// CompanyEmployeeProfile.tsx - 완전히 처음부터 새로 작성

import React, { useState, useEffect } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import '../../styles/CompanyProfile.css';

// 회사 데이터 타입 정의
interface CompanyData {
    id: number;
    company_name: string;
    business_number?: string;
    industry?: string;
    address?: string;
    phone?: string;
    email?: string;
    representative?: string;
    created_at: string;
}

interface CompanyEmployeeProfile {
    // 회사 정보 (CompanyProfile과 동일, 은행정보 제외)
    companyName: string;
    basicOverview: string;
    representative: string;
    businessNumber: string;
    contactInfo: string;
    address: string;

    // 담당자 정보
    department: string;
    contactPerson: string;
    phone: string;
    email: string;
    responsibility: string;
    workStyle: string;
    personalInfo: string;
    organizationInfo: string;
    relationship: string;
    projectExperience: string;
    notes: string;

    // 컨택 리포트
    existingReports: Array<{
        date: string;
        content: string;
    }>;
    newReportDate: string;
    newReportContent: string;
}

const CompanyEmployeeProfileForm: React.FC = () => {
    // 상태 관리
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // 회사 검색 관련 상태
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<CompanyData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);

    const [formData, setFormData] = useState<CompanyEmployeeProfile>({
        // 회사 정보
        companyName: '',
        basicOverview: '',
        representative: '',
        businessNumber: '',
        contactInfo: '',
        address: '',

        // 담당자 정보
        department: '',
        contactPerson: '',
        phone: '',
        email: '',
        responsibility: '',
        workStyle: '',
        personalInfo: '',
        organizationInfo: '',
        relationship: '',
        projectExperience: '',
        notes: '',

        // 컨택 리포트
        existingReports: [
            { date: '2025.07.23', content: '• 제목 및 안건: 현대자동차 EV 신차 발표회 프로모션의 건\n• 회의 및 내용: ...' }
        ],
        newReportDate: '',
        newReportContent: ''
    });

    // URL 파라미터 처리
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const companyId = urlParams.get('companyId');
        const contactId = urlParams.get('contactId');

        if (companyId) {
            console.log('전달받은 회사 ID:', companyId);
            setLoading(true);
            fetchCompanyDetails(parseInt(companyId));
        }

        if (contactId) {
            console.log('전달받은 담당자 ID:', contactId);
            setIsEditMode(true);

            // 담당자 정보 설정
            setFormData(prev => ({
                ...prev,
                department: urlParams.get('department') || '',
                contactPerson: `${urlParams.get('position') || ''} ${urlParams.get('contactName') || ''}`.trim(),
                phone: urlParams.get('phone') || '',
                email: urlParams.get('email') || '',
                responsibility: urlParams.get('responsibility') || '',
                workStyle: urlParams.get('workStyle') || '',
                personalInfo: urlParams.get('personalInfo') || '',
                organizationInfo: urlParams.get('organizationInfo') || '',
                relationship: urlParams.get('relationshipInfo') || '',
                projectExperience: urlParams.get('projectExperience') || ''
            }));
        }
    }, []);

    // 회사 정보 조회
    const fetchCompanyDetails = async (companyId: number) => {
        try {
            // const response = await fetch(`http://localhost:8001/api/company-profile/${companyId}`);
            const response = await fetch(`/api/company-profile/${companyId}`);
            if (response.ok) {
                const companyData = await response.json();

                setFormData(prev => ({
                    ...prev,
                    companyName: companyData.company_name,
                    basicOverview: companyData.industry || '',
                    representative: companyData.representative || '',
                    businessNumber: companyData.business_number || '',
                    contactInfo: [companyData.phone, companyData.email].filter(Boolean).join(' / '),
                    address: companyData.address || ''
                }));

                setSelectedCompany(companyData);
            }
        } catch (error) {
            console.error('회사 정보 조회 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    // 회사 검색 함수
    const handleCompanySearch = async () => {
        setShowSearchModal(true);
        setCurrentPage(1);
        await searchCompanies(1);
    };

    const searchCompanies = async (page: number) => {
        try {
            setSearchLoading(true);

            const params = new URLSearchParams({
                skip: ((page - 1) * 10).toString(),
                limit: '10'
            });

            if (formData.companyName) {
                params.append('search', formData.companyName);
            }

            // const listUrl = `http://localhost:8001/api/company-profile/?${params.toString()}`;
            // const countUrl = `http://localhost:8001/api/company-profile/count?${params.toString()}`;
            const listUrl = `/api/company-profile/?${params.toString()}`;
            const countUrl = `/api/company-profile/count?${params.toString()}`;

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
                setTotalPages(1);
            }

        } catch (error) {
            console.error('검색 오류:', error);
            alert(`검색 중 오류가 발생했습니다: ${error}`);
        } finally {
            setSearchLoading(false);
        }
    };

    const selectCompany = async (company: CompanyData) => {
        try {
            // const response = await fetch(`http://localhost:8001/api/company-profile/${company.id}`);
            const response = await fetch(`/api/company-profile/${company.id}`);
            if (!response.ok) {
                throw new Error('회사 정보를 가져올 수 없습니다.');
            }

            const detailedCompany = await response.json();

            setFormData(prev => ({
                ...prev,
                companyName: detailedCompany.company_name,
                basicOverview: detailedCompany.industry || '',
                representative: detailedCompany.representative || '',
                businessNumber: detailedCompany.business_number || '',
                contactInfo: [detailedCompany.phone, detailedCompany.email].filter(Boolean).join(' / '),
                address: detailedCompany.address || ''
            }));

            setSelectedCompany(detailedCompany);
            setShowSearchModal(false);

            alert(`회사 "${detailedCompany.company_name}"이 선택되었습니다.`);

        } catch (error) {
            console.error('회사 선택 오류:', error);
            alert('회사 정보를 가져오는데 실패했습니다.');
        }
    };

    // 신규 작성 모드로 전환
    const handleNewContactMode = () => {
        setIsEditMode(false);

        setFormData(prev => ({
            ...prev,
            department: '',
            contactPerson: '',
            phone: '',
            email: '',
            responsibility: '',
            workStyle: '',
            personalInfo: '',
            organizationInfo: '',
            relationship: '',
            projectExperience: '',
            notes: '',
            existingReports: [],
            newReportDate: '',
            newReportContent: ''
        }));
    };

    // 입력 변경 처리
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'companyName') {
            setSelectedCompany(null);
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 리포트 추가
    const handleAddReport = () => {
        if (formData.newReportDate && formData.newReportContent) {
            setFormData(prev => ({
                ...prev,
                existingReports: [
                    ...prev.existingReports,
                    { date: prev.newReportDate, content: prev.newReportContent }
                ],
                newReportDate: '',
                newReportContent: ''
            }));
        }
    };

    // 로딩 중 표시
    if (loading) {
        return (
            <div className="loading-container" style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '200px',
                fontSize: '16px',
                color: '#666'
            }}>
                회사 정보를 불러오는 중...
            </div>
        );
    }

    // 검색 모달 컴포넌트
    const CompanySearchModal: React.FC = () => {
        return showSearchModal ? (
            <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>회사 검색</h3>
                        <button
                            className="modal-close-btn"
                            onClick={() => setShowSearchModal(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="modal-body">
                        <div className="search-info">
                            <p>검색어: "{formData.companyName}"</p>
                        </div>

                        {searchLoading ? (
                            <div className="loading">검색 중...</div>
                        ) : (
                            <>
                                {searchResults.length === 0 ? (
                                    <div className="no-results">검색 결과가 없습니다.</div>
                                ) : (
                                    <>
                                        <table className="search-table">
                                            <thead>
                                            <tr>
                                                <th>회사명</th>
                                                <th>대표자</th>
                                                <th>업종</th>
                                                <th>사업자번호</th>
                                                <th>등록일</th>
                                                <th>선택</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {searchResults.map((company) => (
                                                <tr key={company.id}>
                                                    <td>{company.company_name}</td>
                                                    <td>{company.representative || '-'}</td>
                                                    <td>{company.industry || '-'}</td>
                                                    <td>{company.business_number || '-'}</td>
                                                    <td>{new Date(company.created_at).toLocaleDateString()}</td>
                                                    <td>
                                                        <button
                                                            className="select-btn"
                                                            onClick={() => selectCompany(company)}
                                                        >
                                                            선택
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>

                                        <div className="pagination">
                                            <button
                                                onClick={() => {
                                                    setCurrentPage(prev => prev - 1);
                                                    searchCompanies(currentPage - 1);
                                                }}
                                                disabled={currentPage <= 1}
                                            >
                                                이전
                                            </button>
                                            <span className="page-info">{currentPage} / {totalPages}</span>
                                            <button
                                                onClick={() => {
                                                    setCurrentPage(prev => prev + 1);
                                                    searchCompanies(currentPage + 1);
                                                }}
                                                disabled={currentPage >= totalPages}
                                            >
                                                다음
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        ) : null;
    };

    return (
        <div className="company-profile-container">
            {/* 헤더 */}
            <div className="profile-header">
                <div className="profile-title-section">
                    <h1 className="profile-title">
                        광고주 담당자 Profile 양식 {isEditMode ? '(수정)' : '(신규)'}
                    </h1>
                </div>
                <div className="profile-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 프로필 섹션 */}
            <div className="profile-main">
                {/* 클라이언트 기업 정보 */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 클라이언트 기업 정보
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">회사명</td>
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleInputChange}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                handleCompanySearch();
                                            }
                                        }}
                                        className="profile-input"
                                        placeholder="회사명 입력 후 엔터 또는 🔍 클릭"
                                        readOnly={!!selectedCompany}
                                    />
                                    {!selectedCompany && (
                                        <button
                                            type="button"
                                            className="search-btn"
                                            onClick={handleCompanySearch}
                                        >
                                            🔍
                                        </button>
                                    )}
                                </div>
                            </td>
                            <td className="table-cell table-cell-label">기본개요</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="basicOverview"
                                    value={formData.basicOverview}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">대표</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="representative"
                                    value={formData.representative}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">사업자번호</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="businessNumber"
                                    value={formData.businessNumber}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">연락처</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="contactInfo"
                                    value={formData.contactInfo}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">주소</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 신규 작성 버튼 */}
                {isEditMode && (
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginTop: '10px',
                        marginBottom: '20px'
                    }}>
                        <button
                            type="button"
                            onClick={handleNewContactMode}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#17a2b8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontWeight: '600'
                            }}
                        >
                            신규 담당자 작성
                        </button>
                    </div>
                )}

                {/* 담당자 상세 정보 */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 담당자 상세 정보
                    </h3>

                    <table className="profile-table section-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">소속/부서</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">직책/이름</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">연락처</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">이메일</td>
                            <td className="table-cell-input">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">담당 업무</td>
                            <td className="table-cell-input" colSpan={3}>
                                <textarea
                                    name="responsibility"
                                    value={formData.responsibility}
                                    onChange={handleInputChange}
                                    className="profile-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">업무 스타일</td>
                            <td className="table-cell-input" colSpan={3}>
                                <textarea
                                    name="workStyle"
                                    value={formData.workStyle}
                                    onChange={handleInputChange}
                                    className="profile-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">개별 특화정보</td>
                            <td className="table-cell-input" colSpan={3}>
                                <textarea
                                    name="personalInfo"
                                    value={formData.personalInfo}
                                    onChange={handleInputChange}
                                    className="profile-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">부서 및 조직정보</td>
                            <td className="table-cell-input" colSpan={3}>
                                <textarea
                                    name="organizationInfo"
                                    value={formData.organizationInfo}
                                    onChange={handleInputChange}
                                    className="profile-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    {/* 히스토리 섹션 */}
                    <h3 className="section-header section-header-margin">
                        ■ 히스토리
                    </h3>

                    <table className="profile-table section-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">관계성</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="relationship"
                                    value={formData.relationship}
                                    onChange={handleInputChange}
                                    className="profile-textarea textarea-large"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="projectExperience"
                                    value={formData.projectExperience}
                                    onChange={handleInputChange}
                                    className="profile-textarea textarea-large"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 컨택 리포트 섹션 */}
                <div className="profile-section">
                    <h3 className="section-header section-header-margin">
                        ■ 컨택 리포트(회의록)
                    </h3>

                    <table className="profile-table section-table">
                        <tbody>
                        <tr>
                            <td className="table-header">날짜</td>
                            <td className="table-header">내용</td>
                        </tr>

                        {formData.existingReports.map((report, index) => (
                            <tr key={index}>
                                <td className="contact-date-cell">
                                    <div className="contact-date">{report.date}</div>
                                </td>
                                <td className="table-cell-input">
                                    <div className="contact-content">{report.content}</div>
                                </td>
                            </tr>
                        ))}

                        <tr className="new-report-row">
                            <td className="contact-date-cell">
                                <input
                                    type="text"
                                    name="newReportDate"
                                    value={formData.newReportDate}
                                    onChange={handleInputChange}
                                    className="profile-date-input"
                                    placeholder="YYYY.MM.DD"
                                />
                            </td>
                            <td className="table-cell-input">
                                <div className="new-report-container">
                                    <textarea
                                        name="newReportContent"
                                        value={formData.newReportContent}
                                        onChange={handleInputChange}
                                        className="profile-textarea textarea-large"
                                        placeholder="• 제목 및 안건: &#10;• 회의 및 내용: "
                                    />
                                    <button
                                        type="button"
                                        className="add-report-btn"
                                        onClick={handleAddReport}
                                        disabled={!formData.newReportDate || !formData.newReportContent}
                                    >
                                        추가
                                    </button>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 섹션 */}
                <div className="button-section">
                    <button type="button" className="submit-btn" onClick={() => {
                        console.log('담당자 Profile 저장:', formData);
                    }}>
                        저장
                    </button>
                    <button type="button" className="print-btn" onClick={() => window.print()}>
                        인쇄
                    </button>
                </div>
            </div>

            {/* 검색 모달 */}
            <CompanySearchModal />
        </div>
    );
};

export default CompanyEmployeeProfileForm;