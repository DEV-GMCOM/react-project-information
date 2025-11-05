
import React, { useState, useRef, useEffect,useCallback, useMemo, ChangeEvent } from 'react';


// [추가] API 서비스 및 타입 import
import { projectService } from '../../api/services/projectService';
import { employeeService } from '../../api/services/employeeService';
import { Project, Employee, MeetingMinute } from '../../api/types';
import { fileUploadService } from '../../api/services/fileUploadService';

// 회의록 서비스 import
import { meetingMinuteService } from '../../api/services/meetingMinuteService'; // (가정: 새 서비스 파일 필요)

import MeetingBasicInfoForm from '../../components/meeting/MeetingBasicInfoForm';
import NewMeetingModal from '../../components/meeting/NewMeetingModal';


// [추가] 에러 핸들러 (프로젝트에 이미 있다면 경로 수정)
import { handleApiError } from '../../api/utils/errorUtils';
// ✅ 1. Import 추가 (파일 최상단 import 섹션에)
import {
    generationService,
    STTProgressMessage,
    STTEngine,
    LLMEngine,
    DocType
} from '../../api/services/generationService';
// import { generationService, STTProgressMessage } from '../../api/services/generationService';

import { useHelp } from '../../contexts/HelpContext';

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

// 파일 상단의 상태 정의 부분
interface LLMResultUI {
    id: string;
    label: string;
    content: string;
    save: boolean;
    llm_document_id?: number;  // ✅ 추가
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

    // 원본 데이터 저장 (회의록 로드 시점의 데이터)
    const [originalData, setOriginalData] = useState<{
        meetingTitle: string;
        meetingDateTime: Date | null;
        meetingPlace: string;
        projectId: number | null;
        sharedWithIds: number[];
        tags: string;
        shareMethods: { email: boolean; jandi: boolean };
        attendees: string;
        manualInput: string;
        sttResults: Record<string, string>;
        llmResults: Array<{ id: string; title: string; content: string; save: boolean }>;
    } | null>(null);

    // 변경 여부 추적
    const [hasChanges, setHasChanges] = useState(false);

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
    // const [sttResults, setSttResults] = useState({
    //     whisper: "Whisper AI를 통해 변환된 텍스트 예시입니다... 이 텍스트는 30라인 이상의 길이를 가질 수 있으며, 스크롤을 통해 전체 내용을 확인할 수 있습니다.",
    //     clova: "Clova Speech를 통해 변환된 텍스트 예시입니다...",
    //     google: "Google STT를 통해 변환된 텍스트 예시입니다...",
    //     aws: "AWS STT를 통해 변환된 텍스트 예시입니다...",
    //     azure: "Azure STT를 통해 변환된 텍스트 예시입니다...",
    //     vosk: "Vosk STT를 통해 변환된 텍스트 예시입니다...",
    // });
    const [sttResults, setSttResults] = useState({
        whisper: "",  // 👈 빈 문자열로 변경
        clova: "",
        google: "",
        aws: "",
        azure: "",
        vosk: "",
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
    // ✅ [추가] 둘 중 하나는 반드시 선택되도록 강제하는 커스텀 상태 설정 함수
    const customSetShareMethods: React.Dispatch<React.SetStateAction<{ email: boolean; jandi: boolean; }>> = (valueOrFn) => {

        // React의 set함수는 (새로운 값) 또는 (이전값 => 새로운 값) 형태의 함수를 받을 수 있습니다.
        // 두 경우 모두 처리합니다.
        setShareMethods(prev => {
            // 1. 자식 컴포넌트가 의도한 '다음 상태'를 계산합니다.
            const nextState = typeof valueOrFn === 'function'
                ? valueOrFn(prev)  // (prev) => newState 형태
                : valueOrFn;        // newState 형태

            // 2. '다음 상태'를 검증합니다.
            // 만약 '다음 상태'에서 email과 jandi가 모두 false라면,
            if (!nextState.email && !nextState.jandi) {
                // 3. 상태 업데이트를 거부하고 '이전 상태'를 반환합니다.
                return prev;
            }

            // 4. 유효한 변경이라면 '다음 상태'를 반환하여 업데이트를 승인합니다.
            return nextState;
        });
    };

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

    // 필터 상태 추가
    const [filterType, setFilterType] = useState<'all' | 'project' | 'independent'>('all');

    // State 추가 (파일 상단 state 섹션에)
    type SaveMode = 'create' | 'update';
    const [saveMode, setSaveMode] = useState<SaveMode>('create');
    const [currentMeetingId, setCurrentMeetingId] = useState<number | null>(null);

    // State 추가 (기존 state들 아래에)
    const [uploadedFileIds, setUploadedFileIds] = useState<Map<string, number>>(new Map());
    // Map<파일명, file_id> - 업로드된 파일의 ID 추적

    const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);

    const [selectedMeeting, setSelectedMeeting] = useState<MeetingMinute | null>(null);


    const handleNewMeeting = () => {
        // 상태 초기화
        setMeetingTitle('');
        setMeetingDateTime(null);
        setMeetingPlace('');
        setProjectName('');
        setSelectedProjectId(null);
        setSharedWith([]);
        setAttendees('');
        setTags('');
        setShareMethods({ email: true, jandi: false });
        setCurrentMeetingId(null);
        setSaveMode('create');

        // 모달 열기
        setIsNewMeetingModalOpen(true);
    };



    const handleSaveNewMeeting = async () => {
        if (!meetingTitle || !meetingDateTime) {
            alert("회의록 제목과 일시는 필수입니다.");
            // return;
            throw new Error("필수값 누락"); // ✅ throw로 변경
        }

        try {
            const minimalData = {
                meeting_title: meetingTitle,
                meeting_datetime: new Date(meetingDateTime).toISOString(),
                meeting_place: meetingPlace || '미정',
                project_id: selectedProjectId,
                shared_with_ids: sharedWith.map(emp => emp.id),
                share_methods: Object.entries(shareMethods)
                    .filter(([, checked]) => checked)
                    .map(([key]) => key),
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
                attendee_ids: [],
                basic_minutes: ''
            };

            const created = await meetingMinuteService.createMeeting(minimalData);
            setCurrentMeetingId(created.meeting_id);
            setSaveMode('update');

            alert("신규 회의록이 생성되었습니다.");

            // 목록 새로고침
            if (activeTab === 'my' || activeTab === 'shared') {
                loadMeetings(activeTab, filterType);
            }
        } catch (error: any) {
            console.error('저장 실패:', error);
            alert(`저장 실패: ${error.message}`);
            throw error; // ✅ 에러를 다시 throw
        }
    };

    const { setHelpContent } = useHelp();

    useEffect(() => {
        setHelpContent({
            pageName: '회의록',
            content: (
                <>
                    <div className="help-section">
                        <h3>📋 회의록 작성 가이드</h3>
                        <p>
                            프로젝트 진행 중 발생하는 각종 회의 내용을 체계적으로 기록하고
                            결정 사항 및 액션 아이템을 관리하기 위한 문서입니다.
                        </p>
                    </div>

                    <div className="help-section">
                        <h3>🔍 프로젝트 선택 및 회의 정보</h3>
                        <ul>
                            <li><strong>프로젝트 검색:</strong> 회의가 진행된 프로젝트를 검색하여 선택합니다.</li>
                            <li><strong>회의 목록:</strong> 해당 프로젝트의 이전 회의록 목록을 확인할 수 있습니다.</li>
                            <li><strong>신규 작성:</strong> 새로운 회의록을 작성하거나 기존 회의록을 수정합니다.</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📝 회의록 작성 항목</h3>

                        <p><strong>1. 회의 기본 정보:</strong></p>
                        <ul>
                            <li><strong>회의 제목:</strong> 회의 목적을 명확히 나타내는 제목</li>
                            <li><strong>회의 유형:</strong>
                                <ul>
                                    <li>킥오프 미팅 (Kick-off Meeting)</li>
                                    <li>정기 진행 회의 (Status Meeting)</li>
                                    <li>기술 검토 회의 (Technical Review)</li>
                                    <li>설계 리뷰 (Design Review)</li>
                                    <li>이슈 해결 회의 (Issue Resolution)</li>
                                    <li>클라이언트 미팅 (Client Meeting)</li>
                                    <li>회고 회의 (Retrospective)</li>
                                    <li>기타</li>
                                </ul>
                            </li>
                            <li><strong>회의 일시:</strong> 날짜 및 시간 (시작~종료)</li>
                            <li><strong>회의 장소:</strong> 물리적 장소 또는 온라인 회의 URL</li>
                        </ul>

                        <p><strong>2. 참석자 정보:</strong></p>
                        <ul>
                            <li><strong>참석자:</strong> 회의 참석 인원 (직원 검색 가능)
                                <ul>
                                    <li>이름, 소속, 역할</li>
                                    <li>내부/외부 구분</li>
                                </ul>
                            </li>
                            <li><strong>불참자:</strong> 참석 예정이었으나 불참한 인원</li>
                            <li><strong>작성자:</strong> 회의록 작성 담당자</li>
                            <li><strong>배포 대상:</strong> 회의록을 공유할 인원 목록</li>
                        </ul>

                        <p><strong>3. 회의 목적 및 안건:</strong></p>
                        <ul>
                            <li><strong>회의 목적:</strong> 이 회의를 개최한 배경 및 목적</li>
                            <li><strong>안건 목록:</strong> 논의할 주제들
                                <ul>
                                    <li>안건 번호</li>
                                    <li>안건 제목</li>
                                    <li>제안자</li>
                                    <li>우선순위</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>4. 회의 내용:</strong></p>
                        <ul>
                            <li><strong>안건별 논의 내용:</strong>
                                <ul>
                                    <li>제기된 의견들</li>
                                    <li>찬반 의견</li>
                                    <li>논쟁점</li>
                                    <li>합의 사항</li>
                                </ul>
                            </li>
                            <li><strong>주요 발언:</strong> 중요한 발언이나 의견 기록</li>
                            <li><strong>제시된 대안:</strong> 논의 과정에서 나온 여러 옵션들</li>
                            <li><strong>기술적 논의:</strong> 기술 관련 상세 내용 (필요시)</li>
                        </ul>

                        <p><strong>5. 결정 사항 (Decisions Made):</strong></p>
                        <ul>
                            <li><strong>결정 내용:</strong> 회의를 통해 확정된 사항들
                                <ul>
                                    <li>결정 번호</li>
                                    <li>결정 사항 요약</li>
                                    <li>결정 근거</li>
                                    <li>반대 의견 (있는 경우)</li>
                                </ul>
                            </li>
                            <li><strong>승인 사항:</strong> 최종 승인이 필요한 항목</li>
                            <li><strong>보류 사항:</strong> 추가 검토가 필요한 사항</li>
                        </ul>

                        <p><strong>6. 액션 아이템 (Action Items):</strong></p>
                        <ul>
                            <li><strong>항목 추가:</strong> '+ 액션 아이템 추가' 버튼으로 등록</li>
                            <li><strong>액션 정보:</strong>
                                <ul>
                                    <li>액션 ID (자동 부여)</li>
                                    <li>할 일 내용 (구체적으로 작성)</li>
                                    <li>담당자 (반드시 지정)</li>
                                    <li>협조자 (필요 시)</li>
                                    <li>기한 (명확한 날짜)</li>
                                    <li>우선순위 (High, Medium, Low)</li>
                                    <li>상태 (Not Started, In Progress, Done)</li>
                                </ul>
                            </li>
                            <li><strong>진행 상황:</strong> 액션 아이템별 진행률 및 완료 여부</li>
                        </ul>

                        <p><strong>7. 이슈 및 리스크:</strong></p>
                        <ul>
                            <li><strong>논의된 이슈:</strong> 회의에서 다룬 현재 이슈</li>
                            <li><strong>신규 이슈:</strong> 회의 중 새로 발견된 문제</li>
                            <li><strong>리스크 식별:</strong> 향후 발생 가능한 리스크</li>
                            <li>각 이슈/리스크별 대응 방안</li>
                        </ul>

                        <p><strong>8. 질의응답 (Q&A):</strong></p>
                        <ul>
                            <li>제기된 질문과 답변</li>
                            <li>미해결 질문 및 추후 답변 계획</li>
                            <li>클라이언트 질의 사항 (클라이언트 미팅인 경우)</li>
                        </ul>

                        <p><strong>9. 다음 회의:</strong></p>
                        <ul>
                            <li><strong>차기 회의 일정:</strong> 다음 회의 예정일</li>
                            <li><strong>준비 사항:</strong> 다음 회의까지 준비할 자료나 검토 사항</li>
                            <li><strong>안건 예고:</strong> 다음 회의에서 다룰 주제</li>
                        </ul>

                        <p><strong>10. 기타 사항:</strong></p>
                        <ul>
                            <li>특기 사항</li>
                            <li>공지 사항</li>
                            <li>참고 자료</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📎 첨부파일</h3>
                        <ul>
                            <li><strong>회의 자료:</strong> 발표 자료, 보고서 등</li>
                            <li><strong>관련 문서:</strong> 논의에 사용된 참고 문서</li>
                            <li><strong>화이트보드:</strong> 다이어그램, 스케치 이미지</li>
                            <li><strong>녹취록:</strong> 회의 녹음 파일 (필요시)</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>🔄 회의록 관리</h3>
                        <ul>
                            <li><strong>즉시 작성:</strong> 회의 직후 또는 당일 내 작성</li>
                            <li><strong>검토 및 승인:</strong> 주요 회의는 참석자 검토 후 확정</li>
                            <li><strong>배포:</strong> 관련자에게 이메일 또는 시스템으로 공유</li>
                            <li><strong>이력 관리:</strong> 수정 이력을 자동으로 기록</li>
                            <li><strong>액션 추적:</strong> 액션 아이템 완료 여부를 지속 모니터링</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📊 회의록 활용</h3>
                        <ul>
                            <li><strong>의사결정 기록:</strong> 프로젝트 주요 결정의 근거 자료</li>
                            <li><strong>책임 명확화:</strong> 액션 아이템을 통한 업무 할당</li>
                            <li><strong>진행 추적:</strong> 프로젝트 진행 과정 파악</li>
                            <li><strong>분쟁 예방:</strong> 합의 사항의 증빙 자료</li>
                            <li><strong>인수인계:</strong> 프로젝트 히스토리 파악</li>
                        </ul>
                    </div>

                    <div className="help-tip">
                        <strong>💡 TIP:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>회의 중 실시간으로 작성하거나, 회의 직후 즉시 작성하세요.</li>
                            <li>결정 사항과 액션 아이템은 명확하고 구체적으로 작성하세요.</li>
                            <li>담당자와 기한은 반드시 명시하여 책임을 명확히 하세요.</li>
                            <li>중요한 회의는 참석자들의 검토를 받아 정확성을 높이세요.</li>
                            <li>회의 템플릿을 활용하면 일관성 있는 회의록 작성이 가능합니다.</li>
                        </ul>
                    </div>

                    <div className="help-warning">
                        <strong>⚠️ 주의사항:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>개인 의견과 합의된 결정을 명확히 구분하여 작성하세요.</li>
                            <li>민감한 내용이나 기밀 사항은 배포 범위를 제한하세요.</li>
                            <li>액션 아이템은 실행 가능한 수준으로 구체적으로 작성하세요.</li>
                            <li>회의록은 법적 증빙 자료가 될 수 있으므로 정확하게 작성하세요.</li>
                        </ul>
                    </div>
                </>
            )
        });

        return () => {
            setHelpContent(null);
        };
    }, [setHelpContent]);

    const loadMeetings = useCallback(async (tab: 'my' | 'shared', filter: typeof filterType) => {
        setListLoading(true);
        setListError(null);
        try {
            // filter를 백엔드가 이해하는 has_project로 변환
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
        // loadMeetings 함수는 useCallback으로 메모이제이션되었으므로 의존성 배열에 추가
    }, [activeTab, filterType, loadMeetings]);

    // [신규] 필터 변경 핸들러
    const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setFilterType(event.target.value as 'all' | 'project' | 'independent');
    };

    // --- ▼▼▼ 회의록 선택 핸들러 ▼▼▼ ---
    // const handleMeetingSelect = useCallback(async (meeting: MeetingMinute) => {
    //     console.log('선택된 회의록:', meeting);
    //
    //     setSelectedMeeting(meeting);
    //
    //     // 기본 정보 로드
    //     setMeetingTitle(meeting.meeting_title);
    //     setMeetingDateTime(meeting.meeting_datetime ? new Date(meeting.meeting_datetime) : null);
    //     setMeetingPlace(meeting.meeting_place || '');
    //     setProjectName(meeting.project_name || '');
    //     setSelectedProjectId(meeting.project_id || null);
    //     setSharedWith(meeting.shared_with || []);
    //     setAttendees(meeting.attendees_display || '');
    //     setTags(meeting.tags?.join(', ') || '');
    //     setShareMethods({
    //         email: meeting.share_methods?.includes('email') ?? true,
    //         jandi: meeting.share_methods?.includes('jandi') ?? false
    //     });
    //
    //     // basic_minutes 로드
    //     setManualInput(meeting.basic_minutes || '');
    //
    //     try {
    //         // ✅ 상세 정보 조회 (STT/LLM 포함)
    //         const details = await meetingMinuteService.getMeetingDetails(meeting.meeting_id);
    //
    //         console.log('상세 정보:', details);
    //
    //         // ✅ 파일 목록 설정
    //         if (details.file_attachments) {
    //             setServerFiles(details.file_attachments);
    //         }
    //
    //         // ✅ STT 결과 처리
    //         if (details.stt_originals && details.stt_originals.length > 0) {
    //             const sttData: Record<string, string> = {};
    //             details.stt_originals.forEach((stt: any) => {
    //                 sttData[stt.stt_engine_type] = stt.original_text;
    //             });
    //
    //             // 기존 sttResults와 병합
    //             setSttResults(prev => ({ ...prev, ...sttData }));
    //
    //             // 가장 최근 STT 결과를 기본 선택
    //             setSelectedSttSource(details.stt_originals[0].stt_engine_type);
    //
    //             console.log('STT 결과 로드 완료:', Object.keys(sttData));
    //         }
    //
    //         // ✅ LLM 결과 처리
    //         if (details.llm_documents && details.llm_documents.length > 0) {
    //             setLlmResults(prev =>
    //                 prev.map(result => {
    //                     const llmDoc = details.llm_documents?.find(
    //                         (doc: any) => doc.document_type === result.id
    //                     );
    //                     return llmDoc
    //                         ? { ...result, content: llmDoc.document_content || '', save: true }
    //                         : result;
    //                 })
    //             );
    //
    //             console.log('LLM 결과 로드 완료');
    //         }
    //
    //     } catch (error) {
    //         console.error('상세 정보 로드 실패:', error);
    //         alert('상세 정보를 불러오는 중 오류가 발생했습니다.');
    //     }
    //
    //     setCurrentMeetingId(meeting.meeting_id);
    //     setSaveMode('update');
    //
    //     console.log(`회의록 ${meeting.meeting_id} 로드 완료`);
    //
    //
    // }, []); // 의존성 배열 비움 (다른 상태 변경 시 재생성 방지)
    // // --- ▲▲▲ 회의록 선택 핸들러 종료 ▲▲▲ ---
    const handleMeetingSelect = useCallback(async (meeting: MeetingMinute) => {
        console.log('선택된 회의록:', meeting);

        setSelectedMeeting(meeting);

        // 기본 정보 로드
        setMeetingTitle(meeting.meeting_title);
        setMeetingDateTime(meeting.meeting_datetime ? new Date(meeting.meeting_datetime) : null);
        setMeetingPlace(meeting.meeting_place || '');
        setProjectName(meeting.project_name || '');
        setSelectedProjectId(meeting.project_id || null);
        setSharedWith(meeting.shared_with || []);
        setAttendees(meeting.attendees_display || '');
        setTags(meeting.tags?.join(', ') || '');
        setShareMethods({
            email: meeting.share_methods?.includes('email') ?? true,
            jandi: meeting.share_methods?.includes('jandi') ?? false
        });

        // basic_minutes 로드
        setManualInput(meeting.basic_minutes || '');

        try {
            // 상세 정보 조회 (STT/LLM 포함)
            const details = await meetingMinuteService.getMeetingDetails(meeting.meeting_id);

            console.log('상세 정보:', details);

            // 파일 목록 설정
            if (details.file_attachments) {
                setServerFiles(details.file_attachments);
            }

            // STT 결과 처리
            // const loadedSttResults: Record<string, string> = {
            //     whisper: "",
            //     clova: "",
            //     google: "",
            //     aws: "",
            //     azure: "",
            //     vosk: ""
            // };
            // STT 결과 처리
            const loadedSttResults: {
                whisper: string;
                clova: string;
                google: string;
                aws: string;
                azure: string;
                vosk: string;
            } = {
                whisper: "",
                clova: "",
                google: "",
                aws: "",
                azure: "",
                vosk: ""
            };
            if (details.stt_originals && details.stt_originals.length > 0) {
                details.stt_originals.forEach((stt: any) => {
                    // loadedSttResults[stt.stt_engine_type] = stt.original_text
                    // ✅ 타입 단언 추가
                    const engineType = stt.stt_engine_type as keyof typeof loadedSttResults;
                    if (engineType in loadedSttResults) {
                        loadedSttResults[engineType] = stt.original_text;
                    }
                });

                setSttResults(loadedSttResults);
                setSelectedSttSource(details.stt_originals[0].stt_engine_type);

                // console.log('STT 결과 로드 완료:', Object.keys(loadedSttResults).filter(k => loadedSttResults[k]));
                console.log('STT 결과 로드 완료:', Object.keys(loadedSttResults).filter(k => {
                    const key = k as keyof typeof loadedSttResults;
                    return loadedSttResults[key];
                }));
            } else {
                setSttResults(loadedSttResults);
            }

            // LLM 결과 처리
            const loadedLlmResults = llmResults.map(result => {
                const llmDoc = details.llm_documents?.find(
                    (doc: any) => doc.document_type === result.id
                );
                return llmDoc
                    ? { ...result, content: llmDoc.document_content || '', save: true }
                    : result;
            });

            setLlmResults(loadedLlmResults);
            console.log('LLM 결과 로드 완료');

            // ✅ 원본 데이터 저장 (변경 감지용)
            setOriginalData({
                meetingTitle: meeting.meeting_title,
                meetingDateTime: meeting.meeting_datetime ? new Date(meeting.meeting_datetime) : null,
                meetingPlace: meeting.meeting_place || '',
                projectId: meeting.project_id || null,
                sharedWithIds: (meeting.shared_with || []).map(emp => emp.id),
                tags: meeting.tags?.join(', ') || '',
                shareMethods: {
                    email: meeting.share_methods?.includes('email') ?? true,
                    jandi: meeting.share_methods?.includes('jandi') ?? false
                },
                attendees: meeting.attendees_display || '',
                manualInput: meeting.basic_minutes || '',
                sttResults: { ...loadedSttResults },
                llmResults: JSON.parse(JSON.stringify(loadedLlmResults)) // deep copy
            });

            // 변경 없음으로 초기화
            setHasChanges(false);

        } catch (error) {
            console.error('상세 정보 로드 실패:', error);
            alert('상세 정보를 불러오는 중 오류가 발생했습니다.');
        }

        setCurrentMeetingId(meeting.meeting_id);
        setSaveMode('update');

        console.log(`회의록 ${meeting.meeting_id} 로드 완료`);

    }, [llmResults]);


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
    // const [meetingDateTime, setMeetingDateTime] = useState<string>('');
    const [meetingDateTime, setMeetingDateTime] = useState<Date | null>(null);
    const [meetingPlace, setMeetingPlace] = useState<string>('');

    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [generationPhase, setGenerationPhase] = useState<number>(0); // 0: 대기, 1: STT, 2: LLM
    const [sttProgress, setSttProgress] = useState<number>(0); // STT 진행률 (0-100)

    const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
    const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
    const [sttStatusMessage, setSttStatusMessage] = useState<string>('');

    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
    const [conversionDuration, setConversionDuration] = useState<number | null>(null);
    const [wsStartTime, setWsStartTime] = useState<number | null>(null);


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

            // 텍스트 파일 자동 로드 (문서 모드일 때만)
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

            // 텍스트 파일 자동 로드 (문서 모드일 때만)
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

    // ✅ 회의록 자동 생성 함수 추가
    const createMinimalMeeting = async (): Promise<number> => {
        if (!meetingTitle || !meetingDateTime) {
            throw new Error("회의록 제목과 일시는 필수입니다.");
        }

        const minimalData = {
            meeting_title: meetingTitle,
            meeting_datetime: new Date(meetingDateTime).toISOString(),
            meeting_place: meetingPlace || '미정',
            project_id: selectedProjectId,
            shared_with_ids: sharedWith.map(emp => emp.id),
            share_methods: Object.entries(shareMethods)
                .filter(([, checked]) => checked)
                .map(([key]) => key),
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            attendee_ids: [],
            basic_minutes: manualInput || ''
        };

        const created = await meetingMinuteService.createMeeting(minimalData);
        setCurrentMeetingId(created.meeting_id);
        setSaveMode('update');

        return created.meeting_id;
    };

    // ✅ STT 실행 (자동 회의록 생성 포함)
    const handleGenerateSTT = async () => {
        console.log("STT 변환 시작");
        console.log("선택된 STT 엔진:", sttEngine);
        console.log("현재 회의록 ID:", currentMeetingId);

        // --- 파라미터 유효성 검증 ---
        if (selectedFiles.length === 0) {
            alert("STT 변환을 위한 음성 파일을 먼저 업로드해주세요.");
            return;
        }

        setIsGenerating(true);
        setGenerationPhase(1);
        setSttProgress(0);
        // setSttStatusMessage('작업 생성 중...');
        setSttStatusMessage('준비 중...');

        try {
            // ✅ 1단계: 회의록 ID 확보
            let meetingId = currentMeetingId;

            if (!meetingId) {
                setSttStatusMessage('회의록 생성 중...');
                meetingId = await createMinimalMeeting();
                console.log(`✅ 회의록 자동 생성: ID=${meetingId}`);
            }

            // ✅ 2단계: STT 실행
            setSttStatusMessage('파일 업로드 중...');

            const fileToConvert = selectedFiles[0];
            const engineToUse = sttEngine as any; // STTEngine 타입

            // // meeting_id 확인
            // const meetingIdToSend = currentMeetingId || undefined;
            // console.log("전송할 meeting_id:", meetingIdToSend);

            // 비동기 작업 생성
            const createResponse = await generationService.createSTTTask(
                engineToUse,
                fileToConvert,
                {
                    model_size: 'medium', // 설정 가능하도록 state로 관리 가능
                    language: 'ko',
                    // meeting_id: currentMeetingId || undefined  // 회의록 ID 전달
                    // meeting_id: meetingIdToSend  // undefined 또는 숫자
                    meeting_id: meetingId  // ✅ 항상 존재
                }
            );

            const taskId = createResponse.task_id;
            const fileId = createResponse.file_id;  // 파일 ID 받음

            setCurrentTaskId(taskId);
            // 파일 ID 저장 (나중에 STT 결과 조회용)
            setUploadedFileIds(prev => new Map(prev).set(fileToConvert.name, fileId));

            console.log(`✅ 파일 업로드 완료: file_id=${fileId}`);
            setSttStatusMessage('WebSocket 연결 중...');
            setWsStartTime(Date.now());

            // ✅ 3단계: WebSocket 진행률 수신
            // const ws = generationService.connectSTTProgress(
            //     taskId,
            //     async (data: STTProgressMessage) => {
            //         console.log('📊 진행률 수신:', data);
            //
            //         // 진행률 업데이트
            //         setSttProgress(data.progress);
            //         setSttStatusMessage(data.message);
            //
            //         // 상태별 처리
            //         if (data.status === 'completed' && data.result_text) {
            //             // ✅ STT 결과 저장
            //             setSttResults(prev => ({
            //                 ...prev,
            //                 [engineToUse]: data.result_text!
            //             }));
            //
            //             alert(`[${engineToUse}] STT 변환이 완료되었습니다.`);
            //
            //             // ✅ (선택) DB에서 최신 결과 다시 가져오기
            //             try {
            //                 const sttResult = await generationService.getSTTResult(fileId);
            //                 console.log('✅ DB 저장 확인:', sttResult);
            //             } catch (error) {
            //                 console.error('STT 결과 조회 실패:', error);
            //             }
            //
            //             // 상태 초기화
            //             setIsGenerating(false);
            //             setGenerationPhase(0);
            //             setCurrentTaskId(null);
            //         } else if (data.status === 'failed') {
            //             alert(`STT 변환 실패: ${data.error || '알 수 없는 오류'}`);
            //             setIsGenerating(false);
            //             setGenerationPhase(0);
            //             setCurrentTaskId(null);
            //         } else if (data.status === 'aborted') {
            //             alert('STT 변환이 중단되었습니다.');
            //             setIsGenerating(false);
            //             setGenerationPhase(0);
            //             setCurrentTaskId(null);
            //         }
            //     },
            //     (error) => {
            //         console.error('WebSocket 에러:', error);
            //         alert('WebSocket 연결 실패. 네트워크를 확인해주세요.');
            //         setIsGenerating(false);
            //         setGenerationPhase(0);
            //         setCurrentTaskId(null);
            //     }
            // );
            const ws = generationService.connectSTTProgress(
                taskId,
                async (data: STTProgressMessage) => {
                    console.log('📊 진행률 수신:', data);

                    // 진행률 업데이트
                    setSttProgress(data.progress);
                    setSttStatusMessage(data.message || '');

                    // ✅ 남은 시간 계산
                    if (data.progress > 0 && data.progress < 100 && wsStartTime) {
                        const elapsed = Date.now() - wsStartTime;
                        const estimatedTotal = (elapsed / data.progress) * 100;
                        const remaining = Math.max(0, estimatedTotal - elapsed);
                        setEstimatedTimeRemaining(Math.ceil(remaining / 1000));
                    }

                    // ✅ 완료 처리
                    if (data.status === 'completed') {
                        console.log('✅ STT 변환 완료');
                        setSttProgress(100);
                        setSttStatusMessage('변환 완료!');
                        setIsGenerating(false); // ✅ 중단 버튼 숨김
                        setEstimatedTimeRemaining(null);

                        if (data.result_text) {
                            setSttResults(prev => ({
                                ...prev,
                                [sttEngine]: data.result_text!
                            }));
                            setSelectedSttSource(sttEngine);
                        }

                        // ✅ 변환 시간 저장
                        if (data.metadata?.conversion_duration) {
                            setConversionDuration(data.metadata.conversion_duration);
                        }

                        // ✅ WebSocket 명시적 종료
                        if (wsConnection) {
                            wsConnection.close();
                            setWsConnection(null);
                        }

                        alert(`[${sttEngine}] STT 변환이 완료되었습니다.`);

                        // DB 결과 확인 (기존 코드)
                        try {
                            const sttResult = await generationService.getSTTResult(fileId);
                            console.log('✅ DB 저장 확인:', sttResult);
                        } catch (error) {
                            console.error('STT 결과 조회 실패:', error);
                        }

                        setGenerationPhase(0);
                        setCurrentTaskId(null);
                    }
                    // ✅ 실패 처리
                    else if (data.status === 'failed') {
                        console.log(`❌ 작업 실패:`, data.error);
                        setIsGenerating(false);
                        setEstimatedTimeRemaining(null);
                        setSttStatusMessage('변환 실패');
                        setGenerationPhase(0);
                        setCurrentTaskId(null);

                        if (wsConnection) {
                            wsConnection.close();
                            setWsConnection(null);
                        }

                        alert(`STT 변환 실패: ${data.error || '알 수 없는 오류'}`);
                    }
                    // ✅ 중단 처리
                    else if (data.status === 'aborted') {
                        console.log('⏹️ 작업 중단됨');
                        setIsGenerating(false);
                        setEstimatedTimeRemaining(null);
                        setSttStatusMessage('작업이 중단되었습니다');
                        setGenerationPhase(0);
                        setCurrentTaskId(null);

                        if (wsConnection) {
                            wsConnection.close();
                            setWsConnection(null);
                        }

                        alert('STT 변환이 중단되었습니다.');
                    }
                },
                (error) => {
                    console.error('WebSocket 에러:', error);
                    alert('WebSocket 연결 실패. 네트워크를 확인해주세요.');
                    setIsGenerating(false);
                    setGenerationPhase(0);
                    setCurrentTaskId(null);
                    setEstimatedTimeRemaining(null);
                }
            );

            setWsConnection(ws);

        } catch (error: any) {
            console.error("STT 작업 생성 중 오류:", error);
            // ✅ 사용자 친화적 에러 메시지
            if (error.message.includes("필수")) {
                alert(error.message);
            } else {
                alert(`STT 작업 생성 실패: ${error.message || error}`);
            }
            setIsGenerating(false);
            setGenerationPhase(0);
        }
    };

    // ✅ 4. Abort 핸들러 추가 (신규 함수)
    const handleAbortSTT = async () => {
        if (!currentTaskId) {
            return;
        }

        const confirmed = confirm('STT 변환을 중단하시겠습니까?');
        if (!confirmed) {
            return;
        }

        try {
            // WebSocket으로 abort 명령 전송
            if (wsConnection && wsConnection.readyState === WebSocket.OPEN) {
                wsConnection.send(JSON.stringify({ command: 'abort' }));
            }

            // HTTP로도 abort 요청
            await generationService.abortSTTTask(currentTaskId);

            alert('STT 변환 중단 요청이 전송되었습니다.');
        } catch (error) {
            console.error('Abort 요청 실패:', error);
        }
    };

    // ✅ 5. Cleanup 추가 (컴포넌트 언마운트 시 WebSocket 정리)
    useEffect(() => {
        return () => {
            // 컴포넌트 언마운트 시 WebSocket 연결 종료
            if (wsConnection) {
                wsConnection.close();
            }
        };
    }, [wsConnection]);

    // ✅ 4. LLM 생성 전용 함수 (신규)
    const handleGenerateLLM = async () => {

        console.log("LLM 회의록 생성 시작");
        console.log("생성할 문서 타입:", llmDocTypes);
        if (isGenerating) {
            console.log("LLM 생성 중이라, 중복 요청 방지");
            return;
        } // 이중 클릭 방지

        // --- 파라미터 유효성 검증 및 조립 ---

        // 0. meeting_id 확인 (없으면 먼저 회의록 생성)
        let meetingId = currentMeetingId;
        if (!meetingId) {
            console.log("회의록 ID가 없어서 먼저 생성합니다");
            try {
                meetingId = await createMinimalMeeting();
            } catch (error) {
                console.error("회의록 생성 실패:", error);
                alert("회의록을 먼저 생성해야 합니다");
                return;
            }
        }

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

        // 4. stt_original_id 조립 (음성에서 생성한 경우)
        let stt_original_id: number | undefined = undefined;
        if (recordingMethod === 'audio' && selectedSttSource) {
            // STT 원본 ID를 가져오는 로직 (필요시 state 추가)
            // stt_original_id = sttOriginalIds[selectedSttSource];
        }

        // --- API 호출 ---
        setIsGenerating(true);
        setGenerationPhase(2); // LLM 진행 중 UI 표시

        try {
            const payload = {
                source_text,
                engine,
                doc_types,
                meeting_id: meetingId,  // ✅ 추가
                stt_original_id         // ✅ 추가 (선택)
            };

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
                        return {
                            ...uiResult,
                            content: backendResult.content,
                            llm_document_id: backendResult.llm_document_id  // ✅ 추가
                        };
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

        // ✅ [추가] 마지막 남은 하나를 끄려고 할 때, 변경을 막음
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

        // if (!meetingPlace || !meetingPlace.trim()) {
        //     alert("회의장소를 입력해주세요.");
        //     return;
        // }

        // if (llmOutput && !selectedSttSource) {
        //     alert("LLM 생성을 위한 소스 텍스트를 선택해주세요.");
        //     return;
        // }
        if (recordingMethod === 'audio' && !selectedSttSource) {
            alert("LLM 생성을 위한 STT 결과(Source)를 선택해주세요.");
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

            // ✅ 공유자 전송 (이미 DB에 저장되어 있으므로)
            if (shareMethodArray.length > 0) {
                try {
                    await generationService.shareMeeting({
                        meeting_id: meetingId,
                        share_methods: shareMethodArray
                    });
                    console.log("공유자 전송 완료");
                } catch (shareError) {
                    console.error("공유자 전송 실패:", shareError);
                    // 실패해도 계속 진행 (저장은 이미 완료됨)
                }
            }

            alert("회의록이 성공적으로 저장되었습니다.");

            // // 현재 활성화된 탭('my' 또는 'shared')의 목록을
            // // 현재 필터 기준으로 다시 불러옵니다.
            // if (activeTab === 'my' || activeTab === 'shared') {
            //     loadMeetings(activeTab, filterType);
            // }
            // ✅ 저장 성공 후 원본 데이터 업데이트
            setOriginalData({
                meetingTitle,
                meetingDateTime,
                meetingPlace,
                projectId: selectedProjectId,
                sharedWithIds: sharedWith.map(emp => emp.id),
                tags,
                shareMethods: { ...shareMethods },
                attendees,
                manualInput,
                sttResults: { ...sttResults },
                llmResults: JSON.parse(JSON.stringify(llmResults))
            });

            setHasChanges(false);

            // 목록 새로고침
            if (activeTab === 'my' || activeTab === 'shared') {
                loadMeetings(activeTab, filterType);
            }

        } catch (error: any) {
            console.error('저장 실패:', error);
            handleApiError(error);
            if (error.response?.status === 409) {
                alert("회의록 정보가 유효하지 않습니다. 새로고침 후 다시 시도해주세요.");
            } else {
                alert(`저장 실패: ${error.message}`);
            }
        } finally {
            setIsFileUploading(false);
        }
    };

    // 데이터 변경 감지
    useEffect(() => {
        if (!originalData || !currentMeetingId) {
            setHasChanges(false);
            return;
        }

        // 각 필드 비교
        const titleChanged = meetingTitle !== originalData.meetingTitle;
        const dateChanged = meetingDateTime?.getTime() !== originalData.meetingDateTime?.getTime();
        const placeChanged = meetingPlace !== originalData.meetingPlace;
        const projectChanged = selectedProjectId !== originalData.projectId;
        const tagsChanged = tags !== originalData.tags;
        const attendeesChanged = attendees !== originalData.attendees;
        const manualInputChanged = manualInput !== originalData.manualInput;

        // sharedWith 비교
        const currentSharedIds = sharedWith.map(emp => emp.id).sort();
        const originalSharedIds = [...originalData.sharedWithIds].sort();
        const sharedWithChanged = JSON.stringify(currentSharedIds) !== JSON.stringify(originalSharedIds);

        // shareMethods 비교
        const shareMethodsChanged =
            shareMethods.email !== originalData.shareMethods.email ||
            shareMethods.jandi !== originalData.shareMethods.jandi;

        // STT 결과 비교
        const sttChanged = JSON.stringify(sttResults) !== JSON.stringify(originalData.sttResults);

        // LLM 결과 비교
        const llmChanged = JSON.stringify(llmResults) !== JSON.stringify(originalData.llmResults);

        const changed =
            titleChanged ||
            dateChanged ||
            placeChanged ||
            projectChanged ||
            tagsChanged ||
            attendeesChanged ||
            manualInputChanged ||
            sharedWithChanged ||
            shareMethodsChanged ||
            sttChanged ||
            llmChanged;

        setHasChanges(changed);

    }, [
        meetingTitle,
        meetingDateTime,
        meetingPlace,
        selectedProjectId,
        sharedWith,
        tags,
        attendees,
        manualInput,
        shareMethods,
        sttResults,
        llmResults,
        originalData,
        currentMeetingId
    ]);

    // ✅ [추가] 음성 파일 존재 여부 확인 로직
    const hasAudioFiles = useMemo(() => {
        // 1. 새로 선택된 파일 (selectedFiles: File[]) 검사
        const hasNewAudioFiles = selectedFiles.some(file => {
            const ext = file.name.split('.').pop()?.toLowerCase();
            return ext && audioExtensions.includes(ext);
        });

        if (hasNewAudioFiles) return true;

        // 2. 서버에 이미 저장된 파일 (serverFiles: any[]) 검사
        //    (file.original_file_name 사용)
        const hasServerAudioFiles = serverFiles.some(file => {
            if (!file.original_file_name) return false;
            const ext = file.original_file_name.split('.').pop()?.toLowerCase();
            return ext && audioExtensions.includes(ext);
        });

        return hasServerAudioFiles;

    }, [selectedFiles, serverFiles, audioExtensions]); // audioExtensions는 recordingMethod 변경 시 재계산되므로 의존성 추가

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
                    <div className="section-header-meetingminutes" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h4 style={{ margin: 0 }}>■ 회의록 리스트</h4>
                        <button
                            className="btn-new-item"
                            onClick={handleNewMeeting}
                            // style={{ marginRight: '0.5rem' }}
                        >
                            신규 작성
                        </button>
                    </div>
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

                {/* 기본 정보 섹션 - 컴포넌트로 교체 */}
                {selectedMeeting && (
                    <div>
                        <div id="basic-info-section" className="meeting-minutes-section">
                            <h3 className="section-header-meetingminutes">■ 기본 정보</h3>
                            <MeetingBasicInfoForm
                                meetingTitle={meetingTitle}
                                setMeetingTitle={setMeetingTitle}
                                meetingDateTime={meetingDateTime}
                                setMeetingDateTime={setMeetingDateTime}
                                meetingPlace={meetingPlace}
                                setMeetingPlace={setMeetingPlace}
                                projectName={projectName}
                                onProjectSearch={() => setShowProjectSearchModal(true)}
                                sharedWith={sharedWith}
                                onEmployeeSearch={() => setShowEmployeeSearchModal(true)}
                                onRemoveEmployee={(id) => setSharedWith(prev => prev.filter(emp => emp.id !== id))}
                                attendees={attendees}
                                setAttendees={setAttendees}
                                tags={tags}
                                setTags={setTags}
                                shareMethods={shareMethods}
                                // setShareMethods={setShareMethods}
                                setShareMethods={customSetShareMethods}
                            />
                        </div>

                        {selectedMeeting && serverFiles.length > 0 && (
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
                        )}

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

                        {/*{recordingMethod === 'audio' && (*/}
                        {recordingMethod === 'audio' && hasAudioFiles && (
                            <div className="generation-panel" style={{flexDirection: 'column', gap: '15px'}}>
                                <div style={{display: 'flex', width: '100%', gap: '20px'}}>
                                    <div className="generation-options" style={{
                                        flex: 1,
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        border: '1px solid #eee',
                                        padding: '15px',
                                        borderRadius: '8px',
                                        // opacity: 0.3,
                                        // pointerEvents: 'none'
                                    }}>
                                        <h4>1. STT 엔진 선택</h4>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="whisper" checked={sttEngine === 'whisper'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                            Whisper
                                        </label>
                                        <label className="meeting-minutes-label" style={{opacity: '0.3'}}>
                                            <input disabled className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="vosk" checked={sttEngine === 'vosk'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                            Vosk STT
                                        </label>
                                        <label className="meeting-minutes-label" style={{opacity: '0.3'}}>
                                            <input disabled className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="clova" checked={sttEngine === 'clova'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                            Clova Speech
                                        </label>
                                        <label className="meeting-minutes-label" style={{opacity: '0.3'}}>
                                            <input disabled className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="google" checked={sttEngine === 'google'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                            Google STT
                                        </label>
                                        <label className="meeting-minutes-label" style={{opacity: '0.3'}}>
                                            <input disabled className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="aws" checked={sttEngine === 'aws'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                            AWS Transcribe
                                        </label>
                                        <label className="meeting-minutes-label" style={{opacity: '0.3'}}>
                                            <input disabled className="meeting-minutes-radio radio-large" type="radio" name="stt-engine" value="azure" checked={sttEngine === 'azure'} onChange={(e) => setSttEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                            Azure Speech
                                        </label>
                                    </div>
                                </div>
                                <button className="btn-secondary" onClick={handleGenerateSTT} style={{margin: '2rem'}}>STT( Speech To Text ) 변환</button>
                            </div>
                        )}

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
                                    //
                                    <div className="generation-progress">
                                        <div className="progress-header">
                                            <h4>🎙️ STT 변환 진행 중...</h4>
                                            {/* ✅ Abort 버튼 추가 */}
                                            <button
                                                type="button"
                                                onClick={handleAbortSTT}
                                                className="abort-button"
                                                disabled={!currentTaskId}
                                            >
                                                ⏹️ 중단
                                            </button>
                                        </div>
                                        <div className="progress-bar-container">
                                            <div
                                                className="progress-bar"
                                                style={{ width: `${sttProgress}%` }}
                                            >
                                                {sttProgress.toFixed(0)}%
                                            </div>
                                        </div>
                                        {/* ✅ 상태 메시지 표시 추가 */}
                                        <p className="progress-message">{sttStatusMessage}</p>
                                        <p className="progress-info">엔진: {sttEngine}</p>
                                        {/* ✅ 남은 시간 표시 */}
                                        {estimatedTimeRemaining !== null && (
                                            <p className="progress-info" style={{ color: '#1890ff' }}>
                                                예상 남은 시간: 약 {estimatedTimeRemaining}초
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* 음성에서 추출한 텍스트 섹션 - STT 결과가 실제로 있을 때만 전체 섹션 표시 */}
                        {recordingMethod === 'audio' &&
                            Object.values(sttResults).some(text => text && text.trim().length > 0) && (
                                <>
                                    {/* ✅ 아래 방향 화살표 */}
                                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', margin: '10px 0'}}>
                                        <div style={{fontSize: '6rem', color: '#18f02f', lineHeight: '1'}}>
                                            ⬇
                                        </div>
                                    </div>

                                    <div className="meeting-minutes-section">
                                        <h3 className="section-header-meetingminutes">■ 음성에서 추출한 텍스트 (Source)</h3>
                                        <div style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                                            {Object.entries(sttResults).map(([key, value]) => (
                                                value && value.trim().length > 0 && (
                                                    <div key={key}>
                                                        <label className="meeting-minutes-label">
                                                            <input
                                                                type="radio"
                                                                name="stt-source"
                                                                value={key}
                                                                checked={selectedSttSource === key}
                                                                onChange={(e) => setSelectedSttSource(e.target.value)}
                                                                style={{marginRight: '8px'}}
                                                            />
                                                            {key.charAt(0).toUpperCase() + key.slice(1)} 결과 (이것을 소스로 사용)
                                                        </label>
                                                        <div style={{
                                                            border: '1px solid #ddd',
                                                            borderRadius: '8px',
                                                            padding: '15px',
                                                            backgroundColor: '#f9f9f9',
                                                            maxHeight: '300px',
                                                            overflowY: 'auto',
                                                            marginTop: '5px',
                                                            whiteSpace: 'pre-wrap',
                                                            wordBreak: 'break-word',
                                                            fontSize: '14px',
                                                            lineHeight: '1.6'
                                                        }}>
                                                            {value}
                                                        </div>
                                                    </div>
                                                )
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                        {/*{ recordingMethod === 'document' && llmOutput && (*/}
                        {/*{ ( llmOutput || (recordingMethod === 'audio') ) && (*/}
                        { ((recordingMethod === 'document' && manualInput && manualInput.trim().length > 0)
                            || (recordingMethod === 'audio' && sttResults && Object.values(sttResults).some(text => text && text.trim().length > 0))) && (
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
                                            <label className="meeting-minutes-label" style={{opacity: 0.3}}>
                                                <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="claude" checked={llmEngine === 'claude'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                                Claude
                                            </label>
                                            <label className="meeting-minutes-label">
                                                <input className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="chatgpt" checked={llmEngine === 'chatgpt'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                                ChatGPT
                                            </label>
                                            <label className="meeting-minutes-label" style={{opacity: 0.3}}>
                                                <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="gemini" checked={llmEngine === 'gemini'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
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

                                {/*<div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', margin: '10px 0'}}>*/}
                                {/*    <div style={{fontSize: '6rem', color: '#18f02f', lineHeight: '1'}}>*/}
                                {/*        ⬇*/}
                                {/*    </div>*/}
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

                                {/* 생성된 결과 섹션 - LLM 결과가 실제로 있을 때만 표시 */}
                                {/*{recordingMethod === 'document' &&*/}
                                {/*    manualInput &&*/}
                                {/*    manualInput.trim().length > 0 &&*/}
                                {/*    llmResults.some(result =>*/}
                                {/*        llmDocTypes[result.id as keyof typeof llmDocTypes] &&*/}
                                {/*        result.content &&*/}
                                {/*        result.content.trim().length > 0*/}
                                {/*    ) && (*/}
                                {llmResults.some(result =>
                                    llmDocTypes[result.id as keyof typeof llmDocTypes] &&
                                    result.content &&
                                    result.content.trim().length > 0
                                ) && (
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
                                )}

                            </div>
                        )}

                        {/*<div className="meeting-minutes-actions" style={{justifyContent: 'center'}}>*/}
                        {/*    <button className="btn-primary" onClick={handleSave}>서버 저장&nbsp;&nbsp;&nbsp;&&nbsp;&nbsp;&nbsp;공유자에게 전송</button>*/}
                        {/*</div>*/}
                        {/* 최종 저장 버튼 - 회의록 선택했을 때만 표시 */}
                        {selectedMeeting && (
                            <div className="meeting-minutes-actions" style={{justifyContent: 'center'}}>
                                <button
                                    className="btn-primary"
                                    onClick={handleSave}
                                    disabled={!hasChanges || isFileUploading}
                                    style={{
                                        opacity: (!hasChanges || isFileUploading) ? 0.5 : 1,
                                        cursor: (!hasChanges || isFileUploading) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    서버 저장&nbsp;&nbsp;&nbsp;&&nbsp;&nbsp;&nbsp;공유자에게 전송
                                </button>
                            </div>
                        )}

                    </div>
                )}

                {/* 신규 작성 모달 */}
                <NewMeetingModal
                    isOpen={isNewMeetingModalOpen}
                    onClose={() => setIsNewMeetingModalOpen(false)}
                    onSave={handleSaveNewMeeting}
                    meetingTitle={meetingTitle}
                    setMeetingTitle={setMeetingTitle}
                    meetingDateTime={meetingDateTime}
                    setMeetingDateTime={setMeetingDateTime}
                    meetingPlace={meetingPlace}
                    setMeetingPlace={setMeetingPlace}
                    projectName={projectName}
                    onProjectSearch={() => setShowProjectSearchModal(true)}
                    sharedWith={sharedWith}
                    onEmployeeSearch={() => setShowEmployeeSearchModal(true)}
                    onRemoveEmployee={(id) => setSharedWith(prev => prev.filter(emp => emp.id !== id))}
                    attendees={attendees}
                    setAttendees={setAttendees}
                    tags={tags}
                    setTags={setTags}
                    shareMethods={shareMethods}
                    setShareMethods={setShareMethods}
                />

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

                {/* --- ▼▼▼ [수정] 직원 검색 모달 호출 ▼▼▼ --- */}
                {showEmployeeSearchModal && (
                    <EmployeeSearchModal
                        onClose={() => setShowEmployeeSearchModal(false)}
                        onSelect={handleSharedWithSelect}
                        initialSelected={sharedWith}
                    />
                )}
            </div>
        </div>
    );
};

export default MeetingMinutes;