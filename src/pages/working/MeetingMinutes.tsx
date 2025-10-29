
import React, { useState, useRef, useEffect,useCallback, ChangeEvent } from 'react';

// [추가] API 서비스 및 타입 import
import { projectService } from '../../api/services/projectService';
import { employeeService } from '../../api/services/employeeService';
import { Project, Employee, MeetingMinute } from '../../api/types';
import { fileUploadService } from '../../api/services/fileUploadService';

// 회의록 서비스 import
import { meetingMinuteService } from '../../api/services/meetingMinuteService'; // (가정: 새 서비스 파일 필요)

// [추가] 에러 핸들러 (프로젝트에 이미 있다면 경로 수정)
import { handleApiError } from '../../api/utils/errorUtils';
// 1. 새로 만든 서비스와 타입 import
import {
    generationService,
    STTEngine,
    LLMEngine,
    DocType
} from '../../api/services/generationService';







// [추가] react-datepicker import
import DatePicker from "react-datepicker";
import { ko } from 'date-fns/locale'; // 👈 [추가]
import "react-datepicker/dist/react-datepicker.css";

// 제공된 CSS 파일들이 상위에서 import 되었다고 가정합니다.
import '../../styles/FormPage.css';
import '../../styles/MeetingMinutes.css';
import '../../styles/ProjectBasicInfoForm.css'; // 검색 모달 등에 필요한 스타일






// --- ▼▼▼ 회의록 목록 컴포넌트 (별도 파일 분리 권장) ▼▼▼ ---
interface MeetingListProps {
    meetings: MeetingMinute[];
    onSelect: (meeting: MeetingMinute) => void;
}
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

const MeetingList: React.FC<MeetingListProps> = ({ meetings, onSelect }) => {
    // 날짜 포맷 함수 (필요시)
    const formatDateTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return isoString;
        }
    };

    return (
        <table className="meeting-list-table">
            <thead>
            <tr>
                <th>회의명</th>
                <th>회의일시</th>
                <th>연계프로젝트</th>
                <th>작성자</th>
                <th>참석자</th>
                <th>태그</th>
                <th>상태</th>
            </tr>
            </thead>
            <tbody>
            {meetings.length === 0 ? (
                <tr>
                    <td colSpan={7} className="no-results">회의록이 없습니다.</td>
                </tr>
            ) : (
                meetings.map(meeting => (
                    // <tr key={meeting.meeting_id} onClick={() => onSelect(meeting)} className="meeting-list-item">
                    //     <td className="meeting-title-cell">
                    //         {/* 회의명을 클릭 가능하게 */}
                    //         <span className="meeting-link">{meeting.meeting_title}</span>
                    //     </td>
                    //     <td>{new Date(meeting.meeting_datetime).toLocaleString('ko-KR')}</td>
                    //     <td>{meeting.project_name || '독립 회의'}</td>
                    //     <td>{meeting.creator_name}</td>
                    //     <td>{`${meeting.attendees?.length || 0}명`}</td>
                    //     <td>
                    //         {meeting.tags?.map(tag => (
                    //             <span key={tag} className="tag-badge">{tag}</span>
                    //         ))}
                    //     </td>
                    //     {/* <td>{meeting.llm_generated ? 'AI 생성' : '-'}</td> */}
                    // </tr>
                    <tr key={meeting.meeting_id} onClick={() => onSelect(meeting)} className="meeting-list-item" title="클릭하여 상세 정보 보기">
                        <td className="meeting-title-cell">
                            <span className="meeting-link">{meeting.meeting_title}</span>
                        </td>
                        <td>{formatDateTime(meeting.meeting_datetime)}</td>
                        <td title={meeting.project_name}>{meeting.project_name || 'N/A'}</td>
                        <td>{meeting.creator_name || 'N/A'}</td>
                        <td title={meeting.attendees_display}>{meeting.attendees_display}</td>
                        <td>
                            {meeting.tags?.map(tag => (
                                <span key={tag} className="tag-badge" title={tag}>{tag}</span>
                            ))}
                        </td>
                        <td>{meeting.has_llm_documents ? '✔️ AI 생성' : '-'}</td>
                    </tr>
                ))
            )}
            </tbody>
        </table>
    );
};
// --- ▲▲▲ 회의록 목록 컴포넌트 종료 ▲▲▲ ---

const MeetingMinutes: React.FC = () => {

    // 1. 파일 입력(input) DOM에 접근하기 위한 ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2. 파일 목록, 업로드 상태 등을 관리하는 state
    const [serverFiles, setServerFiles] = useState<any[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // ✅ 새로 선택한 로컬 파일 목록
    const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    // state 추가
    const [recordingMethod, setRecordingMethod] = useState<string>('document'); // 'document' | 'audio' | 'realtime'
    const [manualInput, setManualInput] = useState<string>(''); // 직접 입력용

    // 파일 확장자 목록을 동적으로 변경
    const documentExtensions = ['text', 'txt', 'md'];
    const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'];
    const allowedExtensions = recordingMethod === 'document' ? documentExtensions : audioExtensions;

    // --- ▼▼▼ 기능 추가에 따른 상태 관리 ▼▼▼ ---
    const [sttEngine, setSttEngine] = useState<string>('whisper');
    const [sttResults, setSttResults] = useState({
        whisper: "Whisper AI를 통해 변환된 텍스트 예시입니다... 이 텍스트는 30라인 이상의 길이를 가질 수 있으며, 스크롤을 통해 전체 내용을 확인할 수 있습니다.",
        clova: "Clova Speech를 통해 변환된 텍스트 예시입니다...",
        google: "Google STT를 통해 변환된 텍스트 예시입니다...",
        aws: "AWS STT를 통해 변환된 텍스트 예시입니다...",
        azure: "Azure STT를 통해 변환된 텍스트 예시입니다...",
        vosk: "Vosk STT를 통해 변환된 텍스트 예시입니다...",
    });
    const [selectedSttSource, setSelectedSttSource] = useState<string>('');

    // const [llmEngine, setLlmEngine] = useState<string>('claude');
    const [llmEngine, setLlmEngine] = useState<string>('chatgpt');
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
    const [attendees, setAttendees] = useState<string>('');
    const [tags, setTags] = useState<string>('');
    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'all'>('my');
    const [llmOutput, setLlmOutput] = useState(true);
    // --- ▲▲▲ 상태 관리 종료 ▲▲▲ ---

    const [myMeetings, setMyMeetings] = useState<MeetingMinute[]>([]);
    const [sharedMeetings, setSharedMeetings] = useState<MeetingMinute[]>([]);
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    // ✅ [신규] 필터 상태 추가
    const [filterType, setFilterType] = useState<'all' | 'project' | 'independent'>('all');

    // State 추가 (파일 상단 state 섹션에)
    type SaveMode = 'create' | 'update';
    const [saveMode, setSaveMode] = useState<SaveMode>('create');
    const [currentMeetingId, setCurrentMeetingId] = useState<number | null>(null);


    // --- ▼▼▼ 회의록 데이터 로딩 함수 ▼▼▼ ---
    // ✅ useCallback의 함수 정의에 (tab: 'my' | 'shared') 파라미터 추가
    // const loadMeetings = useCallback(async (tab: 'my' | 'shared', filter: typeof filterType) => {
    //     setListLoading(true);
    //     setListError(null);
    //     try {
    //         // ✅ API 호출 시 filter 파라미터 추가 (백엔드와 협의 필요)
    //         const params = { limit: 50, filter: filter };
    //         if (tab === 'my') {
    //             const data = await meetingMinuteService.getMyMeetings(params);
    //             setMyMeetings(data);
    //         } else if (tab === 'shared') {
    //             const data = await meetingMinuteService.getSharedMeetings(params);
    //             setSharedMeetings(data);
    //         }
    //     } catch (error) {
    //         console.error(`Error loading ${tab} meetings with filter ${filter}:`, error);setListError('회의록 목록을 불러오는 중 오류가 발생했습니다.');
    //         handleApiError(error); // 에러 처리 유틸리티 사용
    //     } finally {
    //         setListLoading(false);
    //     }
    //     // ✅ useCallback 의존성 배열은 비워둡니다.
    //     // loadMeetings 함수 자체가 외부 변수에 의존하지 않으므로,
    //     // 여기서 tab을 추가하면 activeTab이 바뀔 때마다 함수가 재생성되어 비효율적입니다.
    // }, []);
    const loadMeetings = useCallback(async (tab: 'my' | 'shared', filter: typeof filterType) => {
        setListLoading(true);
        setListError(null);
        try {
            // ✅ filter를 백엔드가 이해하는 has_project로 변환
            const params: any = { limit: 50 };

            if (filter === 'project') {
                params.has_project = true;
            } else if (filter === 'independent') {
                params.has_project = false;
            }
            // filter === 'all'이면 has_project를 전달하지 않음 (undefined)

            if (tab === 'my') {
                const data = await meetingMinuteService.getMyMeetings(params);
                setMyMeetings(data);
            } else if (tab === 'shared') {
                const data = await meetingMinuteService.getSharedMeetings(params);
                setSharedMeetings(data);
            }
        } catch (error) {
            console.error(`Error loading ${tab} meetings with filter ${filter}:`, error);
            setListError('회의록 목록을 불러오는 중 오류가 발생했습니다.');
            handleApiError(error);
        } finally {
            setListLoading(false);
        }
    }, []);

    // 탭이 변경될 때 해당 탭의 데이터를 로드
    useEffect(() => {
        // 'my' 탭은 기본으로 로드
        if (activeTab === 'my') {
            loadMeetings('my', filterType);
        } else if (activeTab === 'shared') {
            loadMeetings('shared', filterType);
        }
        // ✅ loadMeetings 함수는 useCallback으로 메모이제이션되었으므로 의존성 배열에 추가
    }, [activeTab, filterType, loadMeetings]);

    // ✅ [신규] 필터 변경 핸들러
    const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setFilterType(event.target.value as 'all' | 'project' | 'independent');
    };

    // --- ▼▼▼ 회의록 선택 핸들러 ▼▼▼ ---
    const handleMeetingSelect = useCallback(async (meeting: MeetingMinute) => {
        console.log('선택된 회의록:', meeting);

        // 기본 정보 섹션의 상태들을 업데이트
        setMeetingTitle(meeting.meeting_title);

        // setMeetingDateTime(meeting.meeting_datetime ? new Date(meeting.meeting_datetime).toISOString().slice(0, 16) : ''); // datetime-local 형식
        const localDateTime = meeting.meeting_datetime
            ? new Date(new Date(meeting.meeting_datetime).getTime() - (new Date().getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
            : '';
        setMeetingDateTime(localDateTime);

        setMeetingPlace(meeting.meeting_place || '');
        setProjectName(meeting.project_name || '');
        setSelectedProjectId(meeting.project_id || null);

        setSharedWith(meeting.shared_with || []); // '회의록 공유'는 Employee 객체 배열 (API 응답이 그렇다고 가정)
        setAttendees(meeting.attendees_display || ''); // attendees가 문자열 배열일 경우 // '그 외 참석자'는 문자열이라고 가정 (attendees_display 사용)
        setTags(meeting.tags?.join(', ') || '');

        setShareMethods({
            email: meeting.share_methods?.includes('email') ?? true,
            jandi: meeting.share_methods?.includes('jandi') ?? false
        });

        // TODO:
        // 1. 이 회의록에 연결된 파일 목록(serverFiles) 불러오기
        // 2. 이 회의록의 STT/LLM 결과(sttResults, llmResults) 불러오기
        //    (예: const details = await meetingMinuteService.getMeetingDetails(meeting.meeting_id);)
        // 3. (선택) 스크롤을 '기본 정보' 섹션으로 이동
        // window.scrollTo(0, document.getElementById('basic-info-section')?.offsetTop || 0);

        // 백엔드에서 받은 basic_minutes 값을 manualInput 상태에 설정합니다.
        setManualInput(meeting.basic_minutes || '');

        // ✅ 1. 회의록에 연결된 파일 목록 불러오기
        try {
            const files = await fileUploadService.getMeetingFiles(meeting.meeting_id);
            setServerFiles(files);
            console.log(`회의록 ${meeting.meeting_id}의 파일 목록:`, files);
        } catch (error) {
            console.error('파일 목록 조회 실패:', error);
            setServerFiles([]);
        }

        // ✅ 2. 회의록 ID와 모드 설정
        setCurrentMeetingId(meeting.meeting_id);
        setSaveMode('update');

        // TODO: STT/LLM 결과 불러오기 (향후 구현)
        // const details = await meetingMinuteService.getMeetingDetails(meeting.meeting_id);
        // setLlmResults(...);
        alert(`[${meeting.meeting_title}] 회의록 정보를 '기본 정보' 섹션에 로드했습니다.`);

    }, []); // 의존성 배열 비움 (다른 상태 변경 시 재생성 방지)
    // --- ▲▲▲ 회의록 선택 핸들러 종료 ▲▲▲ ---

    // 텍스트 파일 내용 읽기 함수
    const readTextFile = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target?.result as string;
                resolve(text);
            };
            reader.onerror = (e) => {
                reject(e);
            };
            reader.readAsText(file, 'UTF-8');
        });
    };

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

    // 기존 state들 아래에 추가
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationPhase, setGenerationPhase] = useState<number>(0); // 0: 대기, 1: STT, 2: LLM
    const [sttProgress, setSttProgress] = useState<number>(0); // STT 진행률 (0-100)

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

        const fileArray = Array.from(files);
        const validFiles: File[] = [];

        for (const file of fileArray) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!ext || !allowedExtensions.includes(ext)) {
                alert(`허용되지 않는 파일 형식입니다: ${file.name}\n지원 형식: ${allowedExtensions.join(', ')}`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);

            // ✅ 텍스트 파일 자동 로드 (문서 모드일 때만)
            if (recordingMethod === 'document') {
                for (const file of validFiles) {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (ext && ['txt', 'text', 'md'].includes(ext)) {
                        try {
                            const content = await readTextFile(file);
                            setManualInput(content);
                            // 여러 파일 중 첫 번째 텍스트 파일만 로드
                            break;
                        } catch (error) {
                            console.error('파일 읽기 오류:', error);
                            alert(`파일을 읽는 중 오류가 발생했습니다: ${file.name}`);
                        }
                    }
                }
            }
        }

        // input 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles: File[] = [];

        for (const file of droppedFiles) {
            const ext = file.name.split('.').pop()?.toLowerCase();
            if (!ext || !allowedExtensions.includes(ext)) {
                alert(`허용되지 않는 파일 형식입니다: ${file.name}\n지원 형식: ${allowedExtensions.join(', ')}`);
                continue;
            }
            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...validFiles]);

            // ✅ 텍스트 파일 자동 로드 (문서 모드일 때만)
            if (recordingMethod === 'document') {
                for (const file of validFiles) {
                    const ext = file.name.split('.').pop()?.toLowerCase();
                    if (ext && ['txt', 'text', 'md'].includes(ext)) {
                        try {
                            const content = await readTextFile(file);
                            setManualInput(content);
                            // 여러 파일 중 첫 번째 텍스트 파일만 로드
                            break;
                        } catch (error) {
                            console.error('파일 읽기 오류:', error);
                            alert(`파일을 읽는 중 오류가 발생했습니다: ${file.name}`);
                        }
                    }
                }
            }
        }
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
        // ✅ 삭제할 파일이 텍스트 파일인지 확인
        const ext = fileToRemove.name.split('.').pop()?.toLowerCase();
        const isTextFile = ext && ['txt', 'text', 'md'].includes(ext);

        setSelectedFiles(prev => {
            const newFiles = prev.filter(f => f !== fileToRemove);

            // ✅ 텍스트 파일이 삭제되고, 문서 모드이며, manualInput에 내용이 있는 경우
            if (isTextFile && recordingMethod === 'document' && manualInput) {
                // 남은 파일 중에 다른 텍스트 파일이 있는지 확인
                const hasOtherTextFile = newFiles.some(f => {
                    const fileExt = f.name.split('.').pop()?.toLowerCase();
                    return fileExt && ['txt', 'text', 'md'].includes(fileExt);
                });

                // 다른 텍스트 파일이 없으면 manualInput 초기화
                if (!hasOtherTextFile) {
                    setManualInput('');
                }
            }

            return newFiles;
        });
    };


    // 파일 크기 포맷 함수
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

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

    // const handleGenerate = async () => {
    //     console.log("LLM 회의록 생성 시작");
    //     console.log("선택된 STT 엔진:", sttEngine);
    //     console.log("생성할 문서 타입:", llmDocTypes);
    //
    //     setIsGenerating(true);
    //
    //     try {
    //         // Phase 1: STT 변환 (음성 모드일 때만)
    //         if (recordingMethod === 'audio') {
    //             setGenerationPhase(1);
    //             setSttProgress(0);
    //
    //             // TODO: 실제 STT API 호출
    //             // 예시: 진행률 시뮬레이션
    //             for (let i = 0; i <= 100; i += 10) {
    //                 setSttProgress(i);
    //                 await new Promise(resolve => setTimeout(resolve, 300));
    //             }
    //
    //             // 실제 구현 예시:
    //             // const sttResult = await sttService.convert(selectedFiles[0], sttEngine, (progress) => {
    //             //     setSttProgress(progress);
    //             // });
    //             // setSttResults(prev => ({...prev, [sttEngine]: sttResult}));
    //         }
    //
    //         // Phase 2: LLM 생성
    //         setGenerationPhase(2);
    //
    //         // TODO: 실제 LLM API 호출
    //         await new Promise(resolve => setTimeout(resolve, 3000)); // 시뮬레이션
    //
    //         // 실제 구현 예시:
    //         // const llmResult = await llmService.generate({
    //         //     source: recordingMethod === 'audio' ? sttResults[sttEngine] : manualInput,
    //         //     docTypes: llmDocTypes
    //         // });
    //         // setLlmResults(llmResult);
    //
    //         alert("회의록 생성이 완료되었습니다.");
    //
    //     } catch (error) {
    //         console.error("생성 중 오류:", error);
    //         alert("회의록 생성 중 오류가 발생했습니다.");
    //     } finally {
    //         setIsGenerating(false);
    //         setGenerationPhase(0);
    //         setSttProgress(0);
    //     }
    // };
    // ✅ 3. STT 변환 전용 함수 (신규)
    const handleGenerateSTT = async () => {

        console.log("LLM 회의록 생성 시작");
        console.log("선택된 STT 엔진:", sttEngine);
        // console.log("생성할 문서 타입:", llmDocTypes);

        // --- 파라미터 유효성 검증 ---
        if (selectedFiles.length === 0) {
            alert("STT 변환을 위한 음성 파일을 먼저 업로드해주세요.");
            return;
        }

        setIsGenerating(true);
        setGenerationPhase(1); // STT 진행 중 UI 표시
        setSttProgress(0); // 프로그레스 바 초기화

        try {
            const fileToConvert = selectedFiles[0];
            const engineToUse = sttEngine as STTEngine;

            // --- API 호출 ---
            const result = await generationService.generateSTT(engineToUse, fileToConvert);

            // --- 결과 반영 ---
            // 백엔드에서 받은 텍스트로 sttResults 상태 업데이트
            setSttResults(prev => ({
                ...prev,
                [result.engine]: result.text
            }));

            // UI 업데이트
            setSttProgress(100);
            alert(`[${result.engine}] STT 변환이 완료되었습니다.`);

        } catch (error) {
            console.error("STT 변환 중 오류:", error);
            handleApiError(error); // 공통 에러 핸들러 사용
        } finally {
            setIsGenerating(false);
            setGenerationPhase(0);
        }
    };

    // ✅ 4. LLM 생성 전용 함수 (신규)
    const handleGenerateLLM = async () => {

        console.log("LLM 회의록 생성 시작");
        console.log("생성할 문서 타입:", llmDocTypes);
        if (isGenerating) {
            console.log("LLM 생성 중이라, 중복 요청 방지");
            return;
        } // 이중 클릭 방지

        // --- 파라미터 유효성 검증 및 조립 ---

        // 1. source_text 조립
        let source_text: string | null = null;
        if (recordingMethod === 'document') {
            source_text = manualInput;
        } else if (recordingMethod === 'audio') {
            if (selectedSttSource) {
                source_text = sttResults[selectedSttSource as keyof typeof sttResults];
            }
        }

        if (!source_text || source_text.trim().length < 50) {
            alert("LLM 생성을 위한 원본 텍스트 정보가 없거나 너무 짧습니다.\n(문서 직접 입력 또는 STT 변환/선택 필요)");
            return;
        }

        // 2. engine 조립
        const engine = llmEngine as LLMEngine;

        // 3. doc_types 조립 (❌ 핵심 수정 ❌)
        // { summary: true, concept: false } -> ["summary"]
        const doc_types = Object.keys(llmDocTypes)
            .filter(key => llmDocTypes[key as DocType]) as DocType[];

        if (doc_types.length === 0) {
            alert("생성할 문서 타입을 1개 이상 선택해주세요.");
            return;
        }

        // --- API 호출 ---
        setIsGenerating(true);
        setGenerationPhase(2); // LLM 진행 중 UI 표시

        try {
            const payload = { source_text, engine, doc_types };

            const response = await generationService.generateLLM(payload);

            // --- 결과 반영 ---
            // 백엔드에서 받은 results 배열을 프론트엔드 llmResults 상태에 맞게 매핑
            setLlmResults(prev =>
                prev.map(uiResult => {
                    // 백엔드 결과에서 일치하는 doc_type 찾기
                    const backendResult = response.results.find(
                        res => res.doc_type === uiResult.id
                    );

                    if (backendResult) {
                        // 일치하는 결과가 있으면 content 업데이트
                        return { ...uiResult, content: backendResult.content };
                    }
                    // 일치하는 결과가 없으면 (e.g. 프론트에만 있고 요청 안 보냄) 기존 상태 유지
                    return uiResult;
                })
            );

            alert(`[${response.engine}] LLM 문서 생성이 완료되었습니다.`);

        } catch (error) {
            console.error("LLM 생성 중 오류:", error);
            handleApiError(error);
        } finally {
            setIsGenerating(false);
            setGenerationPhase(0);
        }
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

    const handleSave = async () => {  // async 추가
        // 유효성 검증
        // 수정된 코드 (올바른 검증)
        if (!meetingTitle || !meetingTitle.trim()) {
            alert("회의록 제목을 입력해주세요.");
            return;
        }

        if (!meetingDateTime) {
            alert("회의일시를 입력해주세요.");
            return;
        }

        if (!meetingPlace || !meetingPlace.trim()) {
            alert("회의장소를 입력해주세요.");
            return;
        }

        if (llmOutput && !selectedSttSource) {
            alert("LLM 생성을 위한 소스 텍스트를 선택해주세요.");
            return;
        }

        try {
            setIsFileUploading(true);

            const dataToSave = {
                projectId: selectedProjectId,
                sttSource: selectedSttSource,
                llmResultsToSave: llmResults.filter(r => r.save && r.content),
                sharedWith,
                shareMethods,
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
            };

            console.log("서버에 저장할 최종 데이터:", dataToSave);

            // 1️⃣ [수정] 서버로 전송할 전체 데이터 구성
            // [추가] shareMethods를 ['email', 'jandi'] 형태의 배열로 변환
            const shareMethodArray = Object.entries(shareMethods)
                .filter(([, checked]) => checked)
                .map(([key]) => key);

            // [추가] sharedWith를 [1, 2, 3] 형태의 ID 배열로 변환
            const sharedWithIds = sharedWith.map(emp => emp.id);

            // [추가] tags를 ['tag1', 'tag2'] 형태의 배열로 변환
            const tagArray = tags.split(',').map(t => t.trim()).filter(t => t);

            // [추가] manualInput (소스 텍스트)
            // 'document' 모드일 때 manualInput을 사용, 'audio' 모드일 때 선택된 STT 결과를 사용
            // 🛑 [수정] sourceText 로직은 basic_minutes와 별개이므로 제거하고
            // basic_minutes를 직접 할당합니다.
            // let sourceText: string | null = null;
            // if (recordingMethod === 'document') {
            //     sourceText = manualInput;
            // } else if (recordingMethod === 'audio' && selectedSttSource) {
            //     // sttResults에서 선택된 소스(예: 'whisper')의 실제 텍스트 내용을 가져옴
            //     sourceText = sttResults[selectedSttSource as keyof typeof sttResults] || null;
            // }

            const meetingData = {
                meeting_title: meetingTitle,
                meeting_datetime: new Date(meetingDateTime).toISOString(),
                meeting_place: meetingPlace,
                project_id: selectedProjectId,

                // --- ▼▼▼ [추가] 누락된 데이터들 ▼▼▼ ---

                // (가정) 백엔드 필드명: 'source_text' (manualInput 또는 STT 결과)
                // source_text: sourceText,
                // ✅ manualInput 값을 basic_minutes 필드로 전송
                basic_minutes: manualInput,

                // (가정) 백엔드 필드명: 'share_methods'
                share_methods: shareMethodArray,

                // (가정) 백엔드 필드명: 'shared_with_ids' (공유 대상 직원 ID 목록)
                shared_with_ids: sharedWithIds,

                // (가정) 백엔드 필드명: 'tags'
                tags: tagArray,

                // ✅ attendees (그 외 참석자)는 현재 문자열(attendees)로 관리되고 있습니다.
                // 백엔드 API 스키마(MeetingMinutesCreate)는 attendee_ids: List[int]를 받습니다.
                // 이 부분은 별도의 상태 관리가 필요하지만, 현재 요청은 manualInput에 관한 것이므로
                // 우선 빈 배열로 두거나, 기존 로직을 유지합니다. (여기서는 빈 배열로 가정)
                // 만약 '그 외 참석자' 문자열을 저장하는 다른 필드가 있다면 그것을 사용해야 합니다.
                // -> 백엔드 라우터를 보니 attendee_ids를 받지 않고, 대신 스키마에 attendee_ids가 있습니다.
                // -> 프론트엔드 코드의 meetingData에 attendee_ids를 추가해야 합니다.
                // -> 지금 attendees 상태는 문자열이므로, ID 배열을 관리하는 상태가 필요합니다.
                // -> 이 요청의 범위를 벗어나므로, 우선 빈 배열로 둡니다.
                attendee_ids: [], // TODO: 실제 참석자 ID 배열 관리 필요

                // (가정) TODO: LLM 결과물(llmResultsToSave)도 API 스펙에 따라 추가해야 할 수 있습니다.
                // llm_results: llmResults.filter(r => r.save && r.content),
            };
            // 🛑 디버깅
            console.log("서버에 저장할 최종 데이터:", meetingData);

            // 1️⃣ 회의록 데이터 저장 (Create or Update)
            let meetingId: number;

            if (saveMode === 'create') {
                // 신규 생성
                const created = await meetingMinuteService.createMeeting(meetingData);
                meetingId = created.meeting_id;
                setCurrentMeetingId(meetingId);
                setSaveMode('update');
            } else {
                // 업데이트
                if (!currentMeetingId) {
                    throw new Error("meeting_id가 없습니다");
                }
                await meetingMinuteService.updateMeeting(currentMeetingId, meetingData);
                meetingId = currentMeetingId;
            }

            // 2️⃣ 파일 업로드 (meeting_id가 확정된 이후)
            if (selectedFiles.length > 0) {
                try {
                    const uploadPromises = selectedFiles.map((file: File) =>
                        fileUploadService.uploadFile(
                            null,  // projectId는 null (회의록 파일이므로)
                            file,
                            2,  // meeting_minutes 타입
                            meetingId  // meeting_id 전달
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

            alert("회의록이 성공적으로 저장되었습니다.");

            // 현재 활성화된 탭('my' 또는 'shared')의 목록을
            // 현재 필터 기준으로 다시 불러옵니다.
            if (activeTab === 'my' || activeTab === 'shared') {
                loadMeetings(activeTab, filterType);
            }

        } catch (error: any) {
            console.error('저장 실패:', error);

            if (error.response?.status === 409) {
                alert("회의록 정보가 유효하지 않습니다. 새로고침 후 다시 시도해주세요.");
            } else {
                alert(`저장 실패: ${error.message}`);
            }
        } finally {
            setIsFileUploading(false);
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

                {/* --- ▼▼▼ 회의록 리스트 탭 섹션 ▼▼▼ --- */}
                <div className="meeting-minutes-section">
                    <h3 className="section-header-meetingminutes">■ 회의록 리스트</h3>

                    {/* 탭 네비게이션 */}
                    <div className="tab-navigation">
                        <button
                            className={`tab-button ${activeTab === 'my' ? 'active' : ''}`}
                            onClick={() => setActiveTab('my')}
                        >
                            나의 회의록
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'shared' ? 'active' : ''}`}
                            onClick={() => setActiveTab('shared')}
                        >
                            공유받은 회의록
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
                            disabled
                        >
                            전체 회의록
                        </button>
                    </div>

                    {/* 탭 컨텐츠 */}
                    <div className="tab-content">
                        {/* ✅ [신규] 필터 바 추가 */}
                        <div className="filter-bar">
                            <select value={filterType} onChange={handleFilterChange}>
                                <option value="all">전체</option>
                                <option value="project">프로젝트 연계</option>
                                <option value="independent">독립 회의록</option>
                            </select>
                        </div>

                        {/* ✅ [수정] 로딩/에러/목록 렌더링 로직 추가 */}
                        {listLoading ? (
                            <div className="loading">목록을 불러오는 중...</div>
                        ) : listError ? (
                            <div className="error">{listError}</div>
                        ) : (
                            <>
                                {activeTab === 'my' && (
                                    <div className="tab-pane active">
                                        <MeetingList meetings={myMeetings} onSelect={handleMeetingSelect} />
                                    </div>
                                )}
                                {activeTab === 'shared' && (
                                    <div className="tab-pane active">
                                        <MeetingList meetings={sharedMeetings} onSelect={handleMeetingSelect} />
                                    </div>
                                )}
                                {activeTab === 'all' && (
                                    <div className="tab-pane active">
                                        <p>전체 회의록 리스트가 여기에 표시됩니다. (권한에 따라)</p>
                                        {/* TODO: '전체 회의록' 리스트 컴포넌트 렌더링 */}
                                        {/* 예: <AllMeetingMinutesList /> */}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
                {/* --- ▲▲▲ 회의록 리스트 탭 섹션 종료 ▲▲▲ --- */}

                {/*<div className="meeting-minutes-section">*/}
                {/*    <h3 className="section-header-meetingminutes">■ 회의록 리스트</h3>*/}
                {/*</div>*/}

                <div id="basic-info-section" className="meeting-minutes-section">
                    <h3 className="section-header-meetingminutes">■ 기본 정보</h3>
                    {/* --- ▼▼▼ [최종 수정] 기본 정보 레이아웃 및 기능 ▼▼▼ --- */}
                    {/* (데이터는 handleMeetingSelect에 의해 업데이트됨) */}
                    {/*<div style={{ padding: '15px' }}>*/}
                    <div style={{ padding: '2.5rem 1.75rem' }}>
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

                                    {/*<input*/}
                                    {/*    type="datetime-local"*/}
                                    {/*    className="writer-field-input"*/}
                                    {/*    style={{width: '100%'}}*/}
                                    {/*    value={meetingDateTime}*/}
                                    {/*    onChange={(e) => setMeetingDateTime(e.target.value)}*/}
                                    {/*/>*/}
                                    {/* --- ▼▼▼ [수정] react-datepicker로 교체 ▼▼▼ --- */}
                                    <DatePicker
                                        locale={ko}
                                        selected={meetingDateTime ? new Date(meetingDateTime) : null}
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                // date 객체를 'YYYY-MM-DDTHH:mm' 형식의 로컬 시간 문자열로 변환
                                                // (기존 handleMeetingSelect에서 사용한 로직과 동일하게)
                                                const localDateTime = new Date(date.getTime() - (date.getTimezoneOffset() * 60000))
                                                    .toISOString()
                                                    .slice(0, 16);
                                                setMeetingDateTime(localDateTime);
                                            } else {
                                                setMeetingDateTime('');
                                            }
                                        }}
                                        showTimeSelect  // 시간 선택 옵션 활성화
                                        dateFormat="yyyy-MM-dd HH:mm" // 사용자에게 보여질 날짜/시간 형식
                                        className="writer-field-input" // 기존 스타일 적용
                                        // ✅ [추가] DatePicker 래퍼에 100% 너비를 적용하기 위한 클래스
                                        wrapperClassName="date-picker-wrapper"

                                        // ❌ [제거] 이 'style' prop이 TS 오류의 원인이었습니다.
                                        // style={{width: '100%'}}
                                        placeholderText="회의 일시를 선택하세요"
                                        autoComplete="off" // 브라우저 자동완성 끄기
                                    />
                                    {/* --- ▲▲▲ 수정 종료 ▲▲▲ --- */}
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
                            <div className="writer-field"> {/* ✅ style 속성 제거 */}
                                <label className="writer-field-label">그 외 참석자</label> {/* ✅ style 속성 제거 */}
                                <input type="text" className="writer-field-input" style={{width: '100%'}} value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="참석자는 기록용도 일 뿐, 회의록 공유는 이뤄지지 않습니다. 쉼표(,)로 구분" />
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

                {/* ✅ 아래 방향 화살표 추가 */}
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', margin: '10px 0'}}>
                    {/*<div style={{fontSize: '6rem', color: '#1890ff', lineHeight: '1'}}>*/}
                    <div style={{fontSize: '6rem', color: '#18f02f', lineHeight: '1'}}>

                        ⬇
                    </div>
                </div>

                {/*3. '회의록 기록 방법 선택' 섹션 추가*/}
                <div className="meeting-minutes-section">
                    <h3 className="section-header-meetingminutes">■ 회의록 기록 방법 선택</h3>
                    {/*<div style={{padding: '20px', display: 'flex', gap: '20px', justifyContent: 'center'}}>*/}
                    <div style={{ padding: '2.5rem 2.75rem', display: 'flex', gap: '20px', justifyContent: 'center' }}>
                        <label className="recording-method-label" style={{
                            border: '2px solid #ddd',
                            borderRadius: '12px',
                            padding: '30px',
                            flex: 1,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: recordingMethod === 'document' ? '#f0f8ff' : 'white',
                            borderColor: recordingMethod === 'document' ? '#1890ff' : '#ddd',
                            display: 'flex',
                            flexDirection: 'row',  // ✅ 가로 배치
                            alignItems: 'center',  // ✅ 세로축 기준 가운데 정렬
                            justifyContent: 'center',  // ✅ 가로축 기준 가운데 정렬
                            gap: '15px'
                        }}>
                            <input
                                type="radio"
                                name="recording-method"
                                value="document"
                                checked={recordingMethod === 'document'}
                                onChange={(e) => setRecordingMethod(e.target.value)}
                                style={{
                                    transform: 'scale(1.8)',
                                    margin: '0'  // ✅ 기본 마진 제거
                                }}
                            />
                            <div style={{fontSize: '18px', fontWeight: 'bold'}}>
                                문서 파일 또는 직접 입력
                            </div>
                        </label>

                        <label className="recording-method-label" style={{
                            border: '2px solid #ddd',
                            borderRadius: '12px',
                            padding: '30px',
                            flex: 1,
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: recordingMethod === 'audio' ? '#f0f8ff' : 'white',
                            borderColor: recordingMethod === 'audio' ? '#1890ff' : '#ddd',
                            display: 'flex',
                            flexDirection: 'row',  // ✅ 가로 배치
                            alignItems: 'center',  // ✅ 세로축 기준 가운데 정렬
                            justifyContent: 'center',  // ✅ 가로축 기준 가운데 정렬
                            gap: '15px'
                        }}>
                            <input
                                type="radio"
                                name="recording-method"
                                value="audio"
                                checked={recordingMethod === 'audio'}
                                onChange={(e) => setRecordingMethod(e.target.value)}
                                style={{
                                    transform: 'scale(1.8)',
                                    margin: '0'  // ✅ 기본 마진 제거
                                }}
                            />
                            <div style={{fontSize: '18px', fontWeight: 'bold'}}>
                                음성 녹취록 (녹음파일)
                            </div>
                        </label>

                        <label className="recording-method-label" style={{
                            border: '2px solid #ddd',
                            borderRadius: '12px',
                            padding: '30px',
                            flex: 1,
                            textAlign: 'center',
                            cursor: 'not-allowed',
                            backgroundColor: '#f5f5f5',
                            borderColor: '#ddd',
                            opacity: 0.6,
                            display: 'flex',
                            flexDirection: 'row',  // ✅ 가로 배치
                            alignItems: 'center',  // ✅ 세로축 기준 가운데 정렬
                            justifyContent: 'center',  // ✅ 가로축 기준 가운데 정렬
                            gap: '15px'
                        }}>
                            <input
                                type="radio"
                                name="recording-method"
                                value="realtime"
                                disabled
                                style={{
                                    transform: 'scale(1.8)',
                                    margin: '0'  // ✅ 기본 마진 제거
                                }}
                            />
                            <div style={{fontSize: '18px', fontWeight: 'bold', color: '#999'}}>
                                실시간 생성
                            </div>
                            <div style={{fontSize: '12px', color: '#999'}}>
                                (준비중)
                            </div>
                        </label>
                    </div>
                </div>

                {/* ✅ 아래 방향 화살표 추가 */}
                <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', margin: '10px 0'}}>
                    <div style={{fontSize: '6rem', color: '#18f02f', lineHeight: '1'}}>
                        ⬇
                    </div>
                </div>

                <div className="meeting-minutes-section">
                    <h3 className="section-header-meetingminutes">■ 파일 리스트</h3>
                    {serverFiles.length > 0 ? (
                        <div style={{padding: '15px'}}>
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '10px'
                            }}>
                                {serverFiles.map(file => (
                                    <div
                                        key={`server-${file.id}`}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            padding: '12px 16px',
                                            border: '1px solid #e0e0e0',
                                            borderRadius: '8px',
                                            backgroundColor: '#f9f9f9'
                                        }}
                                    >
                                        <div style={{flex: 1}}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '4px'
                                            }}>
                                                <span style={{fontSize: '16px'}}>📄</span>
                                                <span style={{fontWeight: '500'}}>{file.original_file_name}</span>
                                                <span style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: '#e8f5e9',
                                                    color: '#2e7d32',
                                                    borderRadius: '4px',
                                                    fontSize: '12px'
                                                }}>
                                    저장됨
                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '13px',
                                                color: '#666',
                                                display: 'flex',
                                                gap: '12px'
                                            }}>
                                                <span>{formatFileSize(file.file_size)}</span>
                                                <span>업로드: {new Date(file.uploaded_at).toLocaleDateString('ko-KR')}</span>
                                                {file.uploader_name && <span>by {file.uploader_name}</span>}
                                            </div>
                                        </div>
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    window.open(file.download_url, '_blank');
                                                }}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#1890ff',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '14px'
                                                }}
                                            >
                                                ⬇️ 다운로드
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div style={{
                            padding: '30px',
                            textAlign: 'center',
                            color: '#999',
                            fontSize: '14px'
                        }}>
                            저장된 파일이 없습니다.
                        </div>
                    )}
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
                        {/*{serverFiles.length === 0 && selectedFiles.length === 0 ? (*/}
                        {selectedFiles.length === 0 ? (
                            <div className="drop-zone-message">
                                <div className="drop-zone-icon">📁</div>
                                <div className="drop-zone-text">
                                    <p style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
                                        📎 클릭하거나 파일을 드래그하여 업로드하세요
                                    </p>
                                    <p style={{ fontSize: '2rem', color: '#888' }}>
                                        지원 형식: {allowedExtensions.join(', ')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="file-list">
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

                {/*5. 직접 입력 inputbox 추가 (파일 업로드 섹션 바로 다음, line 700 근처)*/}
                {/*{recordingMethod === 'document' && (*/}
                {/*    <div className="meeting-minutes-section">*/}
                {/*        <h3 className="section-header-meetingminutes">■ 회의록 직접 입력</h3>*/}
                {/*        <textarea*/}
                {/*            className="meeting-minutes-textarea"*/}
                {/*            rows={15}*/}
                {/*            value={manualInput}*/}
                {/*            onChange={(e) => setManualInput(e.target.value)}*/}
                {/*            placeholder="회의록 내용을 직접 입력하세요..."*/}
                {/*            style={{width: '100%', padding: '15px'}}*/}
                {/*        />*/}
                {/*    </div>*/}
                {/*)}*/}
                {recordingMethod === 'document' && (
                    <div className="meeting-minutes-section">
                        <h3 className="section-header-meetingminutes">
                            ■ 회의록 직접 입력
                            {manualInput && selectedFiles.length > 0 && (
                                <span style={{fontSize: '14px', color: '#1890ff', marginLeft: '10px'}}>
                                    (파일에서 로드됨)
                                </span>
                            )}
                        </h3>
                        <textarea
                            className="meeting-minutes-textarea"
                            rows={15}
                            value={manualInput}
                            onChange={(e) => setManualInput(e.target.value)}
                            placeholder="회의록 내용을 직접 입력하거나, txt/md 파일을 드롭존에서 선택하면 자동으로 내용이 로드됩니다..."
                            style={{
                                margin: '0.5rem',
                                // width: '100%',
                                width: 'calc(100% - 1rem)',
                                padding: '15px',
                                fontFamily: 'monospace', // md 파일의 경우 가독성 향상
                                whiteSpace: 'pre-wrap', // 줄바꿈 및 공백 유지
                                overflowWrap: 'break-word'
                            }}
                        />
                        <div className="writer-field" style={{ alignItems: 'center', margin: '0 0.5rem' }}>
                            <label className="meeting-minutes-label share-method-label">
                                <input type="checkbox" className="meeting-minutes-checkbox checkbox-large" name="llm-output" checked={llmOutput} onChange={(e) => setLlmOutput(e.target.checked)}/>
                                <span>LLM 문서 생성</span>
                            </label>
                        </div>

                        {manualInput && (
                            <div style={{marginTop: '10px', fontSize: '12px', color: '#666'}}>
                                💡 마크다운 형식이 유지됩니다. 자유롭게 편집하세요.
                            </div>
                        )}
                    </div>
                )}

                {recordingMethod === 'audio' && (
                    <div className="generation-panel" style={{flexDirection: 'column', gap: '15px'}}>
                        <div style={{display: 'flex', width: '100%', gap: '20px'}}>
                            {/*<div className="generation-options" style={{flex: 1, flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>*/}
                            <div className="generation-options" style={{
                                flex: 1,
                                flexDirection: 'column',
                                alignItems: 'flex-start',
                                border: '1px solid #eee',
                                padding: '15px',
                                borderRadius: '8px',
                                // opacity: recordingMethod === 'audio' ? 1 : 0.3,
                                // pointerEvents: recordingMethod === 'audio' ? 'auto' : 'none'
                                opacity: 0.3,
                                pointerEvents: 'none'
                            }}>
                                <h4>1. STT 엔진 선택</h4>
                                <label className="meeting-minutes-label">
                                    <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="whisper" checked={sttEngine === 'whisper'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                    Whisper
                                </label>
                                <label className="meeting-minutes-label">
                                    <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="vosk" checked={sttEngine === 'vosk'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                    Vosk STT
                                </label>
                                <label className="meeting-minutes-label">
                                    <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="clova" checked={sttEngine === 'clova'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                    Clova Speech
                                </label>
                                <label className="meeting-minutes-label">
                                    <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="google" checked={sttEngine === 'google'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                    Google STT
                                </label>
                                <label className="meeting-minutes-label">
                                    <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="aws" checked={sttEngine === 'aws'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                    AWS Transcribe
                                </label>
                                <label className="meeting-minutes-label">
                                    <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="azure" checked={sttEngine === 'azure'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                    Azure Speech
                                </label>
                            </div>
                            {/*<div className="generation-options" style={{flex: 1, flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>*/}
                            {/*    <h4>2. 생성할 문서 타입</h4>*/}
                            {/*    <label className="meeting-minutes-label">*/}
                            {/*        <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="summary" checked={llmDocTypes.summary} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>*/}
                            {/*        내용(안건) 정리*/}
                            {/*    </label>*/}
                            {/*    <label className="meeting-minutes-label">*/}
                            {/*        <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="concept" checked={llmDocTypes.concept} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>*/}
                            {/*        컨셉 문서*/}
                            {/*    </label>*/}
                            {/*    <label className="meeting-minutes-label">*/}
                            {/*        <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="draft" checked={llmDocTypes.draft} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>*/}
                            {/*        Draft 기획서*/}
                            {/*    </label>*/}
                            {/*</div>*/}
                        </div>
                        {/*<div style={{flexDirection: 'column', gap: '15px'}}>*/}
                        {/*<button className="btn-secondary" onClick={handleGenerate} style={{fontSize: '2.5rem'}}>LLM 회의록 생성</button>*/}
                        {/*<button className="btn-secondary" onClick={handleGenerate} style={{margin: '2rem'}}>STT( Speech To Text ) 변환</button>*/}
                        <button className="btn-secondary" onClick={handleGenerateSTT} style={{margin: '2rem'}}>STT( Speech To Text ) 변환</button>
                    </div>
                )}


                {/*<div className="generation-panel" style={{flexDirection: 'column', gap: '15px', backgroundColor: 'white'}}>*/}
                {/*    /!*<div style={{flexDirection: 'column', gap: '15px'}}>*!/*/}
                {/*    /!*<button className="btn-secondary" onClick={handleGenerate} style={{fontSize: '2.5rem'}}>LLM 회의록 생성</button>*!/*/}
                {/*    <button className="btn-secondary" onClick={handleGenerate}>STT( Speech To Text ) 변환</button>*/}
                {/*</div>*/}

                {/* ✅ 프로그레스 바 추가 */}
                {isGenerating && (
                    <div className="generation-progress" style={{
                        padding: '20px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '8px',
                        margin: '20px 0',
                        border: '1px solid #e0e0e0'
                    }}>
                        {generationPhase === 1 && (
                            <div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '10px'
                                }}>
                                    <h4 style={{margin: 0, fontSize: '16px', color: '#333'}}>
                                        🎤 Phase 1: STT 음성 변환 중
                                    </h4>
                                    <span style={{fontSize: '14px', fontWeight: 'bold', color: '#1890ff'}}>
                                        {sttProgress}%
                                    </span>
                                </div>
                                <div style={{
                                    width: '100%',
                                    height: '30px',
                                    backgroundColor: '#e0e0e0',
                                    borderRadius: '15px',
                                    overflow: 'hidden',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: `${sttProgress}%`,
                                        height: '100%',
                                        backgroundColor: '#1890ff',
                                        transition: 'width 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'flex-end',
                                        paddingRight: '10px',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: 'bold'
                                    }}>
                                        {sttProgress > 5 && `${sttProgress}%`}
                                    </div>
                                </div>
                                <div style={{
                                    marginTop: '8px',
                                    fontSize: '12px',
                                    color: '#666'
                                }}>
                                    {sttEngine === 'clova' && 'Clova Speech'}
                                    {sttEngine === 'google' && 'Google STT'}
                                    {sttEngine === 'whisper' && 'Whisper AI'}
                                    로 음성을 텍스트로 변환하고 있습니다...
                                </div>
                            </div>
                        )}

                        {/*{generationPhase === 2 && (*/}
                        {/*    <div>*/}
                        {/*        <div style={{*/}
                        {/*            display: 'flex',*/}
                        {/*            alignItems: 'center',*/}
                        {/*            gap: '15px',*/}
                        {/*            marginBottom: '10px'*/}
                        {/*        }}>*/}
                        {/*            <div className="spinner" style={{*/}
                        {/*                width: '30px',*/}
                        {/*                height: '30px',*/}
                        {/*                border: '4px solid #f3f3f3',*/}
                        {/*                borderTop: '4px solid #1890ff',*/}
                        {/*                borderRadius: '50%',*/}
                        {/*                animation: 'spin 1s linear infinite'*/}
                        {/*            }}></div>*/}
                        {/*            <h4 style={{margin: 0, fontSize: '16px', color: '#333'}}>*/}
                        {/*                🤖 Phase 2: LLM 문서 생성 중*/}
                        {/*            </h4>*/}
                        {/*        </div>*/}
                        {/*        <div style={{*/}
                        {/*            marginTop: '8px',*/}
                        {/*            fontSize: '12px',*/}
                        {/*            color: '#666',*/}
                        {/*            marginLeft: '45px'*/}
                        {/*        }}>*/}
                        {/*            AI가 회의록을 분석하여*/}
                        {/*            {llmDocTypes.summary && ' 안건 정리'}*/}
                        {/*            {llmDocTypes.concept && (llmDocTypes.summary ? ', 컨셉 문서' : ' 컨셉 문서')}*/}
                        {/*            {llmDocTypes.draft && ((llmDocTypes.summary || llmDocTypes.concept) ? ', Draft 기획서' : ' Draft 기획서')}*/}
                        {/*            를 생성하고 있습니다...*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*)}*/}
                    </div>
                )}

                {/*/!* ✅ 아래 방향 화살표 추가 *!/*/}
                {/*<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', margin: '10px 0'}}>*/}
                {/*    <div style={{fontSize: '6rem', color: '#18f02f', lineHeight: '1'}}>*/}
                {/*        ⬇*/}
                {/*    </div>*/}
                {/*</div>*/}

                {recordingMethod === 'audio' && (
                    <div className="meeting-minutes-section">
                        {/* ✅ 아래 방향 화살표 추가 */}
                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', margin: '10px 0'}}>
                            <div style={{fontSize: '6rem', color: '#18f02f', lineHeight: '1'}}>
                                ⬇
                            </div>
                        </div>
                        <h3 className="section-header-meetingminutes">■ 음성에서 추출한 텍스트 (Source)</h3>
                        <div style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            {Object.entries(sttResults).map(([key, value]) => (
                                <div key={key}>
                                    <label className="meeting-minutes-label">
                                        <input type="radio" name="stt-source" value={key} onChange={(e) => setSelectedSttSource(e.target.value)} style={{marginRight: '8px'}} />
                                        {key.charAt(0).toUpperCase() + key.slice(1)} 결과 (이것을 소스로 사용)
                                    </label>
                                    <textarea className="meeting-minutes-textarea" rows={10} defaultValue={value} style={{marginTop: '5px'}}/>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/*{ recordingMethod === 'document' && llmOutput && (*/}
                { ( llmOutput || (recordingMethod === 'audio') ) && (
                    <div>
                        <div className="generation-panel" style={{flexDirection: 'column', gap: '15px'}}>
                            <div style={{display: 'flex', width: '100%', gap: '20px'}}>
                                {/*<div className="generation-options" style={{flex: 1, flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>*/}
                                <div className="generation-options" style={{
                                    flex: 1,
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    border: '1px solid #eee',
                                    padding: '15px',
                                    borderRadius: '8px',
                                    // opacity: recordingMethod === 'audio' ? 1 : 0.3,
                                    // pointerEvents: recordingMethod === 'audio' ? 'auto' : 'none'
                                }}>
                                    <h4>1. LLM 선택</h4>
                                    <label className="meeting-minutes-label">
                                        <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="claude" checked={llmEngine === 'claude'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                        Claude
                                    </label>
                                    <label className="meeting-minutes-label">
                                        <input className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="chatgpt" checked={llmEngine === 'chatgpt'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                        ChatGPT
                                    </label>
                                    <label className="meeting-minutes-label">
                                        <input className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="gemini" checked={llmEngine === 'gemini'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                        Gemini
                                    </label>
                                    <label className="meeting-minutes-label" style={{opacity: 0.3}}>
                                        <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="perplexity" checked={llmEngine === 'perplexity'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                        Perplexity
                                    </label>
                                    <label className="meeting-minutes-label" style={{opacity: 0.3}}>
                                        <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="grok" checked={llmEngine === 'grok'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                        Grok
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
                            {/*<button className="btn-secondary" onClick={handleGenerate} style={{margin: '2rem'}}>LLM 회의록 생성</button>*/}
                            <button
                                className="btn-secondary"
                                // className="btn-disabled"
                                onClick={handleGenerateLLM}
                                style={{margin: '2rem'}}
                                disabled={isGenerating}
                            >
                                LLM 회의록 생성
                            </button>
                        </div>

                        <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', margin: '10px 0'}}>
                            <div style={{fontSize: '6rem', color: '#18f02f', lineHeight: '1'}}>
                                ⬇
                            </div>
                        </div>

                        {/* ✅ 프로그레스 바 추가 */}
                        {isGenerating && (
                            <div className="generation-progress" style={{
                                padding: '20px',
                                backgroundColor: '#f8f9fa',
                                borderRadius: '8px',
                                margin: '20px 0',
                                border: '1px solid #e0e0e0'
                            }}>
                                {generationPhase === 2 && (
                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px',
                                            marginBottom: '10px'
                                        }}>
                                            <div className="spinner" style={{
                                                width: '30px',
                                                height: '30px',
                                                border: '4px solid #f3f3f3',
                                                borderTop: '4px solid #1890ff',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}></div>
                                            <h4 style={{margin: 0, fontSize: '16px', color: '#333'}}>
                                                🤖 Phase 2: LLM 문서 생성 중
                                            </h4>
                                        </div>
                                        <div style={{
                                            marginTop: '8px',
                                            fontSize: '12px',
                                            color: '#666',
                                            marginLeft: '45px'
                                        }}>
                                            AI가 회의록을 분석하여
                                            {llmDocTypes.summary && ' 안건 정리'}
                                            {llmDocTypes.concept && (llmDocTypes.summary ? ', 컨셉 문서' : ' 컨셉 문서')}
                                            {llmDocTypes.draft && ((llmDocTypes.summary || llmDocTypes.concept) ? ', Draft 기획서' : ' Draft 기획서')}
                                            를 생성하고 있습니다...
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="meeting-minutes-section">
                            <h3 className="section-header-meetingminutes">■ 생성된 Draft 기획서, 컨셉문서, 주요 안건 정리</h3>
                            <div style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                                {llmResults.map(result => (
                                    llmDocTypes[result.id as keyof typeof llmDocTypes] && (
                                        <div key={result.id}>

                                            <label className="meeting-minutes-label llm-result-label">
                                                <input
                                                    // className="meeting-minutes-checkbox" /* ✅ checkbox-large 클래스 제거 */
                                                    className="meeting-minutes-checkbox checkbox-large" /* ✅ checkbox-large 클래스 제거 */
                                                    type="checkbox"
                                                    checked={result.save}
                                                    onChange={() => handleLlmResultSaveChange(result.id)}
                                                    // /* ✅ style 속성 제거 */
                                                />
                                                <span>{result.title} (서버에 저장)</span>
                                            </label>
                                            <textarea className="meeting-minutes-textarea" rows={20} value={result.content} readOnly style={{marginTop: '5px'}} />
                                        </div>
                                    )
                                ))}
                            </div>
                        </div>

                    </div>
                )}

                {/* --- ▼▼▼ [수정] 최종 저장 버튼 (요청사항 11) ▼▼▼ --- */}
                <div className="meeting-minutes-actions" style={{justifyContent: 'center'}}>
                    <button className="btn-primary" onClick={handleSave}>서버 저장&nbsp;&nbsp;&nbsp;&&nbsp;&nbsp;&nbsp;공유자에게 전송</button>
                </div>
                {/* --- ▲▲▲ 최종 저장 버튼 종료 ▲▲▲ --- */}

            </div>
        </div>
    );
};

export default MeetingMinutes;