// src/types/project.ts - ProjectKickoff 최적화 버전

export interface ProjectBasicInfo {
    projectName: string;
    inflowPath: string;
    client: string;
    manager: string;
    eventDate: string;
    eventLocation: string;
    attendees: string;
    eventNature: string;
    otSchedule: string;
    submissionSchedule: string;
    expectedRevenue: string;
    expectedCompetitors: string;
    scoreTable: string;
    bidAmount: string;
}

export interface ProjectDetailInfo {
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    comparison: string;
}

// 프로젝트 검토 데이터 (읽기 전용)
export interface ProjectReviewData {
    swotAnalysis: string;
    resourcePlan: string;
    writerOpinion: string;
}

// 프로젝트 착수보고 폼데이터 (CRUD용)
export interface ProjectKickoffFormData {
    department: string;
    presenter: string;
    personnel: string;
    collaboration: string;
    schedule: string;    // UI 필드명
    others: string;      // UI 필드명
}

// API 통신용 착수보고 데이터
export interface ProjectKickoffApiData {
    department: string;
    presenter: string;
    personnel: string;
    collaboration: string;
    progress_schedule: string;  // DB 필드명
    other_notes: string;        // DB 필드명
}

export interface ProjectData {
    project_id: number;
    project_name: string;
    status: string;
    created_at: string;
    inflow_path?: string;
    client?: string;
    project_period_start?: string;
    project_period_end?: string;
    event_location?: string;
    attendees?: string;
    event_nature?: string;
    ot_schedule?: string;
    contract_amount?: number;
    expected_competitors?: string;
    project_overview?: string;
    project_scope?: string;
    deliverables?: string;
    special_requirements?: string;
    project_background?: string;
    expected_effects?: string;
    risk_factors?: string;
    business_type?: string;

    reports?: Array<{
        id: number;
        report_date: string;
        content: string;
    }>;

    writer_info?: WriterInfo;
    updater_info?: WriterInfo;
    company_profile?: CompanyProfileData;
    selected_contact?: CompanyContactData;
}

export interface ExtendedProjectData extends ProjectBasicInfo {
    // 상세 정보
    purposeBackground?: string;
    mainContent?: string;
    coreRequirements?: string;
    comparison?: string;

    // 작성자 정보 (선택적)
    writerName?: string;
    writerDepartment?: string;
}

// API 응답 타입들
export interface ProjectDataApiResponse {
    project_id: number;
    basic_info?: {
        project_name: string;
        inflow_path?: string;
        client?: string;
        contract_amount?: number;
        project_period_start?: string;
        project_period_end?: string;
        event_location?: string;
        attendees?: string;
        business_type?: string;
        ot_schedule?: string;
        expected_competitors?: string;
        our_manager_name?: string;
        client_manager_name?: string;
    };
    detail_info?: {
        project_overview?: string;
        project_scope?: string;
        deliverables?: string;
        special_requirements?: string;
    };
    review_info?: {
        swot_analysis?: string;
        resource_plan?: string;
        writer_opinion?: string;
    };
    kickoff_info?: {
        department?: string;
        presenter?: string;
        personnel?: string;
        collaboration?: string;
        progress_schedule?: string;
        other_notes?: string;
    };
}

/** 직원의 간단한 정보를 나타냅니다. (작성자, 수정자 등) */
export interface WriterInfo {
    emp_id: number;
    name: string;
    department?: string;
    position?: string;
    email?: string;
}

/** 고객사 담당자의 상세 정보를 나타냅니다. */
export interface CompanyContactData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    is_primary: boolean;
}

/** 회사의 상세 정보와 소속된 모든 담당자 목록을 포함합니다. */
export interface CompanyProfileData {
    id: number;
    company_name: string;
    contacts: CompanyContactData[];
}