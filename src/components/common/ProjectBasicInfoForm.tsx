// src/components/common/ProjectBasicInfoForm.tsx
import React, { useState } from 'react';
import { ProjectBasicInfo, ProjectData, WriterInfo, CompanyContactData, CompanyProfileData } from '../../types/project';
import { handleApiError } from '../../api/utils/errorUtils';

// apiClient 사용으로 변경
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

// interface ProjectBasicInfoFormProps {
//     formData: ProjectBasicInfo;
//     onChange: (name: keyof ProjectBasicInfo, value: string) => void;
//     onProjectSelect?: (project: ProjectData) => void;
//     onCompanySelect?: (company: CompanyProfileData) => void;
//     onContactSelect?: (contact: CompanyContactData) => void;
//     readOnly?: boolean;
//     className?: string;
//     tableClassName?: string;
//     inputClassName?: string;
// }

type ExternalSearchHandlerResult = 'handled' | 'skip' | void;
type ExternalSearchHandler = () => ExternalSearchHandlerResult | Promise<ExternalSearchHandlerResult>;

// (상단) props 인터페이스에 콜백/플래그 추가
interface ProjectBasicInfoFormProps {
    formData: ProjectBasicInfo;
    onChange: (name: keyof ProjectBasicInfo, value: string) => void;

    onProjectSelect?: (project: ProjectData) => void;
    onCompanySelect?: (company: CompanyProfileData) => void;
    onContactSelect?: (contact: CompanyContactData) => void;

    // ▼ 추가: 외부에서 검색 버튼 동작을 가로채고 싶을 때(옵션)
    // onProjectSearch?: () => void;
    // onCompanySearch?: () => void;
    // onContactSearch?: () => void;
    onProjectSearch?: ExternalSearchHandler;
    onCompanySearch?: ExternalSearchHandler;
    onContactSearch?: ExternalSearchHandler;

    /** 외부 핸들러가 false/void를 반환할 때 내부 기본 동작으로 폴백할지 (기본: true) */
    useInternalSearchFallback?: boolean;

    // ▼ 추가: 검색 아이콘/버튼 노출 제어(옵션, 기본 true)
    showSearch?: boolean;
    readOnly?: boolean;
    className?: string;
    tableClassName?: string;
    inputClassName?: string;
}

// const ProjectBasicInfoForm: React.FC<ProjectBasicInfoFormProps> = ({
//                                                                        formData,
//                                                                        onChange,
//                                                                        onProjectSelect,
//                                                                        onCompanySelect,
//                                                                        onContactSelect,
//                                                                        readOnly = false,
//                                                                        className = "project-section",
//                                                                        tableClassName = "project-table",
//                                                                        inputClassName = "project-input"
//                                                                    }) => {

// 컴포넌트 파라미터에 추가된 props 디폴트 포함
const ProjectBasicInfoForm: React.FC<ProjectBasicInfoFormProps> = ({
                                                                       formData,
                                                                       onChange,
                                                                       onProjectSelect,
                                                                       onCompanySelect,
                                                                       onContactSelect,
                                                                       onProjectSearch,
                                                                       onCompanySearch,
                                                                       onContactSearch,
                                                                       showSearch = true,
                                                                       readOnly = false,
                                                                       className = "project-section",
                                                                       tableClassName = "project-table",
                                                                       inputClassName = "project-input"
                                                                   }) => {
    // 프로젝트 검색 관련 상태
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
    const [totalPages, setTotalPages] = useState(1);

    // 회사 검색 관련 상태
    const [showCompanySearchModal, setShowCompanySearchModal] = useState(false);
    const [companySearchLoading, setCompanySearchLoading] = useState(false);
    const [companySearchResults, setCompanySearchResults] = useState<CompanyData[]>([]);

    // 담당자 검색 관련 상태
    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        onChange(name as keyof ProjectBasicInfo, value);
    };

    const handleDateChange = (fieldName: keyof ProjectBasicInfo, e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedDate = e.target.value;
        if (selectedDate) {
            const formattedDate = selectedDate.replace(/-/g, '.');
            onChange(fieldName, formattedDate);
        } else {
            onChange(fieldName, '');
        }
    };

    const formatDateForInput = (dateStr: string) => {
        return dateStr ? dateStr.replace(/\./g, '-') : '';
    };

    // ▼ 외부 콜백이 있으면 그걸 먼저 실행하고, 없으면 기존 내부 로직 수행
    const tryExternalThenInternal = async (ext?: ExternalSearchHandler, internal?: () => any) => {
        if (ext) {
            try {
                const res = await ext();
                if (res === 'handled') return;       // 외부가 처리 완료 → 내부 X
                // res 가 'skip' 이거나 undefined → 내부 모달 실행
            } catch (e) {
                // 외부에서 실패하면 내부로 위임 (UX 보장)
                console.error('[external search handler error]', e);
            }
        }
        return internal?.();
    };

    const handleProjectSearchClick = async () => {
        await tryExternalThenInternal(onProjectSearch, handleProjectSearch);
    };

    const handleCompanySearchClick = async () => {
        await tryExternalThenInternal(onCompanySearch, handleCompanySearch);
    };

    const handleContactSearchClick = async () => {
        await tryExternalThenInternal(onContactSearch, handleContactSearch);
    };


    // 프로젝트 검색 함수들
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

            const listUrl = `/api/projects/?${params.toString()}`;
            const listUrlAxios = `/projects/?${params.toString()}`;
            const countUrl = `/api/projects/count?${params.toString()}`;

            // const response = await fetch(listUrl);
            // if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            // const data = await response.json();
            // setSearchResults(data);

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

    const selectProject = (project: ProjectData) => {
        onChange('projectName', project.project_name || '');
        onChange('client', project.company_profile?.company_name || project.client || '');
        onChange('manager', project.selected_contact?.contact_name || '');
        onChange('eventDate', project.project_period_start || '');
        onChange('submissionSchedule', project.project_period_end || '');
        onChange('eventLocation', project.event_location || '');
        onChange('attendees', project.attendees || '');
        onChange('eventNature', project.business_type || '');
        onChange('otSchedule', project.ot_schedule || '');
        onChange('expectedRevenue', project.contract_amount?.toString() || '');
        onChange('expectedCompetitors', project.expected_competitors || '');

        setShowSearchModal(false);
        onProjectSelect?.(project);
    };

    // 회사 검색 함수들
    const handleCompanySearch = async () => {
        setShowCompanySearchModal(true);
        await searchCompaniesAPI(formData.client);
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

            onChange('client', detailedCompany.company_name);
            onChange('manager', '');

            setShowCompanySearchModal(false);
            onCompanySelect?.(detailedCompany);
        } catch (error) {
            handleApiError(error);
        }
    };

    // 담당자 검색 함수들
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
            if (formData.client) {
                results = results.filter(contact =>
                    contact.company.company_name === formData.client
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
        onChange('client', contact.company.company_name);
        onChange('manager', contact.contact_name);

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
        onChange('client', '');
        onChange('manager', '');
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
                                    value={formData.projectName}
                                    className={inputClassName}
                                    readOnly
                                />
                            ) : (
                                <div className="input-with-search">
                                    <input
                                        type="text"
                                        name="projectName"
                                        value={formData.projectName}
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
                                value={formData.inflowPath}
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
                                    value={formData.client}
                                    className={inputClassName}
                                    readOnly
                                />
                            ) : (
                                <div className="input-with-search">
                                    {formData.client && (
                                        <button
                                            type="button"
                                            className="status-badge company-badge with-reset"
                                            onClick={handleCompanySearchClick}
                                            title="발주처 변경"
                                        >
                                            <span className="badge-text">{formData.client}</span>
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
                                    value={formData.manager}
                                    className={inputClassName}
                                    readOnly
                                />
                            ) : (
                                <div className="input-with-search">
                                    {formData.manager && (
                                        <button
                                            type="button"
                                            className="status-badge contact-badge"
                                            title="담당자 상세 정보 보기"
                                        >
                                            {formData.manager}
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
                                value={formatDateForInput(formData.eventDate)}
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
                                value={formData.eventLocation}
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
                                value={formData.attendees}
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
                                value={formData.eventNature}
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
                                value={formatDateForInput(formData.otSchedule)}
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
                                value={formatDateForInput(formData.submissionSchedule)}
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
                                value={formData.expectedRevenue}
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
                                value={formData.expectedCompetitors}
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
                                value={formData.scoreTable}
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
                                value={formData.bidAmount}
                                onChange={handleInputChange}
                                placeholder="XX.X, Y%"
                                className="kickoff-input"
                            />
                        </td>
                    </tr>
                    </tbody>
                </table>
            </div>
            {/* 프로젝트 검색 모달 */}
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
                                    defaultValue={formData.client}
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