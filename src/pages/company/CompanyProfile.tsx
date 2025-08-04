import React, { useState } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import '../../styles/CompanyProfile.css';

interface CompanyProfile {
    // 클라이언트 기업 정보 - 테이블 구조에 맞게 수정
    companyName: string;           // 회사명 (검색 가능)
    basicOverview: string;         // 기본개요
    representative: string;        // 대표
    businessNumber: string;        // 사업자번호
    contactInfo: string;          // 연락처
    address: string;              // 주소
    bankName: string;             // 은행명
    accountNumber: string;        // 계좌번호
    // 담당자는 별도 관리 (href 연결)

    // 담당자 상세 정보
    department: string;           // 소속/부서
    contactPerson: string;        // 직책/이름
    phone: string;               // 연락처
    email: string;               // 이메일
    responsibility: string;       // 담당 업무
    workStyle: string;           // 업무 스타일
    personalInfo: string;        // 개별 특화정보
    organizationInfo: string;    // 부서 및 조직정보

    // 히스토리
    relationship: string;        // 관계성
    projectExperience: string;   // 프로젝트 경험성
    notes: string;              // 비고

    // 컨택 리포트 (기존 데이터)
    existingReports: Array<{
        date: string;
        content: string;
    }>;

    // 새 컨택 리포트 입력
    newReportDate: string;
    newReportContent: string;

    // 검색 관련
    selectedCompanyId?: number;
}

// 회사 검색 결과 타입
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

// 1. 타입 정의 추가 (기존 interface 아래에 추가)
interface CompanyContactData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    is_primary: boolean;
    responsibility?: string;
    work_style?: string;
    personal_info?: string;
    organization_info?: string;
    relationship_info?: string;
    project_experience?: string;
}

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
    contacts?: CompanyContactData[]; // 담당자 정보 추가
}



const CompanyProfileForm: React.FC = () => {
    const [formData, setFormData] = useState<CompanyProfile>({
        companyName: '',
        basicOverview: '',
        representative: '',
        businessNumber: '',
        contactInfo: '',
        address: '',
        bankName: '',
        accountNumber: '',
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
        existingReports: [
            {
                date: '2025.07.23',
                content: '• 제목 및 안건: 현대자동차 EV 신차 발표회 프로모션의 건\n• 회의 및 내용: ...'
            }
        ],
        newReportDate: '',
        newReportContent: ''
    });

    // 상태 관리
    const [showContactInformations, setShowContactInformations] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<CompanyData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);

    // 2. 상태 추가 (기존 상태들 아래에 추가)
    const [companyContacts, setCompanyContacts] = useState<CompanyContactData[]>([]);


    // 7. 회사명 입력 필드 초기화 시 담당자 정보도 초기화 (handleInputChange 함수 수정)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // 회사명이 변경될 때 기존 선택된 회사 정보 및 담당자 정보 초기화
        if (name === 'companyName') {
            setSelectedCompany(null);
            setCompanyContacts([]);
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

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

    const handleSubmit = () => {
        console.log('광고주 Profile 저장:', formData);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    const loadContactInformations = () => {
        setShowContactInformations(!showContactInformations);
    };

    // 회사 검색 함수 (ProjectInformation 패턴 참조)
    const handleCompanySearch = async () => {
        setShowSearchModal(true);
        setCurrentPage(1);
        await searchCompanies(1);
    };

    // 회사 검색 실행
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

            const listUrl = `http://localhost:8001/api/company-profile/?${params.toString()}`;
            const countUrl = `http://localhost:8001/api/company-profile/count?${params.toString()}`;

            console.log('요청 URL:', listUrl);

            const response = await fetch(listUrl);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            setSearchResults(data);

            // 총 개수 조회
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

    // 3. selectCompany 함수 수정
    const selectCompany = async (company: CompanyData) => {
        try {
            // 단일 회사 상세 정보 조회 (담당자 정보 포함)
            const response = await fetch(`http://localhost:8001/api/company-profile/${company.id}`);

            if (!response.ok) {
                throw new Error('회사 정보를 가져올 수 없습니다.');
            }

            const detailedCompany = await response.json();

            // 폼 데이터에 반영
            setFormData(prev => ({
                ...prev,
                companyName: detailedCompany.company_name,
                basicOverview: detailedCompany.industry || '',
                representative: detailedCompany.representative || '',
                businessNumber: detailedCompany.business_number || '',
                contactInfo: [detailedCompany.phone, detailedCompany.email].filter(Boolean).join(' / '),
                address: detailedCompany.address || '',
                selectedCompanyId: detailedCompany.id
            }));

            // 담당자 정보 설정
            if (detailedCompany.contacts && detailedCompany.contacts.length > 0) {
                setCompanyContacts(detailedCompany.contacts);
            } else {
                setCompanyContacts([]);
            }

            setSelectedCompany(detailedCompany);
            setShowSearchModal(false);

            alert(`회사 "${detailedCompany.company_name}"이 선택되었습니다.${detailedCompany.contacts?.length ? ` (담당자 ${detailedCompany.contacts.length}명)` : ''}`);

        } catch (error) {
            console.error('회사 선택 오류:', error);
            alert('회사 정보를 가져오는데 실패했습니다.');
        }
    };

    // 4. 담당자 페이지로 이동하는 함수 추가
    const handleAddContactPage = () => {
        if (!selectedCompany) {
            alert('먼저 회사를 선택해주세요.');
            return;
        }

        // 담당자 추가 페이지로 이동 (실제 경로에 맞게 수정)
        // 예: React Router 사용시
        // navigate(`/company-contact/${selectedCompany.id}`);

        // 또는 새 창으로 열기
        window.open(`/company-contact?companyId=${selectedCompany.id}`, '_blank');

        // 또는 현재 창에서 이동
        // window.location.href = `/company-contact?companyId=${selectedCompany.id}`;
    };


    // 1. 기존 모달 컴포넌트 삭제 후 다음으로 교체:
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

                                        {/* 페이지네이션 */}
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
                <div>
                    <h1 className="profile-title">
                        별첨 1. 광고주 Profile 양식
                    </h1>
                </div>
                <div className="profile-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 프로필 섹션 */}
            <div className="profile-main">
                <div className="profile-title-section">
                    <h2 className="profile-subtitle">
                        고객사 기업 정보
                    </h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>
                                최종 작성자 :
                            </div>
                        </div>
                    </div>
                </div>

                {/* 클라이언트 기업 정보 테이블 */}
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
                                    />
                                    <button
                                        type="button"
                                        onClick={handleCompanySearch}
                                        className="search-btn"
                                        title="회사명 검색"
                                    >
                                        🔍
                                    </button>
                                </div>
                            </td>
                            <td className="table-cell table-cell-label">기본개요</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="basicOverview"
                                    value={formData.basicOverview}
                                    onChange={handleInputChange}
                                    placeholder="삼성계열 광고대행사"
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
                                    placeholder="제일기획 대표 이름"
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
                                    placeholder="000-00-00000"
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
                                    placeholder="대표전화/이메일/홈페이지"
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
                                    placeholder="서울특별시 서초구 서초동 1317-23"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">은행명</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleInputChange}
                                    placeholder="기업은행"
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">계좌번호</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="accountNumber"
                                    value={formData.accountNumber}
                                    onChange={handleInputChange}
                                    placeholder="001-2333-234-98475623"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">담당자</td>
                            <td className="table-cell-input" colSpan={3}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        {companyContacts.length > 0 ? (
                                            <div className="contact-list">
                                                {companyContacts.map((contact, index) => (
                                                    <div key={contact.id} className="contact-item">
                                <span className="contact-name">
                                    {contact.contact_name}
                                    {contact.is_primary && <span className="primary-badge"> (주담당)</span>}
                                </span>
                                                        {contact.position && <span className="contact-position"> - {contact.position}</span>}
                                                        {contact.department && <span className="contact-department"> ({contact.department})</span>}
                                                        {contact.phone && <span className="contact-phone"> / {contact.phone}</span>}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="no-contacts">
                                                {selectedCompany ? '등록된 담당자가 없습니다.' : '회사를 선택하면 담당자 정보가 표시됩니다.'}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        type="button"
                                        className="project-btn"
                                        style={{
                                            marginLeft: '10px',
                                            whiteSpace: 'nowrap',
                                            alignSelf: 'flex-start'
                                        }}
                                        onClick={handleAddContactPage}
                                    >
                                        담당자 추가 페이지로 이동
                                    </button>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 토글 버튼 */}
                <button
                    type="button"
                    onClick={loadContactInformations}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 24px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        margin: '20px 0',
                        fontSize: '14px'
                    }}
                >
                    고객사 담당자 기록 불러오기/보이기
                </button>

                {/* 담당자 상세 정보 */}
                {showContactInformations && (
                    <div className="profile-section">
                        <h3 className="section-header">
                            ■ 담당자 상세 정보
                        </h3>

                        <table className="profile-table">
                            <tbody>
                            <tr>
                                <td className="table-header">구분</td>
                                <td className="table-header" colSpan={2}>내용</td>
                                <td className="table-header">구분</td>
                                <td className="table-header">내용</td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">소속/부서</td>
                                <td className="table-cell-input" colSpan={2}>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleInputChange}
                                        placeholder="BX 1팀"
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
                                        placeholder="팀장 홍길동"
                                        className="profile-input"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">연락처</td>
                                <td className="table-cell-input" colSpan={2}>
                                    <input
                                        type="text"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        placeholder="010-0000-0000"
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
                                        placeholder="abcd@efgh.com"
                                        className="profile-input"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label table-cell-rowspan" rowSpan={4}>부가정보</td>
                                <td className="table-cell table-cell-label">담당 업무</td>
                                <td className="table-cell-input" colSpan={3}>
                                    <input
                                        type="text"
                                        name="responsibility"
                                        value={formData.responsibility}
                                        onChange={handleInputChange}
                                        placeholder="담당 업무 내용"
                                        className="profile-input"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">업무 스타일</td>
                                <td className="table-cell-input" colSpan={3}>
                                    <input
                                        type="text"
                                        name="workStyle"
                                        value={formData.workStyle}
                                        onChange={handleInputChange}
                                        placeholder="보수적, 자율적"
                                        className="profile-input"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">개별 특화정보</td>
                                <td className="table-cell-input" colSpan={3}>
                                    <textarea
                                        name="personalInfo"
                                        value={formData.personalInfo}
                                        onChange={handleInputChange}
                                        placeholder="생일, 취미, 개인적 성향"
                                        className="profile-textarea textarea-small"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">부서 및 조직정보</td>
                                <td className="table-cell-input" colSpan={3}>
                                    <textarea
                                        name="organizationInfo"
                                        value={formData.organizationInfo}
                                        onChange={handleInputChange}
                                        placeholder="XXX전담부서, 기존 BE 본부와 업무분할"
                                        className="profile-textarea textarea-small"
                                    />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 히스토리 */}
                {showContactInformations && (
                    <div className="profile-section">
                        <h3 className="section-header">
                            ■ 히스토리
                        </h3>

                        <table className="profile-table">
                            <tbody>
                            <tr>
                                <td className="table-header table-header-category">구분</td>
                                <td className="table-header">내용</td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label table-cell-top">관계성</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="relationship"
                                        value={formData.relationship}
                                        onChange={handleInputChange}
                                        placeholder="• 지엠컴 담당자/부서는 누구이며, 언제부터 관계가 형성되었고, 친분 및 영업관계에 대한 친밀도 등등의 정보"
                                        className="profile-textarea textarea-medium"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>
                                <td className="table-cell-input">
                                    <div className="project-experience-container">
                                        <textarea
                                            name="projectExperience"
                                            value={formData.projectExperience}
                                            onChange={handleInputChange}
                                            placeholder="• 프로젝트 유경험 시, 프로젝트명/기간/특이사항 입력"
                                            className="profile-textarea textarea-medium"
                                        />
                                        <div className="project-buttons-overlay">
                                            <button
                                                type="button"
                                                className="project-btn"
                                                onClick={() => {/* 추후 모달 팝업 구현 */}}
                                            >
                                                Prj Profile
                                            </button>
                                            <button
                                                type="button"
                                                className="project-btn"
                                                onClick={() => {/* 추후 모달 팝업 구현 */}}
                                            >
                                                Proj Kickoff
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label table-cell-top">비고</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        placeholder="기타 특이사항"
                                        className="profile-textarea textarea-medium"
                                    />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 컨택 리포트 */}
                {showContactInformations && (
                    <div className="profile-section">
                        <h3 className="section-header">
                            ■ 컨택 리포트 (미팅 회의록)
                        </h3>

                        <table className="profile-table">
                            <tbody>
                            <tr>
                                <td className="table-header table-header-category">날짜</td>
                                <td className="table-header">주요 내용</td>
                            </tr>
                            {/* 기존 리포트들 */}
                            {formData.existingReports.map((report, index) => (
                                <tr key={index}>
                                    <td className="table-cell table-cell-label table-cell-top contact-date-cell">
                                        <div className="contact-date">{report.date}</div>
                                    </td>
                                    <td className="table-cell-input">
                                        <div className="contact-content">
                                            {report.content.split('\n').map((line, lineIndex) => (
                                                <div key={lineIndex}>{line}</div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {/* 새 리포트 입력 행 */}
                            <tr className="new-report-row">
                                <td className="table-cell-input">
                                    <input
                                        type="date"
                                        name="newReportDate"
                                        value={formData.newReportDate}
                                        onChange={handleInputChange}
                                        className="profile-date-input"
                                    />
                                </td>
                                <td className="table-cell-input">
                                    <div className="new-report-container">
                                        <textarea
                                            name="newReportContent"
                                            value={formData.newReportContent}
                                            onChange={handleInputChange}
                                            placeholder="• 제목 및 안건: 현대자동차 EV 신차 발표회 프로모션의 건"
                                            className="profile-textarea textarea-large"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAddReport}
                                            className="add-report-btn"
                                            disabled={!formData.newReportDate || !formData.newReportContent}
                                        >
                                            ➕ 추가
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className="form-actions">
                    <button
                        onClick={handlePrint}
                        className="action-button btn-print"
                    >
                        📄 인쇄
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="action-button btn-save"
                    >
                        💾 저장
                    </button>
                </div>
            </div>

            {/* 회사 검색 모달 */}
            <CompanySearchModal />
        </div>
    );
};

export default CompanyProfileForm;