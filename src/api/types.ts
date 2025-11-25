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
    id: number;
    name: string;
}

export interface Employee {
    id: number;
    employee_id: string;
    name: string;
    department?: Department;
    division?: string; // ✅ 추가
    team?: string;     // ✅ 추가
    position?: string;
    email?: string;
    phone?: string;
    hire_date?: string;
    birth_date?: string;
    address?: string;
    status: 'active' | 'inactive' | 'terminated';
    created_at: string;
    updated_at: string;
    role?: Role; // ✅ 추가: 직원의 역할 정보
}

export interface EmployeeCreate {
    employee_id: string;
    name: string;
    department_id?: number;
    position?: string;
    email?: string;
    phone?: string;
    hire_date?: string;
    birth_date?: string;
    address?: string;
    status: 'active' | 'inactive' | 'terminated';
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
    attendees_display: string;
    shared_with: Employee[];
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
}

export interface RoleUpdate extends Partial<RoleCreate> {}

// ✅ EmployeeRoleAssignment 인터페이스 제거
// export interface EmployeeRoleAssignment {
//     role_id: number;
// }


