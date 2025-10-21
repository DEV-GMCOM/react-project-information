
import React, { useState, useRef, useEffect } from 'react';

// [추가] API 서비스 및 타입 import
import { projectService } from '../../api/services/projectService';
import { employeeService } from '../../api/services/employeeService';
import { Project, Employee } from '../../api/types';
import { fileUploadService } from '../../api/services/fileUploadService';  // ✅ 추가


// 제공된 CSS 파일들이 상위에서 import 되었다고 가정합니다.
import '../../styles/FormPage.css';
import '../../styles/MeetingMinutes.css';
import '../../styles/ProjectBasicInfoForm.css'; // 검색 모달 등에 필요한 스타일

// --- ▼▼▼ [수정] 직원 검색 모달 ▼▼▼ ---
interface EmployeeSearchModalProps {
    onClose: () => void;
    onSelect: (selectedEmployees: Employee[]) => void;
    initialSelected: Employee[];
}

// 직원 검색 모달을 위한 간단한 컴포넌트
// 실제 구현에서는 별도의 파일로 분리하는 것이 좋습니다.
const EmployeeSearchModal: React.FC<EmployeeSearchModalProps> = ({ onClose, onSelect, initialSelected }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Employee[]>([]);
    const [selected, setSelected] = useState<Employee[]>(initialSelected);

    const handleSearch = async () => {
        setLoading(true);
        try {
            const employees = await employeeService.getEmployees({ search: searchTerm });
            setResults(employees);
        } catch (error) {
            console.error("직원 검색 오류:", error);
            alert("직원을 검색하는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch(); // 컴포넌트 마운트 시 전체 직원 목록 로드
    }, []);

    const handleCheckboxChange = (employee: Employee) => {
        setSelected(prev => {
            if (prev.some(e => e.id === employee.id)) {
                return prev.filter(e => e.id !== employee.id);
            } else {
                return [...prev, employee];
            }
        });
    };

    const handleConfirm = () => {
        onSelect(selected);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>직원 검색</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="input-with-search" style={{ marginBottom: '15px' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                            placeholder="이름 또는 부서로 검색"
                            className="project-input"
                        />
                        <button onClick={handleSearch} className="search-btn">🔍</button>
                    </div>
                    {loading ? (
                        <div className="loading">검색 중...</div>
                    ) : (
                        <table className="search-table">
                            <thead>
                            <tr>
                                <th>선택</th>
                                <th>이름</th>
                                <th>부서</th>
                                <th>직급</th>
                            </tr>
                            </thead>
                            <tbody>
                            {results.length > 0 ? (
                                results.map(emp => (
                                    <tr key={emp.id}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={selected.some(e => e.id === emp.id)}
                                                onChange={() => handleCheckboxChange(emp)}
                                                className="meeting-minutes-checkbox"
                                            />
                                        </td>
                                        <td>{emp.name}</td>
                                        <td>{emp.department || '-'}</td>
                                        <td>{emp.position || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="no-results">검색 결과가 없습니다.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="modal-footer" style={{ padding: '15px', textAlign: 'right' }}>
                    <button className="btn-primary" onClick={handleConfirm}>확인</button>
                    <button className="btn-secondary" onClick={onClose} style={{ marginLeft: '10px' }}>취소</button>
                </div>
            </div>
        </div>
    );
};
// --- ▲▲▲ 직원 검색 모달 종료 ▲▲▲ ---

const MeetingMinutes: React.FC = () => {

    // 1. 파일 입력(input) DOM에 접근하기 위한 ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2. 파일 목록, 업로드 상태 등을 관리하는 state
    const [serverFiles, setServerFiles] = useState<any[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // ✅ 새로 선택한 로컬 파일 목록
    const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    // 4. 허용할 파일 확장자 목록
    const allowedExtensions = ['txt', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'zip', 'rar', '7z'];

    // --- ▼▼▼ 기능 추가에 따른 상태 관리 ▼▼▼ ---
    const [sttEngine, setSttEngine] = useState<string>('clova');
    const [sttResults, setSttResults] = useState({
        clova: "Clova Speech를 통해 변환된 텍스트 예시입니다. 이 텍스트는 30라인 이상의 길이를 가질 수 있으며, 스크롤을 통해 전체 내용을 확인할 수 있습니다.",
        google: "Google STT를 통해 변환된 텍스트 예시입니다...",
        whisper: "Whisper AI를 통해 변환된 텍스트 예시입니다..."
    });
    const [selectedSttSource, setSelectedSttSource] = useState<string>('');

    const [llmDocTypes, setLlmDocTypes] = useState({
        summary: true,
        concept: false,
        draft: false,
    });

    const [llmResults, setLlmResults] = useState([
        { id: 'summary', title: '주요 안건 정리', content: '', save: true },
        { id: 'concept', title: '컨셉 문서', content: '', save: false },
        { id: 'draft', title: 'Draft 기획서', content: '', save: false },
    ]);

    const [showEmployeeModal, setShowEmployeeModal] = useState(false);
    const [shareMethods, setShareMethods] = useState({
        email: true,
        jandi: false,
    });
    const [shareMethod, setShareMethod] = useState<'email' | 'jandi'>('email');
    const [tags, setTags] = useState<string>('');
    // --- ▲▲▲ 상태 관리 종료 ▲▲▲ ---


    // 파일 선택창 열기
    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    // --- ▼▼▼ [수정] 프로젝트 및 공유 인원 관련 상태 ▼▼▼ ---
    const [projectName, setProjectName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [showProjectSearchModal, setShowProjectSearchModal] = useState(false);
    const [projectSearchLoading, setProjectSearchLoading] = useState(false);
    const [projectSearchResults, setProjectSearchResults] = useState<Project[]>([]);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    const [showEmployeeSearchModal, setShowEmployeeSearchModal] = useState(false);
    const [sharedWith, setSharedWith] = useState<Employee[]>([]); // Employee 객체 배열로 관리
    // --- ▲▲▲ 상태 관리 종료 ▲▲▲ ---


    const [meetingTitle, setMeetingTitle] = useState<string>('');
    const [meetingDateTime, setMeetingDateTime] = useState<string>('');
    const [meetingPlace, setMeetingPlace] = useState<string>('');

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    // const handleFiles = async (files: FileList | null) => {
    //     if (!files || files.length === 0) return;
    //     console.log("업로드할 파일:", files);
    // };
    // 수정할 코드
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const newFiles = Array.from(files);
        // 기존에 선택된 파일 목록에 새로 추가된 파일을 합칩니다.
        setSelectedFiles(prevFiles => [...prevFiles, ...newFiles]);

        console.log("선택된 파일 목록:", newFiles);
        // 여기에 실제 파일 업로드 API 호출 로직을 추가할 수 있습니다.
        // 예: uploadFiles(newFiles);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };



    // 파일 다운로드/삭제 핸들러
    const handleFileDownload = (file: any) => console.log("다운로드:", file);
    const handleFileDelete = (file: any) => {
        if (window.confirm(`${file.original_file_name} 파일을 정말 삭제하시겠습니까?`)) {
            console.log("삭제:", file);
        }
    };

    const handleRemoveSelectedFile = (fileToRemove: File) => {
        setSelectedFiles(prevFiles => prevFiles.filter(file => file !== fileToRemove));
    };


    // 파일 크기 포맷 함수
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // --- ▼▼▼ [수정] 프로젝트 검색 핸들러 ▼▼▼ ---
    // const openProjectSearchModal = () => {
    //     setModalSearchTerm(''); // 모달을 열 때 검색어 초기화
    //     setShowProjectSearchModal(true);
    //     handleProjectSearch(''); // 초기 목록을 보여주기 위해 빈 검색어로 검색
    // };
    const openProjectSearchModal = () => {
        setModalSearchTerm(projectName); // 모달을 열 때 현재 프로젝트명을 모달 검색어 초기값으로 설정
        setShowProjectSearchModal(true);
        handleProjectSearch(projectName); // 현재 프로젝트명으로 초기 검색 실행
    };

    const handleProjectSearch = async (term: string) => {
        setProjectSearchLoading(true);
        try {
            const results = await projectService.getProjects({ search: term });
            setProjectSearchResults(results);
        } catch (error) {
            console.error("프로젝트 검색 오류:", error);
            alert("프로젝트 검색 중 오류가 발생했습니다.");
        } finally {
            setProjectSearchLoading(false);
        }
    };

    const selectProject = (project: Project) => {
        setProjectName(project.project_name);
        setSelectedProjectId(project.id);
        setShowProjectSearchModal(false);
    };

    // [추가] 프로젝트 선택 취소 핸들러
    const cancelProjectSelection = () => {
        setProjectName('');
        setSelectedProjectId(null);
    };
    // --- ▲▲▲ 프로젝트 검색 핸들러 종료 ▲▲▲ ---

    // --- ▼▼▼ [수정] 공유 인원 핸들러 ▼▼▼ ---
    const handleSharedWithSelect = (selectedEmployees: Employee[]) => {
        setSharedWith(selectedEmployees);
    };

    const removeSharedEmployee = (employeeId: number) => {
        setSharedWith(prev => prev.filter(e => e.id !== employeeId));
    };
    // --- ▲▲▲ 공유 인원 핸들러 종료 ▲▲▲ ---

    // --- ▼▼▼ 추가된 기능 핸들러 ▼▼▼ ---
    const handleLlmDocTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setLlmDocTypes(prev => ({ ...prev, [name]: checked }));
    };

    const handleGenerate = () => {
        if (!selectedSttSource) {
            alert("LLM 생성을 위한 소스 텍스트를 선택해주세요.");
            return;
        }
        console.log("생성 시작:", { sttEngine, llmDocTypes, selectedSttSource });
        alert("콘솔을 확인하여 생성 요청 데이터를 확인하세요.");
        // API 호출 후 결과로 llmResults 상태 업데이트
    };

    const handleLlmResultSaveChange = (id: string) => {
        setLlmResults(prev => prev.map(result =>
            result.id === id ? { ...result, save: !result.save } : result
        ));
    };

    const handleShareMethodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target as { name: keyof typeof shareMethods; checked: boolean };

        // 마지막 남은 하나를 끄려고 할 때, 변경을 막음
        if (!checked && ( (name === 'email' && !shareMethods.jandi) || (name === 'jandi' && !shareMethods.email) )) {
            return; // 아무것도 하지 않음
        }

        setShareMethods(prev => ({ ...prev, [name]: checked }));
    };

    const handleSave = async () => {  // ✅ async 추가
        // 유효성 검증
        if (!selectedProjectId) {
            alert("프로젝트를 선택해주세요.");
            return;
        }

        if (!selectedSttSource) {
            alert("LLM 생성을 위한 소스 텍스트를 선택해주세요.");
            return;
        }

        const dataToSave = {
            projectId: selectedProjectId,
            sttSource: selectedSttSource,
            llmResultsToSave: llmResults.filter(r => r.save && r.content),
            sharedWith,
            shareMethods,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
        };

        console.log("서버에 저장할 최종 데이터:", dataToSave);

        try {
            setIsFileUploading(true);  // ✅ loading 대신 기존 state 사용

            // 1️⃣ 파일 업로드
            if (selectedFiles.length > 0) {
                try {
                    const uploadPromises = selectedFiles.map((file: File) =>
                        fileUploadService.uploadFileAuto(
                            selectedProjectId,  // ✅ projectId 대신 selectedProjectId
                            file,
                            2, // 'meeting_minutes',
                            (progress: number) => {  // ✅ 타입 명시
                                console.log(`${file.name}: ${progress.toFixed(1)}%`);
                            }
                        )
                    );

                    await Promise.all(uploadPromises);
                    setSelectedFiles([]);
                    console.log("파일 업로드 완료");

                } catch (fileError: any) {
                    console.error('파일 업로드 실패:', fileError);
                    alert(`파일 업로드 실패: ${fileError.message}`);
                    return;
                }
            }

            // 2️⃣ 회의록 데이터 저장
            // TODO: 실제 API 호출로 교체 필요
            alert("데이터가 서버에 저장됩니다. (콘솔 확인)");

        } catch (error: any) {
            console.error('저장 중 오류:', error);
            alert(`저장 실패: ${error.message}`);
        } finally {
            setIsFileUploading(false);  // ✅ loading 대신 기존 state 사용
        }
    };


    return (
        <div className="meeting-minutes-container">
            <div className="meeting-minutes-header">
                <div>
                    <h1 className="meeting-minutes-title">회의록 자동 문서화</h1>
                </div>
                <div className="meeting-minutes-logo">GMCOM</div>
            </div>

            <div className="meeting-minutes-main">
                 {/* ... 다른 섹션들은 동일 ... */}
                <div className="meeting-minutes-title-section">
                    <h2 className="meeting-minutes-subtitle">회의록 음성 파일</h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>최종 작성자 :</div>
                        </div>
                    </div>
                </div>

                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 기본 정보</h3>
                    {/* --- ▼▼▼ [최종 수정] 기본 정보 레이아웃 및 기능 ▼▼▼ --- */}
                    <div style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            {/* ✅ 회의록 제목 필드 추가 */}
                            <div className="writer-field">
                                <label className="writer-field-label">회의록 제목</label>
                                <input
                                    type="text"
                                    className="writer-field-input"
                                    style={{width: '100%'}}
                                    value={meetingTitle}
                                    onChange={(e) => setMeetingTitle(e.target.value)}
                                    placeholder="회의록 제목을 입력하세요"
                                />
                            </div>

                            {/* ✅ 회의 일시 및 장소 필드 추가 */}
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div className="writer-field" style={{ flex: 1 }}>
                                    <label className="writer-field-label">회의 일시</label>
                                    <input
                                        type="datetime-local"
                                        className="writer-field-input"
                                        style={{width: '100%'}}
                                        value={meetingDateTime}
                                        onChange={(e) => setMeetingDateTime(e.target.value)}
                                    />
                                </div>
                                <div className="writer-field" style={{ flex: 1 }}>
                                    <label className="writer-field-label">회의 장소</label>
                                    <input
                                        type="text"
                                        className="writer-field-input"
                                        style={{width: '100%'}}
                                        value={meetingPlace}
                                        onChange={(e) => setMeetingPlace(e.target.value)}
                                        placeholder="회의 장소를 입력하세요"
                                    />
                                </div>
                            </div>
                            {/* --- ▼▼▼ [수정] 연관 프로젝트 UI ▼▼▼ --- */}
                            <div className="writer-field">
                                <label className="writer-field-label">연관 프로젝트</label>
                                <div className="project-selection-display" style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #ddd', borderRadius: '4px', padding: '5px', minHeight: '38px' }}>
                                    {projectName ? (
                                        <span
                                            className="status-badge company-badge with-reset"
                                            style={{
                                                maxWidth: '100%', // 부모 너비를 넘지 않도록 설정
                                                minWidth: 0,       // flex 아이템이 작아질 수 있도록 허용
                                            }}
                                        >
                                            <span
                                                className="badge-text"
                                                title={projectName}
                                                style={{
                                                    whiteSpace: 'nowrap',   // 텍스트가 줄바꿈되지 않도록
                                                    overflow: 'hidden',     // 넘치는 텍스트 숨기기
                                                    textOverflow: 'ellipsis', // 넘치는 텍스트를 ...으로 표시
                                                }}
                                            >
                                                {projectName}
                                            </span>
                                            <span className="badge-reset-icon" onClick={cancelProjectSelection} title="프로젝트 선택 취소">×</span>
                                        </span>
                                    ) : (
                                        <span style={{ color: '#999', fontSize: '14px', paddingLeft: '8px' }}>오른쪽 검색 버튼으로 프로젝트를 선택하세요</span>
                                    )}
                                    <button className="search-btn" onClick={openProjectSearchModal} style={{ marginLeft: 'auto' }}>🔍</button>
                                </div>
                            </div>
                            {/* --- ▲▲▲ 수정 종료 ▲▲▲ --- */}
                            {/*<div className="writer-field" style={{ alignItems: 'flex-start' }}>*/}
                            {/*    <label className="writer-field-label" style={{ paddingTop: '5px' }}>회의록 공유</label>*/}
                            <div className="writer-field"> {/* ✅ style 속성 제거 */}
                                <label className="writer-field-label">회의록 공유</label> {/* ✅ style 속성 제거 */}
                                <div className="input-with-search" style={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '5px', minHeight: '38px' }}>
                                    {sharedWith.map(emp => (
                                        <span key={emp.id} className="status-badge company-badge with-reset">
                                            <span className="badge-text">{emp.name}({emp.department})</span>
                                            <span className="badge-reset-icon" onClick={() => removeSharedEmployee(emp.id)} title={`${emp.name} 삭제`}>×</span>
                                        </span>
                                    ))}
                                    <button className="search-btn" onClick={() => setShowEmployeeSearchModal(true)} style={{ marginLeft: 'auto', alignSelf: 'center' }}>+</button>
                                </div>
                            </div>
                            <div className="writer-field" style={{ alignItems: 'center' }}>
                                <label className="writer-field-label">전달 방법</label>
                                <label className="meeting-minutes-label share-method-label">
                                    <input type="checkbox" className="meeting-minutes-checkbox checkbox-large" name="email" checked={shareMethods.email} onChange={handleShareMethodChange} />
                                    <span>이메일</span>
                                </label>
                                <label className="meeting-minutes-label share-method-label">
                                    <input type="checkbox" className="meeting-minutes-checkbox checkbox-large" name="jandi" checked={shareMethods.jandi} onChange={handleShareMethodChange} />
                                    <span>잔디</span>
                                </label>
                            </div>
                            <div className="writer-field">
                                <label className="writer-field-label">태그</label>
                                <input type="text" className="writer-field-input" style={{width: '100%'}} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="쉼표(,)로 구분, 검색 시 활용 (10자 이내)" />
                            </div>
                        </div>
                    </div>
                    {/* --- ▲▲▲ 기본 정보 레이아웃 종료 ▲▲▲ --- */}
                </div>
                {/*{showEmployeeModal && <EmployeeSearchModal onClose={() => setShowEmployeeModal(false)} />}*/}
                {/* --- ▲▲▲ 기본 정보 섹션 종료 ▲▲▲ --- */}
                {/* --- ▼▼▼ [추가] 프로젝트 검색 모달 ▼▼▼ --- */}
                {showProjectSearchModal && (
                    <div className="modal-overlay" onClick={() => setShowProjectSearchModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>프로젝트 검색</h3>
                                <button className="modal-close-btn" onClick={() => setShowProjectSearchModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                {/* --- ▼▼▼ [수정] 모달 내 검색창 추가 ▼▼▼ --- */}
                                <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                    <input
                                        type="text"
                                        className="project-input"
                                        placeholder="프로젝트명으로 검색"
                                        value={modalSearchTerm}
                                        onChange={e => setModalSearchTerm(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleProjectSearch(modalSearchTerm); }}
                                    />
                                    <button className="search-btn" onClick={() => handleProjectSearch(modalSearchTerm)}>🔍</button>
                                </div>
                                {/* --- ▲▲▲ 수정 종료 ▲▲▲ --- */}
                                {projectSearchLoading ? (
                                    <div className="loading">검색 중...</div>
                                ) : (
                                    <table className="search-table">
                                        <thead>
                                        <tr>
                                            <th>프로젝트명</th>
                                            <th>상태</th>
                                            <th>선택</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {projectSearchResults.length > 0 ? (
                                            projectSearchResults.map((proj) => (
                                                <tr key={proj.id}>
                                                    <td>{proj.project_name}</td>
                                                    <td>{proj.status}</td>
                                                    <td>
                                                        <button className="select-btn" onClick={() => selectProject(proj)}>선택</button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={3} className="no-results">검색 결과가 없습니다.</td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                {/* --- ▲▲▲ 프로젝트 검색 모달 종료 ▲▲▲ --- */}
                {/* --- ▼▼▼ [수정] 직원 검색 모달 호출 ▼▼▼ --- */}
                {showEmployeeSearchModal && (
                    <EmployeeSearchModal
                        onClose={() => setShowEmployeeSearchModal(false)}
                        onSelect={handleSharedWithSelect}
                        initialSelected={sharedWith}
                    />
                )}
                {/* --- ▲▲▲ 직원 검색 모달 종료 ▲▲▲ --- */}


                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 회의록 리스트</h3>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept={allowedExtensions.map(ext => `.${ext}`).join(',')}
                    onChange={handleFileInputChange}
                    style={{ display: 'none' }}
                />

                {/* --- ▼▼▼ [보존] 파일 업로드 드래그앤드롭 UI ▼▼▼ --- */}
                {/* 파일 업로드 영역 */}
                <div className="file-upload-section">
                    <div
                        className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileSelect}
                    >
                        {/* ✅ serverFiles와 selectedFiles가 모두 비어있을 때만 메시지 표시 */}
                        {serverFiles.length === 0 && selectedFiles.length === 0 ? (
                            <div className="drop-zone-message">
                                <div className="drop-zone-icon">📁</div>
                                <div className="drop-zone-text">
                                    <p>파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                                    <p className="drop-zone-hint">
                                        지원 형식: {allowedExtensions.join(', ')} (최대 100MB)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="file-list">
                                {/* 서버에 이미 업로드된 파일 목록 */}
                                {serverFiles.map(file => (
                                    <div key={`server-${file.id}`} className="file-item uploaded-file">
                                        {/* ... 기존 서버 파일 렌더링 코드 ... */}
                                    </div>
                                ))}

                                {/* ✅ 새로 선택된 로컬 파일 목록 */}
                                {selectedFiles.map((file, index) => (
                                    <div key={`local-${index}`} className="file-item">
                                        <div className="file-info">
                                            <div className="file-name">
                                                📄 {file.name}
                                            </div>
                                            <div className="file-details">
                                                <span className="file-size">{formatFileSize(file.size)}</span>
                                            </div>
                                        </div>
                                        <button
                                            className="file-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation(); // 드롭존 클릭 방지
                                                handleRemoveSelectedFile(file);
                                            }}
                                            title="파일 삭제"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}

                                {/* 파일 추가 버튼 */}
                                <div
                                    className="drop-zone-add-more"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileSelect();
                                    }}
                                    style={{ display: isFileUploading ? 'none' : 'flex' }}
                                >
                                    <span>+ 더 많은 파일 추가</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {isFileUploading && (
                        <div className="upload-progress">
                            <div className="upload-spinner">⏳</div>
                            <span>파일을 업로드하고 있습니다...</span>
                        </div>
                    )}
                </div>
                {/* --- ▲▲▲ 파일 업로드 UI 종료 ▲▲▲ --- */}

                {/* --- ▼▼▼ [수정] 생성 관련 UI (요청사항 1, 2, 3, 4) ▼▼▼ --- */}
                <div className="generation-panel" style={{flexDirection: 'column', gap: '15px'}}>
                    <div style={{display: 'flex', width: '100%', gap: '20px'}}>
                        <div className="generation-options" style={{flex: 1, flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>
                            <h4>1. STT 엔진 선택</h4>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="clova" checked={sttEngine === 'clova'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                Clova Speech
                            </label>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="google" checked={sttEngine === 'google'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                Google STT
                            </label>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="whisper" checked={sttEngine === 'whisper'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                Whisper
                            </label>
                        </div>
                        <div className="generation-options" style={{flex: 1, flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>
                            <h4>2. 생성할 문서 타입</h4>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="summary" checked={llmDocTypes.summary} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                내용(안건) 정리
                            </label>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="concept" checked={llmDocTypes.concept} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                컨셉 문서
                            </label>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="draft" checked={llmDocTypes.draft} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                Draft 기획서
                            </label>
                        </div>
                    </div>
                    <button className="btn-secondary" onClick={handleGenerate}>LLM 회의록 생성</button>
                </div>
                {/* --- ▲▲▲ 생성 패널 종료 ▲▲▲ --- */}

                {/* --- ▼▼▼ [수정] STT 생성 텍스트 (요청사항 5) ▼▼▼ --- */}
                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 음성에서 추출한 텍스트 (Source)</h3>
                    <div style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        {Object.entries(sttResults).map(([key, value]) => (
                            <div key={key}>
                                <label className="meeting-minutes-label">
                                    <input type="radio" name="stt-source" value={key} onChange={(e) => setSelectedSttSource(e.target.value)} style={{marginRight: '8px'}} />
                                    {key.charAt(0).toUpperCase() + key.slice(1)} 결과 (이것을 소스로 사용)
                                </label>
                                <textarea className="meeting-minutes-textarea" rows={30} defaultValue={value} style={{marginTop: '5px'}}/>
                            </div>
                        ))}
                    </div>
                </div>
                {/* --- ▲▲▲ STT 텍스트 종료 ▲▲▲ --- */}

                {/* --- ▼▼▼ [수정] LLM 생성 결과 ▼▼▼ --- */}
                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 생성된 Draft 기획서, 컨셉문서, 주요 안건 정리</h3>
                    <div style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        {llmResults.map(result => (
                            llmDocTypes[result.id as keyof typeof llmDocTypes] && (
                                <div key={result.id}>
                                    {/* ✅ className="llm-result-label" 추가 */}
                                    <label className="meeting-minutes-label llm-result-label">
                                        <input
                                            // className="meeting-minutes-checkbox" /* ✅ checkbox-large 클래스 제거 */
                                            className="meeting-minutes-checkbox checkbox-large" /* ✅ checkbox-large 클래스 제거 */
                                            type="checkbox"
                                            checked={result.save}
                                            onChange={() => handleLlmResultSaveChange(result.id)}
                                            /* ✅ style 속성 제거 */
                                        />
                                        <span>{result.title} (서버에 저장)</span>
                                    </label>
                                    <textarea className="meeting-minutes-textarea" rows={20} value={result.content} readOnly style={{marginTop: '5px'}} />
                                </div>
                            )
                        ))}
                    </div>
                </div>
                {/* --- ▲▲▲ LLM 결과 종료 ▲▲▲ --- */}

                {/* --- ▼▼▼ [수정] 최종 저장 버튼 (요청사항 11) ▼▼▼ --- */}
                <div className="meeting-minutes-actions" style={{justifyContent: 'center'}}>
                    <button className="btn-primary" onClick={handleSave}>저장&nbsp;&nbsp;&nbsp;&&nbsp;&nbsp;&nbsp;전송</button>
                </div>
                {/* --- ▲▲▲ 최종 저장 버튼 종료 ▲▲▲ --- */}

            </div>
        </div>
    );
};

export default MeetingMinutes;