// // src/pages/working/MeetingMinutes.tsx
//
// import React, { useState, useRef, useEffect } from 'react'; // useState, useRef, useEffect 추가
//
// import '../../styles/FormPage.css';
// import '../../styles/MeetingMinutes.css';
//
// const MeetingMinutes: React.FC = () => {
//
//     // 1. 파일 입력(input) DOM에 접근하기 위한 ref
//     const fileInputRef = useRef<HTMLInputElement>(null);
//
//     // 2. 파일 목록, 업로드 상태 등을 관리하는 state
//     const [serverFiles, setServerFiles] = useState<any[]>([]); // 서버에 업로드된 파일 목록
//     const [isFileUploading, setIsFileUploading] = useState<boolean>(false); // 파일 업로드 진행 상태
//     const [isDragOver, setIsDragOver] = useState<boolean>(false); // 드래그-앤-드롭 UI 상태
//
//     // 3. 현재 작업중인 프로젝트 ID (가정)
//     // 이 값은 상위 컴포넌트나 URL로부터 받아와야 합니다.
//     const [selectedProjectId, setSelectedProjectId] = useState<number | null>(1);
//
//     // 4. 허용할 파일 확장자 목록
//     const allowedExtensions = ['txt', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'zip', 'rar', '7z'];
//
//
//
//     // 파일 선택창을 여는 함수
//     const handleFileSelect = () => {
//         fileInputRef.current?.click();
//     };
//
//     // 파일이 드래그하여 드롭 영역에 들어왔을 때
//     const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragOver(true);
//     };
//
//     // 파일 드래그가 드롭 영역을 벗어났을 때
//     const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragOver(false);
//     };
//
//     // 파일이 드롭되었을 때 또는 파일 선택창에서 선택되었을 때
//     const handleFiles = async (files: FileList | null) => {
//         if (!files || files.length === 0) return;
//         // 이곳에 실제 파일 업로드 API를 호출하는 로직이 들어갑니다.
//         console.log("업로드할 파일:", files);
//         // 예: uploadFiles(files);
//     };
//
//     const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
//         e.preventDefault();
//         setIsDragOver(false);
//         handleFiles(e.dataTransfer.files);
//     };
//
//     const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//         handleFiles(e.target.files);
//     };
//
//     // 파일 다운로드 처리 함수
//     const handleFileDownload = (file: any) => {
//         console.log("다운로드할 파일:", file);
//         // 이곳에 파일 다운로드 API 호출 로직이 들어갑니다.
//     };
//
//     // 파일 삭제 처리 함수
//     const handleFileDelete = (file: any) => {
//         if (window.confirm(`${file.original_file_name} 파일을 정말 삭제하시겠습니까?`)) {
//             console.log("삭제할 파일:", file);
//             // 이곳에 파일 삭제 API 호출 로직이 들어갑니다.
//         }
//     };
//
//     // 파일 크기를 읽기 쉽게 변환하는 유틸리티 함수
//     const formatFileSize = (bytes: number): string => {
//         if (bytes === 0) return '0 Bytes';
//         const k = 1024;
//         const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
//         const i = Math.floor(Math.log(bytes) / Math.log(k));
//         return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
//     };
//
//     return (
//         <div className="meeting-minutes-container">
//             {/* ... 헤더 부분은 동일 ... */}
//             <div className="meeting-minutes-header">
//                 <div>
//                     <h1 className="meeting-minutes-title">회의록 자동 문서화</h1>
//                 </div>
//                 <div className="meeting-minutes-logo">GMCOM</div>
//             </div>
//
//             <div className="meeting-minutes-main">
//                 {/* ... 다른 섹션들은 동일 ... */}
//                 <div className="meeting-minutes-title-section">
//                     <h2 className="meeting-minutes-subtitle">회의록 음성 파일</h2>
//                     <div className="profile-writer">
//                         <div className="writer-form">
//                             <div>최종 작성자 :</div>
//                         </div>
//                     </div>
//                 </div>
//                 <div className="meeting-minutes-section">
//                     <h3 className="section-header">■ 파일 리스트</h3>
//                 </div>
//
//                 <div className="table-action-section">
//                     <input
//                         ref={fileInputRef}
//                         type="file"
//                         multiple
//                         accept=".txt,.text,.md,.pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.png,.jpg,.jpeg,.xls,.xlsx,.zip,.rar,.7z"
//                         onChange={handleFileInputChange}
//                         style={{ display: 'none' }}
//                     />
//                     {/*<button*/}
//                     {/*    type="button"*/}
//                     {/*    className="rfp-attach-btn"*/}
//                     {/*    onClick={handleFileSelect}*/}
//                     {/*    disabled={!selectedProjectId || isFileUploading}*/}
//                     {/*>*/}
//                     {/*    {isFileUploading ? '업로드 중...' : `음성 파일 첨부${serverFiles.length > 0 ? ` (${serverFiles.length})` : ''}`}*/}
//                     {/*</button>*/}
//                 </div>
//
//                 {/* 파일 업로드 영역 */}
//                 <div className="file-upload-section">
//                     <div
//                         className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
//                         onDragOver={handleDragOver}
//                         onDragLeave={handleDragLeave}
//                         onDrop={handleDrop}
//                         onClick={handleFileSelect}
//                     >
//                         {serverFiles.length === 0 ? (
//                             <div className="drop-zone-message">
//                                 <div className="drop-zone-icon">📁</div>
//                                 <div className="drop-zone-text">
//                                     <p>파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
//                                     <p className="drop-zone-hint">
//                                         지원 형식: {allowedExtensions.join(', ')} (최대 100MB)
//                                     </p>
//                                 </div>
//                             </div>
//                         ) : (
//                             <div className="file-list">
//                                 {serverFiles.map(file => (
//                                     <div key={`server-${file.id}`} className="file-item uploaded-file">
//                                         <div className="file-info">
//                                             <div className="file-name">
//                                                 <button
//                                                     className="file-download-link"
//                                                     onClick={(e) => {
//                                                         e.stopPropagation();
//                                                         handleFileDownload(file);
//                                                     }}
//                                                     title="클릭하여 다운로드"
//                                                 >
//                                                     📄 {file.original_file_name}
//                                                 </button>
//                                                 {file.is_readonly && <span className="readonly-badge">🔒</span>}
//                                             </div>
//                                             <div className="file-details">
//                                                 <span className="file-size">{formatFileSize(file.file_size)}</span>
//                                                 <span className="file-type">{file.file_type?.toUpperCase()}</span>
//                                                 <span className="upload-date">
//                                                     {new Date(file.uploaded_at).toLocaleString('ko-KR')}
//                                                 </span>
//                                             </div>
//                                         </div>
//                                         <button
//                                             className="file-remove-btn"
//                                             onClick={(e) => {
//                                                 e.stopPropagation();
//                                                 handleFileDelete(file);
//                                             }}
//                                             title="파일 삭제"
//                                         >
//                                             🗑️
//                                         </button>
//                                     </div>
//                                 ))}
//
//                                 <div
//                                     className="drop-zone-add-more"
//                                     onClick={handleFileSelect}
//                                     style={{ display: isFileUploading ? 'none' : 'flex' }}
//                                 >
//                                     <span>+ 더 많은 파일 추가</span>
//                                 </div>
//                             </div>
//                         )}
//                     </div>
//
//                     {isFileUploading && (
//                         <div className="upload-progress">
//                             <div className="upload-spinner">⏳</div>
//                             <span>파일을 업로드하고 있습니다...</span>
//                         </div>
//                     )}
//                 </div>
//
//
//                 {/* --- ▼▼▼ [제안] 생성 관련 UI를 하나의 패널로 그룹화 ▼▼▼ --- */}
//                 <div className="generation-panel">
//                     <div className="generation-options">
//                         <label className="meeting-minutes-label">
//                             <input className="meeting-minutes-checkbox" type="checkbox" name="summary" defaultChecked />
//                             내용(안건) 정리
//                         </label>
//                         <label className="meeting-minutes-label">
//                             <input className="meeting-minutes-checkbox" type="checkbox" name="concept" />
//                             컨셉 문서
//                         </label>
//                         <label className="meeting-minutes-label">
//                             <input className="meeting-minutes-checkbox" type="checkbox" name="draft" />
//                             Draft 기획서
//                         </label>
//                     </div>
//                     <button className="btn-primary">생성</button>
//                 </div>
//                 {/* --- ▲▲▲ 생성 패널 종료 ▲▲▲ --- */}
//
//                 <div className="meeting-minutes-section">
//                     <h3 className="section-header">■ 생성된 텍스트</h3>
//                 </div>
//                 <div className="meeting-minutes-section">
//                     <h3 className="section-header">■ 생성된 Draft 기획서, 컨셉문서, 주요 안건 정리</h3>
//                 </div>
//
//                 {/* --- ▼▼▼ 최종 저장 버튼은 명확하게 분리 ▼▼▼ --- */}
//                 <div className="meeting-minutes-actions">
//                     <button className="btn-secondary">저장</button>
//                 </div>
//                 {/* --- ▲▲▲ 최종 저장 버튼 종료 ▲▲▲ --- */}
//
//             </div>
//         </div>
//     );
// };
//
// export default MeetingMinutes;


import React, { useState, useRef, useEffect } from 'react';

// [추가] API 서비스 및 타입 import
import { projectService } from '../../api/services/projectService';
import { employeeService } from '../../api/services/employeeService';
import { Project, Employee } from '../../api/types';

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
        jandi: true,
        email: false,
    });
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

    const [showEmployeeSearchModal, setShowEmployeeSearchModal] = useState(false);
    const [sharedWith, setSharedWith] = useState<Employee[]>([]); // Employee 객체 배열로 관리
    // --- ▲▲▲ 상태 관리 종료 ▲▲▲ ---

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        console.log("업로드할 파일:", files);
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

    // 파일 크기 포맷 함수
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // --- ▼▼▼ [추가] 프로젝트 검색 핸들러 ▼▼▼ ---
    const handleProjectSearch = async () => {
        setProjectSearchLoading(true);
        setShowProjectSearchModal(true);
        try {
            const results = await projectService.getProjects({ search: projectName });
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
        const { name, checked } = e.target;
        setShareMethods(prev => ({ ...prev, [name]: checked }));
    };

    const handleSave = () => {
        const dataToSave = {
            projectId: selectedProjectId,
            sttSource: selectedSttSource,
            llmResultsToSave: llmResults.filter(r => r.save && r.content),
            sharedWith,
            shareMethods,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
        };
        console.log("서버에 저장할 최종 데이터:", dataToSave);
        alert("데이터가 서버에 저장됩니다. (콘솔 확인)");
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
                    {/*<div style={{ padding: '15px' }}>*/}
                    {/*    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">프로젝트명</label>*/}
                    {/*            <div className="input-with-search">*/}
                    {/*                <input type="text" className="writer-field-input" style={{width: '100%'}} placeholder="프로젝트를 검색하여 선택" />*/}
                    {/*                <button className="search-btn">🔍</button>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">공유할 인원</label>*/}
                    {/*            <div className="input-with-search">*/}
                    {/*                <input type="text" className="writer-field-input" style={{width: '100%'}} value={sharedWith.join(', ')} readOnly />*/}
                    {/*                <button className="search-btn" onClick={() => setShowEmployeeModal(true)}>+</button>*/}
                    {/*            </div>*/}
                    {/*        </div>*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">공유 방식</label>*/}
                    {/*            <label className="meeting-minutes-label">*/}
                    {/*                <input type="checkbox" className="meeting-minutes-checkbox checkbox-large" style={{ transform: 'scale(1.5)'}} name="jandi" checked={shareMethods.jandi} onChange={handleShareMethodChange} />*/}
                    {/*                잔디*/}
                    {/*            </label>*/}
                    {/*            <label className="meeting-minutes-label">*/}
                    {/*                <input type="checkbox" className="meeting-minutes-checkbox checkbox-large" style={{ transform: 'scale(1.5)'}} name="email" checked={shareMethods.email} onChange={handleShareMethodChange} />*/}
                    {/*                이메일*/}
                    {/*            </label>*/}
                    {/*        </div>*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">태그</label>*/}
                    {/*            <input type="text" className="writer-field-input" style={{width: '100%'}} value={tags} onChange={(e) => setTags(e.target.value)} placeholder="쉼표(,)로 구분, 검색 시 활용 (10자 이내)" />*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                    {/* --- ▼▼▼ [수정] 기본 정보 레이아웃 및 기능 ▼▼▼ --- */}
                    <div style={{ padding: '15px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="writer-field" style={{ flexWrap: 'nowrap' }}>
                                <label className="writer-field-label">연관 프로젝트</label>
                                <div className="input-with-search" style={{ flexGrow: 1 }}>
                                    <input
                                        type="text"
                                        className="writer-field-input"
                                        style={{ width: '100%' }}
                                        placeholder="프로젝트명 입력 후 엔터 또는 🔍 클릭"
                                        value={projectName}
                                        onChange={e => setProjectName(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleProjectSearch(); }}
                                    />
                                    <button className="search-btn" onClick={handleProjectSearch}>🔍</button>
                                </div>
                            </div>
                            <div className="writer-field" style={{ alignItems: 'flex-start' }}>
                                <label className="writer-field-label" style={{ paddingTop: '5px' }}>공유할 인원</label>
                                <div className="input-with-search" style={{ flexGrow: 1, display: 'flex', flexWrap: 'wrap', gap: '5px', border: '1px solid #ddd', borderRadius: '4px', padding: '5px' }}>
                                    {sharedWith.map(emp => (
                                        <span key={emp.id} className="status-badge company-badge with-reset">
                                            <span className="badge-text">{emp.name}({emp.department})</span>
                                            <span className="badge-reset-icon" onClick={() => removeSharedEmployee(emp.id)} title={`${emp.name} 삭제`}>×</span>
                                        </span>
                                    ))}
                                    <button className="search-btn" onClick={() => setShowEmployeeSearchModal(true)} style={{ marginLeft: 'auto', alignSelf: 'center' }}>+</button>
                                </div>
                            </div>
                            <div className="writer-field">
                                <label className="writer-field-label">공유 방식</label>
                                <label className="meeting-minutes-label">
                                    <input type="checkbox" className="meeting-minutes-checkbox checkbox-large" style={{ transform: 'scale(1.5)'}} name="jandi" checked={shareMethods.jandi} onChange={handleShareMethodChange} />
                                    잔디
                                </label>
                                <label className="meeting-minutes-label">
                                    <input type="checkbox" className="meeting-minutes-checkbox checkbox-large" style={{ transform: 'scale(1.5)'}} name="email" checked={shareMethods.email} onChange={handleShareMethodChange} />
                                    이메일
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
                    <h3 className="section-header">■ 회의록 음성 파일</h3>
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
                        {serverFiles.length === 0 ? (
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
                                {serverFiles.map(file => (
                                    <div key={`server-${file.id}`} className="file-item uploaded-file">
                                        <div className="file-info">
                                            <div className="file-name">
                                                <button
                                                    className="file-download-link"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileDownload(file);
                                                    }}
                                                    title="클릭하여 다운로드"
                                                >
                                                    📄 {file.original_file_name}
                                                </button>
                                                {file.is_readonly && <span className="readonly-badge">🔒</span>}
                                            </div>
                                            <div className="file-details">
                                                <span className="file-size">{formatFileSize(file.file_size)}</span>
                                                <span className="file-type">{file.file_type?.toUpperCase()}</span>
                                                <span className="upload-date">
                                                    {new Date(file.uploaded_at).toLocaleString('ko-KR')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="file-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileDelete(file);
                                            }}
                                            title="파일 삭제"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}

                                <div
                                    className="drop-zone-add-more"
                                    onClick={handleFileSelect}
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
                    <button className="btn-primary" onClick={handleGenerate}>생성</button>
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

                {/* --- ▼▼▼ [수정] LLM 생성 결과 (요청사항 6, 7) ▼▼▼ --- */}
                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 생성된 Draft 기획서, 컨셉문서, 주요 안건 정리</h3>
                    <div style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                        {llmResults.map(result => (
                            llmDocTypes[result.id as keyof typeof llmDocTypes] && (
                                <div key={result.id}>
                                    <label className="meeting-minutes-label">
                                        <input
                                            className="meeting-minutes-checkbox checkbox-large"
                                            type="checkbox"
                                            checked={result.save}
                                            onChange={() => handleLlmResultSaveChange(result.id)}
                                            style={{ transform: 'scale(1.5)'}}
                                        />
                                        {result.title} (서버에 저장)
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
                    <button className="btn-secondary" onClick={handleSave}>최종 저장</button>
                </div>
                {/* --- ▲▲▲ 최종 저장 버튼 종료 ▲▲▲ --- */}

            </div>
        </div>
    );
};

export default MeetingMinutes;