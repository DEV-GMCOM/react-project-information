import React, { useState, useEffect } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import '../../styles/ProjectInformation.css';

/** 직원의 간단한 정보를 나타냅니다. (작성자, 수정자 등) */
interface WriterInfo {
    emp_id: number;
    name: string;
    department?: string;
    position?: string;
    email?: string;
}

/** 고객사 담당자의 상세 정보를 나타냅니다. */
interface CompanyContactData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    is_primary: boolean;
}

/** 회사의 상세 정보와 소속된 모든 담당자 목록을 포함합니다. */
interface CompanyProfileData {
    id: number;
    company_name: string;
    contacts: CompanyContactData[]; // 해당 회사의 모든 담당자 목록
}


/** [API 응답용] API로부터 받는 프로젝트의 최종 데이터 구조입니다. */
interface ProjectData {
    // --- 프로젝트 기본 속성 (DB 컬럼과 일치) ---
    project_id: number;
    project_name: string;
    status: string;
    created_at: string;
    inflow_path?: string;
    client?: string;
    project_period_start?: string;
    project_period_end?: string;

    // --- 💡 [추가] 누락되었던 모든 상세 정보 필드를 여기에 선언합니다. ---
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
    business_type?: string; // 💡 이 필드를 추가합니다.

    // --- 💡 [추가] 새로 만든 리포트(정보수집 추가사항) 배열을 선언합니다. ---
    reports?: Array<{
        id: number;
        report_date: string;
        content: string;
    }>;

    // --- 관계를 통해 표현되는 중첩 객체 ---
    writer_info?: WriterInfo;
    updater_info?: WriterInfo;
    company_profile?: CompanyProfileData;
    selected_contact?: CompanyContactData;
}


/** [폼 상태 관리용] 화면의 입력 필드 상태를 관리하는 인터페이스입니다. */
interface ProjectInformationFormData {
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
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    comparison: string;
    additionalInfo: Array<{
        date: string;
        content: string;
    }>;
    // 프로젝트 검토 필드들 추가
    swotAnalysis: string;
    // marketSize: string;
    // competitorAnalysis: string;
    // coreSuccessFactors: string;
    // otherNotes: string;
    resourcePlan: string;
    writerOpinion: string;
    proceedDecision: string;
}
// (참고) 기존 `ProjectInformation` 인터페이스는 `ProjectInformationFormData`로
// 이름을 변경하여 역할(폼 데이터 관리)을 명확히 하고, ID 필드는 제거했습니다.
// useState<ProjectInformation> 부분을 useState<ProjectInformationFormData>로 변경해주세요.
// 예: const [formData, setFormData] = useState<ProjectInformationFormData>({ ... });

// [추가할 인터페이스] 이 코드 블록을 기존 interface 선언부에 추가하세요.

/** 담당자 검색 결과 항목의 타입을 정의합니다. */
interface ContactSearchData {
    id: number;
    contact_name: string;
    company: {
        id: number;
        company_name: string;
    };
}

/** 회사(발주처) 검색 결과 항목의 타입을 정의합니다. */
interface CompanyData {
    id: number;
    company_name: string;
    representative?: string;
    business_number?: string;
}

/** 담당자 상세 정보 모달에 사용될 데이터 타입을 정의합니다. */
interface ContactDetailData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    company: {
        id: number;
        company_name: string;
        address?: string;
    };
    reports?: Array<{
        contact_date: string;
        content: string;
    }>;
}

const ProjectInformationForm: React.FC = () => {
    // --- 기존 상태(state) 정의는 그대로 유지 ---
    const [formData, setFormData] = useState<ProjectInformationFormData>({
        projectName: '',
        inflowPath: '',
        client: '',
        manager: '',
        eventDate: '',
        eventLocation: '',
        attendees: '',
        eventNature: '',
        otSchedule: '',
        submissionSchedule: '',
        expectedRevenue: '',
        expectedCompetitors: '',
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        additionalInfo: [
            // {
            //     date: '2025.07.23',
            //     content: '• 제목 및 안건 : 현대자동차 EV 신차 발표회 프로모션의 건\n• 협의 및 내용 : '
            // },
            { date: '', content: '' }
        ],
        // 프로젝트 검토 필드들 초기화
        swotAnalysis: '',
        // marketSize: '',
        // competitorAnalysis: '',
        // coreSuccessFactors: '',
        // otherNotes: '',
        resourcePlan: '',
        writerOpinion: '',
        proceedDecision: '',
    });

    // --- 기존 상태들도 그대로 유지 ---
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [writerSearchModal, setWriterSearchModal] = useState(false);
    const [writerSearchResults, setWriterSearchResults] = useState<WriterInfo[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

    // [요구사항 1] 최종 수정자 정보 표시를 위한 상태 하나만 새로 추가합니다.
    const [lastUpdater, setLastUpdater] = useState<WriterInfo | null>(null);

    // [이 코드 블록을 기존 useState 선언부 아래에 추가하세요]
    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);

    // [이 코드 블록을 기존 useState 선언부 아래에 추가하세요]
    const [showContactDetailModal, setShowContactDetailModal] = useState(false);
    const [contactDetailData, setContactDetailData] = useState<ContactDetailData | null>(null);

    // [이 코드 블록을 기존 useState 선언부 아래에 추가하세요]
    const [showCompanySearchModal, setShowCompanySearchModal] = useState(false);
    const [companySearchResults, setCompanySearchResults] = useState<CompanyData[]>([]);
    const [companySearchLoading, setCompanySearchLoading] = useState(false);
    const [saveMode, setSaveMode] = useState<'insert' | 'update'>('insert');    const [clientCompanyContacts, setClientCompanyContacts] = useState<CompanyContactData[]>([]);
    const [selectedContact, setSelectedContact] = useState<CompanyContactData | null>(null);

    // ... 다른 useState 선언부 아래에 추가
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfileData | null>(null);

    // --- 기존 함수들은 모두 그대로 유지하며, 필요한 부분만 수정합니다 ---
    // [이 코드 블록을 새로 추가하세요]
    useEffect(() => {
        // 프로젝트명(projectName) 필드가 비워졌는지 확인합니다.
        if (formData.projectName === '') {
            // 이전에 선택했던 프로젝트 정보와 관련 상태들을 모두 초기화합니다.
            setSelectedProject(null);
            setLastUpdater(null);
            setClientCompanyContacts([]);
            setSelectedContact(null);
            setSaveMode('insert');

            // 폼 데이터에서 발주처와 담당자 정보도 함께 초기화합니다.
            setFormData(prev => ({
                ...prev,
                client: '',
                manager: '',
                // clientContactId: undefined
            }));
        }
    }, [formData.projectName]); // formData.projectName이 변경될 때마다 이 함수가 실행됩니다.

    const handleProjectSearch = async () => {
        setShowSearchModal(true);
        setCurrentPage(1);
        await searchProjects(1);
    };

    const searchProjects = async (page: number) => {
        try {
            setSearchLoading(true);

            const params = new URLSearchParams({
                skip: ((page - 1) * 10).toString(),
                limit: '10'
            });

            if (formData.projectName) {
                params.append('search', formData.projectName);
            }

            // const listUrl = `http://localhost:8001/api/projects/?${params.toString()}`;
            // const countUrl = `http://localhost:8001/api/projects/count?${params.toString()}`;
            const listUrl = `/api/projects/?${params.toString()}`;
            const countUrl = `/api/projects/count?${params.toString()}`;

            const response = await fetch(listUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setSearchResults(data);

            const countResponse = await fetch(countUrl);
            if (countResponse.ok) {
                const countData = await countResponse.json();
                setTotalPages(Math.ceil(countData.total_count / 10));
            } else {
                console.warn('카운트 요청 실패, 기본값 사용');
                setTotalPages(1);
            }

        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error('검색 오류:', errorMessage);
            alert(`검색 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setSearchLoading(false);
        }
    };

    // const selectProject = async (project: ProjectData) => {
    //     try {
    //         const response = await fetch(`/api/projects/${project.project_id}`);
    //         if (!response.ok) throw new Error('프로젝트 정보를 가져올 수 없습니다.');
    //         const detailedProject: ProjectData = await response.json();
    //
    //         // 💡 [핵심 수정] API 응답 객체의 모든 필드를 formData 상태에 매핑합니다.
    //         // 🔥 기존 reports 데이터 처리 - 항상 마지막에 빈 행 보장
    //         let additionalInfoData: Array<{ date: string; content: string }> = [];
    //
    //         if (detailedProject.reports && detailedProject.reports.length > 0) {
    //             // 기존 데이터가 있는 경우
    //             additionalInfoData = detailedProject.reports.map(report => ({
    //                 date: report.report_date,
    //                 content: report.content || ''
    //             }));
    //         }
    //
    //         // 🔥 핵심: 마지막 행이 빈 행이 아니면 새로운 빈 행 추가
    //         const lastItem = additionalInfoData[additionalInfoData.length - 1];
    //         if (additionalInfoData.length === 0 ||
    //             (lastItem && lastItem.date && lastItem.content)) {
    //             additionalInfoData.push({ date: '', content: '' });
    //         }
    //
    //         setFormData(prev => ({
    //             ...prev,
    //             projectName: detailedProject.project_name || '',
    //             inflowPath: detailedProject.inflow_path || '',
    //             client: detailedProject.company_profile?.company_name || detailedProject.client || '',
    //             manager: detailedProject.selected_contact?.contact_name || '', // ⬅️ '담당자'
    //             eventDate: detailedProject.project_period_start || '',
    //             submissionSchedule: detailedProject.project_period_end || '',
    //             eventLocation: detailedProject.event_location || '',
    //             attendees: detailedProject.attendees || '',
    //             eventNature: detailedProject.business_type || '', // ⬅️ '성격'
    //             otSchedule: detailedProject.ot_schedule || '',
    //             expectedRevenue: detailedProject.contract_amount?.toString() || '',
    //             expectedCompetitors: detailedProject.expected_competitors || '', // ⬅️ '예상경쟁사'
    //             purposeBackground: detailedProject.project_overview || '',
    //             mainContent: detailedProject.project_scope || '',
    //             comparison: detailedProject.deliverables || '',
    //             coreRequirements: detailedProject.special_requirements || '',
    //             additionalInfo: detailedProject.reports?.map(report => ({
    //                 date: report.report_date,
    //                 content: report.content || ''
    //             })) || [{ date: '', content: '' }]
    //         }));
    //
    //         // --- 관계형 데이터 상태 업데이트 (이 부분은 잘 구현되어 있습니다) ---
    //         setLastUpdater(detailedProject.updater_info || detailedProject.writer_info || null);
    //         setClientCompanyContacts(detailedProject.company_profile?.contacts || []);
    //         setSelectedContact(detailedProject.selected_contact || null);
    //         setSelectedProject(detailedProject);
    //         setSaveMode('update');
    //         setShowSearchModal(false);
    //
    //     } catch (error) {
    //         handleApiError(error);
    //     }
    // };
    // ProjectInformation.tsx

    const selectProject = async (project: ProjectData) => {
        try {
            const response = await fetch(`/api/projects/${project.project_id}`);
            if (!response.ok) throw new Error('프로젝트 정보를 가져올 수 없습니다.');
            const detailedProject: ProjectData = await response.json();

            // --- 💡 [핵심 수정] additionalInfo 데이터를 미리 가공하는 로직 ---
            // 1. API 응답의 reports를 기본 형태로 변환합니다. 데이터가 없으면 빈 배열이 됩니다.
            const reportsData = detailedProject.reports?.map(report => ({
                date: report.report_date,
                content: report.content || ''
            })) || [];

            // 2. 마지막 항목을 확인합니다.
            const lastReport = reportsData[reportsData.length - 1];

            // 3. 데이터가 아예 없거나, 마지막 항목이 비어있지 않으면 새로운 빈 행을 추가합니다.
            if (reportsData.length === 0 || (lastReport && (lastReport.date || lastReport.content))) {
                reportsData.push({ date: '', content: '' });
            }
            // ----------------------------------------------------------------

            setFormData(prev => ({
                ...prev,
                projectName: detailedProject.project_name || '',
                inflowPath: detailedProject.inflow_path || '',
                client: detailedProject.company_profile?.company_name || detailedProject.client || '',
                manager: detailedProject.selected_contact?.contact_name || '',
                eventDate: detailedProject.project_period_start || '',
                submissionSchedule: detailedProject.project_period_end || '',
                eventLocation: detailedProject.event_location || '',
                attendees: detailedProject.attendees || '',
                eventNature: detailedProject.business_type || '',
                otSchedule: detailedProject.ot_schedule || '',
                expectedRevenue: detailedProject.contract_amount?.toString() || '',
                expectedCompetitors: detailedProject.expected_competitors || '',
                purposeBackground: detailedProject.project_overview || '',
                mainContent: detailedProject.project_scope || '',
                comparison: detailedProject.deliverables || '',
                coreRequirements: detailedProject.special_requirements || '',

                // 💡 위에서 가공한 최종 데이터를 상태에 반영합니다.
                additionalInfo: reportsData
            }));

            // --- 나머지 상태 업데이트 로직은 그대로 ---
            setLastUpdater(detailedProject.updater_info || detailedProject.writer_info || null);
            setClientCompanyContacts(detailedProject.company_profile?.contacts || []);
            setSelectedContact(detailedProject.selected_contact || null);
            setSelectedProject(detailedProject);
            setSaveMode('update');
            setShowSearchModal(false);

        } catch (error) {
            handleApiError(error);
        }
    };

    const renderSearchResults = () => {
        if (searchLoading) {
            return <div className="loading">검색 중...</div>;
        }

        if (searchResults.length === 0) {
            return <div className="no-results">검색 결과가 없습니다.</div>;
        }

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>프로젝트명</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>고객사</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>상태</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>작성자</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>부서</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>생성일</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>선택</th>
                </tr>
                </thead>
                <tbody>
                {searchResults.map((project: ProjectData) => (
                    <tr key={project.project_id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.project_name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.client || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}><span className={`status-badge status-${project.status}`}>{getStatusText(project.status)}</span></td>
                        {/*<td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.writer_name || '-'}{project.writer_position && (<small style={{ display: 'block', color: '#666' }}>{project.writer_position}</small>)}</td>*/}
                        {/*<td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.writer_department || '-'}</td>*/}
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {project.writer_info?.name || '-'}
                            {project.writer_info?.position && (
                                <small style={{ display: 'block', color: '#666' }}>
                                    {project.writer_info.position}
                                </small>
                            )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {project.writer_info?.department || '-'}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(project.created_at).toLocaleDateString('ko-KR')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}><button className="select-btn" onClick={() => selectProject(project)}>선택</button></td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    const getStatusText = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'planning': '기획중', 'active': '진행중', 'completed': '완료', 'cancelled': '취소'
        };
        return statusMap[status] || status;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 🔥 추가: handleAdditionalInfoChange 함수도 개선하여 동적 행 추가를 더 안정적으로 만들기
    const handleAdditionalInfoChange = (index: number, field: 'date' | 'content', value: string) => {
        const updatedInfo = [...formData.additionalInfo];
        updatedInfo[index][field] = value;

        // 🔥 개선: 마지막 행이 채워지면 새로운 빈 행 추가
        const isLastRow = index === updatedInfo.length - 1;
        const currentRowFilled = updatedInfo[index].date.trim() && updatedInfo[index].content.trim();

        if (isLastRow && currentRowFilled) {
            updatedInfo.push({ date: '', content: '' });
        }

        setFormData(prev => ({
            ...prev,
            additionalInfo: updatedInfo
        }));
    };

    // 🔥 추가 기능: 수동으로 새 행 추가하는 함수 (옵션)
    const addNewAdditionalInfo = () => {
        setFormData(prev => ({
            ...prev,
            additionalInfo: [...prev.additionalInfo, { date: '', content: '' }]
        }));
    };

    // 🔥 추가 기능: 행 삭제 함수 (옵션)
    const removeAdditionalInfo = (index: number) => {
        if (formData.additionalInfo.length <= 1) {
            // 최소 1개 행은 유지
            setFormData(prev => ({
                ...prev,
                additionalInfo: [{ date: '', content: '' }]
            }));
            return;
        }

        const updatedInfo = formData.additionalInfo.filter((_, i) => i !== index);
        // 삭제 후 빈 행이 없으면 추가
        const lastItem = updatedInfo[updatedInfo.length - 1];
        if (updatedInfo.length === 0 || (lastItem && lastItem.date && lastItem.content)) {
            updatedInfo.push({ date: '', content: '' });
        }

        setFormData(prev => ({
            ...prev,
            additionalInfo: updatedInfo
        }));
    };

    const formatWithBullets = (text: string): string => {
        if (!text) return text;
        const lines = text.split('\n');
        return lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
                return `• ${trimmedLine}`;
            }
            return line;
        }).join('\n');
    };

    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };



    const handleSubmit = async () => {
        // 1. 필수값 유효성 검사
        if (!formData.projectName.trim()) {
            alert('프로젝트명을 입력해주세요.');
            return;
        }

        let action = saveMode;
        // let url = 'http://localhost:8001/api/projects/';
        let url = '/api/projects/';
        let method = 'POST';

        // 2. 프로젝트명 변경 감지 및 사용자 선택 처리
        if (action === 'update' && selectedProject && formData.projectName !== selectedProject.project_name) {
            const userChoice = window.confirm(
                '프로젝트명이 변경되었습니다.\n\n- "확인"을 누르면: 현재 프로젝트를 새 이름으로 수정합니다 (UPDATE).\n- "취소"를 누르면: 이 내용을 새 프로젝트로 생성합니다 (INSERT).'
            );
            if (!userChoice) {
                action = 'insert';
            }
        }

        // 💡 1. 실제로는 인증 라이브러리나 전역 상태에서 가져와야 합니다.
        // 테스트를 위해 임시로 객체를 선언합니다.
        const currentUser = { id: 1, name: "테스트유저" }; // ❗ 이 부분은 실제 로직으로 대체 필요

        const apiData = {
            // --- 1. 기본/상세 정보 ---
            project_name: formData.projectName,
            inflow_path: formData.inflowPath,
            client: formData.client,
            client_manager_name: formData.manager, // ⬅️ '담당자' 이름
            business_type: formData.eventNature,   // ⬅️ '성격'
            expected_competitors: formData.expectedCompetitors, // ⬅️ '예상경쟁사'
            event_location: formData.eventLocation,
            attendees: formData.attendees,
            contract_amount: parseFloat(formData.expectedRevenue) || null,
            project_overview: formData.purposeBackground,
            project_scope: formData.mainContent,
            deliverables: formData.comparison,
            special_requirements: formData.coreRequirements,

            // --- 2. 날짜 필드 ---
            project_period_start: formData.eventDate ? formData.eventDate.replace(/\./g, '-') : null,
            project_period_end: formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : null,
            ot_schedule: formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : null,

            // --- 3. 관계 ID ---
            // company_id: selectedProject?.company_profile?.id,
            // 💡 [수정] company_id를 selectedProject가 아닌 selectedCompany 상태에서 가져옵니다.
            company_id: selectedCompany?.id,

            client_contact_id: selectedContact?.id, // ⬅️ [수정] '담당자' ID
            writer_emp_id: selectedProject?.writer_info?.emp_id || currentUser.id,

            // --- 💡 [핵심] 누락된 writer_name 필드 추가 ---
            // 수정 모드일 때는 lastUpdater의 이름을, 신규 생성 모드일 때는 현재 로그인 유저의 이름을 사용합니다.
            writer_name: lastUpdater?.name || currentUser.name,

            // --- 4. 리포트 정보 ---
            reports: formData.additionalInfo
                .filter(info => info.date || info.content)
                .map(info => ({
                    report_date: info.date ? info.date.replace(/\./g, '-') : null,
                    content: info.content
                }))
        };

        if (action === 'update') {
            method = 'PUT';
            url += `${selectedProject!.project_id}`;
        }

        // 4. API 호출
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(apiData)
            });

            if (response.ok) {
                const result = await response.json();
                alert(`프로젝트가 성공적으로 ${action === 'update' ? '수정' : '생성'}되었습니다!`)

                // --- 💡 [핵심 추가] 저장 성공 후 상태를 업데이트하는 로직 ---
                // 1. 폼의 모드를 'update'로 변경합니다.
                setSaveMode('update');

                // 2. 서버로부터 받은 최신 데이터를 selectedProject 상태에 저장합니다.
                //    이렇게 하면 이제 이 폼은 '저장된' 프로젝트를 다루게 됩니다.
                setSelectedProject(result);

                // 3. (선택적이지만 권장) 최종 수정자, 담당자 목록 등 관련 상태도 함께 업데이트합니다.
                setLastUpdater(result.updater_info || result.writer_info || null);
                setClientCompanyContacts(result.company_profile?.contacts || []);
                setSelectedContact(result.selected_contact || null);

            } else {
                const errorData = await response.json();
                const errorDetail = errorData.detail ? JSON.stringify(errorData.detail) : '알 수 없는 오류';
                alert(`저장 실패: ${errorDetail}`);
            }
        } catch (error) {
            handleApiError(error);
        }
    };


    const handlePrint = () => { window.print(); };

    const searchWriters = async (searchTerm: string) => {
        try {
            // const url = `http://localhost:8001/api/hr/?search=${encodeURIComponent(searchTerm)}&limit=20`;
            const url = `/api/hr/?search=${encodeURIComponent(searchTerm)}&limit=20`;
            const response = await fetch(url);
            if (response.ok) {
                const writers = await response.json();
                setWriterSearchResults(writers);
            } else {
                console.error('API 응답 오류:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('작성자 검색 오류:', error);
        }
    };

    const selectWriter = (writer: any) => {
        const writerNameInput = document.querySelector('input[name="writerName"]') as HTMLInputElement;
        const writerDeptInput = document.querySelector('input[name="writerDepartment"]') as HTMLInputElement;
        if (writerNameInput) { writerNameInput.value = writer.emp_name; writerNameInput.readOnly = false; writerNameInput.className = 'writer-field-input'; }
        if (writerDeptInput) { writerDeptInput.value = writer.division || ''; writerDeptInput.readOnly = false; writerDeptInput.className = 'writer-field-input'; }
        setFormData(prev => ({ ...prev, writerEmpId: writer.emp_id }));
        setWriterSearchModal(false);
    };


    // [이 코드 블록을 기존 함수 선언부 아래에 추가하세요]
    const handleOpenContactSearchModal = () => {
        setContactSearchTerm(''); // 모달 열 때 검색어 초기화
        setContactSearchResults([]); // 모달 열 때 결과 초기화
        setShowContactSearchModal(true);

        // 모달을 열자마자 초기 검색을 실행합니다.
        searchContacts('');
    };

    // [새로운 handleContactSearchAPI 함수]
    const handleContactSearchAPI = async () => {
        // 사용자가 입력한 검색어(contactSearchTerm)로 검색 함수를 호출합니다.
        await searchContacts(contactSearchTerm);
    };

    const selectContact = (contact: ContactSearchData) => {
        // 💡 [추가] 담당자 정보에 포함된 회사 정보로 selectedCompany 상태도 함께 업데이트합니다.
        setSelectedCompany({
            id: contact.company.id,
            company_name: contact.company.company_name,
            contacts: [], // 이 시점에서는 전체 목록을 모르므로 비워두거나 기존 목록 유지
        });

        // 선택된 담당자 정보를 상태에 저장합니다.
        setSelectedContact({
            id: contact.id,
            contact_name: contact.contact_name,
            is_primary: false,
        });

        // 폼 UI 필드를 업데이트합니다.
        setFormData(prev => ({
            ...prev,
            client: contact.company.company_name,
            manager: contact.contact_name,
        }));

        setShowContactSearchModal(false);
    };

    // [이 코드 블록을 새로 추가하세요]
    const handleOpenContactDetailModal = async () => {
        // if (!formData.clientContactId) return;
        if (!selectedContact?.id) return;

        // 실제로는 로딩 상태를 true로 설정하는 것이 좋습니다.
        setShowContactDetailModal(true);
        try {
            // 이 API는 백엔드에 담당자의 모든 상세 정보를 내려주도록 구현해야 합니다.
            const response = await fetch(`/api/company-contacts/${selectedContact.id}/details`);

            if (!response.ok) throw new Error('담당자 상세 정보 조회에 실패했습니다.');

            const data: ContactDetailData = await response.json();
            setContactDetailData(data);
        } catch (error) {
            alert(handleApiError(error));
            setShowContactDetailModal(false); // 실패 시 모달 닫기
        }
    };

    // [이 코드 블록을 기존 함수 선언부 아래에 새로 추가하세요]
    const handleOpenCompanySearchModal = async () => {
        setShowCompanySearchModal(true);
        // 모달이 열릴 때 현재 발주처 이름으로 기본 검색을 수행할 수 있습니다.
        await searchCompaniesAPI(formData.client);
    };

    // 이 함수를 새로 추가하세요.
    const searchContacts = async (searchTerm: string) => {
        setContactSearchLoading(true);
        try {
            // API는 우선 담당자 이름으로 검색합니다 (초기 검색 시 searchTerm은 '' 입니다).
            // const url = `http://localhost:8001/api/company-profile/contacts/search?search=${encodeURIComponent(searchTerm)}`;
            const url = `/api/company-profile/contacts/search?search=${encodeURIComponent(searchTerm)}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('담당자 검색에 실패했습니다.');

            let results: ContactSearchData[] = await response.json();

            // [핵심] 발주처(formData.client) 값의 유무에 따라 프론트에서 한번 더 필터링합니다.
            if (formData.client) {
                results = results.filter(contact =>
                    contact.company.company_name === formData.client
                );
            }

            // 최종 결과를 상태에 저장합니다.
            setContactSearchResults(results);

        } catch (error) {
            handleApiError(error);
        } finally {
            setContactSearchLoading(false);
        }
    };

    const searchCompaniesAPI = async (searchTerm: string) => {
        setCompanySearchLoading(true);
        try {
            // CompanyProfile 검색과 동일한 API 엔드포인트를 사용합니다.
            // const response = await fetch(`http://localhost:8001/api/company-profile/?search=${encodeURIComponent(searchTerm)}`);
            const response = await fetch(`/api/company-profile/?search=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('회사 검색에 실패했습니다.');
            const data: CompanyData[] = await response.json();
            setCompanySearchResults(data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setCompanySearchLoading(false);
        }
    };

    const selectCompany = async (company: CompanyData) => {
        try {
            const response = await fetch(`/api/company-profile/${company.id}`);
            if (!response.ok) throw new Error('회사 상세 정보 조회에 실패했습니다.');
            const detailedCompany: CompanyProfileData = await response.json();

            // 💡 [추가] 선택된 회사 정보를 새 상태에 저장합니다.
            setSelectedCompany(detailedCompany);

            // 담당자 목록 상태를 업데이트하고, 기존 담당자 선택은 해제합니다.
            setClientCompanyContacts(detailedCompany.contacts || []);
            setSelectedContact(null);

            // 폼 UI를 업데이트합니다.
            setFormData(prev => ({
                ...prev,
                client: detailedCompany.company_name,
                manager: '', // 발주처를 바꾸면 담당자는 초기화
            }));

            setShowCompanySearchModal(false);
        } catch (error) {
            handleApiError(error);
        }
    };

    const resetClientAndContact = () => {
        // 1. 선택된 회사와 담당자 객체 상태를 null로 초기화합니다.
        setSelectedCompany(null);
        setSelectedContact(null);

        // 2. 담당자 목록을 비웁니다.
        setClientCompanyContacts([]);

        // 3. 폼 데이터에서 발주처와 담당자 이름 필드를 비웁니다.
        setFormData(prev => ({
            ...prev,
            client: '',
            manager: '',
        }));
    };

    const handleResetClick = (e: React.MouseEvent) => {
        // 부모 버튼의 onClick(검색 모달 열기)이 실행되지 않도록 이벤트 전파를 막습니다.
        e.stopPropagation();
        resetClientAndContact();
    };

    const WriterSearchModal: React.FC = () => {
        const [searchTerm, setSearchTerm] = useState('');
        return writerSearchModal ? (
            <div className="modal-overlay" onClick={() => setWriterSearchModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>직원 검색</h3><button onClick={() => setWriterSearchModal(false)}>×</button></div>
                    <div className="modal-body">
                        <div className="search-input-container"><input type="text" placeholder="이름 또는 이메일 입력 시 자동검색 (1글자 이상)" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value.length >= 1) { searchWriters(e.target.value); }}}/></div>
                        <div className="search-results">{writerSearchResults.map((writer: any) => (<div key={writer.emp_id} className="writer-result-item" onClick={() => selectWriter(writer)}><div><strong>{writer.emp_name}</strong><div style={{ fontSize: '12px', color: '#676' }}>{writer.division} {writer.position && `· ${writer.position}`}</div></div><div style={{ fontSize: '12px', color: '#666' }}>{writer.email}</div></div>))}</div>
                    </div>
                </div>
            </div>
        ) : null;
    };

    return (
        <div className="project-info-container">
            <div className="project-header">
                <div><h1 className="project-title">별첨 2-1. (프로젝트) 정보 수집 양식</h1></div>
                <div className="project-logo">GMCOM</div>
            </div>

            <div className="project-main">
                <div className="project-title-section">
                    <h2 className="project-subtitle">정보 수집</h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>
                                최종 작성자 :
                            </div>
                        </div>
                    </div>

                </div>

                {/* --- 아래의 모든 JSX 코드는 원본 파일과 완전히 동일합니다. --- */}
                <div className="project-section">
                    <h3 className="section-header">■ 프로젝트 기본 정보</h3>
                    <table className="project-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td><td className="table-header">내용</td><td className="table-header">구분</td><td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">프로젝트명</td>
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    <input type="text" name="projectName" value={formData.projectName} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleProjectSearch(); }}} className="project-input" placeholder="프로젝트명 입력 후 엔터 또는 🔍 클릭"/>
                                    <button type="button" onClick={handleProjectSearch} className="search-btn" title="프로젝트 검색">🔍</button>
                                </div>
                            </td>
                            <td className="table-cell table-cell-label">유입경로</td>
                            <td className="table-cell-input"><input type="text" name="inflowPath" value={formData.inflowPath} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">발주처</td>
                            {/* [새로운 발주처 UI] */}
                            <td className="table-cell-input">
                                {(() => {
                                    const isClientFixed = selectedProject && (selectedProject.company_profile?.company_name || selectedProject.client);

                                    if (isClientFixed) {
                                        // [고정 상태] - 기존 로직 유지
                                        // 선택된 프로젝트에 발주처가 원래부터 있었던 경우 -> 고정된 input으로 표시
                                        return (
                                            <div className="input-with-search">
                                                <input
                                                    type="text"
                                                    name="client"
                                                    value={formData.client}
                                                    className="project-input readonly-field"
                                                    readOnly
                                                />
                                                <button type="button" className="search-btn" title="발주처 정보 고정됨" disabled>
                                                    🔍
                                                </button>
                                            </div>
                                        );
                                    } else {
                                        // [활성화 상태] - ✨ 새로운 UI 로직 적용
                                        // 신규 작성이거나, 선택된 프로젝트에 발주처 정보가 없었던 모든 경우
                                        return (
                                            <div className="input-with-search">
                                                {/* 조건부 뱃지: 선택된 회사가 있으면 왼쪽에 뱃지로 표시 */}
                                                {formData.client && (
                                                    <button
                                                        type="button"
                                                        className="status-badge company-badge with-reset"
                                                        onClick={handleOpenCompanySearchModal}
                                                        title="발주처 변경"
                                                    >
                                                    {/* 발주처 이름 */}
                                                    <span className="badge-text">{formData.client}</span>

                                                    {/* 'x' 리셋 아이콘 */}
                                                    <span className="badge-reset-icon" onClick={handleResetClick} title="발주처 초기화">
                                                        ×
                                                    </span>
                                            </button>

                                        )}

                                                {/* 항상 보이는 검색 버튼: 우측 정렬되어 항상 표시 */}
                                                <button
                                                    type="button"
                                                    onClick={handleOpenCompanySearchModal}
                                                    className="search-btn"
                                                    title="발주처 검색"
                                                    style={{ marginLeft: 'auto' }} // 뱃지 유무와 관계없이 항상 오른쪽에 위치
                                                >
                                                    🔍
                                                </button>
                                            </div>
                                        );
                                    }
                                })()}
                            </td>

                            <td className="table-cell table-cell-label">담당자</td>
                            {/* [새로운 담당자 UI] */}
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    {/* 조건부 뱃지: 선택된 담당자가 있으면 왼쪽에 뱃지로 표시 */}
                                    {/*{formData.clientContactId && (*/}
                                    {/*    <button*/}
                                    {/*        type="button"*/}
                                    {/*        className="status-badge contact-badge"*/}
                                    {/*        onClick={handleOpenContactDetailModal}*/}
                                    {/*        title="담당자 상세 정보 보기"*/}
                                    {/*    >*/}
                                    {/*        {formData.manager}*/}
                                    {/*    </button>*/}
                                    {/*)}*/}
                                    {/* 💡 조건문을 selectedContact로 변경 */}
                                    {selectedContact && (
                                        <button
                                            type="button"
                                            className="status-badge contact-badge"
                                            onClick={handleOpenContactDetailModal}
                                            title="담당자 상세 정보 보기"
                                        >
                                            {formData.manager}
                                        </button>
                                    )}

                                    {/* 항상 보이는 검색 버튼: 우측 정렬되어 항상 표시 */}
                                    <button
                                        type="button"
                                        onClick={handleOpenContactSearchModal}
                                        className="search-btn"
                                        title="담당자 검색"
                                        style={{ marginLeft: 'auto' }} // 뱃지 유무와 관계없이 항상 오른쪽에 위치
                                    >
                                        🔍
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input"><input type="date" name="eventDate" value={formData.eventDate ? formData.eventDate.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; if (selectedDate) { const formattedDate = selectedDate.replace(/-/g, '.'); setFormData(prev => ({ ...prev, eventDate: formattedDate }));} else { setFormData(prev => ({ ...prev, eventDate: '' }));}}} className="project-date-input"/></td>
                            <td className="table-cell table-cell-label">행사장소</td>
                            <td className="table-cell-input"><input type="text" name="eventLocation" value={formData.eventLocation} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">참석대상</td>
                            <td className="table-cell-input"><input type="text" name="attendees" value={formData.attendees} onChange={handleInputChange} placeholder="VIP XX명, 약 XX명 예상" className="project-input"/></td>
                            <td className="table-cell table-cell-label">행사성격</td>
                            <td className="table-cell-input"><input type="text" name="eventNature" value={formData.eventNature} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">OT 일정</td>
                            <td className="table-cell-input"><input type="date" name="otSchedule" value={formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; if (selectedDate) { const formattedDate = selectedDate.replace(/-/g, '.'); setFormData(prev => ({ ...prev, otSchedule: formattedDate }));} else { setFormData(prev => ({ ...prev, otSchedule: '' }));}}} className="project-date-input"/></td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input"><input type="date" name="submissionSchedule" value={formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; if (selectedDate) { const formattedDate = selectedDate.replace(/-/g, '.'); setFormData(prev => ({ ...prev, submissionSchedule: formattedDate }));} else { setFormData(prev => ({ ...prev, submissionSchedule: '' }));}}} className="project-date-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">
                                예 산<br/>( 단위 : 천만원 )
                            </td>
                            <td className="table-cell-input"><input type="text" name="expectedRevenue" value={formData.expectedRevenue} onChange={handleInputChange} placeholder="XX.X [ 수익 X.X ]" className="project-input"/></td>
                            <td className="table-cell table-cell-label">예상 경쟁사</td>
                            <td className="table-cell-input"><input type="text" name="expectedCompetitors" value={formData.expectedCompetitors} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className="project-section">
                    <h3 className="section-header">■ 프로젝트 상세 정보</h3>
                    <table className="project-table">
                        <tbody>
                        <tr><td className="table-header">구분</td><td className="table-header">내용</td></tr>
                        <tr><td className="table-cell table-cell-label">목적 및 배경</td><td className="table-cell-input"><textarea name="purposeBackground" value={formData.purposeBackground} onChange={handleInputChange} className="project-textarea textarea-medium"/></td></tr>
                        {/*<tr><td className="table-cell table-cell-label">주요 내용</td><td className="table-cell-input"><textarea name="mainContent" value={formData.mainContent} onChange={handleBulletTextChange} placeholder="주요 과제, 행사 맥락, 주요 프로그램 등" className="project-textarea textarea-large bullet-textarea"/></td></tr>*/}
                        {/*<tr><td className="table-cell table-cell-label">핵심 요구사항</td><td className="table-cell-input"><textarea name="coreRequirements" value={formData.coreRequirements} onChange={handleBulletTextChange} placeholder="- 과업 제안범위, 제출금액, 운영 시 필수 고려사항등" className="project-textarea textarea-large bullet-textarea"/></td></tr>*/}
                        <tr><td className="table-cell table-cell-label">주요 내용<br/>및<br/>핵심 요구사항</td><td className="table-cell-input"><textarea name="mainContent" value={formData.mainContent} onChange={handleBulletTextChange} placeholder="- 주요 과제, 행사 맥락, 주요 프로그램 등&#10;- 과업 제안범위, 제출금액, 운영 시 필수 고려사항등&#10;- 프로젝트 추진 방향성&#10;- 내외부 리소스 활용방법" className="project-textarea textarea-large bullet-textarea"/></td></tr>
                        {/*<tr><td className="table-cell table-cell-label">핵심 요구사항</td><td className="table-cell-input"><textarea name="coreRequirements" value={formData.coreRequirements} onChange={handleBulletTextChange} placeholder="- 과업 제안범위, 제출금액, 운영 시 필수 고려사항등" className="project-textarea textarea-large bullet-textarea"/></td></tr>*/}
                        <tr><td className="table-cell table-cell-label">비 고</td><td className="table-cell-input"><textarea name="comparison" value={formData.comparison} onChange={handleInputChange} placeholder="- 특이사항 및 중요사항등 추가 기재" className="project-textarea textarea-medium"/></td></tr>
                        </tbody>
                    </table>
                </div>

                {/* 프로젝트 검토 (5x2 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 프로젝트 검토
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">SWOT 분석</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="swotAnalysis"
                                    value={formData.swotAnalysis}
                                    onChange={handleBulletTextChange}
                                    placeholder="- 강점: 독보적 경험과 노하우 활요, 높은 수주가능성&#10;- 약점: 내수율 저조&#10;- 기회: 매출달성에 기여, 차기 Proj 기약&#10;- 위험: 내정자에 따른 휴먼 리소스 소모"
                                    className="profile-textarea textarea-xlarge bullet-textarea"
                                />
                            </td>
                        </tr>
                        {/*<tr>*/}
                        {/*    <td className="table-cell table-cell-label blue-highlight-label">추진방향</td>*/}
                        {/*    <td className="table-cell-input">*/}
                        {/*        <textarea*/}
                        {/*            name="direction"*/}
                        {/*            value={formData.direction}*/}
                        {/*            onChange={handleBulletTextChange}*/}
                        {/*            placeholder="- 프로젝트 추진 방향성&#10;- 내외부 리소스 활용방법"*/}
                        {/*            className="profile-textarea textarea-large bullet-textarea"*/}
                        {/*        />*/}
                        {/*    </td>*/}
                        {/*</tr>*/}
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">리소스 활용방안</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="resourcePlan"
                                    value={formData.resourcePlan}
                                    onChange={handleBulletTextChange}
                                    placeholder="- 내부 전담조직 및 참여자 역량&#10;- 협업 조직: XX사 3D 디자인, 영상팀"
                                    className="profile-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">작성자 의견</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="writerOpinion"
                                    value={formData.writerOpinion}
                                    onChange={handleBulletTextChange}
                                    placeholder="- 프로젝트 진행여부 판단 의견 요약 ( 팀원들의 첨언 포함 )&#10;- 평가등급 기재 (A~C)&#10;      A : 프로젝트 추진&#10;      B : 재검토후 추진여부 결정&#10;      C : 추진 중지"
                                    className="profile-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">진행 부결 사유</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="proceedDecision"
                                    value={formData.proceedDecision}
                                    onChange={handleBulletTextChange}
                                    placeholder="부결 사유 기재"
                                    className="profile-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className="project-section">
                    <h3 className="section-header">■ 정보수집 추가 사항</h3>
                    <table className="project-table">
                        <tbody>
                        <tr><td className="table-header contact-date-header">날짜</td><td className="table-header">주요 내용</td></tr>
                        {formData.additionalInfo.map((info, index) => (
                            <tr key={index}>
                                <td className="table-cell contact-date-cell">{index === 0 && info.date === '2025.07.23' ? (<div className="contact-date">{info.date}</div>) : (<input type="date" value={info.date ? info.date.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; const formattedDate = selectedDate ? selectedDate.replace(/-/g, '.') : ''; handleAdditionalInfoChange(index, 'date', formattedDate);}} className="project-date-input"/>)}</td>
                                <td className="table-cell-input"><div className="info-content-container"><textarea value={info.content} onChange={(e) => handleAdditionalInfoChange(index, 'content', e.target.value)} placeholder="- 미팅 안건, 협의/논의 했던 내용등을 기재 &#10;- 프로젝트와 연계된 내용 위주로 작성 ( 개인정보, 개인성향 등 지양 )" className="project-textarea textarea-large bullet-textarea" style={{ whiteSpace: 'pre-line' }}/></div></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="button-section">
                    <button
                        onClick={handleSubmit}
                        className="submit-btn"
                        // 프로젝트명이 비어있으면 버튼을 비활성화합니다.
                        disabled={!formData.projectName.trim()}
                    >
                        저장
                    </button>
                </div>
            </div>

            {showSearchModal && (
                <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>프로젝트 검색</h3><button className="modal-close-btn" onClick={() => setShowSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {searchLoading ? (<div className="loading">검색 중...</div>) : (
                                <>
                                    <div className="search-results">{renderSearchResults()}</div>
                                    {totalPages > 1 && (
                                        <div className="pagination">
                                            <button disabled={currentPage === 1} onClick={() => { setCurrentPage(1); searchProjects(1);}}>처음</button>
                                            <button disabled={currentPage === 1} onClick={() => { const prevPage = currentPage - 1; setCurrentPage(prevPage); searchProjects(prevPage);}}>이전</button>
                                            <span className="page-info">{currentPage} / {totalPages}</span>
                                            <button disabled={currentPage === totalPages} onClick={() => { const nextPage = currentPage + 1; setCurrentPage(nextPage); searchProjects(nextPage);}}>다음</button>
                                            <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(totalPages); searchProjects(totalPages);}}>마지막</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            <WriterSearchModal />

            {/* [이 코드 블록을 return문의 최하단에 추가하세요] */}
            {showContactSearchModal && (
                <div className="modal-overlay" onClick={() => setShowContactSearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>담당자 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowContactSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* [새로운 검색 UI] */}
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                {/* 발주처 값에 따라 동적으로 텍스트를 표시하는 부분 */}
                                <div className="search-prefix">
                                    {formData.client ? `${formData.client} :` : '전체 고객사 :'}
                                </div>
                                <input
                                    type="text"
                                    value={contactSearchTerm}
                                    onChange={e => setContactSearchTerm(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleContactSearchAPI(); }}
                                    placeholder="담당자 이름 검색"
                                    className="project-input"
                                />
                                <button onClick={handleContactSearchAPI} className="search-btn" title="담당자 검색">
                                    🔍
                                </button>
                            </div>
                            {contactSearchLoading ? (
                                <div className="loading">검색 중...</div>
                            ) : (
                                <table className="search-table">
                                    <thead>
                                    <tr>
                                        <th>담당자명</th>
                                        <th>소속 회사</th>
                                        <th>선택</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {contactSearchResults.length > 0 ? (
                                        contactSearchResults.map(contact => (
                                            <tr key={contact.id}>
                                                <td>{contact.contact_name}</td>
                                                <td>{contact.company.company_name}</td>
                                                <td>
                                                    <button className="select-btn" onClick={() => selectContact(contact)}>선택</button>
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

            {/* [이 코드 블록을 return문의 최하단에 새로 추가하세요] */}
            {showContactDetailModal && contactDetailData && (
                <div className="modal-overlay" onClick={() => setShowContactDetailModal(false)}>
                    <div className="modal-content wide-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>담당자 상세 정보 (읽기 전용)</h3>
                            <button className="modal-close-btn" onClick={() => setShowContactDetailModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>담당자 상세정보</h4>
                                <p><strong>이름:</strong> {contactDetailData.contact_name}</p>
                                <p><strong>소속/부서:</strong> {contactDetailData.department || '-'}</p>
                                <p><strong>직급:</strong> {contactDetailData.position || '-'}</p>
                            </div>
                            <div className="detail-section">
                                <h4>컨택 리포트</h4>
                                <div className="report-list">
                                    {contactDetailData.reports && contactDetailData.reports.length > 0 ? (
                                        contactDetailData.reports.map((report, index) => (
                                            <div key={index} className="report-item">
                                                <strong>{report.contact_date}:</strong> {report.content}
                                            </div>
                                        ))
                                    ) : ( <p>내역 없음</p> )}
                                </div>
                            </div>
                            <div className="detail-section">
                                <h4>회사정보</h4>
                                <p><strong>회사명:</strong> {contactDetailData.company.company_name}</p>
                                <p><strong>주소:</strong> {contactDetailData.company.address || '정보 없음'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* [이 코드 블록을 return문의 최하단에 새로 추가하세요] */}
            {showCompanySearchModal && (
                <div className="modal-overlay" onClick={() => setShowCompanySearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>발주처 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowCompanySearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* 검색 UI는 담당자 검색과 유사하지만, searchCompaniesAPI를 호출합니다. */}
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    defaultValue={formData.client} // 현재 발주처 이름을 기본값으로
                                    onKeyDown={e => { if (e.key === 'Enter') searchCompaniesAPI((e.target as HTMLInputElement).value); }}
                                    placeholder="회사 이름으로 검색"
                                    className="project-input"
                                />
                                <button onClick={() => {
                                    const input = document.querySelector('.modal-body .project-input') as HTMLInputElement;
                                    if (input) searchCompaniesAPI(input.value);
                                }} className="search-btn" style={{ padding: '0 12px' }}>
                                    🔍
                                </button>
                            </div>
                            {companySearchLoading ? (
                                <div className="loading">검색 중...</div>
                            ) : (
                                <table className="search-table">
                                    <thead>
                                    <tr>
                                        <th>회사명</th>
                                        <th>대표자</th>
                                        <th>사업자번호</th>
                                        <th>선택</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {companySearchResults.length > 0 ? (
                                        companySearchResults.map(company => (
                                            <tr key={company.id}>
                                                <td>{company.company_name}</td>
                                                <td>{company.representative || '-'}</td>
                                                <td>{company.business_number || '-'}</td>
                                                <td>
                                                    <button className="select-btn" onClick={() => selectCompany(company)}>선택</button>
                                                </td>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectInformationForm;