// src/api/types.ts

// [추가] 페이지네이션을 위한 제네릭 타입
export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    size: number;
    pages: number;
}

export interface Company {
    id: number;
    company_name: string;
    business_number?: string;
    industry?: string;
    ceo_name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;

    // 담당자 정보
    contact_person?: string;
    contact_department?: string;
    contact_position?: string;
    contact_phone?: string;
    contact_email?: string;

    // 회사 규모 정보
    established_date?: string;
    capital?: number;
    employee_count?: number;
    annual_revenue?: number;

    // 기타 정보
    business_registration_date?: string;
    tax_office?: string;
    business_type?: string;
    business_category?: string;
    memo?: string;

    created_at: string;
    updated_at: string;
}

export interface CompanyCreate {
    company_name: string;
    business_number?: string;
    industry?: string;
    ceo_name?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    contact_person?: string;
    contact_department?: string;
    contact_position?: string;
    contact_phone?: string;
    contact_email?: string;
    established_date?: string;
    capital?: number;
    employee_count?: number;
    annual_revenue?: number;
    business_registration_date?: string;
    tax_office?: string;
    business_type?: string;
    business_category?: string;
    memo?: string;
}

export interface CompanyUpdate extends Partial<CompanyCreate> {}

export interface CompanySearchParams {
    skip?: number;
    limit?: number;
    search?: string;
    industry?: string;
    business_type?: string;
}

export interface Department {
    id?: number;           // 일부 화면에서 사용
    name?: string;         // 일부 화면에서 사용
    dept_id: number;
    dept_name: string;
    dept_code: string | null; // null 허용, undefined 불허
    description: string | null; // null 허용, undefined 불허
    parent_dept_id: number | null; // null 허용, undefined 불허
    manager_emp_id: number | null; // null 허용, undefined 불허
    sort_order: number | null; // null 허용, undefined 불허
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
    employee_count: number; // number | null; // API 스키마에 따라 유동적
    manager_name?: string;
}

// ✅ 부서 관리용 상세 타입 (Department와 동일)
export type DepartmentFull = Department;

export interface DepartmentCreate {
    dept_name: string;
    dept_code: string | null; // null 허용, undefined 불허
    description: string | null; // null 허용, undefined 불허
    parent_dept_id: number | null; // null 허용, undefined 불허
    manager_emp_id: number | null; // null 허용, undefined 불허
    sort_order: number | null; // null 허용, undefined 불허
}

export interface DepartmentUpdate {
    dept_name?: string;
    dept_code: string | null; // null 허용, undefined 불허
    description: string | null; // null 허용, undefined 불허
    parent_dept_id: number | null; // null 허용, undefined 불허
    manager_emp_id: number | null; // null 허용, undefined 불허
    sort_order: number | null; // null 허용, undefined 불허
    is_active?: boolean;
}

export interface DepartmentEmployee {
    emp_id: number;
    id: string;
    name: string;
    team?: string;
    title?: string;
    position?: string;
    email?: string;
    is_active: boolean;
}

export interface DepartmentEmployeesResponse {
    dept_id: number;
    dept_name: string;
    employees: DepartmentEmployee[];
}


export interface EmployeeSimple { // ✅ 새로운 인터페이스
    emp_id: number;
    name: string;
}

export interface Employee { // ✅ 복구
    emp_id: number;  // 기본키 (DB emp_id)
    id: string;      // 로그인 ID (DB id)
    employee_id: string;
    name: string;
    department?: Department; // ✅ Department 객체 타입으로 복구
    division?: string;
    team?: string;
    position?: string;
    title?: string;      // 직급
    email?: string;
    phone?: string;
    mobile?: string;     // 휴대폰
    hire_date?: string;
    birth_date?: string;
    birth?: string;      // 생년월일 (YYYYMMDD)
    address?: string;
    status: 'active' | 'inactive' | 'terminated';
    is_active?: boolean; // 재직 상태
    created_at: string;
    updated_at: string;
    role?: Role;
}

export interface EmployeeCreate {
    id?: string;           // 사번/로그인 ID
    pw?: string;           // 비밀번호
    employee_id?: string;  // 사원번호 (optional)
    name: string;
    department_id?: number;
    division?: string;
    team?: string;
    position?: string;
    title?: string;
    email?: string;
    phone?: string;
    mobile?: string;
    hire_date?: string;
    birth_date?: string;
    birth?: string;
    address?: string;
    status?: 'active' | 'inactive' | 'terminated';
    is_active?: boolean;
}

export interface EmployeeUpdate {
    name?: string;
    division?: string;
    team?: string;
    position?: string;
    title?: string;
    email?: string;
    mobile?: string;
    birth?: string;
    role_id?: number;
    is_active?: boolean;
}


export interface Project {
    id: number;
    project_id: number;
    project_code: string;
    project_name: string;
    project_type: string;
    memo: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
    budget?: number;
    company_id?: number;
    manager_id?: number;
    company_name?: string;
    manager_name?: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectCalendarEntry {
    event_id: number;
    year: number;
    month: number;
    event_name: string;
    advertiser?: string;
    budget?: number;
    ot_date?: string; // YYYY-MM-DD format
    bundle_id?: number;
    cell_color?: string;
}

export interface ProjectCalendarBundle {
    id: number;
    bundle_id: number;
    project_calendar_event_id: number;
    bundle_nickname?: string;
    priority: 'low' | 'medium' | 'high';
    alarm_start_at?: string;
    alarm_interval_days?: number;
    alarm_repeat_count?: number;
    channels: ProjectCalendarBundleChannel[];
    recipients: ProjectCalendarBundleRecipient[];
}

export interface ProjectCalendarBundleChannel {
    id: number;
    bundle_id: number;
    channel: 'email' | 'jandi';
}

export interface ProjectCalendarBundleRecipient {
    id: number;
    bundle_id: number;
    emp_id: number;
}

export interface DashboardStats {
    total_stats: {
        companies: number;
        employees: number;
        projects: number;
    };
    active_stats: {
        employees: number;
        projects: number;
    };
    monthly_stats: {
        new_companies: number;
        new_employees: number;
    };
}

// ============ 프로젝트 대시보드 타입 ============

// 기간 유형
export type ProjectPeriodType =
    | 'yearly'          // 년간
    | 'half_year'       // 반기
    | 'quarterly'       // 분기
    | 'monthly'         // 월간 (매월 1일~말일)
    | 'weekly'          // 주간
    | 'recent_30_days'  // 최근 30일
    | 'custom';         // 사용자 지정 (특정 구간)

export const PROJECT_PERIOD_LABELS: Record<ProjectPeriodType, string> = {
    yearly: '년간',
    half_year: '반기',
    quarterly: '분기',
    monthly: '월간',
    weekly: '주간',
    recent_30_days: '최근 30일',
    custom: '사용자 지정'
};

// 프로젝트 상태
export type ProjectStatusType =
    | 'lead'           // 리드/발굴
    | 'proposal'       // 제안 준비
    | 'ot_scheduled'   // OT 예정
    | 'pt_scheduled'   // PT 예정
    | 'submitted'      // 제출 완료
    | 'won'            // 수주
    | 'lost'           // 실주
    | 'cancelled'      // 취소
    | 'planning'       // 기획 중
    | 'active'         // 진행 중
    | 'completed';     // 완료

export const PROJECT_STATUS_LABELS: Record<ProjectStatusType, string> = {
    lead: '리드/발굴',
    proposal: '제안 준비',
    ot_scheduled: 'OT 예정',
    pt_scheduled: 'PT 예정',
    submitted: '제출 완료',
    won: '수주',
    lost: '실주',
    cancelled: '취소',
    planning: '기획 중',
    active: '진행 중',
    completed: '완료'
};

export const PROJECT_STATUS_COLORS: Record<ProjectStatusType, string> = {
    lead: '#9CA3AF',
    proposal: '#60A5FA',
    ot_scheduled: '#FBBF24',
    pt_scheduled: '#F97316',
    submitted: '#8B5CF6',
    won: '#10B981',
    lost: '#EF4444',
    cancelled: '#6B7280',
    planning: '#3B82F6',
    active: '#22C55E',
    completed: '#14B8A6'
};

// 프로젝트 기본 정보
export interface ProjectBasicInfo {
    project_id: number;
    project_name: string;
    inflow_path?: string;          // 유입경로
    client?: string;               // 발주처
    manager?: string;              // 담당자
    event_date?: string;           // 행사일
    event_location?: string;       // 행사장소
    attendees?: string;            // 참석대상
    event_nature?: string;         // 행사성격
    ot_schedule?: string;          // OT 일정
    submission_schedule?: string;  // 제출 일정
    pt_schedule?: string;          // PT 일정
    budget?: string;               // 예산 (단위: 천만원)
    bid_amount?: string;           // 제출/투찰 금액
    expected_competitors?: string; // 예상 경쟁사
    score_table?: string;          // 배점표
    status: string;
    status_label?: string;
    created_at?: string;
    company_name?: string;
    writer_name?: string;
}

// 상태별 카운트
export interface StatusCount {
    status: string;
    status_label: string;
    count: number;
    percentage: number;
}

// 기간별 통계
export interface PeriodStats {
    period_type: string;
    period_label: string;
    start_date: string;
    end_date: string;
    total_projects: number;
    total_budget: string;
    total_bid_amount: string;
    status_breakdown: StatusCount[];
}

// 월별 프로젝트
export interface MonthlyProject {
    month: number;
    month_label: string;
    project_count: number;
    projects: ProjectBasicInfo[];
}

// 금액 통계
export interface AmountStats {
    total_contract_amount: string;
    total_bid_amount: string;
    avg_contract_amount: string;
    max_contract_amount: string;
    min_contract_amount: string;
    total_contract_amount_raw?: number;
    total_bid_amount_raw?: number;
}

// 프로젝트 대시보드 메인 통계
export interface ProjectDashboardStats {
    total_projects: number;
    total_budget: string;
    active_projects: number;
    won_projects: number;
    lost_projects: number;
    win_rate: number;
    active_percentage?: number;
    won_percentage?: number;
    lost_percentage?: number;
    amount_stats?: AmountStats;
    status_distribution: StatusCount[];
    period_stats?: PeriodStats;
    monthly_projects: MonthlyProject[];
}

// 프로젝트 대시보드 필터
export interface ProjectDashboardFilter {
    period_type: ProjectPeriodType;
    year?: number;
    month?: number;
    quarter?: number;
    half_year?: number;
    start_date?: string;
    end_date?: string;
    status?: string;
    client?: string;
    manager?: string;
    search?: string;
}

// 프로젝트 목록 응답
export interface ProjectListResponse {
    period_label: string;
    total_count: number;
    items: ProjectBasicInfo[];
}

// 프로젝트 상태 변경 요청
export interface ProjectStatusUpdateRequest {
    project_id: number;
    new_status: string;
    note?: string;
}

// 프로젝트 상태 변경 응답
export interface ProjectStatusUpdateResponse {
    project_id: number;
    old_status: string;
    new_status: string;
    updated_at: string;
    updated_by?: string;
}

// 프로젝트 트리 노드
export interface ProjectTreeNode {
    id: string;
    label: string;
    type: 'year' | 'quarter' | 'month' | 'project';
    children?: ProjectTreeNode[];
    data?: ProjectBasicInfo;
    count?: number;
}

// 프로젝트 계층 구조
export interface ProjectHierarchy {
    year: number;
    tree: ProjectTreeNode[];
    total_count: number;
}

// 점유율
export interface OccupancyRate {
    category: string;
    label: string;
    value: number;
    total: number;
    percentage: number;
}

// 점유율 데이터
export interface OccupancyData {
    period_label: string;
    total: number;
    by_status: OccupancyRate[];
    by_client: OccupancyRate[];
    by_inflow_path: OccupancyRate[];
    by_manager?: OccupancyRate[];
}

// 일별 추이
export interface DailyTrend {
    date: string;
    count: number;
}

// 최근 30일 통계
export interface Recent30DaysStats {
    period: string;
    total_new_projects: number;
    status_breakdown: StatusCount[];
    daily_trend: DailyTrend[];
}

// ============ 프로젝트 대시보드 타입 끝 ============

// 💡 [추가] ProjectKickoff 타입을 아래 내용으로 추가합니다.
export interface ProjectKickoff {
    id?: number;
    project_id?: number;

    // 프로젝트 착수보고 내용
    department?: string;
    presenter?: string;
    personnel?: string;
    collaboration?: string;
    progress_schedule?: string; // 백엔드 모델 필드명 기준
    other_notes?: string;       // 백엔드 모델 필드명 기준

    // 프론트엔드에서 alias로 매핑될 필드 (선택사항)
    schedule?: string;
    others?: string;

    // 메타데이터
    created_at?: string;
    updated_at?: string;
    created_by?: number;
    updated_by?: number;
}


// src/api/types.ts 파일 끝에 추가
export interface PTChecklistItem {
    checked: boolean;
    opinion: string;
}

export interface PTChecklist {
    id?: number;
    project_id: number;
    department?: string;
    presenter?: string;
    professional_understanding?: PTChecklistItem;
    concept_strategy?: PTChecklistItem;
    feasibility?: PTChecklistItem;
    proposal_completeness?: PTChecklistItem;
    safety_management?: PTChecklistItem;
    event_plan?: PTChecklistItem;
    organization_structure?: PTChecklistItem;
    performance_record?: PTChecklistItem;
    pricing_adequacy?: PTChecklistItem;
    additional_proposals?: PTChecklistItem;
    persuasiveness?: PTChecklistItem;
    strategic_performance?: PTChecklistItem;
    qa_preparation?: PTChecklistItem;
    presenter_attitude?: PTChecklistItem;
    writer_name?: string;
    writer_department?: string;
    created_at?: string;
    updated_at?: string;
}

// 회의록 데이터 타입
export interface MeetingMinute {
    meeting_id: number;
    meeting_title: string;
    meeting_datetime: string;
    meeting_place: string | null;
    project_id: number | null;
    project_name?: string;
    creator_name?: string;
    sharers_display?: string; // ✅ 추가
    companion_attendees?: string; // ✅ 추가
    shared_with: EmployeeSimple[];
    tags: string[];
    share_methods: ('email' | 'jandi')[];
    is_active: boolean;
    created_at: string;
    created_by: number;
    basic_minutes?: string;
    has_llm_documents?: boolean;

    // ✅ 상세 정보 추가
    stt_originals?: STTOriginal[];
    llm_documents?: LLMDocument[];
    file_attachments?: any[];
}


// ✅ STT 결과 타입
export interface STTOriginal {
    stt_original_id: number;
    file_attachment_id: number;
    original_text: string;
    stt_engine_type: string; // 'whisper', 'clova', 'google', etc.
    conversion_duration?: string;
    created_at: string;
}

// ✅ LLM 문서 타입
export interface LLMDocument {
    llm_document_id: number;
    document_type: string; // 'summary', 'concept', 'draft'
    document_title: string;
    document_content: string;
    created_at: string;
}

// LLM 생성 요청 타입
export interface LLMGenerateRequest {
    source_text: string;
    engine: 'claude' | 'chatgpt' | 'gemini' | 'perplexity' | 'grok';
    doc_types: ('summary' | 'concept' | 'draft')[];
    meeting_id: number;  // ✅ 추가
    stt_original_id?: number;  // ✅ 추가
}

// LLM 응답 타입
export interface LLMDocumentResult {
    llm_document_id: number;  // ✅ 추가
    doc_type: 'summary' | 'concept' | 'draft';
    title: string;
    content: string;
}

export interface LLMGenerateResponse {
    engine: string;
    results: LLMDocumentResult[];
    processing_time_ms: number;
}

// ✅ Permission 인터페이스 추가
export interface Permission {
    permission_id: number;
    permission_name: string;
    permission_code: string;
    resource_type: string;
    action_type: string;
    description?: string;
    is_active: boolean;
    created_at: string;
    modified_at: string;
}

// ✅ 권한 생성 및 수정을 위한 타입 추가
export interface PermissionCreate {
    permission_name: string;
    permission_code: string;
    resource_type: string;
    action_type: string;
    description?: string;
}

export interface PermissionUpdate extends Partial<PermissionCreate> {}

// ✅ Role 인터페이스 수정 (AuthContext에서 사용되는 Role과 동일)
export interface Role {
    role_id: number;
    role_name: string;
    role_code: string;
    description?: string;
    can_view_finance: boolean; // Re-added
    can_edit_finance: boolean; // Re-added
    applying_to_all: boolean; // 모든 직원에게 적용 여부
    is_active: boolean;
    created_at: string;
    modified_at: string;
    permissions: Permission[]; // Add permissions list
}

// ✅ 역할 생성 및 수정을 위한 타입 추가
export interface RoleCreate {
    role_name: string;
    role_code: string;
    description?: string;
    can_view_finance?: boolean;
    can_edit_finance?: boolean;
    applying_to_all?: boolean;
}

export interface RoleUpdate extends Partial<RoleCreate> {}

// ✅ EmployeeRoleAssignment 인터페이스 제거
// export interface EmployeeRoleAssignment {
//     role_id: number;
// }


