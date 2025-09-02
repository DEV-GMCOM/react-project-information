// src/types/project.ts

// // 기존 컴포넌트에서 정의된 타입들을 import
// import { CompanyProfileData } from '../pages/project/ProjectProfile';

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
    contacts: CompanyContactData[]; // 해당 회사의 모든 담당자 목록
}

