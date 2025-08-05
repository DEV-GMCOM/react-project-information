// CompanyProfile.tsx - 완전히 새로 정리된 코드

import React, { useState, useEffect } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import '../../styles/CompanyProfile.css';

// 담당자 데이터 타입 정의
// --- 타입 정의 (기존과 동일) ---
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
    contacts?: CompanyContactData[];
}

interface CompanyProfile {
    companyName: string;
    basicOverview: string;
    representative: string;
    businessNumber: string;
    contactInfo: string;
    address: string;
    bankName: string;
    accountNumber: string;
    // selectedCompanyId는 formData에 포함시키지 않고 별도 state로 관리하는 것이 더 명확합니다.
}

interface ContactProfile {
    department: string;
    contactName: string;
    position: string;
    phone: string;
    email: string;
    responsibility: string;
    workStyle: string;
    personalInfo: string;
    organizationInfo: string;
    relationship: string;
    projectExperience: string;
}

const initialCompanyState: CompanyProfile = {
    companyName: '',
    basicOverview: '',
    representative: '',
    businessNumber: '',
    contactInfo: '',
    address: '',
    bankName: '',
    accountNumber: '',
};

const initialContactState: ContactProfile = {
    department: '',
    contactName: '',
    position: '',
    phone: '',
    email: '',
    responsibility: '',
    workStyle: '',
    personalInfo: '',
    organizationInfo: '',
    relationship: '',
    projectExperience: ''
};

const CompanyProfileForm: React.FC = () => {
// --- 상태 관리 ---
    const [formData, setFormData] = useState<CompanyProfile>(initialCompanyState);
    const [contactFormData, setContactFormData] = useState<ContactProfile>(initialContactState);

    // 원본 데이터 상태 (수정 감지용)
    const [originalFormData, setOriginalFormData] = useState<CompanyProfile>(initialCompanyState);
    const [originalContactData, setOriginalContactData] = useState<ContactProfile>(initialContactState);

    // UI 및 로직 제어 상태
    const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
    const [companyContacts, setCompanyContacts] = useState<CompanyContactData[]>([]);
    const [selectedContact, setSelectedContact] = useState<CompanyContactData | null>(null);
    const [showContactInformations, setShowContactInformations] = useState(false);
    const [isNewContact, setIsNewContact] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false); // **전체 폼 변경 감지 상태**

    // 검색 관련 상태
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<CompanyData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 컨택 리포트 상태
    const [existingReports, setExistingReports] = useState<Array<{ date: string; content: string; }>>([]);
    const [newReportDate, setNewReportDate] = useState('');
    const [newReportContent, setNewReportContent] = useState('');


    // **[수정] 폼 전체의 변경사항을 감지하는 useEffect**
    useEffect(() => {
        const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
        const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);

        // 신규 담당자 등록 모드에서 입력이 시작되면 dirty로 간주
        const isNewContactTyping = isNewContact && JSON.stringify(contactFormData) !== JSON.stringify(initialContactState);

        setIsFormDirty(companyDataChanged || contactDataChanged || isNewContactTyping);
    }, [formData, contactFormData, originalFormData, originalContactData, isNewContact]);


    // --- 핸들러 함수들 ---

    // 회사 정보 입력 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    };

    // 담당자 정보 입력 핸들러
    const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const {name, value} = e.target;
        setContactFormData(prev => ({...prev, [name]: value}));
    };

    // 컨택 리포트 추가
    const handleAddReport = () => {
        if (newReportDate && newReportContent) {
            setExistingReports(prev => [...prev, {date: newReportDate, content: newReportContent}]);
            setNewReportDate('');
            setNewReportContent('');
            // TODO: 컨택 리포트 저장 로직 필요 (별도 API or handleSubmit에 통합)
        }
    };

    // 인쇄
    const handlePrint = () => {
        window.print();
    };

    // **[신규] 전체 변경사항 취소 핸들러**
    const handleCancelAllChanges = () => {
        if (window.confirm('수정 중인 모든 내용을 취소하고 원본 상태로 되돌리시겠습니까?')) {
            setFormData(originalFormData);
            setContactFormData(originalContactData);
            setShowContactInformations(selectedContact !== null); // 기존 담당자 수정 중이었으면 창 유지, 신규였으면 닫기
            setIsNewContact(false);
            setIsFormDirty(false);
        }
    };


    // --- API 연동 함수들 ---

    // // 회사 검색 모달 열기
    // const handleCompanySearch = async () => {
    //     if (!formData.companyName) {
    //         alert('검색어를 입력해주세요.');
    //         return;
    //     }
    //     setSearchKeyword(formData.companyName);
    //     setShowSearchModal(true);
    //     setCurrentPage(1);
    //     await searchCompanies(formData.companyName, 1);
    // };
    // // [수정] 회사 검색 모달 열기 (빈 문자열 검색 허용)
    const handleCompanySearch = async () => {
        // 검색어 유무를 체크하던 if 문을 제거하여 항상 검색이 실행되도록 함
        setSearchKeyword(formData.companyName);
        setShowSearchModal(true);
        setCurrentPage(1);
        await searchCompanies(formData.companyName, 1);
    };

    // 회사 검색 실행
    const searchCompanies = async (keyword: string, page: number) => {
        try {
            setSearchLoading(true);
            const params = new URLSearchParams({
                search: keyword,
                skip: ((page - 1) * 10).toString(),
                limit: '10'
            });

            const listUrl = `http://localhost:8001/api/company-profile/?${params.toString()}`;
            const countUrl = `http://localhost:8001/api/company-profile/count?${params.toString()}`;

            const [listResponse, countResponse] = await Promise.all([fetch(listUrl), fetch(countUrl)]);

            if (!listResponse.ok) throw new Error(`HTTP ${listResponse.status}`);
            const data = await listResponse.json();
            setSearchResults(data);

            if (countResponse.ok) {
                const countData = await countResponse.json();
                setTotalPages(Math.ceil(countData.total_count / 10));
            } else {
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

    // 회사 선택 (데이터 로드)
    const selectCompany = async (companyId: number) => {
        try {
            const response = await fetch(`http://localhost:8001/api/company-profile/${companyId}`);
            if (!response.ok) throw new Error('회사 정보를 가져올 수 없습니다.');

            const detailedCompany = await response.json();
            const newFormData = {
                companyName: detailedCompany.company_name,
                basicOverview: detailedCompany.industry || '',
                representative: detailedCompany.representative || '',
                businessNumber: detailedCompany.business_number || '',
                contactInfo: [detailedCompany.phone, detailedCompany.email].filter(Boolean).join(' / '),
                address: detailedCompany.address || '',
                bankName: '', // 은행 정보는 별도 API 가정
                accountNumber: ''
            };

            setFormData(newFormData);
            setOriginalFormData(newFormData); // **원본 데이터 설정**

            setCompanyContacts(detailedCompany.contacts || []);
            setSelectedCompany(detailedCompany);

            // 모든 관련 상태 초기화
            setSelectedContact(null);
            setShowContactInformations(false);
            setContactFormData(initialContactState);
            setOriginalContactData(initialContactState);
            setIsFormDirty(false);
            setShowSearchModal(false);

            alert(`회사 "${detailedCompany.company_name}"이 선택되었습니다.`);
        } catch (error) {
            handleApiError(error);
            alert('회사 정보를 가져오는데 실패했습니다.');
        }
    };

    // 담당자 선택
    const handleContactSelect = (contact: CompanyContactData) => {
        setSelectedContact(contact);
        const newContactFormData = {
            department: contact.department || '',
            contactName: contact.contact_name || '',
            position: contact.position || '',
            phone: contact.phone || '',
            email: contact.email || '',
            responsibility: contact.responsibility || '',
            workStyle: contact.work_style || '',
            personalInfo: contact.personal_info || '',
            organizationInfo: contact.organization_info || '',
            relationship: contact.relationship_info || '',
            projectExperience: contact.project_experience || ''
        };
        setContactFormData(newContactFormData);
        setOriginalContactData(newContactFormData); // **원본 데이터 설정**
        setShowContactInformations(true);
        setIsNewContact(false);
        setIsFormDirty(false);
    };

    // 담당자 신규 등록 모드
    const handleNewContactRegistration = () => {
        if (!selectedCompany) {
            alert('먼저 회사를 선택해주세요.');
            return;
        }
        setSelectedContact(null);
        setContactFormData(initialContactState);
        setOriginalContactData(initialContactState); // **원본 데이터 설정 (빈 값)**
        setShowContactInformations(true);
        setIsNewContact(true);
        setIsFormDirty(false);
    };

    // **[수정] 메인 저장 함수 (모든 변경사항 처리)**
    const handleSubmit = async () => {
        // 저장 버튼 자체가 isFormDirty가 아닐 때 비활성화되지만, 방어코드로 남겨둡니다.
        if (!isFormDirty) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        // --- 분기 시작: 신규 생성이냐, 기존 수정이냐? ---
        if (!selectedCompany) {
            // [신규] 1. 신규 회사 생성 로직
            if (!formData.companyName) {
                alert('회사명을 입력해주세요.');
                return;
            }

            try {
                const url = `http://localhost:8001/api/company-profile/`;

                // 신규 회사 생성을 위한 페이로드 구성 (CompanyProfileCreate 스키마 준수)
                const creationPayload: {
                    company_name: string;
                    basic_overview: string;
                    representative: string;
                    business_number: string;
                    contact_info: string;
                    address: string;
                    bank_name: string;
                    account_number: string;
                    contacts: Array<{
                        contact_name: string;
                        position: string;
                        department: string;
                        phone: string;
                        email: string;
                        responsibility: string;
                        work_style: string;
                        personal_info: string;
                        organization_info: string;
                        relationship_info: string;
                        project_experience: string;
                        reports: any[];
                    }>;
                } = {
                    // 타입 정의와 일치하는 속성 할당
                    company_name: formData.companyName,
                    basic_overview: formData.basicOverview,
                    representative: formData.representative,
                    business_number: formData.businessNumber,
                    contact_info: formData.contactInfo,
                    address: formData.address,
                    bank_name: formData.bankName,
                    account_number: formData.accountNumber,
                    contacts: []
                };

                // 만약 신규 회사와 동시에 신규 담당자도 입력했다면, contacts 배열에 추가
                const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(initialContactState);
                if (isNewContact && contactDataChanged) {
                    creationPayload.contacts.push({
                        contact_name: contactFormData.contactName,
                        position: contactFormData.position,
                        department: contactFormData.department,
                        phone: contactFormData.phone,
                        email: contactFormData.email,
                        responsibility: contactFormData.responsibility,
                        work_style: contactFormData.workStyle,
                        personal_info: contactFormData.personalInfo,
                        organization_info: contactFormData.organizationInfo,
                        relationship_info: contactFormData.relationship,
                        project_experience: contactFormData.projectExperience,
                        reports: [] // 컨택리포트는 별도 API로 관리하는 것이 일반적
                    });
                }

                console.log("신규 회사 생성 API 호출:", url, creationPayload);

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(creationPayload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || '신규 회사 생성에 실패했습니다.');
                }

                const newlyCreatedCompany = await response.json();
                alert(`"${newlyCreatedCompany.company_name}" 회사가 성공적으로 등록되었습니다.`);

                // 생성된 회사 정보를 바로 화면에 로드
                await selectCompany(newlyCreatedCompany.id);

            } catch (error) {
                console.error('신규 회사 생성 오류:', error);
                alert(`저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }

        } else {
            // [기존] 2. 기존 회사 수정 로직
            try {
                const apiCalls = [];
                const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
                const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);

                // 회사 정보 수정 API 호출 준비
                if (companyDataChanged) {
                    const companyUpdateUrl = `http://localhost:8001/api/company-profile/${selectedCompany.id}`;
                    // ✅ [최적화된 페이로드] 백엔드 스키마에 정의된 필드만 포함
                    const companyPayload = {
                        company_name: formData.companyName,
                        basic_overview: formData.basicOverview,
                        representative: formData.representative,
                        business_number: formData.businessNumber,
                        contact_info: formData.contactInfo, // 개별 phone, email 대신 통합된 필드 사용
                        address: formData.address,
                        bank_name: formData.bankName,
                        account_number: formData.accountNumber
                    };

                    apiCalls.push(fetch(companyUpdateUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(companyPayload)
                    }));
                }

                // 담당자 정보 생성/수정 API 호출 준비
                if (contactDataChanged && (isNewContact || selectedContact)) {
                    const contactUrl = isNewContact
                        ? `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts`
                        : `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts/${selectedContact!.id}`;
                    const method = isNewContact ? 'POST' : 'PUT';
                    const contactPayload = {
                        contact_name: contactFormData.contactName,
                        position: contactFormData.position,
                        department: contactFormData.department,
                        phone: contactFormData.phone,
                        email: contactFormData.email,
                        // ... 나머지 필드 ...
                    };
                    apiCalls.push(fetch(contactUrl, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(contactPayload)
                    }));
                }

                if (apiCalls.length === 0) return;
                const responses = await Promise.all(apiCalls);
                for (const response of responses) {
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.detail || '저장 중 오류가 발생했습니다.');
                    }
                }

                alert('성공적으로 수정되었습니다.');
                await selectCompany(selectedCompany.id);

            } catch (error) {
                console.error('기존 회사 수정 오류:', error);
                alert(`수정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        }
    };


// --- 렌더링 컴포넌트 ---

    // 검색 모달 컴포넌트
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
                            <p>검색어: "{searchKeyword || '전체'}"</p>
                        </div>

                        {searchLoading ? (
                            <div className="loading">검색 중...</div>
                        ) : (
                            <>
                                {searchResults.length === 0 ? (
                                    <div className="no-results">검색 결과가 없습니다.</div>
                                ) : (
                                    <>
                                        {/* [확인] searchResults 변수를 사용하는 테이블 구조 */}
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
                                                            onClick={() => selectCompany(company.id)}
                                                        >
                                                            선택
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>

                                        {/* [확인] 페이지네이션 원본 구조 및 변수 사용법 수정 */}
                                        <div className="pagination">
                                            <button
                                                onClick={() => {
                                                    const newPage = currentPage - 1;
                                                    setCurrentPage(newPage);
                                                    searchCompanies(searchKeyword, newPage);
                                                }}
                                                disabled={currentPage <= 1}
                                            >
                                                이전
                                            </button>
                                            <span className="page-info">{currentPage} / {totalPages}</span>
                                            <button
                                                onClick={() => {
                                                    const newPage = currentPage + 1;
                                                    setCurrentPage(newPage);
                                                    searchCompanies(searchKeyword, newPage);
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
                        광고주 Profile 양식
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
                        광고주 Profile
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
                                        onChange={(e) => {
                                            // 회사명 직접 입력 시, 선택된 회사 정보와 연결 끊기
                                            if (selectedCompany) {
                                                setSelectedCompany(null);
                                                setCompanyContacts([]);
                                                setSelectedContact(null);
                                                setShowContactInformations(false);
                                            }
                                            handleInputChange(e);
                                        }}
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
                                        className="search-btn"
                                        onClick={handleCompanySearch}
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
                        <tr>
                            <td className="table-cell table-cell-label">은행명</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="bankName"
                                    value={formData.bankName}
                                    onChange={handleInputChange}
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
                                    className="profile-input"
                                />
                            </td>
                        </tr>

                        {/* 담당자 표시 부분 */}
                        <tr>
                            <td className="table-cell table-cell-label">담당자</td>
                            <td className="table-cell-input" colSpan={3}>
                                <div className="contact-section">
                                    {companyContacts.length > 0 ? (
                                        <div className="contact-list">
                                            {companyContacts.map((contact) => (
                                                <div
                                                    key={contact.id}
                                                    className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                                                    onClick={() => handleContactSelect(contact)}
                                                >
                                                <span className="contact-name">
                                                    {contact.contact_name}
                                                    {contact.is_primary && <span className="primary-badge">(주담당)</span>}
                                                </span>
                                                    {contact.position &&
                                                        <span className="contact-position"> - {contact.position}</span>}
                                                    {contact.department && <span
                                                        className="contact-department"> ({contact.department})</span>}
                                                    {contact.phone &&
                                                        <span className="contact-phone"> / {contact.phone}</span>}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-contacts">
                                            {selectedCompany ? '등록된 담당자가 없습니다.' : '회사를 선택하면 담당자 정보가 표시됩니다.'}
                                        </div>
                                    )}

                                    {/* 담당자 신규 등록 버튼을 리스트 하단에 배치 */}
                                    <div className="add-contact-section">
                                        {/* 왼쪽 공간을 채우기 위한 빈 div */}
                                        <div style={{ flex: 1 }}></div>

                                        {/* 가운데 정렬될 '담당자 신규 등록' 버튼 */}
                                        <button
                                            type="button"
                                            className="add-contact-btn"
                                            onClick={handleNewContactRegistration}
                                            disabled={!selectedCompany}
                                            style={{ flex: '0 1 auto' }} // 버튼 크기 자동 조절
                                        >
                                            담당자 신규 등록
                                        </button>

                                        {/* 오른쪽에 정렬될 '담당자 찾기' 버튼 */}
                                        <div style={{ flex: 1, textAlign: 'right' }}>
                                            <button
                                                type="button"
                                                className="find-contact-btn" // 새로운 CSS 클래스
                                                onClick={() => alert('담당자 찾기 기능 구현 필요')} // TODO: 담당자 찾기 기능 구현
                                                disabled={!selectedCompany}
                                            >
                                                담당자 찾기
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 담당자 상세 정보 및 컨택 리포트 - 신규 등록 또는 선택된 담당자가 있을 때 표시 */}
                {showContactInformations && (
                    <>
                        {/* 담당자 상세 정보 */}
                        <div className="profile-section">
                            <h3 className="section-header">
                                ■ 담당자 상세 정보 {selectedContact ? `- ${selectedContact.contact_name} (수정)` : '- 신규 등록'}
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
                                            value={contactFormData.department}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
                                    <td className="table-cell table-cell-label">직책/이름</td>
                                    <td className="table-cell-input">
                                        <div style={{display: 'flex', gap: '8px'}}>
                                            <input
                                                type="text"
                                                name="position"
                                                value={contactFormData.position}
                                                onChange={handleContactFormChange}
                                                className="profile-input"
                                                placeholder="직책"
                                                style={{flex: '0 0 80px'}}
                                            />
                                            <input
                                                type="text"
                                                name="contactName"
                                                value={contactFormData.contactName}
                                                onChange={handleContactFormChange}
                                                className="profile-input"
                                                placeholder="이름"
                                                style={{flex: '1'}}
                                            />
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label">연락처</td>
                                    <td className="table-cell-input">
                                        <input
                                            type="text"
                                            name="phone"
                                            value={contactFormData.phone}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
                                    <td className="table-cell table-cell-label">이메일</td>
                                    <td className="table-cell-input">
                                        <input
                                            type="email"
                                            name="email"
                                            value={contactFormData.email}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">담당 업무</td>
                                    <td className="table-cell-input" colSpan={3}>
                                    <textarea
                                        name="responsibility"
                                        value={contactFormData.responsibility}
                                        onChange={handleContactFormChange}
                                        className="profile-textarea textarea-medium"
                                    />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">업무 스타일</td>
                                    <td className="table-cell-input" colSpan={3}>
                                    <textarea
                                        name="workStyle"
                                        value={contactFormData.workStyle}
                                        onChange={handleContactFormChange}
                                        className="profile-textarea textarea-medium"
                                    />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">개별 특화정보</td>
                                    <td className="table-cell-input" colSpan={3}>
                                    <textarea
                                        name="personalInfo"
                                        value={contactFormData.personalInfo}
                                        onChange={handleContactFormChange}
                                        className="profile-textarea textarea-medium"
                                    />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">부서 및 조직정보</td>
                                    <td className="table-cell-input" colSpan={3}>
                                    <textarea
                                        name="organizationInfo"
                                        value={contactFormData.organizationInfo}
                                        onChange={handleContactFormChange}
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
                                        value={contactFormData.relationship}
                                        onChange={handleContactFormChange}
                                        className="profile-textarea textarea-large"
                                    />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>
                                    <td className="table-cell-input">
                                    <textarea
                                        name="projectExperience"
                                        value={contactFormData.projectExperience}
                                        onChange={handleContactFormChange}
                                        className="profile-textarea textarea-large"
                                    />
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* 컨택 리포트(회의록) */}
                        <div className="profile-section">
                            <h3 className="section-header section-header-margin">
                                ■ 컨택 리포트(회의록) {selectedContact ? `- ${selectedContact.contact_name}` : '- 신규 등록'}
                            </h3>

                            <table className="profile-table section-table">
                                <tbody>
                                <tr>
                                    <td className="table-header">날짜</td>
                                    <td className="table-header">내용</td>
                                </tr>

                                {/* 기존 리포트 렌더링 */}
                                {existingReports.map((report, index) => (
                                    <tr key={`report-${index}`}>
                                        <td className="contact-date-cell">{report.date}</td>
                                        <td className="table-cell-input">
                                            <div className="readonly-content" style={{whiteSpace: 'pre-wrap'}}>
                                                {report.content}
                                            </div>
                                        </td>
                                    </tr>
                                ))}

                                {/* 새 리포트 입력 행 */}
                                <tr className="new-report-row">
                                    <td className="contact-date-cell">
                                        <input
                                            type="text"
                                            value={newReportDate}
                                            onChange={(e) => setNewReportDate(e.target.value)}
                                            className="profile-date-input"
                                            placeholder="YYYY.MM.DD"
                                        />
                                    </td>
                                    <td className="table-cell-input">
                                        <div className="new-report-container">
                                        <textarea
                                            value={newReportContent}
                                            onChange={(e) => setNewReportContent(e.target.value)}
                                            className="profile-textarea textarea-large"
                                            placeholder="• 제목 및 안건: &#10;• 회의 및 내용: "
                                        />
                                            <button
                                                type="button"
                                                className="add-report-btn"
                                                onClick={handleAddReport}
                                                disabled={!newReportDate || !newReportContent}
                                            >
                                                추가
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}

                {/* [수정] 메인 버튼 섹션 */}
                <div className="button-section">
                    <button
                        type="button"
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={!isFormDirty}
                    >
                        저장
                    </button>
                    <button
                        type="button"
                        className="cancel-btn" // CSS에 .cancel-btn 스타일 추가 필요
                        onClick={handleCancelAllChanges}
                        disabled={!isFormDirty}
                    >
                        취소
                    </button>
                    <button type="button" className="print-btn" onClick={handlePrint}>
                        인쇄
                    </button>
                </div>
            </div>

            {/* 검색 모달 */}
            <CompanySearchModal/>
        </div>
    );
};

export default CompanyProfileForm;