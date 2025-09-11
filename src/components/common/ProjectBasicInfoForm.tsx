// src/components/common/ProjectBasicInfoForm.tsx - 수정된 버전
import React, { useState, useEffect } from 'react';
import { ProjectBasicInfo, ProjectData, WriterInfo, CompanyContactData, CompanyProfileData, ExtendedProjectData } from '../../types/project';
import { handleApiError } from '../../api/utils/errorUtils';
import apiClient from '../../api/utils/apiClient';

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

type ExternalSearchHandlerResult = 'handled' | 'skip' | void;
type ExternalSearchHandler = () => ExternalSearchHandlerResult | Promise<ExternalSearchHandlerResult>;

interface ProjectBasicInfoFormProps {
    formData: ExtendedProjectData;
    onChange?: (name: keyof ExtendedProjectData, value: string) => void;
    showDetailSection?: boolean;
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
                                                                       showDetailSection = false,
                                                                       includeDataSections = ['basic', 'detail'],
                                                                       showSearch = true,
                                                                       readOnly = false,
                                                                       className = "project-section",
                                                                       tableClassName = "project-table",
                                                                       inputClassName = "project-input"
                                                                   }) => {
    // 내장 상태 관리
    const [internalFormData, setInternalFormData] = useState<ExtendedProjectData>(formData);

    // props formData 변경 시 내장 상태 동기화
    useEffect(() => {
        if (!onChange) {
            setInternalFormData(formData);
        }
    }, [formData, onChange]);

    // 실제 사용할 formData 결정
    const currentFormData = onChange ? formData : internalFormData;

    // 검색 관련 상태
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

    // 통합된 onChange 핸들러
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

    const formatDateForInput = (dateStr: string) => {
        return dateStr ? dateStr.replace(/\./g, '-') : '';
    };

    // 외부/내부 핸들러 처리
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

    // 프로젝트 검색 관련
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
            const params = new URLSearchParams({
                skip: ((page - 1) * 10).toString(),
                limit: '10'
            });

            if (currentFormData.projectName) {
                params.append('search', currentFormData.projectName);
            }

            const listUrlAxios = `/projects/?${params.toString()}`;
            const countUrl = `/api/projects/count?${params.toString()}`;

            const response = await apiClient(listUrlAxios);
            setSearchResults(response.data);

            const countResponse = await fetch(countUrl);
            if (countResponse.ok) {
                const countData = await countResponse.json();
                setTotalPages(Math.ceil(countData.total_count / 10));
            } else {
                setTotalPages(1);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            alert(`검색 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setSearchLoading(false);
        }
    };

    // 통합된 프로젝트 선택 핸들러
    const selectProject = async (project: ProjectData) => {
        try {
            console.log('프로젝트 선택:', project);

            // 1. 프로젝트 전체 데이터 가져오기
            const sectionsParam = includeDataSections?.join(',') || 'basic,detail';
            const response = await apiClient(`/projects/${project.project_id}/data?include_sections=${sectionsParam}`);
            const fullProjectData = response.data;

            // 2. 기본 정보 매핑
            const updates: Record<string, string> = {
                projectName: fullProjectData.basic_info.project_name || '',
                inflowPath: fullProjectData.basic_info.inflow_path || '',
                client: fullProjectData.basic_info.client || '',
                manager: fullProjectData.basic_info.our_manager_name || fullProjectData.basic_info.client_manager_name || '',
                eventDate: fullProjectData.basic_info.project_period_start || '',
                submissionSchedule: fullProjectData.basic_info.project_period_end || '',
                eventLocation: fullProjectData.basic_info.event_location || '',
                attendees: fullProjectData.basic_info.attendees || '',
                eventNature: fullProjectData.basic_info.business_type || '',
                otSchedule: fullProjectData.basic_info.ot_schedule || '',
                expectedRevenue: fullProjectData.basic_info.contract_amount?.toString() || '',
                expectedCompetitors: fullProjectData.basic_info.expected_competitors || '',
            };

            // 3. 상세 정보 매핑 (showDetailSection이 true일 때)
            if (showDetailSection && fullProjectData.detail_info) {
                updates.purposeBackground = fullProjectData.detail_info.project_background || '';
                updates.mainContent = fullProjectData.detail_info.project_overview || '';
                updates.coreRequirements = fullProjectData.detail_info.deliverables || '';
                updates.comparison = fullProjectData.detail_info.special_requirements || '';
            }

            // 4. 일괄 업데이트
            Object.entries(updates).forEach(([key, value]) => {
                handleInternalChange(key as keyof ExtendedProjectData, value);
            });

            setShowSearchModal(false);

            // 5. 외부 선택 핸들러 호출
            onProjectSelect?.(fullProjectData);

            console.log('프로젝트 데이터 로드 완료');

        } catch (error) {
            const errorMessage = handleApiError(error);
            alert(`프로젝트 데이터 로드 중 오류가 발생했습니다: ${errorMessage}`);
        }
    };

    // 회사 검색 관련
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

            handleInternalChange('client', detailedCompany.company_name);
            handleInternalChange('manager', '');

            setShowCompanySearchModal(false);
            onCompanySelect?.(detailedCompany);
        } catch (error) {
            handleApiError(error);
        }
    };

    // 담당자 검색 관련
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
            const url = `/api/company-profile/contacts/search?search=${encodeURIComponent(searchTerm)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('담당자 검색에 실패했습니다.');

            let results: ContactSearchData[] = await response.json();
            if (currentFormData.client) {
                results = results.filter(contact =>
                    contact.company.company_name === currentFormData.client
                );
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

    // 검색 결과 렌더링
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
            <div className={className}>
                <h3 className="section-header">■ 프로젝트 기본 정보</h3>
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
                            {readOnly ? (
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
                            {readOnly ? (
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
                            {readOnly ? (
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
                                className="kickoff-input"
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
                                className="kickoff-input"
                            />
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>

            {/* 검색 모달들 - 기존과 동일 */}
            {showSearchModal && (
                <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>프로젝트 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
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

            {/* 회사 검색 모달 */}
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

            {/* 담당자 검색 모달 */}
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