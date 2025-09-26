import React, { useState, useEffect, useRef } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import apiClient from '../../api/utils/apiClient';
import '../../styles/ProjectInformation.css';

// === 기존 인터페이스들 그대로 유지 ===
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
    contacts: CompanyContactData[];
}

/** [API 응답용] API로부터 받는 프로젝트의 최종 데이터 구조입니다. */
interface ProjectData {
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
    swotAnalysis: string;
    resourcePlan: string;
    writerOpinion: string;
    proceedDecision: string;
    revenueScore: number | '';
    feasibilityScore: number | '';
    rfpReviewScore: number | '';
    futureValueScore: number | '';
    relationshipScore: number | '';
}

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

// === 평가 관련 인터페이스 추가 (UI 변경 없음) ===
interface ProjectEvaluationCriteria {
    id: number;
    category: string;
    category_name: string;
    description: string;
    max_score: number;
    sort_order: number;
}

interface ProjectEvaluationScore {
    criteria_id: number;
    score: number;
    notes?: string;
}

const ProjectInformationForm: React.FC = () => {
    // === 기존 상태들 모두 그대로 유지 ===
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
        additionalInfo: [{ date: '', content: '' }],
        swotAnalysis: '',
        resourcePlan: '',
        writerOpinion: '',
        proceedDecision: '',
        revenueScore: 0,
        feasibilityScore: 0,
        rfpReviewScore: 0,
        futureValueScore: 0,
        relationshipScore: 0,
    });
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [writerSearchModal, setWriterSearchModal] = useState(false);
    const [writerSearchResults, setWriterSearchResults] = useState<WriterInfo[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [lastUpdater, setLastUpdater] = useState<WriterInfo | null>(null);
    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);
    const [showContactDetailModal, setShowContactDetailModal] = useState(false);
    const [contactDetailData, setContactDetailData] = useState<ContactDetailData | null>(null);
    const [showCompanySearchModal, setShowCompanySearchModal] = useState(false);
    const [companySearchResults, setCompanySearchResults] = useState<CompanyData[]>([]);
    const [companySearchLoading, setCompanySearchLoading] = useState(false);
    const [saveMode, setSaveMode] = useState<'insert' | 'update'>('insert');
    const [clientCompanyContacts, setClientCompanyContacts] = useState<CompanyContactData[]>([]);
    const [selectedContact, setSelectedContact] = useState<CompanyContactData | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfileData | null>(null);
    const [showChecklist, setShowChecklist] = useState(false);
    const [checklistTotalScore, setChecklistTotalScore] = useState<number | null>(null);
    const [checklistGrade, setChecklistGrade] = useState<string>('');
    const revenueScoreRef = useRef<HTMLInputElement>(null);
    const feasibilityScoreRef = useRef<HTMLInputElement>(null);
    const futureValueScoreRef = useRef<HTMLInputElement>(null);
    const relationshipScoreRef = useRef<HTMLInputElement>(null);
    const scoreRefMap = { revenueScore: revenueScoreRef, feasibilityScore: feasibilityScoreRef, futureValueScore: futureValueScoreRef, relationshipScore: relationshipScoreRef };

    // === 평가 관련 상태 추가 (내부 로직용) ===
    const [evaluationCriteria, setEvaluationCriteria] = useState<ProjectEvaluationCriteria[]>([]);
    const [evaluationScores, setEvaluationScores] = useState<{ [key: number]: number }>({});

    // === 기존 useEffect들 그대로 유지 ===
    useEffect(() => {
        if (formData.projectName === '') {
            setSelectedProject(null);
            setLastUpdater(null);
            setClientCompanyContacts([]);
            setSelectedContact(null);
            setSaveMode('insert');
            setFormData(prev => ({ ...prev, client: '', manager: '' }));
        }
    }, [formData.projectName]);

    useEffect(() => {
        const { revenueScore, feasibilityScore, futureValueScore, relationshipScore } = formData;
        const revenue = Number(revenueScore) || 0;
        const feasibility = Number(feasibilityScore) || 0;
        const futureValue = Number(futureValueScore) || 0;
        const relationship = Number(relationshipScore) || 0;
        const total = revenue + feasibility + futureValue + relationship;
        setChecklistTotalScore(total);
        if (total <= 70) setChecklistGrade('C');
        else if (total <= 80) setChecklistGrade('B');
        else setChecklistGrade('A');
    }, [formData.revenueScore, formData.feasibilityScore, formData.futureValueScore, formData.relationshipScore]);

    // === 평가 관련 useEffect 추가 ===
    useEffect(() => {
        loadEvaluationCriteria();
    }, []);

    // === 평가 관련 함수들 추가 (UI 변경 없음, 내부 로직만) ===
    const loadEvaluationCriteria = async () => {
        try {
            const response = await apiClient.get('/api/projects/evaluation/criteria');
            setEvaluationCriteria(response.data || []);
        } catch (error) {
            console.error('평가 기준 로드 실패:', error);
        }
    };

    const loadProjectEvaluation = async (projectId: number) => {
        try {
            const response = await apiClient.get(`/api/projects/${projectId}/evaluation`);
            if (response.data && response.data.scores) {
                const scoresMap: { [key: number]: number } = {};
                response.data.scores.forEach((score: ProjectEvaluationScore) => {
                    scoresMap[score.criteria_id] = score.score;
                });
                setEvaluationScores(scoresMap);
            }
        } catch (error) {
            console.error('프로젝트 평가 데이터 로드 실패:', error);
        }
    };

    const saveEvaluation = async () => {
        if (!selectedProject?.project_id) {
            return;
        }

        try {
            const scores = evaluationCriteria.map(criteria => ({
                criteria_id: criteria.id,
                score: evaluationScores[criteria.id] || 0
            }));

            await apiClient.post(`/api/projects/${selectedProject.project_id}/evaluation`, {
                project_id: selectedProject.project_id,
                scores: scores
            });
        } catch (error) {
            console.error('평가 저장 실패:', error);
        }
    };

    // === 기존 함수들 그대로 유지하되, selectProject에 평가 로드 추가 ===
    const handleProjectSearch = async () => {
        setShowSearchModal(true);
        setCurrentPage(1);
        await searchProjects(1);
    };

    const searchProjects = async (page: number) => {
        try {
            setSearchLoading(true);
            const params = {
                skip: (page - 1) * 10,
                limit: 10,
                search: formData.projectName || ''
            };
            const listResponse = await apiClient.get('/projects/', { params });
            const countResponse = await apiClient.get('/projects/count', { params });
            setSearchResults(listResponse.data);
            setTotalPages(Math.ceil(countResponse.data.total_count / 10));
        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error('검색 오류:', errorMessage);
            alert(`검색 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setSearchLoading(false);
        }
    };

    const selectProject = async (project: ProjectData) => {
        try {
            const response = await apiClient.get(`/projects/${project.project_id}`);
            const detailedProject: ProjectData = response.data;
            const reportsData = detailedProject.reports?.map(report => ({
                date: report.report_date,
                content: report.content || ''
            })) || [];
            const lastReport = reportsData[reportsData.length - 1];
            if (reportsData.length === 0 || (lastReport && (lastReport.date || lastReport.content))) {
                reportsData.push({ date: '', content: '' });
            }
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
                additionalInfo: reportsData
            }));
            setLastUpdater(detailedProject.updater_info || detailedProject.writer_info || null);
            setClientCompanyContacts(detailedProject.company_profile?.contacts || []);
            setSelectedContact(detailedProject.selected_contact || null);
            setSelectedProject(detailedProject);
            setSaveMode('update');
            setShowSearchModal(false);

            // === 평가 데이터 로드 추가 ===
            loadProjectEvaluation(detailedProject.project_id);
        } catch (error) {
            handleApiError(error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.projectName.trim()) {
            alert('프로젝트명을 입력해주세요.');
            return;
        }
        let action = saveMode;
        if (action === 'update' && selectedProject && formData.projectName !== selectedProject.project_name) {
            if (!window.confirm('프로젝트명이 변경되었습니다.\n\n- "확인": 현재 프로젝트를 수정합니다.\n- "취소": 새 프로젝트로 생성합니다.')) {
                action = 'insert';
            }
        }
        const currentUser = { id: 1, name: "테스트유저" };
        const apiData = {
            project_name: formData.projectName,
            inflow_path: formData.inflowPath,
            client: formData.client,
            client_manager_name: formData.manager,
            business_type: formData.eventNature,
            expected_competitors: formData.expectedCompetitors,
            event_location: formData.eventLocation,
            attendees: formData.attendees,
            contract_amount: parseFloat(formData.expectedRevenue) || null,
            project_overview: formData.purposeBackground,
            project_scope: formData.mainContent,
            deliverables: formData.comparison,
            special_requirements: formData.coreRequirements,
            project_period_start: formData.eventDate ? formData.eventDate.replace(/\./g, '-') : null,
            project_period_end: formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : null,
            ot_schedule: formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : null,
            company_id: selectedCompany?.id,
            client_contact_id: selectedContact?.id,
            writer_emp_id: selectedProject?.writer_info?.emp_id || currentUser.id,
            writer_name: lastUpdater?.name || currentUser.name,
            reports: formData.additionalInfo.filter(info => info.date || info.content).map(info => ({
                report_date: info.date ? info.date.replace(/\./g, '-') : null,
                content: info.content
            }))
        };
        try {
            let result;
            if (action === 'update' && selectedProject) {
                const response = await apiClient.put(`/projects/${selectedProject.project_id}`, apiData);
                result = response.data;
            } else {
                const response = await apiClient.post('/projects/', apiData);
                result = response.data;
            }
            alert(`프로젝트가 성공적으로 ${action === 'update' ? '수정' : '생성'}되었습니다!`);
            setSaveMode('update');
            setSelectedProject(result);
            setLastUpdater(result.updater_info || result.writer_info || null);
            setClientCompanyContacts(result.company_profile?.contacts || []);
            setSelectedContact(result.selected_contact || null);

            // === 평가 저장 추가 ===
            if (evaluationCriteria.length > 0 && Object.keys(evaluationScores).length > 0) {
                await saveEvaluation();
            }
        } catch (error) {
            handleApiError(error);
        }
    };

    // === 나머지 모든 기존 함수들 그대로 유지 ===
    const searchWriters = async (searchTerm: string) => {
        try {
            const response = await apiClient.get('/hr/', { params: { search: searchTerm, limit: 20 } });
            setWriterSearchResults(response.data);
        } catch (error) {
            console.error('작성자 검색 오류:', error);
        }
    };

    const searchContacts = async (searchTerm: string) => {
        setContactSearchLoading(true);
        try {
            const response = await apiClient.get('/company-profile/contacts/search', { params: { search: searchTerm } });
            let results: ContactSearchData[] = response.data;
            if (formData.client) {
                results = results.filter(contact => contact.company.company_name === formData.client);
            }
            setContactSearchResults(results);
        } catch (error) {
            handleApiError(error);
        } finally {
            setContactSearchLoading(false);
        }
    };

    const handleOpenContactDetailModal = async () => {
        if (!selectedContact?.id) return;
        setShowContactDetailModal(true);
        try {
            const response = await apiClient.get(`/company-contacts/${selectedContact.id}/details`);
            setContactDetailData(response.data);
        } catch (error) {
            alert(handleApiError(error));
            setShowContactDetailModal(false);
        }
    };

    const searchCompaniesAPI = async (searchTerm: string) => {
        setCompanySearchLoading(true);
        try {
            const response = await apiClient.get('/company-profile/', { params: { search: searchTerm } });
            setCompanySearchResults(response.data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setCompanySearchLoading(false);
        }
    };

    const selectCompany = async (company: CompanyData) => {
        try {
            const response = await apiClient.get(`/company-profile/${company.id}`);
            const detailedCompany: CompanyProfileData = response.data;
            setSelectedCompany(detailedCompany);
            setClientCompanyContacts(detailedCompany.contacts || []);
            setSelectedContact(null);
            setFormData(prev => ({ ...prev, client: detailedCompany.company_name, manager: '' }));
            setShowCompanySearchModal(false);
        } catch (error) {
            handleApiError(error);
        }
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

    const handleAdditionalInfoChange = (index: number, field: 'date' | 'content', value: string) => {
        const updatedInfo = [...formData.additionalInfo];
        updatedInfo[index][field] = value;

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

    const addNewAdditionalInfo = () => {
        setFormData(prev => ({
            ...prev,
            additionalInfo: [...prev.additionalInfo, { date: '', content: '' }]
        }));
    };

    const removeAdditionalInfo = (index: number) => {
        if (formData.additionalInfo.length <= 1) {
            setFormData(prev => ({
                ...prev,
                additionalInfo: [{ date: '', content: '' }]
            }));
            return;
        }
        const updatedInfo = formData.additionalInfo.filter((_, i) => i !== index);
        const lastItem = updatedInfo[updatedInfo.length - 1];
        if (updatedInfo.length === 0 || (lastItem && lastItem.date && lastItem.content)) {
            updatedInfo.push({ date: '', content: '' });
        }
        setFormData(prev => ({
            ...prev,
            additionalInfo: updatedInfo
        }));
    };

    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePrint = () => { window.print(); };

    const selectWriter = (writer: any) => {
        const writerNameInput = document.querySelector('input[name="writerName"]') as HTMLInputElement;
        const writerDeptInput = document.querySelector('input[name="writerDepartment"]') as HTMLInputElement;
        if (writerNameInput) { writerNameInput.value = writer.emp_name; writerNameInput.readOnly = false; writerNameInput.className = 'writer-field-input'; }
        if (writerDeptInput) { writerDeptInput.value = writer.division || ''; writerDeptInput.readOnly = false; writerDeptInput.className = 'writer-field-input'; }
        setWriterSearchModal(false);
    };

    const handleOpenContactSearchModal = () => {
        setContactSearchTerm('');
        setContactSearchResults([]);
        setShowContactSearchModal(true);
        searchContacts('');
    };

    const handleContactSearchAPI = async () => {
        await searchContacts(contactSearchTerm);
    };

    const selectContact = (contact: ContactSearchData) => {
        setSelectedCompany({
            id: contact.company.id,
            company_name: contact.company.company_name,
            contacts: [],
        });
        setSelectedContact({
            id: contact.id,
            contact_name: contact.contact_name,
            is_primary: false,
        });
        setFormData(prev => ({
            ...prev,
            client: contact.company.company_name,
            manager: contact.contact_name,
        }));
        setShowContactSearchModal(false);
    };

    const handleOpenCompanySearchModal = async () => {
        setShowCompanySearchModal(true);
        await searchCompaniesAPI(formData.client);
    };

    const resetClientAndContact = () => {
        setSelectedCompany(null);
        setSelectedContact(null);
        setClientCompanyContacts([]);
        setFormData(prev => ({ ...prev, client: '', manager: '' }));
    };

    const handleResetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        resetClientAndContact();
    };

    const handleChecklistScoreChange = (scoreField: string, value: string, maxScore: number) => {
        const numValue = value === '' ? '' : Number(value);
        if (numValue !== '' && (numValue > maxScore || numValue < 0)) {
            alert(`점수는 0과 배점(${maxScore}점) 사이여야 합니다.`);
            return;
        }
        setFormData(prev => ({ ...prev, [scoreField]: numValue }));
    };

    const handleScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextField: string | null) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextField && scoreRefMap[nextField as keyof typeof scoreRefMap]) {
                scoreRefMap[nextField as keyof typeof scoreRefMap].current?.focus();
            } else {
                (e.target as HTMLInputElement).blur();
            }
        }
    };

    const renderSearchResults = () => {
        if (searchLoading) return <div className="loading">검색 중...</div>;
        if (searchResults.length === 0) return <div className="no-results">검색 결과가 없습니다.</div>;
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
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {project.writer_info?.name || '-'}
                            {project.writer_info?.position && (<small style={{ display: 'block', color: '#666' }}>{project.writer_info.position}</small>)}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.writer_info?.department || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(project.created_at).toLocaleDateString('ko-KR')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}><button className="select-btn" onClick={() => selectProject(project)}>선택</button></td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    const WriterSearchModal: React.FC = () => {
        const [searchTerm, setSearchTerm] = useState('');
        return writerSearchModal ? (
            <div className="modal-overlay" onClick={() => setWriterSearchModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>직원 검색</h3><button onClick={() => setWriterSearchModal(false)}>×</button></div>
                    <div className="modal-body">
                        <div className="search-input-container"><input type="text" placeholder="이름 또는 이메일 입력 시 자동검색 (1글자 이상)" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value.length >= 1) { searchWriters(e.target.value); }}}/></div>
                        <div className="search-results">{writerSearchResults.map((writer: any) => (<div key={writer.emp_id} className="writer-result-item" onClick={() => selectWriter(writer)}><div><strong>{writer.emp_name || writer.name}</strong><div style={{ fontSize: '12px', color: '#676' }}>{writer.division || writer.department} {writer.position && `· ${writer.position}`}</div></div><div style={{ fontSize: '12px', color: '#666' }}>{writer.email}</div></div>))}</div>
                    </div>
                </div>
            </div>
        ) : null;
    };

    // === 원본 JSX 렌더링 그대로 유지 ===
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
                            <div>최종 작성자 : {lastUpdater?.name || '정보 없음'}</div>
                        </div>
                    </div>
                </div>
                <div className="project-section">
                    <h3 className="section-header">■ 프로젝트 기본 정보</h3>
                    <table className="project-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
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
                            <td className="table-cell-input">
                                {(() => {
                                    const isClientFixed = selectedProject && (selectedProject.company_profile?.company_name || selectedProject.client);
                                    if (isClientFixed) {
                                        return (
                                            <div className="input-with-search">
                                                <input type="text" name="client" value={formData.client} className="project-input readonly-field" readOnly />
                                                <button type="button" className="search-btn" title="발주처 정보 고정됨" disabled>🔍</button>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="input-with-search">
                                                {formData.client && (
                                                    <button type="button" className="status-badge company-badge with-reset" onClick={handleOpenCompanySearchModal} title="발주처 변경">
                                                        <span className="badge-text">{formData.client}</span>
                                                        <span className="badge-reset-icon" onClick={handleResetClick} title="발주처 초기화">×</span>
                                                    </button>
                                                )}
                                                <button type="button" onClick={handleOpenCompanySearchModal} className="search-btn" title="발주처 검색" style={{ marginLeft: 'auto' }}>🔍</button>
                                            </div>
                                        );
                                    }
                                })()}
                            </td>
                            <td className="table-cell table-cell-label">담당자</td>
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    {selectedContact && (
                                        <button type="button" className="status-badge contact-badge" onClick={handleOpenContactDetailModal} title="담당자 상세 정보 보기">
                                            {formData.manager}
                                        </button>
                                    )}
                                    <button type="button" onClick={handleOpenContactSearchModal} className="search-btn" title="담당자 검색" style={{ marginLeft: 'auto' }}>🔍</button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input"><input type="date" name="eventDate" value={formData.eventDate ? formData.eventDate.replace(/\./g, '-') : ''} onChange={(e) => setFormData(prev => ({...prev, eventDate: e.target.value.replace(/-/g,'.')}))} className="project-date-input"/></td>
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
                            <td className="table-cell-input"><input type="date" name="otSchedule" value={formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : ''} onChange={(e) => setFormData(prev => ({...prev, otSchedule: e.target.value.replace(/-/g,'.')}))} className="project-date-input"/></td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input"><input type="date" name="submissionSchedule" value={formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : ''} onChange={(e) => setFormData(prev => ({...prev, submissionSchedule: e.target.value.replace(/-/g,'.')}))} className="project-date-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">예 산<br/>( 단위 : 천만원 )</td>
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
                        <tr><td className="table-cell table-cell-label">주요 내용<br/>및<br/>핵심 요구사항</td><td className="table-cell-input"><textarea name="mainContent" value={formData.mainContent} onChange={handleBulletTextChange} placeholder="- 주요 과제, 행사 맥락, 주요 프로그램 등&#10;- 과업 제안범위, 제출금액, 운영 시 필수 고려사항등&#10;- 프로젝트 추진 방향성&#10;- 내외부 리소스 활용방법" className="project-textarea textarea-large bullet-textarea"/></td></tr>
                        <tr><td className="table-cell table-cell-label">비 고</td><td className="table-cell-input"><textarea name="comparison" value={formData.comparison} onChange={handleInputChange} placeholder="- 특이사항 및 중요사항등 추가 기재" className="project-textarea textarea-medium"/></td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="profile-section">
                    <h3 className="section-header">■ 프로젝트 검토</h3>
                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header" colSpan={4}>내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">SWOT 분석</td>
                            <td className="table-cell-input" colSpan={4}>
                                <textarea name="swotAnalysis" value={formData.swotAnalysis} onChange={handleBulletTextChange} placeholder="- 강점: 독보적 경험과 노하우 활요, 높은 수주가능성&#10;- 약점: 내수율 저조&#10;- 기회: 매출달성에 기여, 차기 Proj 기약&#10;- 위험: 내정자에 따른 휴먼 리소스 소모" className="profile-textarea textarea-xlarge bullet-textarea" />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">리소스 활용방안</td>
                            <td className="table-cell-input" colSpan={4}>
                                <textarea name="resourcePlan" value={formData.resourcePlan} onChange={handleBulletTextChange} placeholder="- 내부 전담조직 및 참여자 역량&#10;- 협업 조직: XX사 3D 디자인, 영상팀" className="profile-textarea textarea-large bullet-textarea" />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">작성자 의견</td>
                            <td className="table-cell-input" colSpan={4}>
                                <div className="inner-checklist-container">
                                    <table className="inner-checklist-table">
                                        <thead>
                                        <tr>
                                            <th className="inner-table-header">구분</th>
                                            <th className="inner-table-header">내용</th>
                                            <th className="inner-table-header">배점</th>
                                            <th className="inner-table-header">점수</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">매출액 및 이익</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 예상 매출규모의 충분성<br/>• 예상 수익률의 적정성</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">50</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={revenueScoreRef} type="number" min="0" max="50" name="revenueScore" value={formData.revenueScore} onChange={(e) => handleChecklistScoreChange('revenueScore', e.target.value, 50)} onKeyDown={(e) => handleScoreKeyDown(e, 'feasibilityScore')} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">실행가능성</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 수주가능성 : 유착관계, 당사 리스크 등<br/>• 당사 동원 인력의 역량 및 활용상황<br/>• 참여조건, 심사기준 등의 적합성<br/>• 당사 단독 준비 가능여부, 협업 필요성등<br/>• 수주 가능성 분석 : 유착관계, 당사 리스크 등</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">30</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={feasibilityScoreRef} type="number" min="0" max="30" name="feasibilityScore" value={formData.feasibilityScore} onChange={(e) => handleChecklistScoreChange('feasibilityScore', e.target.value, 30)} onKeyDown={(e) => handleScoreKeyDown(e, 'futureValueScore')} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">미래가치성</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 클라이언트 브랜드 시장가치<br/>• 향후 반복수주의 가능성</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">10</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={futureValueScoreRef} type="number" min="0" max="10" name="futureValueScore" value={formData.futureValueScore} onChange={(e) => handleChecklistScoreChange('futureValueScore', e.target.value, 10)} onKeyDown={(e) => handleScoreKeyDown(e, 'relationshipScore')} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">관계성</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 이전 년도 프로젝트 정보 수집<br/>• 최근 2년간 클라이언트와의 관계성<br/>• 당사와의 관계성</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">10</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={relationshipScoreRef} type="number" min="0" max="10" name="relationshipScore" value={formData.relationshipScore} onChange={(e) => handleChecklistScoreChange('relationshipScore', e.target.value, 10)} onKeyDown={(e) => handleScoreKeyDown(e, null)} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr className="total-row">
                                            <td className="inner-table-cell inner-table-cell-merged" colSpan={2}>총점</td>
                                            <td className="inner-table-cell inner-table-cell-weight">100</td>
                                            <td className="inner-table-cell inner-table-cell-total">{checklistTotalScore !== null ? checklistTotalScore : '-'}</td>
                                        </tr>
                                        <tr className="grade-row">
                                            <td className="inner-table-cell inner-table-cell-merged" colSpan={2}>종합 등급&emsp;&emsp;(&emsp;&emsp;C:0~70&emsp;&emsp;&emsp;B:71~80&emsp;&emsp;&emsp;A:81~100&emsp;&emsp;)</td>
                                            <td className="inner-table-cell inner-table-cell-dash">-</td>
                                            <td className="inner-table-cell inner-table-cell-grade">{checklistGrade ? (<span className={`grade-badge grade-${checklistGrade.toLowerCase()}`}>{checklistGrade}</span>) : '-'}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <br/>
                                <div><textarea name="writerOpinion" value={formData.writerOpinion} onChange={handleBulletTextChange} placeholder="- 프로젝트 진행여부 판단 의견 요약 ( 팀원들의 첨언 포함 )&#10;- 평가등급 기재 (A~C)&#10;      A : 프로젝트 추진&#10;      B : 재검토후 추진여부 결정&#10;      C : 추진 중지" className="profile-textarea textarea-large bullet-textarea" /></div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">진행 부결 사유</td>
                            <td className="table-cell-input" colSpan={4}>
                                <textarea name="proceedDecision" value={formData.proceedDecision} onChange={handleBulletTextChange} placeholder="부결 사유 기재" className="profile-textarea textarea-large bullet-textarea" />
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
                    <button onClick={handleSubmit} className="submit-btn" disabled={!formData.projectName.trim()}>저장</button>
                </div>
            </div>

            {/* === 모든 기존 모달들 그대로 유지 === */}
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
            {showContactSearchModal && (
                <div className="modal-overlay" onClick={() => setShowContactSearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>담당자 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowContactSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                <div className="search-prefix">{formData.client ? `${formData.client} :` : '전체 고객사 :'}</div>
                                <input type="text" value={contactSearchTerm} onChange={e => setContactSearchTerm(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleContactSearchAPI(); }} placeholder="담당자 이름 검색" className="project-input" />
                                <button onClick={handleContactSearchAPI} className="search-btn" title="담당자 검색">🔍</button>
                            </div>
                            {contactSearchLoading ? (
                                <div className="loading">검색 중...</div>
                            ) : (
                                <table className="search-table">
                                    <thead><tr><th>담당자명</th><th>소속 회사</th><th>선택</th></tr></thead>
                                    <tbody>
                                    {contactSearchResults.length > 0 ? (
                                        contactSearchResults.map(contact => (
                                            <tr key={contact.id}>
                                                <td>{contact.contact_name}</td>
                                                <td>{contact.company.company_name}</td>
                                                <td><button className="select-btn" onClick={() => selectContact(contact)}>선택</button></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="no-results">검색 결과가 없습니다.</td></tr>
                                    )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
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
                                            <div key={index} className="report-item"><strong>{report.contact_date}:</strong> {report.content}</div>
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
            {showCompanySearchModal && (
                <div className="modal-overlay" onClick={() => setShowCompanySearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>발주처 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowCompanySearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                <input type="text" defaultValue={formData.client} onKeyDown={e => { if (e.key === 'Enter') searchCompaniesAPI((e.target as HTMLInputElement).value); }} placeholder="회사 이름으로 검색" className="project-input" />
                                <button onClick={() => { const input = document.querySelector('.modal-body .project-input') as HTMLInputElement; if (input) searchCompaniesAPI(input.value); }} className="search-btn" style={{ padding: '0 12px' }}>🔍</button>
                            </div>
                            {companySearchLoading ? (
                                <div className="loading">검색 중...</div>
                            ) : (
                                <table className="search-table">
                                    <thead><tr><th>회사명</th><th>대표자</th><th>사업자번호</th><th>선택</th></tr></thead>
                                    <tbody>
                                    {companySearchResults.length > 0 ? (
                                        companySearchResults.map(company => (
                                            <tr key={company.id}>
                                                <td>{company.company_name}</td>
                                                <td>{company.representative || '-'}</td>
                                                <td>{company.business_number || '-'}</td>
                                                <td><button className="select-btn" onClick={() => selectCompany(company)}>선택</button></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} className="no-results">검색 결과가 없습니다.</td></tr>
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