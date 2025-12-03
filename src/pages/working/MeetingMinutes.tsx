
import React, { useState, useRef, useEffect,useCallback, useMemo, ChangeEvent } from 'react';
import Cookies from 'js-cookie'; // ✅ 쿠키 라이브러리 추가 필요


// [추가] API 서비스 및 타입 import
import { projectService } from '../../api/services/projectService';
import { employeeService } from '../../api/services/employeeService';
import { Project, Employee, MeetingMinute, EmployeeSimple } from '../../api/types';
import { fileUploadService } from '../../api/services/fileUploadService';
import apiClient from '../../api/utils/apiClient';

// 회의록 서비스 import
import { meetingMinuteService } from '../../api/services/meetingMinuteService'; // (가정: 새 서비스 파일 필요)

import MeetingBasicInfoForm from '../../components/meeting/MeetingBasicInfoForm';
import NewMeetingModal from '../../components/meeting/NewMeetingModal';
import MeetingList from '../../components/meeting/MeetingList';
import EmployeeSearchModal from '../../components/meeting/EmployeeSearchModal';
import STTSettingsModal from '../../components/meeting/STTSettingsModal';
import LLMSettingsModal from '../../components/meeting/LLMSettingsModal';


// [추가] 에러 핸들러 (프로젝트에 이미 있다면 경로 수정)
import { handleApiError } from '../../api/utils/errorUtils';
// ✅ 1. Import 추가 (파일 최상단 import 섹션에)
import { generationService, STTProgressMessage, STTEngine, LLMEngine, DocType, STTCreateResponse } from '../../api/services/generationService';
// import { generationService, STTProgressMessage } from '../../api/services/generationService';

import { useHelp } from '../../contexts/HelpContext';
import { useAuth } from '../../contexts/AuthContext'; // ✅ useAuth import 추가

// [추가] react-datepicker import
import DatePicker from "react-datepicker";
import { ko } from 'date-fns/locale'; // 👈 [추가]
import "react-datepicker/dist/react-datepicker.css";

// 제공된 CSS 파일들이 상위에서 import 되었다고 가정합니다.
import '../../styles/FormPage.css';
import '../../styles/MeetingMinutes.css';
import '../../styles/ProjectBasicInfoForm.css'; // 검색 모달 등에 필요한 스타일

// 파일 상단의 상태 정의 부분
interface LLMResultUI {
    id: string;
    label: string;
    content: string;
    save: boolean;
    llm_document_id?: number;  // ✅ 추가
}


// (EmployeeSearchModal definition removed - imported from component)
// (MeetingList definition removed - imported from component)



// Helper function for LLM doc types
const getLLMDocLabel = (type: string): string => {
    switch (type) {
        case 'summary': return '주요 안건 정리';
        case 'concept': return '컨셉 문서';
        case 'draft': return 'Draft 기획서';
        case 'todolist': return 'To Do 리스트';
        case 'role': return 'Role & Responsibility';
        case 'glossary': return '용어/약어';
        case 'biz_overview': return '배경지식/트랜드';
        case 'concept_ideas': return '컨셉 아이디어';
        default: return type;
    }
};

// Helper function: 초를 시분초로 변환
const formatTimeFromSeconds = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.ceil(totalSeconds % 60);

    const parts: string[] = [];
    if (hours > 0) parts.push(`${hours}시간`);
    if (minutes > 0) parts.push(`${minutes}분`);
    if (seconds > 0 || parts.length === 0) parts.push(`${seconds}초`);

    return parts.join(' ');
};

const MeetingMinutes = () => {
    const { user } = useAuth(); // ✅ 사용자 정보 가져오기
    // ... (기존 상태들) ...

    // ----------------------------------------------------------------------------------------------------
    // --- 상태 관리 (State Management) ---------------------------------------------------------------------
    // ----------------------------------------------------------------------------------------------------

    const fileInputRef = useRef<HTMLInputElement>(null);
    // ✅ [추가] 프로그레스 바 DOM에 접근하기 위한 ref
    const sttProgressRef = useRef<HTMLDivElement>(null);
    const llmProgressRef = useRef<HTMLDivElement>(null);
    const completionHandledRef = useRef<boolean>(false); // ✅ STT 완료 처리 잠금용 Ref

    // 2. 파일 목록, 업로드 상태 등을 관리하는 state
    const [serverFiles, setServerFiles] = useState<any[]>([]);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // ✅ 새로 선택한 로컬 파일 목록
    const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    // state 추가
    const [recordingMethod, setRecordingMethod] = useState<'document'|'audio'>('document');
    // const [recordingMethod, setRecordingMethod] = useState<string>('document'); // 'document' | 'audio' | 'realtime'
    const [manualInput, setManualInput] = useState<string>(''); // 직접 입력용

    // 파일 확장자 목록을 동적으로 변경
    const documentExtensions = ['text', 'txt', 'md'];
    const audioExtensions = ['mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac'];
    // const allowedExtensions = recordingMethod === 'document' ? documentExtensions : audioExtensions;
    const allowedExtensions = [...documentExtensions, ...audioExtensions];

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
    const [llmEngine, setLlmEngine] = useState<string>('gemini');
    const [llmDocTypes, setLlmDocTypes] = useState({
        summary: true,
        concept: false,
        draft: false,
        todolist: false,
        // mindmap_tree: false,
        // mindmap_graph: false,
        // cal_gant: false,
        role: false,
        glossary: false,
        biz_overview: false,
        concept_ideas: false,
    });

    const [llmResults, setLlmResults] = useState([
        { id: 'summary', title: '주요 안건 정리', content: '', save: true },
        { id: 'concept', title: '컨셉 문서', content: '', save: false },
        { id: 'draft', title: 'Draft 기획서', content: '', save: false },
        { id: 'todolist', title: 'To Do 리스트', content: '', save: false },
        // { id: 'mindmap_tree', title: 'MindMap 트리', content: '', save: false },
        // { id: 'mindmap_graph', title: 'MindMap 그래프', content: '', save: false },
        // { id: 'cal_gant', title: '캘린더_간트차트', content: '', save: false },
        { id: 'role', title: 'Role & Responsibility', content: '', save: false },
        { id: 'glossary', title: '용어/약어', content: '', save: false },
        { id: 'biz_overview', title: '배경지식/트랜드', content: '', save: false },
        { id: 'concept_ideas', title: '컨셉 아이디어', content: '', save: false },
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

    const [tags, setTags] = useState<string>('');
    const [companionAttendees, setCompanionAttendees] = useState<string>(''); // ✅ 추가
    // 탭 상태 관리
    const [activeTab, setActiveTab] = useState<'my' | 'shared' | 'dept' | 'all'>('my');
    const [llmOutput, setLlmOutput] = useState(true);
    // --- ▲▲▲ 상태 관리 종료 ▲▲▲ ---

    // [추가] 정렬 상태 (useCallback보다 먼저 선언)
    const [sortBy, setSortBy] = useState<string>('meeting_datetime');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

    const [myMeetings, setMyMeetings] = useState<MeetingMinute[]>([]);
    const [sharedMeetings, setSharedMeetings] = useState<MeetingMinute[]>([]);
    const [deptMeetings, setDeptMeetings] = useState<MeetingMinute[]>([]); // ✅ 부서 회의록 추가
    const [allMeetings, setAllMeetings] = useState<MeetingMinute[]>([]); // ✅ 추가
    const [listLoading, setListLoading] = useState(false);
    const [listError, setListError] = useState<string | null>(null);
    
    // [추가] 페이지네이션 상태
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const ITEMS_PER_PAGE = 15;

    // 필터 상태 추가
    const [filterType, setFilterType] = useState<'all' | 'project' | 'independent'>('all');

    // State 추가 (파일 상단 state 섹션에)
    type SaveMode = 'create' | 'update';
    const [saveMode, setSaveMode] = useState<SaveMode>('create');
    const [currentMeetingId, setCurrentMeetingId] = useState<number | null>(null);
    const [selectedMeeting, setSelectedMeeting] = useState<MeetingMinute | null>(null);

    const loadMeetings = useCallback(async (tab: 'my' | 'shared' | 'dept' | 'all', filter: typeof filterType, page: number = 1) => { // ✅ 'dept' 및 page 추가
        setListLoading(true);
        setListError(null);
        try {
            const skip = (page - 1) * ITEMS_PER_PAGE;
            const params: any = { limit: ITEMS_PER_PAGE, skip };

            if (filter === 'project') {
                params.has_project = true;
            } else if (filter === 'independent') {
                params.has_project = false;
            }
            // [추가] 정렬 파라미터
            if (sortBy) {
                params.sort_by = sortBy;
            }
            if (sortOrder) {
                params.sort_order = sortOrder;
            }

            // 데이터와 카운트를 병렬로 조회
            const [data, totalCount] = await Promise.all([
                (async () => {
                    if (tab === 'my') return meetingMinuteService.getMyMeetings(params);
                    if (tab === 'shared') return meetingMinuteService.getSharedMeetings(params);
                    if (tab === 'dept') return meetingMinuteService.getDepartmentMeetings(params);
                    return meetingMinuteService.getAllMeetings(params);
                })(),
                meetingMinuteService.getMeetingsCount(tab, params)
            ]);
            
            if (tab === 'my') setMyMeetings(data);
            else if (tab === 'shared') setSharedMeetings(data);
            else if (tab === 'dept') setDeptMeetings(data);
            else setAllMeetings(data);
            
            setTotalPages(Math.ceil(totalCount / ITEMS_PER_PAGE));
            setCurrentPage(page);

        } catch (error) {
            console.error(`Error loading ${tab} meetings with filter ${filter}:`, error);
            setListError('회의록 목록을 불러오는 중 오류가 발생했습니다.');
            handleApiError(error);
        } finally {
            setListLoading(false);
        }
    }, [sortBy, sortOrder]); // ✅ 의존성 배열에 추가

    // [추가] 정렬 핸들러
    const handleSort = useCallback((column: string) => {
        if (column === sortBy) {
            setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(column);
            setSortOrder('desc'); // 기본 내림차순
        }
        // 정렬 변경 시 1페이지로 리셋하고 다시 로드해야 함 -> useEffect가 처리하도록 activeTab 변경?
        // 아니면 loadMeetings 직접 호출. 정렬 변경은 useEffect[sortBy, sortOrder]로 처리하는 게 좋음
    }, [sortBy]);
    
    // 정렬 변경 시 데이터 다시 로드
    useEffect(() => {
        loadMeetings(activeTab, filterType, 1);
    }, [sortBy, sortOrder, activeTab, filterType, loadMeetings]);

    // 탭이 변경될 때 해당 탭의 데이터를 로드 (기존 useEffect 대체)
    // useEffect(() => {
    //    loadMeetings(activeTab, filterType, 1);
    // }, [activeTab, filterType, loadMeetings]);

    // ✅ [추가] 읽기 전용 모드 여부 (본인이 작성자가 아니면 true)
    const isReadOnly = useMemo(() => {
        if (!selectedMeeting) return false; // 신규 작성 중일 때는 편집 가능
        if (!user) return true;
        return selectedMeeting.created_by !== user.emp_id;
    }, [selectedMeeting, user]);

    // State 추가 (기존 state들 아래에)
    const [uploadedFileIds, setUploadedFileIds] = useState<Map<string, number>>(new Map());
    // Map<파일명, file_id> - 업로드된 파일의 ID 추적

    const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);

    // ✅ [복구] 변경 감지 및 원본 데이터 상태
    const [originalData, setOriginalData] = useState<any>(null);
    const [hasChanges, setHasChanges] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false); // ✅ 상세 로딩 상태 추가

    // ✅ STT 설정 모달 상태
    const [showSttSettingsModal, setShowSttSettingsModal] = useState(false);
    const [showLlmSettingsModal, setShowLlmSettingsModal] = useState(false); // 👈 [추가]
    const [sttModelSize, setSttModelSize] = useState<'tiny' | 'base' | 'small' | 'medium' | 'large'>('medium');
    const [sttLanguage, setSttLanguage] = useState<'ko' | 'en' | 'auto'>('ko');

    // ✅ 컴포넌트 마운트 시 쿠키에서 설정 로드
    useEffect(() => {
        const savedEngine = Cookies.get('stt_engine');
        const savedModelSize = Cookies.get('stt_model_size');
        const savedLanguage = Cookies.get('stt_language');

        if (savedEngine) setSttEngine(savedEngine);
        setSttModelSize('medium'); // 백엔드에서 medium 모델로 고정되었으므로 프론트엔드도 고정
        if (savedLanguage) setSttLanguage(savedLanguage as any);
    }, []);

    // ✅ 설정 저장 핸들러
    const handleSaveSettings = () => {
        // 쿠키에 무기한 저장 (expires 생략하면 세션 쿠키가 되므로 명시)
        Cookies.set('stt_engine', sttEngine, { expires: 36500 }); // 100년
        Cookies.set('stt_language', sttLanguage, { expires: 36500 });

        alert('설정이 저장되었습니다.');
        setShowSttSettingsModal(false);
    };

    const handleNewMeeting = () => {
        // 상태 초기화
        setMeetingTitle('');
        setMeetingDateTime(null);
        setMeetingPlace('');
        setProjectName('');
        setSelectedProjectId(null);
        setSharedWith([]);

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
            throw new Error("필수값 누락"); // ✅ throw로 변경
        }

        try {
            const minimalData = {
                meeting_title: meetingTitle,
                meeting_datetime: new Date(meetingDateTime).toISOString(),
                meeting_place: meetingPlace || '미정',
                project_id: selectedProjectId,
                shared_with_ids: sharedWith.map(emp => emp.emp_id),
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

            // ✅ 모달 닫기
            setIsNewMeetingModalOpen(false);

            // 목록 새로고침
            if (activeTab === 'my' || activeTab === 'shared') {
                await loadMeetings(activeTab, filterType);
            }

            // ✅ 생성된 회의록을 다시 로드하여 화면에 표시
            try {
                const details = await meetingMinuteService.getMeetingDetails(created.meeting_id);

                // MeetingMinute 형태로 변환
                const newMeeting: MeetingMinute = {
                    meeting_id: created.meeting_id,
                    meeting_title: created.meeting_title,
                    meeting_datetime: created.meeting_datetime,
                    meeting_place: created.meeting_place || '',
                    project_id: created.project_id,
                    project_name: projectName || '',
                    creator_name: '', // 서버에서 받아온 데이터로 채울 수 있음

                    tags: tags.split(',').map(t => t.trim()).filter(t => t),
                    share_methods: Object.entries(shareMethods)
                        .filter(([, checked]) => checked)
                        .map(([key]) => key as 'email' | 'jandi'),  // ✅ 타입 단언 추가
                    shared_with: sharedWith,
                    has_llm_documents: false,
                    basic_minutes: '',
                    // ✅ 누락된 필수 속성 추가
                    is_active: true,
                    created_at: new Date().toISOString(),
                    created_by: 0  // 실제 사용자 ID가 있다면 사용
                };

                // handleMeetingSelect 호출하여 전체 데이터 로드
                await handleMeetingSelect(newMeeting);

            } catch (loadError) {
                console.error('생성된 회의록 로드 실패:', loadError);
                // 로드 실패해도 기본 정보는 설정되어 있으므로 계속 진행
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

    // [신규] 필터 변경 핸들러
    const handleFilterChange = (event: ChangeEvent<HTMLSelectElement>) => {
        setFilterType(event.target.value as 'all' | 'project' | 'independent');
    };

    // --- ▼▼▼ 회의록 선택 핸들러 ▼▼▼ ---
    const handleMeetingSelect = useCallback(async (meeting: MeetingMinute) => {
        console.log('선택된 회의록:', meeting);
        
        // ✅ 상세 로딩 시작
        setDetailLoading(true);

        // [추가] 다른 회의록을 선택했으므로, 로컬에서 선택한 파일 목록을 초기화합니다.
        setSelectedFiles([]);
        setSttCompleted(false); // ✅ STT 완료 상태 초기화

        // [추가] STT 관련 상태 초기화
        setIsGenerating(false);
        setGenerationPhase(0);
        setSttProgress(0);
        setSttStatusMessage('');
        setCurrentTaskId(null);
        setEstimatedTimeRemaining(null);
        setConversionDuration(null);
        if (wsConnection) { // 기존 WebSocket 연결이 있다면 종료
            wsConnection.close();
            setWsConnection(null);
        }

        setSelectedMeeting(meeting);

        // 기본 정보 로드
        setMeetingTitle(meeting.meeting_title);
        setMeetingDateTime(meeting.meeting_datetime ? new Date(meeting.meeting_datetime) : null);
        setMeetingPlace(meeting.meeting_place || '');
        setCompanionAttendees(meeting.companion_attendees || ''); // ✅ 추가
        setProjectName(meeting.project_name || '');
        setSelectedProjectId(meeting.project_id || null);


        setTags(meeting.tags?.join(', ') || '');
        setShareMethods({
            email: meeting.share_methods?.includes('email') ?? true,
            jandi: meeting.share_methods?.includes('jandi') ?? false
        });

        try {
            // 상세 정보 조회 (STT/LLM 포함)
            const details = await meetingMinuteService.getMeetingDetails(meeting.meeting_id);
            console.log('상세 정보:', details);

            // [수정] 상세 정보에서 basic_minutes를 가져와 상태 업데이트
            setManualInput(details.basic_minutes || '');

            // 파일 목록 설정
            if (details.file_attachments) {
                setServerFiles(details.file_attachments);
            }

            // STT 결과 처리
            const loadedSttResults = { whisper: "", clova: "", google: "", aws: "", azure: "", vosk: "" };
            if (details.stt_originals && details.stt_originals.length > 0) {
                details.stt_originals.forEach((stt: any) => {
                    if (stt.stt_engine_type in loadedSttResults) {
                        loadedSttResults[stt.stt_engine_type as keyof typeof loadedSttResults] = stt.original_text;
                    }
                });
                setSelectedSttSource(details.stt_originals[0].stt_engine_type);
            }
            setSttResults(loadedSttResults);

            // [수정] LLM 결과 처리 로직
            const newLlmResults = [
                { id: 'summary', title: '주요 안건 정리', content: '', save: false },
                { id: 'concept', title: '컨셉 문서', content: '', save: false },
                { id: 'draft', title: 'Draft 기획서', content: '', save: false },
                { id: 'todolist', title: 'To Do 리스트', content: '', save: false },
                { id: 'mindmap_tree', title: 'MindMap 트리', content: '', save: false },
                { id: 'mindmap_graph', title: 'MindMap 그래프', content: '', save: false },
                { id: 'cal_gant', title: '캘린더_간트차트', content: '', save: false },
                { id: 'role', title: 'Role & Responsibility', content: '', save: false },
                { id: 'glossary', title: '용어/약어', content: '', save: false },
                { id: 'biz_overview', title: '배경지식/트랜드', content: '', save: false },
                { id: 'concept_ideas', title: '컨셉 아이디어', content: '', save: false },
            ].map(uiTemplate => {
                const savedDoc = details.llm_documents?.find(doc => doc.document_type === uiTemplate.id);
                return {
                    ...uiTemplate,
                    content: savedDoc ? savedDoc.document_content : '',
                    llm_document_id: savedDoc ? savedDoc.llm_document_id : undefined,
                };
            });
            setLlmResults(newLlmResults);
            
            // ✅ details가 로드된 후 setSharedWith 호출 (원래 747 라인이 있던 곳으로 이동)
            setSharedWith(details.shared_with || []); // ✅ 여기로 이동

            console.log('LLM 결과 로드 완료');

            // [수정] LLM 설정 복원 로직 제거 -> 항상 초기화
            setLlmEngine('gemini');
            setLlmDocTypes({
                summary: true, // 기본으로 '내용 정리'는 체크
                concept: false,
                draft: false,
                todolist: false,
                role: false,
                glossary: false,
                biz_overview: false,
                concept_ideas: false,
            });
            console.log('LLM 설정 초기화 완료');

            // ✅ STT 설정 복원
            if (details.stt_originals && details.stt_originals.length > 0) {
                const firstSttDoc = details.stt_originals[0] as any;
                if (firstSttDoc.stt_engine_type) {
                    setSttEngine(firstSttDoc.stt_engine_type as STTEngine);
                }
            } else {
                setSttEngine('whisper');
            }

            // ✅ 원본 데이터 저장 (변경 감지용)
            setOriginalData({
                meetingTitle: meeting.meeting_title,
                meetingDateTime: meeting.meeting_datetime ? new Date(meeting.meeting_datetime) : null,
                meetingPlace: meeting.meeting_place || '',
                projectId: meeting.project_id || null,
                sharedWithIds: (meeting.shared_with || []).map(emp => emp.emp_id),
                tags: meeting.tags?.join(', ') || '',
                shareMethods: {
                    email: meeting.share_methods?.includes('email') ?? true,
                    jandi: meeting.share_methods?.includes('jandi') ?? false
                },

                manualInput: details.basic_minutes || '',
                sttResults: { ...loadedSttResults },
                llmResults: JSON.parse(JSON.stringify(newLlmResults))
            });

            // 변경 없음으로 초기화
            setHasChanges(false);

        } catch (error) {
            console.error('상세 정보 로드 실패:', error);
            alert('상세 정보를 불러오는 중 오류가 발생했습니다.');
        } finally {
            // ✅ 상세 로딩 종료
            setDetailLoading(false);
        }

        setCurrentMeetingId(meeting.meeting_id);
        setSaveMode('update');

        console.log(`회의록 ${meeting.meeting_id} 로드 완료`);

        // ✅ 스크롤 로직 추가
        setTimeout(() => {
            const basicInfoSection = document.getElementById('basic-info-section');
            if (basicInfoSection) {
                basicInfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100); // UI 갱신 후 스크롤을 위해 약간의 지연 시간 부여

    }, []); // 종속성 배열을 비워서 항상 최신 상태를 참조하도록 함

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
    const [projectSearchError, setProjectSearchError] = useState<string | null>(null);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    // [추가] 프로젝트 검색 페이지네이션 상태
    const [projectCurrentPage, setProjectCurrentPage] = useState(1);
    const [projectTotalPages, setProjectTotalPages] = useState(0);
    const [projectTotalCount, setProjectTotalCount] = useState(0);

    const [showEmployeeSearchModal, setShowEmployeeSearchModal] = useState(false);
    const [sharedWith, setSharedWith] = useState<EmployeeSimple[]>([]); // ✅ EmployeeSimple[]로 변경
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
    const [llmStatusMessage, setLlmStatusMessage] = useState<string>('LLM 문서 생성 준비 중...'); // [추가] LLM 진행 상태 메시지





    const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
    const [conversionDuration, setConversionDuration] = useState<number | null>(null);
    const [wsStartTime, setWsStartTime] = useState<number | null>(null);
    const [sttCompleted, setSttCompleted] = useState<boolean>(false); // ✅ STT 완료 상태 추가

    // [추가] 오디오 예상 시간 계산용
    const [audioDuration, setAudioDuration] = useState<number | null>(null);
    const STT_SPEED_FACTORS = {
        "tiny": 10.0, "base": 5.0, "small": 3.0,
        "medium": 1.5, "large": 0.8
    };

    const getAudioDuration = (file: File): Promise<number | null> => {
        return new Promise((resolve) => {
            const objectUrl = URL.createObjectURL(file);
            const audio = document.createElement('audio');
            audio.preload = 'metadata';
            audio.onloadedmetadata = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(audio.duration);
            };
            audio.onerror = () => {
                URL.revokeObjectURL(objectUrl);
                resolve(null);
            };
            audio.src = objectUrl;
        });
    };

    // ✅ [추가] STT 작업 시작 시 프로그레스 바로 스크롤하는 효과
    useEffect(() => {
        if (isGenerating && generationPhase === 1) {
            // DOM 렌더링 완료 대기 후 스크롤
            const scrollTimer = setTimeout(() => {
                if (sttProgressRef.current) {
                    sttProgressRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100); // 100ms 딜레이로 DOM 렌더링 보장

            return () => clearTimeout(scrollTimer);
        }
    }, [isGenerating, generationPhase]);

    // [추가] LLM 생성 시작 시 프로그레스 바로 스크롤
    useEffect(() => {
        if (isGenerating && generationPhase === 2) {
            // DOM 렌더링 완료 대기 후 스크롤
            const scrollTimer = setTimeout(() => {
                if (llmProgressRef.current) {
                    llmProgressRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center'
                    });
                }
            }, 100); // 100ms 딜레이로 DOM 렌더링 보장

            return () => clearTimeout(scrollTimer);
        }
    }, [isGenerating, generationPhase]);

    // 드래그 앤 드롭 핸들러
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    // ==================== 수정: handleFiles 함수 - 파일 개수 제한 추가 ====================
    // ==================== 수정: handleFiles 함수 - serverFiles 포함 ====================
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        const fileArray = Array.from(files);
        const validFiles: File[] = [];

        // ✅ 현재 선택된 파일 + 서버 파일 모두 체크
        const currentTextFiles = [
            // selectedFiles에서 텍스트 파일
            ...selectedFiles.filter(f => {
                const ext = f.name.split('.').pop()?.toLowerCase();
                return ext && documentExtensions.includes(ext);
            }),
            // serverFiles에서 텍스트 파일
            ...serverFiles.filter(f => {
                const ext = f.original_file_name?.split('.').pop()?.toLowerCase();
                return ext && documentExtensions.includes(ext);
            })
        ];

        const currentAudioFiles = [
            // selectedFiles에서 음성 파일
            ...selectedFiles.filter(f => {
                const ext = f.name.split('.').pop()?.toLowerCase();
                return ext && audioExtensions.includes(ext);
            }),
            // serverFiles에서 음성 파일
            ...serverFiles.filter(f => {
                const ext = f.original_file_name?.split('.').pop()?.toLowerCase();
                return ext && audioExtensions.includes(ext);
            })
        ];

        // 새로 추가하려는 파일 분류
        let newTextFileCount = 0;
        let newAudioFileCount = 0;

        for (const file of fileArray) {
            const ext = file.name.split('.').pop()?.toLowerCase();

            if (!ext || !allowedExtensions.includes(ext)) {
                alert(`허용되지 않는 파일 형식입니다: ${file.name}\n지원 형식: ${allowedExtensions.join(', ')}`);
                continue;
            }

            // 파일 타입별 개수 체크
            if (documentExtensions.includes(ext)) {
                if (currentTextFiles.length + newTextFileCount >= 1) {
                    alert(`텍스트 파일은 최대 1개까지만 업로드할 수 있습니다.\n현재: ${currentTextFiles.length}개 선택됨`);
                    continue;
                }
                newTextFileCount++;
            } else if (audioExtensions.includes(ext)) {
                if (currentAudioFiles.length + newAudioFileCount >= 1) {
                    alert(`음성 파일은 최대 1개까지만 업로드할 수 있습니다.\n현재: ${currentAudioFiles.length}개 선택됨`);
                    continue;
                }
                newAudioFileCount++;
            }

            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setSttCompleted(false); // ✅ 새 파일 추가 시 STT 완료 상태 초기화
            setSelectedFiles(prev => [...prev, ...validFiles]);

            // [추가] 오디오 파일 길이 측정
            const audioFile = validFiles.find(f => f.type.startsWith('audio/') || audioExtensions.includes(f.name.split('.').pop()?.toLowerCase() || ''));
            if (audioFile) {
                getAudioDuration(audioFile).then(duration => {
                    if (duration) setAudioDuration(duration);
                });
            }

            // 텍스트 파일 자동 로드
            for (const file of validFiles) {
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (ext && ['txt', 'text', 'md'].includes(ext)) {
                    try {
                        const content = await readTextFile(file);
                        setManualInput(content);
                        break;
                    } catch (error) {
                        console.error('파일 읽기 오류:', error);
                        alert(`파일을 읽는 중 오류가 발생했습니다: ${file.name}`);
                    }
                }
            }
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

// ==================== 수정: handleDrop 함수 - serverFiles 포함 ====================
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles: File[] = [];

        // ✅ 현재 선택된 파일 + 서버 파일 모두 체크
        const currentTextFiles = [
            ...selectedFiles.filter(f => {
                const ext = f.name.split('.').pop()?.toLowerCase();
                return ext && documentExtensions.includes(ext);
            }),
            ...serverFiles.filter(f => {
                const ext = f.original_file_name?.split('.').pop()?.toLowerCase();
                return ext && documentExtensions.includes(ext);
            })
        ];

        const currentAudioFiles = [
            ...selectedFiles.filter(f => {
                const ext = f.name.split('.').pop()?.toLowerCase();
                return ext && audioExtensions.includes(ext);
            }),
            ...serverFiles.filter(f => {
                const ext = f.original_file_name?.split('.').pop()?.toLowerCase();
                return ext && audioExtensions.includes(ext);
            })
        ];

        // 새로 추가하려는 파일 분류
        let newTextFileCount = 0;
        let newAudioFileCount = 0;

        for (const file of droppedFiles) {
            const ext = file.name.split('.').pop()?.toLowerCase();

            if (!ext || !allowedExtensions.includes(ext)) {
                alert(`허용되지 않는 파일 형식입니다: ${file.name}\n지원 형식: ${allowedExtensions.join(', ')}`);
                continue;
            }

            // 파일 타입별 개수 체크
            if (documentExtensions.includes(ext)) {
                if (currentTextFiles.length + newTextFileCount >= 1) {
                    alert(`텍스트 파일은 최대 1개까지만 업로드할 수 있습니다.\n현재: ${currentTextFiles.length}개 선택됨`);
                    continue;
                }
                newTextFileCount++;
            } else if (audioExtensions.includes(ext)) {
                if (currentAudioFiles.length + newAudioFileCount >= 1) {
                    alert(`음성 파일은 최대 1개까지만 업로드할 수 있습니다.\n현재: ${currentAudioFiles.length}개 선택됨`);
                    continue;
                }
                newAudioFileCount++;
            }

            validFiles.push(file);
        }

        if (validFiles.length > 0) {
            setSttCompleted(false); // ✅ 새 파일 추가 시 STT 완료 상태 초기화
            setSelectedFiles(prev => [...prev, ...validFiles]);

            // [추가] 오디오 파일 길이 측정
            const audioFile = validFiles.find(f => f.type.startsWith('audio/') || audioExtensions.includes(f.name.split('.').pop()?.toLowerCase() || ''));
            if (audioFile) {
                getAudioDuration(audioFile).then(duration => {
                    if (duration) setAudioDuration(duration);
                });
            }

            // 텍스트 파일 자동 로드
            for (const file of validFiles) {
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (ext && ['txt', 'text', 'md'].includes(ext)) {
                    try {
                        const content = await readTextFile(file);
                        setManualInput(content);
                        break;
                    } catch (error) {
                        console.error('파일 읽기 오류:', error);
                        alert(`파일을 읽는 중 오류가 발생했습니다: ${file.name}`);
                    }
                }
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    // 파일 다운로드/삭제 핸들러
    // 파일 삭제 핸들러 (서버에 저장된 파일)
    const handleFileDelete = async (file: any) => {
        if (!window.confirm(`${file.original_file_name} 파일을 정말 삭제하시겠습니까?`)) {
            return;
        }

        if (!selectedMeeting?.meeting_id) {
            alert('회의록 정보가 없습니다');
            return;
        }

        try {
            // API 호출
            await fileUploadService.deleteMeetingFile(selectedMeeting.meeting_id, file.id);

            // ✅ 1. 서버 파일 목록에서 제거
            setServerFiles(prev => prev.filter(f => f.id !== file.id));

            // ✅ 2. 서버에서 최신 회의록 상세 정보를 다시 불러와서 STT/LLM 결과 동기화
            try {
                const details = await meetingMinuteService.getMeetingDetails(selectedMeeting.meeting_id);

                // STT 결과 동기화
                if (details.stt_originals && details.stt_originals.length > 0) {
                    const sttData = {
                        whisper: "",
                        clova: "",
                        google: "",
                        aws: "",
                        azure: "",
                        vosk: "",
                    };

                    details.stt_originals.forEach((stt: any) => {
                        if (stt.stt_engine_type in sttData) {
                            sttData[stt.stt_engine_type as keyof typeof sttData] = stt.original_text;
                        }
                    });

                    setSttResults(sttData);

                    // 선택된 STT 소스가 삭제된 경우 초기화
                    if (selectedSttSource && !sttData[selectedSttSource as keyof typeof sttData]) {
                        setSelectedSttSource('');
                    }
                } else {
                    // STT 결과가 하나도 없으면 모두 초기화
                    setSttResults({
                        whisper: "",
                        clova: "",
                        google: "",
                        aws: "",
                        azure: "",
                        vosk: "",
                    });
                    setSelectedSttSource('');
                }

                // LLM 결과 동기화
                if (details.llm_documents && details.llm_documents.length > 0) {
                    const llmData = details.llm_documents.map((doc: any) => ({
                        id: doc.doc_type,
                        title: getLLMDocLabel(doc.doc_type),
                        content: doc.document_content,
                        save: true,
                        llm_document_id: doc.llm_document_id
                    }));

                    setLlmResults(llmData);
                } else {
                    // LLM 결과가 하나도 없으면 초기화
                    setLlmResults([]);
                }

            } catch (syncError) {
                console.error('회의록 상세 정보 재로드 실패:', syncError);
                // 동기화 실패 시 안전하게 모두 초기화
                setSttResults({
                    whisper: "",
                    clova: "",
                    google: "",
                    aws: "",
                    azure: "",
                    vosk: "",
                });
                setSelectedSttSource('');
                setLlmResults([]);
            }

            alert('파일이 성공적으로 삭제되었습니다');

        } catch (error: any) {
            console.error('파일 삭제 오류:', error);

            let errorMessage = '파일 삭제 중 오류가 발생했습니다';

            if (error.response) {
                switch (error.response.status) {
                    case 403:
                        errorMessage = '파일 삭제 권한이 없습니다';
                        break;
                    case 404:
                        errorMessage = '파일을 찾을 수 없습니다';
                        break;
                    default:
                        errorMessage = error.response.data?.detail || errorMessage;
                }
            }

            alert(errorMessage);
        }
    };

    // 회의록 삭제 핸들러
    const handleDeleteMeeting = async (meeting: MeetingMinute) => {
        if (!window.confirm(`"${meeting.meeting_title}" 회의록을 정말 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
            return;
        }

        try {
            // API 호출
            await meetingMinuteService.deleteMeeting(meeting.meeting_id);

            // 성공 시 목록 새로고침
            await loadMeetings(activeTab as 'my' | 'shared', filterType);

            // 현재 선택된 회의록이 삭제된 경우 초기화
            if (selectedMeeting?.meeting_id === meeting.meeting_id) {
                setSelectedMeeting(null);
                resetForm();
            }

            alert('회의록이 성공적으로 삭제되었습니다');
        } catch (error: any) {
            console.error('회의록 삭제 오류:', error);

            let errorMessage = '회의록 삭제 중 오류가 발생했습니다';

            if (error.response) {
                switch (error.response.status) {
                    case 403:
                        errorMessage = '회의록 삭제 권한이 없습니다 (작성자만 가능)';
                        break;
                    case 404:
                        errorMessage = '회의록을 찾을 수 없습니다';
                        break;
                    default:
                        errorMessage = error.response.data?.detail || errorMessage;
                }
            }

            alert(errorMessage);
        }
    };

// 폼 초기화 함수
    const resetForm = () => {
        setMeetingTitle('');
        setMeetingDateTime(null);
        setMeetingPlace('');
        setProjectName('');
        setSelectedProjectId(null);
        setSharedWith([]);
        setCompanionAttendees(''); // ✅ 추가
        setTags('');
        setShareMethods({ email: false, jandi: false }); // ✅ 수정: slack → jandi
        setRecordingMethod('audio');
        setSelectedFiles([]);
        setServerFiles([]);
        setManualInput('');
        setSttEngine('google');
        setLlmEngine('gemini');
        setLlmDocTypes({ // ✅ 수정: 실제 프로젝트의 타입에 맞게
            summary: false,
            concept: false,
            draft: false,
            todolist: false,
            // mindmap_tree: false,
            // mindmap_graph: false,
            // cal_gant: false,
            role: false,
            glossary: false,
            biz_overview: false,
            concept_ideas: false
        });
        setLlmResults([]);
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
        setModalSearchTerm(''); // 모달을 열 때 검색어를 초기화
        setShowProjectSearchModal(true);
        // handleProjectSearch(''); // 이 호출은 useEffect로 이동
    };

    const closeProjectSearchModal = () => {
        setShowProjectSearchModal(false);
        // 모달 닫을 때 상태 초기화
        setProjectSearchResults([]);
        setProjectSearchError(null);
        setProjectSearchLoading(false);
        setProjectCurrentPage(1);
        setProjectTotalPages(0);
        setProjectTotalCount(0);
        setModalSearchTerm('');
    };

    const handleProjectSearch = async (term: string, page: number = 1) => {
        setProjectSearchLoading(true);
        setProjectSearchError(null); // 검색 시작 시 에러 상태 초기화
        try {
            const limit = 10;
            const skip = (page - 1) * limit;
            const params = {
                search: term,
                skip: skip,
                limit: limit
            };

            // ProjectBasicInfoForm.tsx와 동일한 방식: 별도 API 호출
            const listResponse = await apiClient.get('/projects/', { params });
            const countResponse = await apiClient.get('/projects/count', { params });

            // 방어적 프로그래밍: 응답이 올바른지 확인
            if (listResponse && listResponse.data && Array.isArray(listResponse.data)) {
                setProjectSearchResults(listResponse.data);

                const totalCount = countResponse?.data?.total_count || 0;
                const totalPages = Math.ceil(totalCount / limit);

                setProjectTotalCount(totalCount);
                setProjectTotalPages(totalPages);
                setProjectCurrentPage(page);
                setProjectSearchError(null); // 성공 시 에러 상태 클리어
            } else {
                // API 응답이 예상과 다를 경우 기본값으로 설정
                setProjectSearchResults([]);
                setProjectTotalCount(0);
                setProjectTotalPages(0);
                setProjectCurrentPage(1);
                setProjectSearchError("서버 응답 형식이 올바르지 않습니다.");
                console.warn("프로젝트 검색 응답 형식이 예상과 다릅니다:", listResponse);
            }
        } catch (error) {
            console.error("프로젝트 검색 오류:", error);
            // 에러 발생 시 빈 배열로 초기화하여 undefined 오류 방지
            setProjectSearchResults([]);
            setProjectTotalCount(0);
            setProjectTotalPages(0);
            setProjectCurrentPage(1);
            setProjectSearchError("프로젝트 검색 중 오류가 발생했습니다.");
        } finally {
            setProjectSearchLoading(false);
        }
    };

    // [수정] 프로젝트 검색 모달이 열릴 때 첫 페이지의 전체 목록을 검색합니다.
    useEffect(() => {
        if (showProjectSearchModal) {
            handleProjectSearch('', 1);
        }
    }, [showProjectSearchModal]);

    const selectProject = (project: Project) => {
        setProjectName(project.project_name);
        setSelectedProjectId(project.id);
        closeProjectSearchModal();
    };

    // [추가] 프로젝트 선택 취소 핸들러
    const cancelProjectSelection = () => {
        setProjectName('');
        setSelectedProjectId(null);
    };
    // --- ▲▲▲ 프로젝트 검색 핸들러 종료 ▲▲▲ ---

    // --- ▼▼▼ [수정] 공유 인원 핸들러 ▼▼▼ ---
    const handleSharedWithSelect = (selectedEmployees: Employee[]) => {
        // Employee[]를 EmployeeSimple[]로 변환 (id, name만 저장)
        const simpleEmployees: EmployeeSimple[] = selectedEmployees.map(emp => ({
            emp_id: emp.emp_id, // emp_id 사용
            name: emp.name
        }));
        setSharedWith(simpleEmployees);
    };

    const removeSharedEmployee = (employeeId: number) => {
        setSharedWith(prev => prev.filter(e => e.emp_id !== employeeId));
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
            shared_with_ids: sharedWith.map(emp => emp.emp_id),
            share_methods: Object.entries(shareMethods)
                .filter(([, checked]) => checked)
                .map(([key]) => key),
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            companion_attendees: companionAttendees, // ✅ 추가
            basic_minutes: manualInput || ''
        };

        const created = await meetingMinuteService.createMeeting(minimalData);
        setCurrentMeetingId(created.meeting_id);
        setSaveMode('update');

        return created.meeting_id;
    };

    // ✅ STT 실행 (자동 회의록 생성 포함)
    // [수정] 파일 다운로드 핸들러 (fileUploadService 사용 - ProjectKickoff 참조)
    const handleFileDownload = async (file: any) => {
        if (!selectedMeeting?.meeting_id) {
            alert('회의록 정보가 올바르지 않습니다.');
            return;
        }

        try {
            await fileUploadService.downloadMeetingFile(
                selectedMeeting.meeting_id,
                file.id,
                file.original_file_name
            );
        } catch (error: any) {
            console.error('다운로드 실패:', error);
            alert(error.message || '파일 다운로드 중 오류가 발생했습니다.');
        }
    };

    // [추가] WebSocket 메시지 핸들러 (재사용)
    const handleSttProgressMessage = useCallback((data: STTProgressMessage) => {
        // console.log('📊 진행률 수신:', data);

        switch (data.status) {
            case 'completed':
                if (completionHandledRef.current) return;
                completionHandledRef.current = true;

                console.log('✅ STT 변환 완료');
                setSttProgress(100);
                setSttStatusMessage('변환 완료!');

                if (data.result_text) {
                    // 메타데이터에 엔진 정보가 있으면 사용, 없으면 현재 설정
                    // const engine = (data.metadata as any)?.engine || sttEngine;
                    const engine = sttEngine; 
                    
                    setSttResults(prev => ({ ...prev, [engine]: data.result_text! }));
                    setSelectedSttSource(engine);
                    alert('STT 변환이 완료되었습니다.');
                }

                setIsGenerating(false);
                setSttCompleted(true);
                setCurrentTaskId(null);
                setEstimatedTimeRemaining(null);
                localStorage.removeItem('currentSttTaskId');
                break;

            case 'failed':
            case 'aborted':
                if (completionHandledRef.current) return;
                completionHandledRef.current = true;

                setIsGenerating(false);
                setSttCompleted(false);
                setEstimatedTimeRemaining(null);
                setSttStatusMessage(data.status === 'failed' ? '변환 실패' : '중단됨');
                setGenerationPhase(0);
                setCurrentTaskId(null);
                localStorage.removeItem('currentSttTaskId');
                
                if (data.status === 'failed') alert(`오류: ${data.error}`);
                break;

            case 'processing':
            case 'pending':
                setSttProgress(data.progress);
                setSttStatusMessage(data.message || '');
                break;
        }
    }, [sttEngine]);

    // [추가] 작업 복구 로직 - selectedMeeting이 있을 때만 실행 (상세 페이지에서만)
    useEffect(() => {
        if (!selectedMeeting) return; // 리스트 페이지에서는 실행 안함

        const savedTaskId = localStorage.getItem('currentSttTaskId');
        if (savedTaskId) {
            checkAndResumeTask(savedTaskId);
        }
    }, [selectedMeeting?.meeting_id]); // selectedMeeting이 있을 때만 실행

    // [추가] 앱 복귀 시(백그라운드 -> 포그라운드) 상태 재확인
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const savedTaskId = localStorage.getItem('currentSttTaskId');
                // 현재 생성 중이라고 표시되어 있는데 포그라운드로 왔다면 상태 확인 필요
                if (savedTaskId && isGenerating) {
                    console.log("👀 앱 복귀 감지: STT 작업 상태 재확인");
                    checkAndResumeTask(savedTaskId);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [isGenerating]);

    const checkAndResumeTask = async (taskId: string) => {
        try {
            const statusRes = await generationService.getSTTStatus(taskId);
            
            if (statusRes.status === 'completed') {
                console.log("✅ STT 작업이 이미 완료되었습니다. 결과를 로드합니다.");
                
                // 완료 UI 처리
                setSttProgress(100);
                setSttStatusMessage('변환 완료!');
                
                // 결과 텍스트 업데이트
                if (statusRes.result_text) {
                    const engine = (statusRes.metadata as any)?.engine || sttEngine;
                    setSttResults(prev => ({ ...prev, [engine]: statusRes.result_text! }));
                    setSelectedSttSource(engine);
                }
                
                // 상태 정리
                setIsGenerating(false);
                setSttCompleted(true);
                setCurrentTaskId(null);
                setEstimatedTimeRemaining(null);
                localStorage.removeItem('currentSttTaskId');
                
            } else if (['processing', 'pending'].includes(statusRes.status)) {
                console.log("🔄 STT 작업 복구 중:", taskId);
                setIsGenerating(true);
                setGenerationPhase(1);
                setCurrentTaskId(taskId);
                setSttProgress(statusRes.progress);
                setSttStatusMessage(statusRes.metadata?.message || '작업 복구 중...');
                
                completionHandledRef.current = false;
                
                const ws = generationService.connectSTTProgress(
                    taskId,
                    handleSttProgressMessage,
                    (err) => console.error("WS 재연결 실패:", err)
                );
                setWsConnection(ws);
            } else {
                // failed, aborted 등
                localStorage.removeItem('currentSttTaskId');
                setIsGenerating(false);
            }
        } catch (e) {
            console.error("작업 복구 실패:", e);
            localStorage.removeItem('currentSttTaskId');
            setIsGenerating(false);
        }
    };

    const handleGenerateSTT = async () => {
        // [추가] 이미 진행 중인 STT 작업이 있는지 확인 (혹시 모를 중복 요청 방지)
        if (isGenerating && generationPhase === 1) {
            alert("이미 STT 변환이 진행 중입니다. 잠시 기다려주세요.");
            return;
        }

        // [추가] localStorage에 taskId가 남아있는데 currentTaskId가 null인 경우 (복구되지 않은 상태)
        const savedTaskId = localStorage.getItem('currentSttTaskId');
        if (savedTaskId && !currentTaskId) {
            alert("이전에 중단된 STT 작업이 있습니다. 페이지를 새로고침하여 복구를 시도하거나 잠시 기다려주세요.");
            return;
        }
        
        // [추가] 텍스트 추출 버튼 클릭 시 자동으로 'audio' 모드로 전환
        setRecordingMethod('audio');
        completionHandledRef.current = false; // ✅ 완료 처리 잠금 해제
        setSttCompleted(false); // ✅ STT 완료 상태 초기화

        console.log("STT 변환 시작");
        console.log("선택된 STT 엔진:", sttEngine);
        console.log("현재 회의록 ID:", currentMeetingId);

        // --- 파라미터 유효성 검증 ---
        // [수정] 로컬 파일과 서버 파일 모두 확인

        setIsGenerating(true);
        setGenerationPhase(1);
        setSttProgress(0);
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
            setSttStatusMessage('파일 확인 중...');

            // 1. 로컬 파일 확인
            const fileToConvert = selectedFiles.find(file => {
                const ext = file.name.split('.').pop()?.toLowerCase();
                return ext && audioExtensions.includes(ext);
            });

            // 2. 로컬 파일이 없으면 서버 파일 확인
            let existingFileId: number | null = null;

            if (!fileToConvert) {
                const serverAudioFile = serverFiles.find(file => {
                    const name = file.original_file_name || file.file_name;
                    const ext = name?.split('.').pop()?.toLowerCase();
                    return ext && audioExtensions.includes(ext);
                });

                if (serverAudioFile) {
                    console.log("서버에 있는 오디오 파일을 사용합니다:", serverAudioFile.original_file_name);
                    existingFileId = serverAudioFile.id;
                }
            }

            // 음성 파일이 없는 경우 STT 실행 중단
            if (!fileToConvert && !existingFileId) {
                alert("STT 변환을 위한 음성 파일(mp3, m4a, wav 등)을 업로드하거나, 기존 파일 목록에서 확인해주세요.");
                setIsGenerating(false); // 로딩 중단
                setGenerationPhase(0); // 단계 초기화
                return;
            }

            const engineToUse = sttEngine as any; // STTEngine 타입
            let createResponse: STTCreateResponse | undefined;

            // ✅ 참석자 정보 준비 (shared_with_ids, share_methods)
            const shared_with_ids = sharedWith.map(emp => emp.emp_id);
            const share_methods_array = Object.entries(shareMethods)
                .filter(([_, enabled]) => enabled)
                .map(([method, _]) => method);

            if (fileToConvert) {
                // [기존 로직] 파일 업로드 및 작업 생성
                setSttStatusMessage('파일 업로드 중...');
                createResponse = await generationService.createSTTTask(
                    engineToUse,
                    fileToConvert,
                    {
                        model_size: sttModelSize,
                        language: sttLanguage,
                        meeting_id: meetingId,
                        shared_with_ids: shared_with_ids,  // ✅ 추가
                        share_methods: share_methods_array  // ✅ 추가
                    }
                );
            } else if (existingFileId) {
                // [신규 로직] 기존 파일 ID로 작업 생성
                setSttStatusMessage('작업 생성 중...');
                createResponse = await generationService.createSTTTaskFromExistingFile(
                    engineToUse,
                    existingFileId,
                    {
                        model_size: sttModelSize,
                        language: sttLanguage,
                        shared_with_ids: shared_with_ids,  // ✅ 추가
                        share_methods: share_methods_array  // ✅ 추가
                    }
                );
            }

            if (!createResponse) {
                console.error("STT 작업 생성 응답이 없습니다.");
                setIsGenerating(false);
                setGenerationPhase(0);
                return;
            }

            const taskId = createResponse.task_id;
            const fileId = createResponse.file_id;  // 파일 ID 받음

            setCurrentTaskId(taskId);
            
            // 파일 ID 저장 (로컬 파일인 경우만)
            if (fileToConvert) {
                setUploadedFileIds(prev => new Map(prev).set(fileToConvert.name, fileId));
            }

            console.log(`✅ STT 작업 시작: task_id=${taskId}, file_id=${fileId}`);
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
            console.log(`✅ STT 작업 시작: task_id=${taskId}, file_id=${fileId}`);
            
            // [추가] 작업 ID를 localStorage에 저장 (새로고침/이동 시 복구용)
            localStorage.setItem('currentSttTaskId', taskId);
            
            setSttStatusMessage('WebSocket 연결 중...');
            setWsStartTime(Date.now());

            // ✅ 3단계: WebSocket 진행률 수신
            const ws = generationService.connectSTTProgress(
                taskId,
                handleSttProgressMessage, // [수정] 공통 핸들러 사용
                (error) => {
                    console.error('WebSocket 에러:', error);
                    alert('WebSocket 연결 실패. 네트워크를 확인해주세요.');
                    setIsGenerating(false);
                    setGenerationPhase(0);
                    setCurrentTaskId(null);
                    setEstimatedTimeRemaining(null);
                    localStorage.removeItem('currentSttTaskId'); // [추가] 에러 시에도 localStorage 제거
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
            
            // [추가] 중단 요청 후 프론트엔드 상태 초기화
            setIsGenerating(false);
            setGenerationPhase(0);
            setCurrentTaskId(null);
            setSttCompleted(false);
            setEstimatedTimeRemaining(null); // 예상 시간도 초기화
            localStorage.removeItem('currentSttTaskId');
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
        // 사용자가 선택하지 않으므로, 모든 정의된 문서 타입을 생성하도록 요청
        const doc_types = Object.entries(llmDocTypes)
            .filter(([, checked]) => checked)
            .map(([key]) => key) as DocType[];

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
        setShowLlmSettingsModal(false); // 👈 [추가] 유효성 검사 통과 후 모달 닫기
        setIsGenerating(true);
        setGenerationPhase(2); // LLM 진행 중 UI 표시
        setLlmStatusMessage('LLM 문서 생성 준비 중...'); // [추가] 초기 메시지

        // ✅ 알림 창 추가 (사용자 요청)
        // ✅ 알림 창 수정 (조건부 알림)
        if (shareMethods.jandi) {
            alert("LLM 결과 생성 후 이메일 + 잔디 (상단 본인이름 클릭하여 등록 필요) 로 알림이 갑니다.");
        } else {
            alert("LLM 결과 생성 후 이메일로 알림이 갑니다.");
        }

        try {
            // ✅ 참석자 정보 준비
            const shared_with_ids = sharedWith.map(emp => emp.emp_id);
            const share_methods_array = Object.entries(shareMethods)
                .filter(([_, enabled]) => enabled)
                .map(([method, _]) => method);

            const payload = {
                source_text,
                engine,
                doc_types,
                meeting_id: meetingId,  // ✅ 추가
                stt_original_id,        // ✅ 추가 (선택)
                shared_with_ids: shared_with_ids,  // ✅ 추가
                share_methods: share_methods_array  // ✅ 추가
            };

            setLlmStatusMessage('AI 모델 호출 중...'); // [추가]
            // 1. LLM 생성 요청
            await generationService.generateLLM(payload);
            setLlmStatusMessage('문서 생성 완료! 결과 저장 중...'); // [추가]

            alert(`[${engine}] LLM 문서 생성이 완료되었습니다. 최신 정보를 다시 불러옵니다.`);

            // 2. 데이터 일관성을 위해 전체 상세 정보 다시 로드
            const details = await meetingMinuteService.getMeetingDetails(meetingId);

            // 3. handleMeetingSelect와 동일한 로직으로 llmResults 상태 업데이트
            const newLlmResults = [
                { id: 'summary', title: '주요 안건 정리', content: '', save: false },
                { id: 'concept', title: '컨셉 문서', content: '', save: false },
                { id: 'draft', title: 'Draft 기획서', content: '', save: false },
                { id: 'todolist', title: 'To Do 리스트', content: '', save: false },
                { id: 'mindmap_tree', title: 'MindMap 트리', content: '', save: false },
                { id: 'mindmap_graph', title: 'MindMap 그래프', content: '', save: false },
                { id: 'cal_gant', title: '캘린더_간트차트', content: '', save: false },
                { id: 'role', title: 'Role & Responsibility', content: '', save: false },
                { id: 'glossary', title: '용어/약어', content: '', save: false },
                { id: 'biz_overview', title: '배경지식/트랜드', content: '', save: false },
                { id: 'concept_ideas', title: '컨셉 아이디어', content: '', save: false },
            ].map(uiTemplate => {
                const savedDoc = details.llm_documents?.find(doc => doc.document_type === uiTemplate.id);
                return {
                    ...uiTemplate,
                    content: savedDoc ? savedDoc.document_content : '',
                    llm_document_id: savedDoc ? savedDoc.llm_document_id : undefined,
                };
            });
            setLlmResults(newLlmResults);

            // '직접 입력'이 소스였을 경우, manualInput 상태도 동기화
            if (recordingMethod === 'document') {
                setManualInput(source_text);
            }

        } catch (error) {
            console.error("LLM 생성 중 오류:", error);
            handleApiError(error);
            setLlmStatusMessage('LLM 문서 생성 실패'); // [추가]
        } finally {
            setIsGenerating(false);
            setGenerationPhase(0);
            setLlmStatusMessage('LLM 문서 생성 준비 중...'); // [추가] 초기 메시지로 복구
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
            const sharedWithIds = sharedWith.map(emp => emp.emp_id);

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
                // ✅ ID가 문자열로 오는 경우를 대비해 숫자로 변환
                shared_with_ids: sharedWith.map(emp => emp.emp_id),

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

                    // [추가] 파일 업로드 후 데이터 동기화를 위해 전체 정보 다시 로드
                    if (selectedMeeting) {
                        await handleMeetingSelect(selectedMeeting);
                    }

                } catch (fileError: any) {
                    console.error('파일 업로드 실패:', fileError);
                    alert(`파일 업로드 실패: ${fileError.message}`);
                    return;
                }
            }

            // ✅ 공유자 전송 (이미 DB에 저장되어 있으므로)
            // ❌ [수정] 공유자 알림은 LLM 생성 완료 시에만 발송하므로, 저장 시점에는 발송하지 않음
            /*
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
            */

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
                sharedWithIds: sharedWith.map(emp => emp.emp_id),
                tags,
                shareMethods: { ...shareMethods },
                // attendees,
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

        const manualInputChanged = manualInput !== originalData.manualInput;

        // sharedWith 비교
        const currentSharedIds = sharedWith.map(emp => emp.emp_id).sort();
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
            // attendeesChanged || // 이 부분 삭제
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

    // 음성 파일 존재 시 라디오 기본 선택 로직
    useEffect(() => {
        // manualInput 이 비어 있고, 음성 파일이 1개 이상이면 기본 선택을 'audio'로
        if ((!manualInput || manualInput.trim().length === 0) && hasAudioFiles) {
            setRecordingMethod('audio');
        }
    }, [manualInput, hasAudioFiles]);

    return (
        <div className="meeting-minutes-container">
            {/* ✅ 상세 로딩 오버레이 */}
            {detailLoading && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    zIndex: 9999,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                    color: 'white',
                    backdropFilter: 'blur(3px)'
                }}>
                    <div className="loading-spinner" style={{
                        width: '50px',
                        height: '50px',
                        border: '5px solid rgba(255,255,255,0.3)',
                        borderTop: '5px solid white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                    }}></div>
                    <style>{`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}</style>
                    <div style={{ marginTop: '20px', fontSize: '18px', fontWeight: 'bold' }}>
                        회의록 상세 정보를 불러오는 중입니다...
                    </div>
                </div>
            )}

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
                        {activeTab === 'my' && (
                            <button
                                className="btn-new-item"
                                onClick={handleNewMeeting}
                                // style={{ marginRight: '0.5rem' }}
                            >
                                신규 작성
                            </button>
                        )}
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
                            className={`tab-button ${activeTab === 'dept' ? 'active' : ''}`}
                            onClick={() => setActiveTab('dept')}
                        >
                            부서 회의록
                        </button>
                        <button
                            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                            onClick={() => setActiveTab('all')}
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
                            <div className="meeting-list-loading">
                                <span className="circle-spinner"></span>
                                목록을 불러오는 중...
                            </div>
                        ) : listError ? (
                            <div className="error">{listError}</div>
                        ) : (
                            <>
                                {activeTab === 'my' && (
                                    <div className="tab-pane active">
                                        <MeetingList
                                            meetings={myMeetings}
                                            onSelect={handleMeetingSelect}
                                            onDelete={handleDeleteMeeting}
                                            showDelete={true}
                                            hideCreatorColumn={true} // ✅ 추가
                                            onSort={handleSort} // ✅ 추가
                                            sortBy={sortBy} // ✅ 추가
                                            sortOrder={sortOrder} // ✅ 추가
                                        />
                                    </div>
                                )}
                                {activeTab === 'shared' && (
                                    <div className="tab-pane active">
                                        <MeetingList
                                            meetings={sharedMeetings}
                                            onSelect={handleMeetingSelect}
                                            showDelete={false}
                                            hideCreatorColumn={false} // ✅ 작성자 컬럼 표시
                                            onSort={handleSort} // ✅ 추가
                                            sortBy={sortBy} // ✅ 추가
                                            sortOrder={sortOrder} // ✅ 추가
                                        />
                                    </div>
                                )}
                                {activeTab === 'dept' && (
                                    <div className="tab-pane active">
                                        <MeetingList
                                            meetings={deptMeetings}
                                            onSelect={handleMeetingSelect}
                                            showDelete={false}
                                            hideCreatorColumn={false}
                                            onSort={handleSort}
                                            sortBy={sortBy}
                                            sortOrder={sortOrder}
                                        />
                                    </div>
                                )}
                                {activeTab === 'all' && (
                                    <div className="tab-pane active">
                                        <MeetingList
                                            meetings={allMeetings} // ✅ allMeetings 사용
                                            onSelect={handleMeetingSelect}
                                            showDelete={false} // 전체 회의록에서는 삭제 버튼 숨김
                                            hideCreatorColumn={false} // 작성자 컬럼 표시
                                            onSort={handleSort} // ✅ 추가
                                            sortBy={sortBy} // ✅ 추가
                                            sortOrder={sortOrder} // ✅ 추가
                                        />
                                    </div>
                                )}

                                {/* 페이지네이션 컨트롤 */}
                                {totalPages > 0 && (
                                    <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginTop: '20px', gap: '10px' }}>
                                        <button
                                            disabled={currentPage === 1}
                                            onClick={() => loadMeetings(activeTab, filterType, currentPage - 1)}
                                            className="btn-secondary btn-sm"
                                            style={{ padding: '5px 10px', fontSize: '12px' }}
                                        >
                                            &lt; 이전
                                        </button>
                                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{currentPage} / {totalPages}</span>
                                        <button
                                            disabled={currentPage >= totalPages}
                                            onClick={() => loadMeetings(activeTab, filterType, currentPage + 1)}
                                            className="btn-secondary btn-sm"
                                            style={{ padding: '5px 10px', fontSize: '12px' }}
                                        >
                                            다음 &gt;
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>                </div>

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
                                onRemoveEmployee={(id) => setSharedWith(prev => prev.filter(emp => emp.emp_id !== id))}
                                tags={tags}
                                setTags={setTags}
                                companionAttendees={companionAttendees} // ✅ 추가
                                setCompanionAttendees={setCompanionAttendees} // ✅ 추가
                                shareMethods={shareMethods}
                                // setShareMethods={setShareMethods}
                                setShareMethods={customSetShareMethods}
                                readOnly={isReadOnly} // ✅ 읽기 전용 모드 전달
                            />
                        </div>

                        {selectedMeeting && serverFiles.length > 0 && (
                            <div className="meeting-minutes-section">
                                <h3 className="section-header-meetingminutes">■ 파일 리스트</h3>
                                {serverFiles.length > 0 ? (
                                    <div className="file-list-container">
                                        <div className="file-list-items">
                                            {serverFiles.map(file => (
                                                <div key={`server-${file.id}`} className="file-item">
                                                    <div className="file-item-info">
                                                        <div className="file-item-header">
                                                            <span className="file-icon">📄</span>
                                                            <span className="file-name">{file.original_file_name}</span>
                                                            <span className="file-status-badge">저장됨</span>
                                                        </div>
                                                        <div className="file-item-meta">
                                                            <span>{formatFileSize(file.file_size)}</span>
                                                            <span>업로드: {new Date(file.uploaded_at).toLocaleDateString('ko-KR')}</span>
                                                            {file.uploader_name && <span>by {file.uploader_name}</span>}
                                                        </div>
                                                    </div>
                                                    <div className="file-actions">
                                                        <button
                                                            className="btn-file-download"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFileDownload(file);
                                                            }}
                                                        >
                                                            ⬇️ 다운로드
                                                        </button>
                                                        <button
                                                            className="btn-file-delete"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleFileDelete(file);
                                                            }}
                                                            title="삭제"
                                                            disabled={isReadOnly}
                                                            style={isReadOnly ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                                                        >
                                                            🗑️ 삭제
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="file-list-empty">
                                        저장된 파일이 없습니다.
                                    </div>
                                )}
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept={allowedExtensions.map(ext => `.${ext}`).join(',')}
                            onChange={handleFileInputChange}
                            style={{ display: 'none' }}
                            disabled={isReadOnly}
                        />

                        {/* --- ▼▼▼ [보존] 파일 업로드 드래그앤드롭 UI ▼▼▼ --- */}
                        {/* 파일 업로드 영역 */}
                        {!isReadOnly && (
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
                                <div className="upload-status">
                                    <div className="upload-spinner">⏳</div>
                                    <span>파일을 업로드하고 있습니다...</span>
                                </div>
                            )}
                        </div>
                        )}
                        {/* --- ▲▲▲ 파일 업로드 UI 종료 ▲▲▲ --- */}

                        {/* 회의록 원문 섹션 - 좌우 분할 (단순화: 항상 2패널, full-width 제거) */}
                        {selectedMeeting && (
                            <div className="meeting-minutes-section">
                                <h3 className="section-header-meetingminutes">■ 회의록 원문</h3>
                                <div className="meeting-source-container">
                                    {/* 좌측: 직접 입력 (선택 시만 강조) */}
                                    <div
                                        className={`meeting-source-panel ${recordingMethod === 'document' ? 'is-selected' : ''}`}
                                    >
                                        <div className="meeting-source-header">
                                            <div className="recording-method-top">
                                                <input
                                                    type="radio"
                                                    name={`recording-method-${currentMeetingId ?? 'new'}`}
                                                    checked={recordingMethod === 'document'}
                                                    onChange={() => setRecordingMethod('document')}
                                                    disabled={(!manualInput || manualInput.trim().length === 0) || isReadOnly}
                                                    aria-disabled={(!manualInput || manualInput.trim().length === 0) || isReadOnly}
                                                    className={`recording-method-radio ${((!manualInput || manualInput.trim().length === 0) || isReadOnly) ? 'is-disabled' : ''}`}
                                                />
                                            </div>
                                            <h4>📝 직접 입력 / 문서 업로드</h4>
                                        </div>
                                        <textarea
                                            className="meeting-minutes-textarea meeting-source-textarea"
                                            rows={15}
                                            value={manualInput}
                                            onChange={(e) => setManualInput(e.target.value)}
                                            placeholder={`선택된 내용이 없습니다.\n직접입력 \n또는 파일(text, txt, md)을 업로드 하세요.`}
                                            disabled={isReadOnly}
                                        />
                                        {manualInput && (
                                            <div className="meeting-source-hint">
                                                💡 마크다운 형식이 유지됩니다. 자유롭게 편집하세요.
                                            </div>
                                        )}
                                    </div>

                                    {/* 우측: STT 결과 (선택 시만 강조) */}
                                    <div
                                        className={`meeting-source-panel ${recordingMethod === 'audio' ? 'is-selected' : ''}`}
                                    >
                                        <div className="meeting-source-header">
                                            <div className="recording-method-top">
                                                <input
                                                    type="radio"
                                                    name={`recording-method-${currentMeetingId ?? 'new'}`}
                                                    checked={recordingMethod === 'audio'}
                                                    onChange={() => setRecordingMethod('audio')}
                                                    // 음성 라디오: 음성 파일이 1개라도 있으면 활성화
                                                    disabled={!hasAudioFiles || isReadOnly}
                                                    aria-disabled={!hasAudioFiles || isReadOnly}
                                                    className={`recording-method-radio ${(!hasAudioFiles || isReadOnly) ? 'is-disabled' : ''}`}
                                                />
                                            </div>
                                            {/*<h4>🎙️ 음성에서 추출한 텍스트 (Source)</h4>*/}
                                            {/* ✅ 헤더 수정: h4 좌측, 버튼 우측 */}
                                            <div style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                width: '100%',
                                                marginTop: '8px'
                                            }}>
                                                <h4 style={{ margin: 0 }}>🎙️ 음성에서 추출한 텍스트 (Source)</h4>
                                                {hasAudioFiles && (
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                                        {/* [추가] 예상 소요 시간 표시 */}
                                                        {audioDuration && !isGenerating && !sttCompleted && (
                                                            <div style={{ fontSize: '12px', color: '#1890ff', fontWeight: 'bold' }}>
                                                                ⏱️ 예상 소요 시간: 약 {formatTimeFromSeconds(Math.ceil(audioDuration / (STT_SPEED_FACTORS[sttModelSize as keyof typeof STT_SPEED_FACTORS] || 1.5)))}
                                                            </div>
                                                        )}
                                                        <div style={{ display: 'flex', gap: '8px' }}>
                                                            <button
                                                                onClick={handleGenerateSTT}
                                                                disabled={isGenerating || isReadOnly}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    fontSize: '13px',
                                                                    backgroundColor: '#007bff',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: (isGenerating || isReadOnly) ? 'not-allowed' : 'pointer',
                                                                    opacity: (isGenerating || isReadOnly) ? 0.6 : 1
                                                                }}
                                                            >
                                                                텍스트 추출
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setRecordingMethod('audio'); // [추가] 설정 버튼 클릭 시 'audio' 모드로 전환
                                                                    setShowSttSettingsModal(true);
                                                                }}
                                                                disabled={isReadOnly}
                                                                style={{
                                                                    padding: '6px 12px',
                                                                    fontSize: '13px',
                                                                    backgroundColor: '#6c757d',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '4px',
                                                                    cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                                                    opacity: isReadOnly ? 0.6 : 1
                                                                }}
                                                            >
                                                                설정
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/*{Object.values(sttResults).some(text => text && text.trim().length > 0) ? (*/}
                                        {/*    <div className="meeting-stt-results">*/}
                                        {/*        {Object.entries(sttResults).map(([key, value]) => (*/}
                                        {/*            value && value.trim().length > 0 && (*/}
                                        {/*                <div key={key}>*/}
                                        {/*                    <div className="meeting-stt-content">{value}</div>*/}
                                        {/*                    <label className="meeting-minutes-label meeting-stt-item-label">*/}
                                        {/*                        <input*/}
                                        {/*                            type="radio"*/}
                                        {/*                            name="stt-source"*/}
                                        {/*                            value={key}*/}
                                        {/*                            checked={selectedSttSource === key}*/}
                                        {/*                            onChange={(e) => setSelectedSttSource(e.target.value)}*/}
                                        {/*                        />*/}
                                        {/*                        {key.charAt(0).toUpperCase() + key.slice(1)} 결과 선택*/}
                                        {/*                    </label>*/}
                                        {/*                </div>*/}
                                        {/*            )*/}
                                        {/*        ))}*/}
                                        {/*    </div>*/}
                                        {/*) : (*/}
                                        {/*    <div className="meeting-stt-empty">*/}
                                        {/*        음성 파일을 업로드하고 STT 변환을 실행하면<br/>*/}
                                        {/*        변환된 텍스트가 여기에 표시됩니다.*/}
                                        {/*    </div>*/}
                                        {/*)}*/}
                                        <div>
                                            {hasAudioFiles ? (
                                                Object.values(sttResults).some(text => text && text.trim().length > 0) ? (
                                                    <div className="meeting-stt-results">
                                                        {Object.entries(sttResults).map(([key, value]) => (
                                                            value && value.trim().length > 0 && (
                                                                <div key={key}>
                                                                    <div className="meeting-stt-content">{value}</div>
                                                                    <label className="meeting-minutes-label meeting-stt-item-label">
                                                                        <input
                                                                            type="radio"
                                                                            name="stt-source"
                                                                            value={key}
                                                                            checked={selectedSttSource === key}
                                                                            onChange={(e) => setSelectedSttSource(e.target.value)}
                                                                        />
                                                                        {key.charAt(0).toUpperCase() + key.slice(1)} 결과 선택
                                                                    </label>
                                                                </div>
                                                            )
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="meeting-stt-empty">
                                                        바로 위의 '텍스트 추출'버튼을 누르시면<br/>
                                                        추출된 텍스트가 여기에 표시됩니다.
                                                    </div>
                                                )
                                            ) : (
                                                <div className="meeting-stt-empty">
                                                    음성 파일을 먼저 업로드해주세요.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ✅ STT 설정 모달 */}
                        <STTSettingsModal
                            isOpen={showSttSettingsModal}
                            onClose={() => setShowSttSettingsModal(false)}
                            onSave={handleSaveSettings}
                            sttEngine={sttEngine}
                            setSttEngine={setSttEngine}
                            sttModelSize={sttModelSize}
                            setSttModelSize={setSttModelSize}
                            sttLanguage={sttLanguage}
                            setSttLanguage={setSttLanguage}
                        />

                        {/* ✅ 프로그레스 바 추가 (STT) */}
                                                    {isGenerating && generationPhase === 1 && (
                                                        <div className="generation-progress" ref={sttProgressRef}>
                                                            <div className="progress-header">
                                                                {/* h4와 메시지 결합 */}
                                                                <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                    <div className="dot-cursor-spinner"></div>
                                                                    <span>STT 변환 진행 중: {sttStatusMessage}</span>
                                                                </h4>
                                                                <button
                                                                    onClick={handleAbortSTT}
                                                                    className="abort-button"
                                                                    disabled={!isGenerating}
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
                                                            {estimatedTimeRemaining !== null && (
                                                                <p className="progress-info" style={{ color: '#1890ff' }}>
                                                                    예상 남은 시간: 약 {formatTimeFromSeconds(estimatedTimeRemaining)}
                                                                </p>
                                                            )}
                        
                                                            {/* [추가] 주의 문구 박스 */}
                                                            <div className="stt-warning-box">
                                                                ⚠️ &nbsp;**참고:** 진행률은 시뮬레이션된 예상 시간으로 실제 처리 시간과 다를 수 있습니다.<br/>
                                                                ⏳ &nbsp;이 페이지를 이동하거나 닫아도 변환 작업은 백그라운드에서 계속됩니다.<br/>
                                                                🔔 &nbsp;완료 시 이메일과 잔디(Jandi)로 알림을 드립니다. 알림 수신 후 다시 방문해주세요!
                                                            </div>
                                                        </div>
                                                    )}                        { ((recordingMethod === 'document' && manualInput && manualInput.trim().length > 0)
                            || (recordingMethod === 'audio' && sttResults && Object.values(sttResults).some(text => text && text.trim().length > 0))) && (
                                <div>
                                    <div className="generation-panel" style={{flexDirection: 'column', gap: '15px'}}>
                                        <button
                                            className="btn-secondary"
                                            // className="btn-disabled"
                                            // onClick={handleGenerateLLM}
                                            onClick={() => setShowLlmSettingsModal(true)} // 👈 [수정 후]
                                            style={{margin: '2rem'}}
                                            disabled={isGenerating || isReadOnly}
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
                                            <div ref={llmProgressRef} style={{padding: '20px 25px', backgroundColor: '#f0f5ff', borderRadius: '8px', margin: '20px 0', border: '1px solid #d6e4ff', minHeight: '150px', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
                                                
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    gap: '15px',
                                                    marginBottom: '20px',
                                                    minHeight: '40px'
                                                }}>
                                                    {/* 스피너 교체 */}
                                                    <div className="dot-cursor-spinner"></div>
                                                    <h4 style={{margin: 0, fontSize: '18px', color: '#1d39c4'}}>
                                                        🤖 LLM 문서 생성 중: {llmStatusMessage} {/* 메시지 통합 */}
                                                    </h4>
                                                </div>
                                                
                                                {/* 기존 메시지 영역 삭제 */}
                                                {/* <div style={{ ... }}> {llmStatusMessage} </div> */}

                                                {/* STT와 동일한 주의 문구 박스 */}
                                                <div className="stt-warning-box">
                                                    ⚠️ &nbsp;**참고:** LLM 문서 생성에는 수십 초에서 수 분이 소요될 수 있습니다.<br/>
                                                    ⏳ &nbsp;이 페이지를 이동하거나 닫아도 문서 생성은 백그라운드에서 계속됩니다.<br/>
                                                    🔔 &nbsp;완료 시 이메일과 잔디(Jandi)로 알림을 드립니다. 알림 수신 후 다시 방문해주세요!
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
                                {llmResults.some(result => result.content && result.content.trim().length > 0) && (
                                    <div className="meeting-minutes-section">
                                        <h3 className="section-header-meetingminutes">■ 생성된 Draft 기획서, 컨셉문서, 주요 안건 정리</h3>
                                        <div style={{padding: '15px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                                            {llmResults.map(result => (
                                                result.content && result.content.trim().length > 0 && (
                                                    <div key={result.id}>

                                                        <label className="meeting-minutes-label llm-result-label">
                                                            <input
                                                                // className="meeting-minutes-checkbox" /* ✅ checkbox-large 클래스 제거 */
                                                                className="meeting-minutes-checkbox checkbox-large" /* ✅ checkbox-large 클래스 제거 */
                                                                type="checkbox"
                                                                checked={result.save}
                                                                onChange={() => handleLlmResultSaveChange(result.id)}
                                                                disabled={isReadOnly}
                                                                // /* ✅ style 속성 제거 */
                                                            />
                                                            <span>{result.title}</span>
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
                        {selectedMeeting && !isReadOnly && (
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
                                    {/*서버 저장&nbsp;&nbsp;&nbsp;&&nbsp;&nbsp;&nbsp;공유자에게 전송*/}
                                    저장 및 공유
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
                    onRemoveEmployee={(id) => setSharedWith(prev => prev.filter(emp => emp.emp_id !== id))}
                    tags={tags}
                    setTags={setTags}
                    companionAttendees={companionAttendees} // ✅ 추가
                    setCompanionAttendees={setCompanionAttendees} // ✅ 추가
                    shareMethods={shareMethods}
                    setShareMethods={customSetShareMethods}
                />

                {/* --- ▼▼▼ [추가] 프로젝트 검색 모달 ▼▼▼ --- */}
                {showProjectSearchModal && (
                    <div className="modal-overlay" onClick={closeProjectSearchModal}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>프로젝트 검색</h3>
                                <button className="modal-close-btn" onClick={closeProjectSearchModal}>×</button>
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
                                {/* 에러 메시지 표시 */}
                                {projectSearchError && (
                                    <div className="error-message" style={{
                                        color: '#e74c3c',
                                        backgroundColor: '#fdf2f2',
                                        border: '1px solid #e74c3c',
                                        borderRadius: '4px',
                                        padding: '10px',
                                        marginBottom: '10px'
                                    }}>
                                        {projectSearchError}
                                    </div>
                                )}
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
                                        {projectSearchResults && projectSearchResults.length > 0 ? (
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
                                                <td colSpan={3} className="no-results">
                                                    {projectSearchResults === null || projectSearchResults === undefined
                                                        ? "검색 중 오류가 발생했습니다."
                                                        : "검색 결과가 없습니다."
                                                    }
                                                </td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>

                                )}
                                {/* 페이지네이션: 에러가 없고, 로딩 중이 아니며, 페이지가 2개 이상일 때만 표시 */}
                                {!projectSearchError && !projectSearchLoading && projectTotalPages > 1 && (
                                    <div className="pagination-container">
                                        <button
                                            onClick={() => handleProjectSearch(modalSearchTerm, projectCurrentPage - 1)}
                                            disabled={projectCurrentPage <= 1 || projectSearchLoading}
                                            className="pagination-button"
                                        >
                                            이전
                                        </button>
                                        {/* 페이지 수가 많을 때 제한해서 표시 */}
                                        {(() => {
                                            const maxPagesToShow = 5;
                                            const currentPage = projectCurrentPage || 1;
                                            const totalPages = projectTotalPages || 0;

                                            if (totalPages <= maxPagesToShow) {
                                                // 페이지 수가 적을 때는 모든 페이지 표시
                                                return Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                    <button
                                                        key={page}
                                                        onClick={() => handleProjectSearch(modalSearchTerm, page)}
                                                        disabled={currentPage === page || projectSearchLoading}
                                                        className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                                                    >
                                                        {page}
                                                    </button>
                                                ));
                                            } else {
                                                // 페이지 수가 많을 때는 현재 페이지 주변만 표시
                                                const startPage = Math.max(1, currentPage - 2);
                                                const endPage = Math.min(totalPages, currentPage + 2);
                                                const pages = [];

                                                // 첫 페이지가 범위에 포함되지 않으면 추가
                                                if (startPage > 1) {
                                                    pages.push(
                                                        <button
                                                            key={1}
                                                            onClick={() => handleProjectSearch(modalSearchTerm, 1)}
                                                            disabled={projectSearchLoading}
                                                            className="pagination-button"
                                                        >
                                                            1
                                                        </button>
                                                    );
                                                    if (startPage > 2) {
                                                        pages.push(<span key="ellipsis1" className="pagination-ellipsis">...</span>);
                                                    }
                                                }

                                                // 현재 페이지 주변 페이지들
                                                for (let page = startPage; page <= endPage; page++) {
                                                    pages.push(
                                                        <button
                                                            key={page}
                                                            onClick={() => handleProjectSearch(modalSearchTerm, page)}
                                                            disabled={currentPage === page || projectSearchLoading}
                                                            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
                                                        >
                                                            {page}
                                                        </button>
                                                    );
                                                }

                                                // 마지막 페이지가 범위에 포함되지 않으면 추가
                                                if (endPage < totalPages) {
                                                    if (endPage < totalPages - 1) {
                                                        pages.push(<span key="ellipsis2" className="pagination-ellipsis">...</span>);
                                                    }
                                                    pages.push(
                                                        <button
                                                            key={totalPages}
                                                            onClick={() => handleProjectSearch(modalSearchTerm, totalPages)}
                                                            disabled={projectSearchLoading}
                                                            className="pagination-button"
                                                        >
                                                            {totalPages}
                                                        </button>
                                                    );
                                                }

                                                return pages;
                                            }
                                        })()}
                                        <button
                                            onClick={() => handleProjectSearch(modalSearchTerm, projectCurrentPage + 1)}
                                            disabled={projectCurrentPage >= projectTotalPages || projectSearchLoading}
                                            className="pagination-button"
                                        >
                                            다음
                                        </button>
                                    </div>
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
                        currentUserId={user?.emp_id}
                    />
                )}

                {/* --- ▼▼▼ [신규] LLM 회의록 생성 설정 모달 ▼▼▼ --- */}
                <LLMSettingsModal
                    isOpen={showLlmSettingsModal}
                    onClose={() => setShowLlmSettingsModal(false)}
                    onGenerate={handleGenerateLLM}
                    llmEngine={llmEngine}
                    setLlmEngine={setLlmEngine}
                    isGenerating={isGenerating}
                />
                {/* --- ▲▲▲ [신규] LLM 모달 종료 ▲▲▲ --- */}
            </div>
        </div>
    );
};

export default MeetingMinutes;