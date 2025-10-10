import React, { useState, useEffect } from 'react';
import { ProjectBasicInfo, ProjectData, WriterInfo, CompanyContactData, CompanyProfileData, ExtendedProjectData } from '../../types/project';
import { handleApiError } from '../../api/utils/errorUtils';
import apiClient from '../../api/utils/apiClient';
import '../../styles/ProjectBasicInfoForm.css';

interface CompanyData {
    id: number;
    company_name: string;
    representative?: string;
    business_number?: string;
}

interface ContactSearchData {
    id: number;
    contact_name: string;
    company: {
        id: number;
        company_name: string;
    };
}

interface ProjectReview {
    swotAnalysis?: string;
    resourcePlan?: string;
    writerOpinion?: string;
    proceedDecision?: string; // 진행/부결 사유
}

interface KickoffReport {
    department: string;
    presenter: string;
    personnel: string;
    collaboration: string;
    plannedExpense: string;
    progressSchedule: string;
    riskFactors: string;
    nextReport: string;
}

interface PTPostmortem {
    ptReview: string;
    ptResult: string;
    reason: string;
    directionConcept: string;
    program: string;
    operation: string;   // 연출
    quotation: string;   // 견적
    managerOpinion: string;
}


type ExternalSearchHandlerResult = 'handled' | 'skip' | void;
type ExternalSearchHandler = () => ExternalSearchHandlerResult | Promise<ExternalSearchHandlerResult>;

interface ProjectBasicInfoFormProps {
    formData: ExtendedProjectData;
    onChange?: (name: keyof ExtendedProjectData, value: string) => void;
    includeDataSections?: string[];
    onProjectSelect?: (project: ProjectData) => void;
    onCompanySelect?: (company: CompanyProfileData) => void;
    onContactSelect?: (contact: CompanyContactData) => void;
    onProjectSearch?: ExternalSearchHandler;
    onCompanySearch?: ExternalSearchHandler;
    onContactSearch?: ExternalSearchHandler;
    useInternalSearchFallback?: boolean;
    showSearch?: boolean;
    readOnly?: boolean;
    className?: string;
    tableClassName?: string;
    inputClassName?: string;

    // 새로 추가된 옵션들
    showDetailSection?: boolean;
    enableDetailSectionToggle?: boolean;
    onDetailSectionChange?: (visible: boolean) => void;
    detailSectionCollapsible?: boolean;
    detailSectionAnimationDuration?: number;

    // ===== 여기부터 추가된 Props =====
    // 프로젝트 검토 Section
    showReviewSection?: boolean;
    enableReviewSectionToggle?: boolean;
    onReviewSectionChange?: (visible: boolean) => void;

    // Project Kickoff Section
    showKickoffSection?: boolean;
    enableKickoffSectionToggle?: boolean;
    onKickoffSectionChange?: (visible: boolean) => void;

    // PT Postmortem Section
    showPTPostmortemSection?: boolean;
    enablePTPostmortemSectionToggle?: boolean;
    onPTPostmortemSectionChange?: (visible: boolean) => void;

    // Project Postmortem Section
    showProjectPostmortemSection?: boolean;
    enableProjectPostmortemSectionToggle?: boolean;
    onProjectPostmortemSectionChange?: (visible: boolean) => void;
    // ===== 추가된 Props 끝 =====

    // 프로젝트 선택 시 ID만 전달
    onProjectIdSelected?: (projectId: number) => void;
}

const ProjectBasicInfoForm: React.FC<ProjectBasicInfoFormProps> = ({
                                                                       formData,
                                                                       onChange,
                                                                       onProjectSelect,
                                                                       onCompanySelect,
                                                                       onContactSelect,
                                                                       onProjectSearch,
                                                                       onCompanySearch,
                                                                       onContactSearch,
                                                                       includeDataSections = ['basic', 'detail'],
                                                                       showSearch = true,
                                                                       readOnly = false,
                                                                       className = "project-section",
                                                                       tableClassName = "project-table",
                                                                       inputClassName = "project-input",

                                                                       // 새로운 옵션들
                                                                       showDetailSection: showDetailSectionProp = false,
                                                                       enableDetailSectionToggle = true,
                                                                       onDetailSectionChange,
                                                                       detailSectionCollapsible = true,
                                                                       detailSectionAnimationDuration = 1000,

                                                                       // ===== 여기부터 추가된 Props destructuring =====
                                                                       showReviewSection: showReviewSectionProp = false,
                                                                       enableReviewSectionToggle = false,
                                                                       onReviewSectionChange,

                                                                       showKickoffSection: showKickoffSectionProp = false,
                                                                       enableKickoffSectionToggle = false,
                                                                       onKickoffSectionChange,

                                                                       showPTPostmortemSection: showPTPostmortemSectionProp = false,
                                                                       enablePTPostmortemSectionToggle = false,
                                                                       onPTPostmortemSectionChange,

                                                                       showProjectPostmortemSection: showProjectPostmortemSectionProp = false,
                                                                       enableProjectPostmortemSectionToggle = false,
                                                                       onProjectPostmortemSectionChange,
                                                                       // ===== 추가된 Props destructuring 끝 =====

                                                                       // 프로젝트 ID 전달 콜백
                                                                       onProjectIdSelected,
                                                                   }) => {
    const [internalFormData, setInternalFormData] = useState<ExtendedProjectData>(formData);
    const [internalShowDetailSection, setInternalShowDetailSection] = useState<boolean>(showDetailSectionProp);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [showCompanySearchModal, setShowCompanySearchModal] = useState(false);
    const [companySearchLoading, setCompanySearchLoading] = useState(false);
    const [companySearchResults, setCompanySearchResults] = useState<CompanyData[]>([]);
    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);

    // ===== 여기부터 추가된 State =====
    const [internalShowReviewSection, setInternalShowReviewSection] = useState<boolean>(showReviewSectionProp);
    const [internalShowKickoffSection, setInternalShowKickoffSection] = useState<boolean>(showKickoffSectionProp);
    const [internalShowPTPostmortemSection, setInternalShowPTPostmortemSection] = useState<boolean>(showPTPostmortemSectionProp);
    const [internalShowProjectPostmortemSection, setInternalShowProjectPostmortemSection] = useState<boolean>(showProjectPostmortemSectionProp);
    // ===== 추가된 State 끝 =====

    const [projectReview, setProjectReview] = useState<ProjectReview>({
        swotAnalysis: '',
        resourcePlan: '',
        writerOpinion: '',
        proceedDecision: '',
    });

    const [kickoff, setKickoff] = useState<KickoffReport>({
        department: '',
        presenter: '',
        personnel: '',
        collaboration: '',
        plannedExpense: '',
        progressSchedule: '',
        riskFactors: '',
        nextReport: '',
    });

    const handleKickoffInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setKickoff(prev => ({ ...prev, [name]: value }));
    };

    const [ptPostmortem, setPtPostmortem] = useState<PTPostmortem>({
        ptReview: '',
        ptResult: '',
        reason: '',
        directionConcept: '',
        program: '',
        operation: '',
        quotation: '',
        managerOpinion: '',
    });

    const handlePTChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setPtPostmortem(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        if (!onChange) {
            setInternalFormData(formData);
        }
    }, [formData, onChange]);

    const currentFormData = onChange ? formData : internalFormData;
    const isDetailSectionVisible = showDetailSectionProp !== undefined
        ? showDetailSectionProp
        : internalShowDetailSection;

    // ===== 여기부터 추가된 Visibility 변수들 =====
    const isReviewSectionVisible = showReviewSectionProp !== undefined ? showReviewSectionProp : internalShowReviewSection;
    const isKickoffSectionVisible = showKickoffSectionProp !== undefined ? showKickoffSectionProp : internalShowKickoffSection;
    const isPTPostmortemSectionVisible = showPTPostmortemSectionProp !== undefined ? showPTPostmortemSectionProp : internalShowPTPostmortemSection;
    const isProjectPostmortemSectionVisible = showProjectPostmortemSectionProp !== undefined ? showProjectPostmortemSectionProp : internalShowProjectPostmortemSection;
    // ===== 추가된 Visibility 변수들 끝 =====

    const handleDetailSectionToggle = () => {
        const newValue = !isDetailSectionVisible;
        if (onDetailSectionChange) {
            onDetailSectionChange(newValue);
        } else {
            setInternalShowDetailSection(newValue);
        }
    };

    // ===== 여기부터 추가된 Toggle Handlers =====
    const handleReviewSectionToggle = () => {
        const newValue = !isReviewSectionVisible;
        if (onReviewSectionChange) {
            onReviewSectionChange(newValue);
        } else {
            setInternalShowReviewSection(newValue);
        }
    };

    const handleKickoffSectionToggle = () => {
        const newValue = !isKickoffSectionVisible;
        if (onKickoffSectionChange) {
            onKickoffSectionChange(newValue);
        } else {
            setInternalShowKickoffSection(newValue);
        }
    };

    const handlePTPostmortemSectionToggle = () => {
        const newValue = !isPTPostmortemSectionVisible;
        if (onPTPostmortemSectionChange) {
            onPTPostmortemSectionChange(newValue);
        } else {
            setInternalShowPTPostmortemSection(newValue);
        }
    };

    const handleProjectPostmortemSectionToggle = () => {
        const newValue = !isProjectPostmortemSectionVisible;
        if (onProjectPostmortemSectionChange) {
            onProjectPostmortemSectionChange(newValue);
        } else {
            setInternalShowProjectPostmortemSection(newValue);
        }
    };
    // ===== 추가된 Toggle Handlers 끝 =====

    const handleInternalChange = (name: keyof ExtendedProjectData, value: string) => {
        if (onChange) {
            onChange(name, value);
        } else {
            setInternalFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        handleInternalChange(name as keyof ExtendedProjectData, value);
    };

    const handleDateChange = (fieldName: keyof ExtendedProjectData, e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            const formattedDate = selectedDate.replace(/-/g, '.');
            handleInternalChange(fieldName, formattedDate);
        } else {
            handleInternalChange(fieldName, '');
        }
    };

    const tryExternalThenInternal = async (ext?: ExternalSearchHandler, internal?: () => any) => {
        if (ext) {
            try {
                const res = await ext();
                if (res === 'handled') return;
            } catch (e) {
                console.error('[external search handler error]', e);
            }
        }
        return internal?.();
    };

    const handleProjectSearchClick = async () => {
        await tryExternalThenInternal(onProjectSearch, handleProjectSearch);
    };

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
                search: currentFormData.projectName || ''
            };
            const listResponse = await apiClient.get('/projects/', { params });
            const countResponse = await apiClient.get('/projects/count', { params });
            setSearchResults(listResponse.data);
            setTotalPages(Math.ceil(countResponse.data.total_count / 10));
        } catch (error) {
            const errorMessage = handleApiError(error);
            alert(`검색 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setSearchLoading(false);
        }
    };

    const selectProject = async (project: ProjectData) => {
        try {
            setSearchLoading(true);
            const response = await apiClient.get(`/projects/${project.project_id}`);
            const projectData = response.data;
            const updates: Record<string, string> = {
                projectName: projectData.project_name || '',
                inflowPath: projectData.inflow_path || '',
                client: projectData.company_profile?.company_name || projectData.client || '',
                manager: projectData.selected_contact?.contact_name || '',
                eventDate: projectData.project_period_start || '',
                submissionSchedule: projectData.project_period_end || '',
                eventLocation: projectData.event_location || '',
                attendees: projectData.attendees || '',
                eventNature: projectData.business_type || '',
                otSchedule: projectData.ot_schedule || '',
                expectedRevenue: projectData.contract_amount?.toString() || '',
                expectedCompetitors: projectData.expected_competitors || '',
                scoreTable: '',
                bidAmount: ''
            };
            if (includeDataSections.includes('detail')) {
                updates.purposeBackground = projectData.project_overview || '';
                updates.mainContent = projectData.project_scope || '';
                updates.coreRequirements = projectData.project_scope || '';
                updates.comparison = projectData.deliverables || '';
            }
            Object.entries(updates).forEach(([key, value]) => {
                if (onChange) {
                    onChange(key as keyof ExtendedProjectData, value);
                } else {
                    setInternalFormData(prev => ({ ...prev, [key]: value }));
                }
            });
            setShowSearchModal(false);
            onProjectSelect?.(project);
            onProjectIdSelected?.(project.project_id);
        } catch (error) {
            const errorMessage = handleApiError(error);
            alert(`프로젝트 데이터를 가져오는 중 오류가 발생했습니다: ${errorMessage}`);
            console.error('프로젝트 선택 오류:', error);
        }
        finally {
            setSearchLoading(false);
        }

        //[프로젝트 검토] 테이블을 위한 데이터 요청
        try {
            setSearchLoading(true);
            const profileResponse = await apiClient.get(`/projects/${project.project_id}/profile`);
            if (profileResponse.data) {
                setProjectReview({
                    swotAnalysis: profileResponse.data.swot_analysis || '',
                    resourcePlan: profileResponse.data.resource_plan || '',
                    writerOpinion: profileResponse.data.writer_opinion || '',
                    proceedDecision: profileResponse.data.proceed_decision || ''
                });
                console.log('✅ 프로젝트 검토 데이터 로드 성공:', profileResponse.data);
            }
        } catch (profileError) {
            console.warn('⚠️ 프로젝트 검토(Profile) 데이터 로드 실패:', profileError);
            // 실패해도 기본 정보는 표시되도록 에러를 무시
            setProjectReview({
                swotAnalysis: '',
                resourcePlan: '',
                writerOpinion: '',
                proceedDecision: ''
            });
        }
        finally {
            setSearchLoading(false);
        }

        try {
            setSearchLoading(true);
            // 착수보고 데이터 가져오기 (kickoff)
            const kickoffResponse = await apiClient(`/projects/${project.project_id}/kickoff`);

            if (kickoffResponse.data) {
                setKickoff(prev => ({
                    ...prev,
                    department: kickoffResponse.data.department || '',
                    presenter: kickoffResponse.data.presenter || '',
                    personnel: kickoffResponse.data.personnel || '',
                    collaboration: kickoffResponse.data.collaboration || '',
                    schedule: kickoffResponse.data.progress_schedule || '',
                    others: kickoffResponse.data.other_notes || ''
                }));
                // setSaveMode('update');
            } else {
                // setSaveMode('insert');
            }
            //
            // // 3. 작성자 정보 설정
            // setKickoffData(prev => ({
            //     ...prev,
            //     writerName: '작성자명',
            //     writerDepartment: '소속부서'
            // }));
            //
            // // 4. 프로젝트 파일 목록 로드
            // await loadProjectFiles(projectId);

        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error('프로젝트 데이터 로드 오류:', errorMessage);
            alert(`프로젝트 데이터를 불러오는 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setSearchLoading(false);
        }


        try {
            setSearchLoading(true);
            // setError(null);

            // const data = await apiCall(`/api/projects/${projectId}/postmortem`);
            const response = await apiClient.get(`/projects/${project.project_id}/pt-postmortem`);
            const data = response.data;

            if (data) {
                // 백엔드 데이터를 프론트엔드 형식으로 변환
                setPtPostmortem(prev => ({
                    ...prev,
                    ptReview: data.pt_review || '',
                    ptResult: data.pt_result || '',
                    reason: data.reason || '',
                    directionConcept: data.direction_concept || '',
                    program: data.program || '',
                    operation: data.operation || '',
                    quotation: data.quotation || '',
                    managerOpinion: data.manager_opinion || '',
                }));
            }
        } catch (err: any) {
            console.error('Postmortem 데이터 로드 오류:', err);
            // 404는 데이터가 없는 것이므로 에러로 처리하지 않음
            if (err.response?.status === 404) {
                return;
            }
            // setError(err instanceof Error ? err.message : 'Postmortem 데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setSearchLoading(false);
        }


    };

    const formatDateForInput = (dateStr?: string): string => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const handleCompanySearchClick = async () => {
        await tryExternalThenInternal(onCompanySearch, handleCompanySearch);
    };

    const handleCompanySearch = async () => {
        setShowCompanySearchModal(true);
        await searchCompaniesAPI(currentFormData.client);
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
            handleInternalChange('client', detailedCompany.company_name);
            handleInternalChange('manager', '');
            setShowCompanySearchModal(false);
            onCompanySelect?.(detailedCompany);
        } catch (error) {
            handleApiError(error);
        }
    };

    const handleContactSearchClick = async () => {
        await tryExternalThenInternal(onContactSearch, handleContactSearch);
    };

    const handleContactSearch = () => {
        setContactSearchTerm('');
        setContactSearchResults([]);
        setShowContactSearchModal(true);
        searchContacts('');
    };

    const searchContacts = async (searchTerm: string) => {
        setContactSearchLoading(true);
        try {
            const response = await apiClient.get('/company-profile/contacts/search', { params: { search: searchTerm } });
            let results: ContactSearchData[] = response.data;
            if (currentFormData.client) {
                results = results.filter(contact => contact.company.company_name === currentFormData.client);
            }
            setContactSearchResults(results);
        } catch (error) {
            handleApiError(error);
        } finally {
            setContactSearchLoading(false);
        }
    };

    const selectContact = (contact: ContactSearchData) => {
        handleInternalChange('client', contact.company.company_name);
        handleInternalChange('manager', contact.contact_name);
        setShowContactSearchModal(false);
        const contactData: CompanyContactData = {
            id: contact.id,
            contact_name: contact.contact_name,
            is_primary: false
        };
        onContactSelect?.(contactData);
    };

    const handleContactSearchAPI = async () => {
        await searchContacts(contactSearchTerm);
    };

    const resetClientAndContact = () => {
        handleInternalChange('client', '');
        handleInternalChange('manager', '');
    };

    const handleResetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        resetClientAndContact();
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
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>선택</th>
                </tr>
                </thead>
                <tbody>
                {searchResults.map((project: ProjectData) => (
                    <tr key={project.project_id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.project_name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.client || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.status}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.writer_info?.name || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                            <button className="select-btn" onClick={() => selectProject(project)}>선택</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    return (
        <>
            {/* [수정] 최상위 div에 readOnly 값에 따라 'readonly-mode' 클래스를 추가합니다. */}
            <div className={`${className} ${readOnly ? 'readonly-mode' : ''}`}>
                <div className={className}>
                    <h3 className="section-header">{readOnly ? '🔒 (검색만 가능)' : '■'} 프로젝트 기본 정보</h3>
                    <table className={tableClassName}>
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
                                {/*{readOnly ? (*/}
                                {false ? (
                                    <input
                                        type="text"
                                        name="projectName"
                                        value={currentFormData.projectName}
                                        className={inputClassName}
                                        readOnly
                                    />
                                ) : (
                                    <div className="input-with-search">
                                        <input
                                            type="text"
                                            name="projectName"
                                            value={currentFormData.projectName}
                                            onChange={handleInputChange}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleProjectSearch();
                                                }
                                            }}
                                            className={inputClassName}
                                            placeholder="프로젝트명 입력 후 엔터 또는 🔍 클릭"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleProjectSearchClick}
                                            className="search-btn"
                                            title="프로젝트 검색"
                                        >
                                            🔍
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="table-cell table-cell-label">유입경로</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="inflowPath"
                                    value={currentFormData.inflowPath}
                                    onChange={handleInputChange}
                                    className={inputClassName}
                                    readOnly={readOnly}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">발주처</td>
                            <td className="table-cell-input">
                                {/*{readOnly ? (*/}
                                {false ? (
                                    <input
                                        type="text"
                                        name="client"
                                        value={currentFormData.client}
                                        className={inputClassName}
                                        readOnly
                                    />
                                ) : (
                                    <div className="input-with-search">
                                        {currentFormData.client && (
                                            <button
                                                type="button"
                                                className="status-badge company-badge with-reset"
                                                onClick={handleCompanySearchClick}
                                                title="발주처 변경"
                                            >
                                                <span className="badge-text">{currentFormData.client}</span>
                                                <span className="badge-reset-icon" onClick={handleResetClick} title="발주처 초기화">
                                                ×
                                            </span>
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleCompanySearchClick}
                                            className="search-btn"
                                            title="발주처 검색"
                                            style={{ marginLeft: 'auto' }}
                                        >
                                            🔍
                                        </button>
                                    </div>
                                )}
                            </td>
                            <td className="table-cell table-cell-label">담당자</td>
                            <td className="table-cell-input">
                                {/*{readOnly ? (*/}
                                {false ? (
                                    <input
                                        type="text"
                                        name="manager"
                                        value={currentFormData.manager}
                                        className={inputClassName}
                                        readOnly
                                    />
                                ) : (
                                    <div className="input-with-search">
                                        {currentFormData.manager && (
                                            <button
                                                type="button"
                                                className="status-badge contact-badge"
                                                title="담당자 상세 정보 보기"
                                            >
                                                {currentFormData.manager}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={handleContactSearchClick}
                                            className="search-btn"
                                            title="담당자 검색"
                                            style={{ marginLeft: 'auto' }}
                                        >
                                            🔍
                                        </button>
                                    </div>
                                )}
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input">
                                <input
                                    type="date"
                                    name="eventDate"
                                    value={formatDateForInput(currentFormData.eventDate)}
                                    onChange={(e) => handleDateChange('eventDate', e)}
                                    className="project-date-input"
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사장소</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventLocation"
                                    value={currentFormData.eventLocation}
                                    onChange={handleInputChange}
                                    className={inputClassName}
                                    readOnly={readOnly}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">참석대상</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="attendees"
                                    value={currentFormData.attendees}
                                    onChange={handleInputChange}
                                    placeholder="VIP XX명, 약 XX명 예상"
                                    className={inputClassName}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사성격</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventNature"
                                    value={currentFormData.eventNature}
                                    onChange={handleInputChange}
                                    className={inputClassName}
                                    readOnly={readOnly}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">OT 일정</td>
                            <td className="table-cell-input">
                                <input
                                    type="date"
                                    name="otSchedule"
                                    value={formatDateForInput(currentFormData.otSchedule)}
                                    onChange={(e) => handleDateChange('otSchedule', e)}
                                    className="project-date-input"
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input">
                                <input
                                    type="date"
                                    name="submissionSchedule"
                                    value={formatDateForInput(currentFormData.submissionSchedule)}
                                    onChange={(e) => handleDateChange('submissionSchedule', e)}
                                    className="project-date-input"
                                    readOnly={readOnly}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">
                                예 산<br/>( 단위 : 천만원 )
                            </td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="expectedRevenue"
                                    value={currentFormData.expectedRevenue}
                                    onChange={handleInputChange}
                                    placeholder="XX.X [ 수익 X.X ]"
                                    className={inputClassName}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="table-cell table-cell-label">예상 경쟁사</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="expectedCompetitors"
                                    value={currentFormData.expectedCompetitors}
                                    onChange={handleInputChange}
                                    placeholder="XX, YY 등 N개사"
                                    className={inputClassName}
                                    readOnly={readOnly}
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">배점표</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="scoreTable"
                                    value={currentFormData.scoreTable}
                                    onChange={handleInputChange}
                                    className={`kickoff-input ${readOnly ? 'readonly-input' : ''}`}
                                    readOnly={readOnly}
                                />
                            </td>
                            <td className="table-cell table-cell-label">
                                제출/투찰 금액<br/>
                                (단위 : 천만원)
                            </td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="bidAmount"
                                    value={currentFormData.bidAmount}
                                    onChange={handleInputChange}
                                    placeholder="XX.X, Y%"
                                    className={`kickoff-input ${readOnly ? 'readonly-input' : ''}`}
                                    readOnly={readOnly}
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    {/*{enableDetailSectionToggle && detailSectionCollapsible && (*/}
                    {/*    <div className="table-action-section">*/}
                    {/*        <button*/}
                    {/*            type="button"*/}
                    {/*            className="toggle-profile-btn"*/}
                    {/*            onClick={handleDetailSectionToggle}*/}
                    {/*            aria-expanded={isDetailSectionVisible}*/}
                    {/*            aria-controls="detail-section-container"*/}
                    {/*        >*/}
                    {/*            Project Profile {isDetailSectionVisible ? '숨기기' : '보기'}*/}
                    {/*        </button>*/}
                    {/*    </div>*/}
                    {/*)}*/}

                    {/* ===== 여기부터 추가된 토글 버튼 섹션 ===== */}
                    {/*{(enableKickoffSectionToggle || enablePTPostmortemSectionToggle || enableProjectPostmortemSectionToggle) && (*/}
                    {((enableDetailSectionToggle && detailSectionCollapsible) || enableKickoffSectionToggle || enablePTPostmortemSectionToggle || enableProjectPostmortemSectionToggle) && (
                        <div className="table-action-section">
                            {enableDetailSectionToggle && detailSectionCollapsible && (
                                <button
                                    type="button"
                                    // className="toggle-profile-btn"
                                    className={`toggle-profile-btn ${isDetailSectionVisible ? 'active' : 'inactive'}`}
                                    onClick={handleDetailSectionToggle}
                                    aria-expanded={isDetailSectionVisible}
                                    aria-controls="detail-section-container"
                                >
                                    {/*Project Profile {isDetailSectionVisible ? '숨기기' : '보기'}*/}
                                    프로젝트 상세정보
                                </button>
                            )}
                            {enableKickoffSectionToggle && (
                                <button
                                    type="button"
                                    // className="toggle-profile-btn"
                                    className={`toggle-profile-btn ${isKickoffSectionVisible ? 'active' : 'inactive'}`}
                                    onClick={handleKickoffSectionToggle}
                                >
                                    {/*Project Kickoff {isKickoffSectionVisible ? '숨기기' : '보기'}*/}
                                    프로젝트 착수보고
                                </button>
                            )}
                            {enablePTPostmortemSectionToggle && (
                                <button
                                    type="button"
                                    // className="toggle-profile-btn"
                                    className={`toggle-profile-btn ${isPTPostmortemSectionVisible ? 'active' : 'inactive'}`}
                                    onClick={handlePTPostmortemSectionToggle}
                                >
                                    {/*PT Postmortem {isPTPostmortemSectionVisible ? '숨기기' : '보기'}*/}
                                    PT 결과분석
                                </button>
                            )}
                            {enableProjectPostmortemSectionToggle && (
                                <button
                                    type="button"
                                    // className="toggle-profile-btn"
                                    className={`toggle-profile-btn ${isProjectPostmortemSectionVisible ? 'active' : 'inactive'}`}
                                    onClick={handleProjectPostmortemSectionToggle}
                                >
                                    {/*Project Postmortem {isProjectPostmortemSectionVisible ? '숨기기' : '보기'}*/}
                                    프로젝트 결과분석
                                </button>
                            )}
                        </div>
                    )}
                    {/* ===== 추가된 토글 버튼 섹션 끝 ===== */}

                    {(enableDetailSectionToggle || isDetailSectionVisible) && (
                        <div
                            id="detail-section-container"
                            className={`profile-tables-container ${isDetailSectionVisible ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                            style={{
                                opacity: isDetailSectionVisible ? 1 : 0,
                                maxHeight: isDetailSectionVisible ? '2000px' : '0',
                                transform: isDetailSectionVisible ? 'translateY(0)' : 'translateY(-20px)',
                                marginBottom: isDetailSectionVisible ? '0' : '0',
                                transition: `all ${detailSectionAnimationDuration}ms ease-in-out`
                            }}
                        >
                            {isDetailSectionVisible && (
                                <>
                                    {/* [수정] 최상위 div에 readOnly 값에 따라 'readonly-mode' 클래스를 추가합니다. */}
                                    <div className={`${className} ${readOnly ? 'readonly-mode' : ''}`}>
                                        <h3 className="section-header">{readOnly ? '🔒' : '■'} 프로젝트 상세 정보</h3>
                                        <table className={tableClassName}>
                                            <tbody>
                                            <tr>
                                                <td className="table-header">구분</td>
                                                <td className="table-header">내용</td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">목적 및 배경</td>
                                                <td className="table-cell-input">
                                        <textarea
                                            name="purposeBackground"
                                            value={currentFormData.purposeBackground || ''}
                                            onChange={(e) => handleInternalChange('purposeBackground', e.target.value)}
                                            placeholder="- 프로젝트 추진 목적 및 배경&#10;- 광고주 측 주요 과제 또는 행사 맥락"
                                            className="project-textarea textarea-large"
                                            readOnly={readOnly}
                                            rows={4}
                                        />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">주요 내용<br/>및<br/>핵심 요구사항</td>
                                                <td className="table-cell-input">
                                        <textarea
                                            name="mainContent"
                                            value={currentFormData.mainContent || ''}
                                            onChange={(e) => handleInternalChange('mainContent', e.target.value)}
                                            placeholder="- 주요 과제, 행사 맥락, 주요 프로그램 등&#10;- 과업 제안범위, 제출금액, 운영 시 필수 고려사항등&#10;- 프로젝트 추진 방향성&#10;- 내외부 리소스 활용방법"
                                            className="project-textarea textarea-large"
                                            readOnly={readOnly}
                                            rows={6}
                                        />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">비 고</td>
                                                <td className="table-cell-input">
                                        <textarea
                                            name="comparison"
                                            value={currentFormData.comparison || ''}
                                            onChange={(e) => handleInternalChange('comparison', e.target.value)}
                                            placeholder="- 특이사항 및 중요사항등 추가 기재"
                                            className="project-textarea textarea-medium"
                                            readOnly={readOnly}
                                            rows={3}
                                        />
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="kickoff-section">
                                        <h3 className="section-header">
                                            🔒 프로젝트 검토
                                        </h3>
                                        <table className="kickoff-table">
                                            <tbody>
                                            <tr>
                                                <td className="table-header">구분</td>
                                                <td className="table-header">내용</td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">SWOT 분석</td>
                                                <td className="table-cell-input">
                                        <textarea
                                            name="swotAnalysis"
                                            value={projectReview.swotAnalysis || ''}
                                            className="kickoff-textarea textarea-xlarge bullet-textarea"
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5' }}
                                        />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">리소스 활용방안</td>
                                                <td className="table-cell-input">
                                        <textarea
                                            name="resourcePlan"
                                            value={projectReview.resourcePlan || ''}
                                            className="kickoff-textarea textarea-large bullet-textarea"
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5' }}
                                        />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">작성자 의견</td>
                                                <td className="table-cell-input">
                                        <textarea
                                            name="writerOpinion"
                                            value={projectReview.writerOpinion || ''}
                                            className="kickoff-textarea textarea-large bullet-textarea"
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5' }}
                                        />
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">진행 부결 사유</td>
                                                <td className="table-cell-input">
                                        <textarea
                                            name="proceedDecision"
                                            value={projectReview.proceedDecision || ''}
                                            className="kickoff-textarea textarea-large bullet-textarea"
                                            readOnly
                                            style={{ backgroundColor: '#f5f5f5' }}
                                        />
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                </>
                            )}
                        </div>
                    )}


                    {/* ===== 여기부터 추가된 테이블 섹션들 ===== */}

                    {/* 프로젝트 검토 Section */}
                    {enableReviewSectionToggle && (
                        <div
                            className={`profile-tables-container ${isReviewSectionVisible ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                            style={{
                                opacity: isReviewSectionVisible ? 1 : 0,
                                maxHeight: isReviewSectionVisible ? '2000px' : '0',
                                transform: isReviewSectionVisible ? 'translateY(0)' : 'translateY(-20px)',
                                transition: `all ${detailSectionAnimationDuration}ms ease-in-out`
                            }}
                        >
                            {isReviewSectionVisible && (
                                <div className={className}>
                                    <h3 className="section-header">■ 프로젝트 검토</h3>
                                    <table className={tableClassName}>
                                        <tbody>
                                        <tr>
                                            <td className="table-header">구분</td>
                                            <td className="table-header">내용</td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">SWOT 분석</td>
                                            <td className="table-cell-input">
                                                {/* 빈 테이블 */}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">리소스 활용방안</td>
                                            <td className="table-cell-input">
                                                {/* 빈 테이블 */}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">작성자 의견</td>
                                            <td className="table-cell-input">
                                                {/* 빈 테이블 */}
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 프로젝트 착수보고 Section */}
                    {enableKickoffSectionToggle && (
                        // <div
                        //     className={`profile-tables-container ${isKickoffSectionVisible ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                        //     style={{
                        //         opacity: isKickoffSectionVisible ? 1 : 0,
                        //         maxHeight: isKickoffSectionVisible ? '2000px' : '0',
                        //         transform: isKickoffSectionVisible ? 'translateY(0)' : 'translateY(-20px)',
                        //         transition: `all ${detailSectionAnimationDuration}ms ease-in-out`
                        //     }}
                        // >
                        //     {isKickoffSectionVisible && (
                        //         <div className={className}>
                        //             <h3 className="section-header">■ 프로젝트 착수보고</h3>
                        //             <table className={tableClassName}>
                        //                 <tbody>
                        //                 <tr>
                        //                     <td className="table-header">구분</td>
                        //                     <td className="table-header">내용</td>
                        //                 </tr>
                        //                 <tr>
                        //                     <td className="table-cell table-cell-label">담당부서</td>
                        //                     <td className="table-cell-input">
                        //                         {/* 빈 테이블 */}
                        //                     </td>
                        //                 </tr>
                        //                 <tr>
                        //                     <td className="table-cell table-cell-label">PT발표자</td>
                        //                     <td className="table-cell-input">
                        //                         {/* 빈 테이블 */}
                        //                     </td>
                        //                 </tr>
                        //                 <tr>
                        //                     <td className="table-cell table-cell-label">기획자</td>
                        //                     <td className="table-cell-input">
                        //                         {/* 빈 테이블 */}
                        //                     </td>
                        //                 </tr>
                        //                 <tr>
                        //                     <td className="table-cell table-cell-label">협업조직</td>
                        //                     <td className="table-cell-input">
                        //                         {/* 빈 테이블 */}
                        //                     </td>
                        //                 </tr>
                        //                 <tr>
                        //                     <td className="table-cell table-cell-label">추진 일정</td>
                        //                     <td className="table-cell-input">
                        //                         {/* 빈 테이블 */}
                        //                     </td>
                        //                 </tr>
                        //                 <tr>
                        //                     <td className="table-cell table-cell-label">기타</td>
                        //                     <td className="table-cell-input">
                        //                         {/* 빈 테이블 */}
                        //                     </td>
                        //                 </tr>
                        //                 </tbody>
                        //             </table>
                        //         </div>
                        //     )}
                        // </div>

                        <div
                            className={`profile-tables-container ${isKickoffSectionVisible ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                            style={{
                                opacity: isKickoffSectionVisible ? 1 : 0,
                                maxHeight: isKickoffSectionVisible ? '2000px' : '0',
                                transform: isKickoffSectionVisible ? 'translateY(0)' : 'translateY(-20px)',
                                marginBottom: isKickoffSectionVisible ? '0' : '0',
                                transition: 'all 1s ease-in-out'
                            }}
                        >
                            {isKickoffSectionVisible && (
                                // <div className="postmortem-section">
                                <div className={`${className} ${readOnly ? 'readonly-mode' : ''}`}>
                                    {/*<h3 className="section-header">*/}
                                    {/*    ■ 프로젝트 착수보고*/}
                                    {/*</h3>*/}
                                    <h3 className="section-header">
                                        {readOnly ? '🔒' : '■'} 프로젝트 착수보고
                                    </h3>
                                    {/*<table className="postmortem-table">*/}
                                    <table className={tableClassName}>
                                        <tbody>
                                        <tr>
                                            <td className="table-header">구분</td>
                                            <td className="table-header">내용</td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">담당부서</td>
                                            <td className="table-cell-input">
                                            <textarea
                                                name="department"
                                                value={kickoff.department}
                                                onChange={handleKickoffInputChange}
                                                placeholder="X본부 Y팀"
                                                className="postmortem-textarea textarea-small bullet-textarea"
                                                readOnly={readOnly}
                                            />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">PT발표자</td>
                                            <td className="table-cell-input">
                                                <input
                                                    type="text"
                                                    name="presenter"
                                                    value={kickoff.presenter}
                                                    onChange={handleInputChange}
                                                    className="postmortem-input"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">
                                                투입인력 및<br/>
                                                역할, 기여도
                                            </td>
                                            <td className="table-cell-input">
                                            <textarea
                                                name="personnel"
                                                value={kickoff.personnel}
                                                onChange={handleKickoffInputChange}
                                                placeholder="메인 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                                readOnly={readOnly}
                                            />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">협업조직</td>
                                            <td className="table-cell-input">
                                            <textarea
                                                name="collaboration"
                                                value={kickoff.collaboration}
                                                onChange={handleKickoffInputChange}
                                                placeholder="키비주얼 : 디자인팀&#10;3D 디자인 : XX 사&#10;영상 : 영상팀"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                                readOnly={readOnly}
                                            />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">기획 예상경비</td>
                                            <td className="table-cell-input">
                                            <textarea
                                                name="plannedExpense"
                                                value={kickoff.plannedExpense}
                                                onChange={handleKickoffInputChange}
                                                placeholder="출장, 야근택시비, 용역비 등"
                                                className="postmortem-textarea textarea-medium bullet-textarea"
                                                readOnly={readOnly}
                                            />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">
                                                진행 일정<br/>
                                                (마일스톤)
                                            </td>
                                            <td className="table-cell-input">
                                            <textarea
                                                name="progressSchedule"
                                                value={kickoff.progressSchedule}
                                                onChange={handleKickoffInputChange}
                                                placeholder="주차별 또는 월별 주요 일정"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                                readOnly={readOnly}
                                            />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">위험요소</td>
                                            <td className="table-cell-input">
                                            <textarea
                                                name="riskFactors"
                                                value={kickoff.riskFactors}
                                                onChange={handleKickoffInputChange}
                                                placeholder="예상되는 리스크와 대응방안"
                                                className="postmortem-textarea textarea-medium bullet-textarea"
                                                readOnly={readOnly}
                                            />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">차기 보고</td>
                                            <td className="table-cell-input">
                                            <textarea
                                                name="nextReport"
                                                value={kickoff.nextReport}
                                                onChange={handleKickoffInputChange}
                                                placeholder="다음 보고 예정일과 내용"
                                                className="postmortem-textarea textarea-small"
                                                readOnly={readOnly}
                                            />
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                    )}

                    {/* PT 결과 분석 Section */}
                    {enablePTPostmortemSectionToggle && (
                        <div
                            className={`profile-tables-container ${isPTPostmortemSectionVisible ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                            style={{
                                opacity: isPTPostmortemSectionVisible ? 1 : 0,
                                maxHeight: isPTPostmortemSectionVisible ? '2000px' : '0',
                                transform: isPTPostmortemSectionVisible ? 'translateY(0)' : 'translateY(-20px)',
                                transition: `all ${detailSectionAnimationDuration}ms ease-in-out`
                            }}
                        >
                            {isPTPostmortemSectionVisible && (
                                <div className={`${className} ${readOnly ? 'readonly-mode' : ''}`}>
                                    <h3 className="section-header">{readOnly ? '🔒' : '■'} PT 결과 분석</h3>
                                    <table className={tableClassName}>
                                        <tbody>
                                        <tr>
                                            <td className="table-header">구분</td>
                                            <td className="table-header">내용</td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">PT 내용 Review</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="ptReview"
                                                    value={ptPostmortem.ptReview}
                                                    onChange={handlePTChange}
                                                    placeholder="발표 과정, 질의응답, 분위기 등"
                                                    className="postmortem-textarea textarea-large bullet-textarea"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">PT 결과</td>
                                            <td className="table-cell-input">
                                                <input
                                                    type="text"
                                                    name="ptResult"
                                                    value={ptPostmortem.ptResult}
                                                    onChange={handlePTChange}
                                                    placeholder="낙찰 / 탈락"
                                                    className={`postmortem-input ${readOnly ? 'readonly-input' : ''}`}
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">이유</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="reason"
                                                    value={ptPostmortem.reason}
                                                    onChange={handlePTChange}
                                                    placeholder="성공/실패 요인 분석"
                                                    className="postmortem-textarea textarea-large bullet-textarea"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">방향성/컨셉</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="directionConcept"
                                                    value={ptPostmortem.directionConcept}
                                                    onChange={handlePTChange}
                                                    className="postmortem-textarea textarea-medium bullet-textarea"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">프로그램</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="program"
                                                    value={ptPostmortem.program}
                                                    onChange={handlePTChange}
                                                    className="postmortem-textarea textarea-medium bullet-textarea"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">연출</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="operation"
                                                    value={ptPostmortem.operation}
                                                    onChange={handlePTChange}
                                                    className="postmortem-textarea textarea-medium bullet-textarea"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">견적</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="quotation"
                                                    value={ptPostmortem.quotation}
                                                    onChange={handlePTChange}
                                                    className="postmortem-textarea textarea-medium bullet-textarea"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>

                                        <tr>
                                            <td className="table-cell table-cell-label">담당PM 의견</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="managerOpinion"
                                                    value={ptPostmortem.managerOpinion}
                                                    onChange={handlePTChange}
                                                    placeholder="향후 개선사항, 교훈 등"
                                                    className="postmortem-textarea textarea-large bullet-textarea"
                                                    readOnly={readOnly}
                                                />
                                            </td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* 프로젝트 실행 후 보고 & 평가 Section */}
                    {enableProjectPostmortemSectionToggle && (
                        <div
                            className={`profile-tables-container ${isProjectPostmortemSectionVisible ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                            style={{
                                opacity: isProjectPostmortemSectionVisible ? 1 : 0,
                                maxHeight: isProjectPostmortemSectionVisible ? '3000px' : '0',
                                transform: isProjectPostmortemSectionVisible ? 'translateY(0)' : 'translateY(-20px)',
                                transition: `all ${detailSectionAnimationDuration}ms ease-in-out`
                            }}
                        >
                            {isProjectPostmortemSectionVisible && (
                                <>
                                    {/* 프로젝트 실행 후 보고 */}
                                    <div className={className}>
                                        <h3 className="section-header">■ 프로젝트 실행 후 보고</h3>
                                        <table className={tableClassName}>
                                            <tbody>
                                            <tr>
                                                <td className="table-header">구분</td>
                                                <td className="table-header">내용</td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">실행일</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">담당부서</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">내부팀 구성</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">외부 파트너</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 실행 후 평가 */}
                                    <div className={className}>
                                        <h3 className="section-header">■ 실행 후 평가</h3>
                                        <table className={tableClassName}>
                                            <tbody>
                                            <tr>
                                                <td className="table-header">구분</td>
                                                <td className="table-header">내용</td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">정량적 평가</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">정성적 평가</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">문제점 및 개선사항</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="table-cell table-cell-label">담당자 의견</td>
                                                <td className="table-cell-input">
                                                    {/* 빈 테이블 */}
                                                </td>
                                            </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    {/* ===== 추가된 테이블 섹션들 끝 ===== */}

                </div>
            </div>

            {showSearchModal && (
                <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>프로젝트 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* ✅ 입력란 추가 - formData.projectName 직접 사용 */}
                            {/* ✅ 수정: handleInternalChange 사용 */}
                            <div className="input-with-search" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    value={currentFormData.projectName}
                                    onChange={(e) => handleInternalChange('projectName', e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            setCurrentPage(1);
                                            searchProjects(1);
                                        }
                                    }}
                                    placeholder="프로젝트명을 입력하세요"
                                    className="project-input"
                                />
                                <button
                                    onClick={() => {
                                        setCurrentPage(1);
                                        searchProjects(1);
                                    }}
                                    className="search-btn"
                                >
                                    🔍
                                </button>
                            </div>

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
                                <input
                                    type="text"
                                    defaultValue={currentFormData.client}
                                    onKeyDown={e => { if (e.key === 'Enter') searchCompaniesAPI((e.target as HTMLInputElement).value); }}
                                    placeholder="회사 이름으로 검색"
                                    className="project-input"
                                />
                                <button onClick={() => {
                                    const input = document.querySelector('.modal-body .project-input') as HTMLInputElement;
                                    if (input) searchCompaniesAPI(input.value);
                                }} className="search-btn">
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
            {showContactSearchModal && (
                <div className="modal-overlay" onClick={() => setShowContactSearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>담당자 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowContactSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                <div className="search-prefix">
                                    {currentFormData.client ? `${currentFormData.client} :` : '전체 고객사 :'}
                                </div>
                                <input
                                    type="text"
                                    value={contactSearchTerm}
                                    onChange={e => setContactSearchTerm(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleContactSearchAPI(); }}
                                    placeholder="담당자 이름 검색"
                                    className="project-input"
                                />
                                <button onClick={handleContactSearchAPI} className="search-btn">
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
        </>
    );
};

export default ProjectBasicInfoForm;
