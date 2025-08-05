// CompanyProfile.tsx - 완전한 소스 코드 (요구사항 반영)

import React, { useState, useEffect } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import '../../styles/CompanyProfile.css';

// --- 타입 정의 ---
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
    etcInfo?: string;
}

// 👉 NEW: API 요청용 타입 정의 추가
interface ContactCreatePayload {
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
    reports?: any[];
}

interface CompanyCreatePayload {
    company_name: string;
    basic_overview: string;
    representative: string;
    business_number: string;
    contact_info: string;
    address: string;
    bank_name: string;
    account_number: string;
    contacts: ContactCreatePayload[];
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
    const [isFormDirty, setIsFormDirty] = useState(false);

    // 검색 관련 상태
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<CompanyData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 👉 NEW: 담당자 검색 관련 상태
    const [contactSearchTerm, setContactSearchTerm] = useState('');

    // 컨택 리포트 상태
    const [existingReports, setExistingReports] = useState<Array<{ date: string; content: string; }>>([]);
    const [newReportDate, setNewReportDate] = useState('');
    const [newReportContent, setNewReportContent] = useState('');

    // --- useEffect ---
    useEffect(() => {
        const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
        const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);
        const isNewContactTyping = isNewContact && JSON.stringify(contactFormData) !== JSON.stringify(initialContactState);

        setIsFormDirty(companyDataChanged || contactDataChanged || isNewContactTyping);
    }, [formData, contactFormData, originalFormData, originalContactData, isNewContact]);

    // 👉 NEW: 회사명 변경 시 담당자 검색 초기화
    useEffect(() => {
        if (formData.companyName) {
            setContactSearchTerm('');
        }
    }, [formData.companyName]);

    // --- 핸들러 함수들 ---

    // 회사 정보 입력 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 담당자 정보 입력 핸들러
    const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContactFormData(prev => ({ ...prev, [name]: value }));
    };

    // 👉 NEW: 담당자 검색 핸들러
    const handleContactSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContactSearchTerm(e.target.value);
    };

    const handleContactSearch = async () => {
        if (!contactSearchTerm.trim()) {
            alert('검색어를 입력해주세요.');
            return;
        }

        try {
            // TODO: 담당자 검색 API 호출
            console.log('담당자 검색:', contactSearchTerm);
            alert(`'${contactSearchTerm}' 담당자 검색 기능을 구현해주세요.`);
        } catch (error) {
            console.error('담당자 검색 오류:', error);
            alert('담당자 검색 중 오류가 발생했습니다.');
        }
    };

    // 컨택 리포트 추가
    const handleAddReport = () => {
        if (newReportDate && newReportContent) {
            setExistingReports(prev => [...prev, { date: newReportDate, content: newReportContent }]);
            setNewReportDate('');
            setNewReportContent('');
        }
    };

    // 인쇄
    const handlePrint = () => {
        window.print();
    };

    // 전체 변경사항 취소 핸들러
    const handleCancelAllChanges = () => {
        if (window.confirm('수정 중인 모든 내용을 취소하고 원본 상태로 되돌리시겠습니까?')) {
            setFormData(originalFormData);
            setContactFormData(originalContactData);
            setShowContactInformations(selectedContact !== null);
            setIsNewContact(false);
            setIsFormDirty(false);
        }
    };

    // --- API 연동 함수들 ---

    // 회사 검색 모달 열기
    const handleCompanySearch = async () => {
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
                basicOverview: detailedCompany.basic_overview || '',
                representative: detailedCompany.representative || '',
                businessNumber: detailedCompany.business_number || '',
                contactInfo: detailedCompany.contact_info || '',
                address: detailedCompany.address || '',
                bankName: detailedCompany.bank_name || '',
                accountNumber: detailedCompany.account_number || ''
            };

            setFormData(newFormData);
            setOriginalFormData(newFormData);

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

    // 👉 수정된 담당자 선택 함수 (selectContact)
    const selectContact = (contact: CompanyContactData) => {
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
        setOriginalContactData(newContactFormData);
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
        setOriginalContactData(initialContactState);
        setShowContactInformations(true);
        setIsNewContact(true);
        setIsFormDirty(false);
    };

    // 메인 저장 함수
    const handleSubmit = async () => {
        if (!isFormDirty) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        // 신규 회사 생성 로직
        if (!selectedCompany) {
            if (!formData.companyName) {
                alert('회사명을 입력해주세요.');
                return;
            }

            try {
                const url = `http://localhost:8001/api/company-profile/`;

                // 👉 FIX: 명시적 타입 사용
                const creationPayload: CompanyCreatePayload = {
                    company_name: formData.companyName,
                    basic_overview: formData.basicOverview,
                    representative: formData.representative,
                    business_number: formData.businessNumber,
                    contact_info: formData.contactInfo,
                    address: formData.address,
                    bank_name: formData.bankName,
                    account_number: formData.accountNumber,
                    contacts: [] // 이제 ContactCreatePayload[] 타입으로 명시됨
                };

                const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(initialContactState);
                if (isNewContact && contactDataChanged) {
                    const contactPayload: ContactCreatePayload = {
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
                        reports: []
                    };
                    creationPayload.contacts.push(contactPayload);
                }

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

                await selectCompany(newlyCreatedCompany.id);

            } catch (error) {
                console.error('신규 회사 생성 오류:', error);
                alert(`저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        } else {
            // 기존 회사 수정 로직
            try {
                const apiCalls = [];
                const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
                const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);

                if (companyDataChanged) {
                    const companyUpdateUrl = `http://localhost:8001/api/company-profile/${selectedCompany.id}`;
                    const companyPayload = {
                        company_name: formData.companyName,
                        basic_overview: formData.basicOverview,
                        representative: formData.representative,
                        business_number: formData.businessNumber,
                        contact_info: formData.contactInfo,
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
                        responsibility: contactFormData.responsibility,
                        work_style: contactFormData.workStyle,
                        personal_info: contactFormData.personalInfo,
                        organization_info: contactFormData.organizationInfo,
                        relationship_info: contactFormData.relationship,
                        project_experience: contactFormData.projectExperience
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
                                    <table className="search-table">
                                        <thead>
                                        <tr>
                                            <th>회사명</th>
                                            <th>사업자번호</th>
                                            <th>대표자</th>
                                            <th>등록일</th>
                                            <th>선택</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {searchResults.map((company) => (
                                            <tr key={company.id}>
                                                <td>{company.company_name}</td>
                                                <td>{company.business_number || '-'}</td>
                                                <td>{company.representative || '-'}</td>
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
                                )}

                                {/* 페이지네이션 */}
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => {
                                                    setCurrentPage(page);
                                                    searchCompanies(searchKeyword, page);
                                                }}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>
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
                                        onChange={handleInputChange}
                                        className="profile-input"
                                        placeholder="회사명을 입력하세요"
                                    />
                                    <button
                                        type="button"
                                        className="search-btn"
                                        onClick={handleCompanySearch}
                                        title="회사 검색"
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
                            <td className="table-cell table-cell-label">대표자</td>
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
                            <td className="table-cell table-cell-label">거래은행</td>
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

                        {/* 👉 수정된 담당자 섹션 */}
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">담당자</td>
                            <td className="table-cell-input" colSpan={3}>
                                <div className="contact-section">
                                    {/* 👉 수정: 담당자 검색 필드를 상시 노출 */}
                                    <div className="input-with-search contact-search-field contact-search-visible">
                                        <input
                                            type="text"
                                            placeholder="담당자 이름으로 검색"
                                            value={contactSearchTerm}
                                            onChange={handleContactSearchChange}
                                            className="profile-input"
                                            onKeyPress={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleContactSearch();
                                                }
                                            }}
                                        />
                                        <button
                                            type="button"
                                            className="search-btn"
                                            onClick={handleContactSearch}
                                            title="담당자 검색"
                                        >
                                            🔍
                                        </button>
                                    </div>

                                    {/* 기존 담당자 리스트 */}
                                    {companyContacts.length > 0 ? (
                                        <div className="contact-list">
                                            {companyContacts.map((contact, index) => (
                                                <div
                                                    key={contact.id}
                                                    className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                                                    onClick={() => selectContact(contact)}
                                                >
                                                    {/* 👉 수정: 한 줄에 모든 정보 표시 */}
                                                    <div className="contact-info-line">
                                                        <span className="contact-name">
                                                            {contact.contact_name}
                                                            {contact.is_primary && <span className="primary-badge">주담당자</span>}
                                                        </span>
                                                        <span className="contact-separator">|</span>
                                                        <span className="contact-position">{contact.position || '-'}</span>
                                                        <span className="contact-separator">|</span>
                                                        <span className="contact-department">{contact.department || '-'}</span>
                                                        <span className="contact-separator">|</span>
                                                        <span className="contact-phone">{contact.phone || '-'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-contacts">
                                            {selectedCompany
                                                ? '등록된 담당자가 없습니다.'
                                                : '회사를 선택하면 담당자 정보가 표시됩니다.'
                                            }
                                        </div>
                                    )}

                                    {/* 👉 수정: '담당자 찾기' 버튼 제거, '담당자 신규 등록'만 중앙 정렬 */}
                                    <div className="add-contact-section">
                                        <button
                                            type="button"
                                            className="add-contact-btn"
                                            onClick={handleNewContactRegistration}
                                            disabled={!selectedCompany}
                                        >
                                            담당자 신규 등록
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 담당자 상세 정보 및 컨택 리포트 */}
                {showContactInformations && (
                    <>
                        {/* 담당자 상세 정보 */}
                        <div className="profile-section contact-detail-section">
                            <h3 className="section-header section-header-attached">
                                ■ 담당자 상세 정보 {selectedContact ?
                                `(${selectedContact.contact_name})` :
                                '(신규 등록)'}
                            </h3>
                            <table className="profile-table" >
                                <tbody>
                                <tr>
                                    <td className="table-header">구분</td>
                                    <td className="table-header" colSpan={4}>내용</td>
                                    {/*<td className="table-header">구분</td>*/}
                                    {/*<td className="table-header">내용</td>*/}
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label">소속/부서</td>
                                    <td className="table-cell-input" colSpan={2}>
                                        <input
                                            type="text"
                                            name="department"
                                            value={contactFormData.department}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
                                    <td className="table-cell table-cell-label">이름/직책</td>
                                    <td className="table-cell-input">
                                        <input
                                            type="text"
                                            name="contactName"
                                            value={contactFormData.contactName}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label">직급</td>
                                    <td className="table-cell-input" colSpan={2}>
                                        <input
                                            type="text"
                                            name="position"
                                            value={contactFormData.position}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
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
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label">이메일</td>
                                    <td className="table-cell-input" colSpan={2}>
                                        <input
                                            type="email"
                                            name="email"
                                            value={contactFormData.email}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
                                    <td className="table-cell table-cell-label">담당업무</td>
                                    <td className="table-cell-input">
                                        <input
                                            type="text"
                                            name="responsibility"
                                            value={contactFormData.responsibility}
                                            onChange={handleContactFormChange}
                                            className="profile-input"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top" rowSpan={6}>부가 정보</td>
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
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">지엠컴과 관계성</td>
                                    <td className="table-cell-input" colSpan={3}>
                                        <textarea
                                            name="relationship"
                                            value={contactFormData.relationship}
                                            onChange={handleContactFormChange}
                                            className="profile-textarea textarea-medium"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>
                                    <td className="table-cell-input" colSpan={3}>
                                        <textarea
                                            name="projectExperience"
                                            value={contactFormData.projectExperience}
                                            onChange={handleContactFormChange}
                                            className="profile-textarea textarea-medium"
                                        />
                                    </td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label table-cell-top">비고 / 기타</td>
                                    <td className="table-cell-input" colSpan={3}>
                                        <textarea
                                            name="etcInfo"
                                            value={contactFormData.etcInfo}
                                            onChange={handleContactFormChange}
                                            className="profile-textarea textarea-medium"
                                        />
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        {/*<div className="profile-section contact-report-section">*/}
                        {/*    /!* 담당자 추가 정보 테이블 *!/*/}
                        {/*    <h3 className="section-header section-header-attached">*/}
                        {/*        ■ 히스토리 {selectedContact ?*/}
                        {/*        `(${selectedContact.contact_name})` :*/}
                        {/*        '(신규 등록)'}*/}
                        {/*    </h3>*/}
                        {/*    <table className="profile-table">*/}
                        {/*        <tbody>*/}
                        {/*        <tr>*/}
                        {/*            <td className="table-header">구분</td>*/}
                        {/*            <td className="table-header">내용</td>*/}
                        {/*        </tr>*/}
                        {/*        <tr>*/}
                        {/*            <td className="table-cell table-cell-label table-cell-top">지엠컴과 관계성</td>*/}
                        {/*            <td className="table-cell-input">*/}
                        {/*                <textarea*/}
                        {/*                    name="relationship"*/}
                        {/*                    value={contactFormData.relationship}*/}
                        {/*                    onChange={handleContactFormChange}*/}
                        {/*                    className="profile-textarea textarea-large"*/}
                        {/*                />*/}
                        {/*            </td>*/}
                        {/*        </tr>*/}
                        {/*        <tr>*/}
                        {/*            <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>*/}
                        {/*            <td className="table-cell-input">*/}
                        {/*                <textarea*/}
                        {/*                    name="projectExperience"*/}
                        {/*                    value={contactFormData.projectExperience}*/}
                        {/*                    onChange={handleContactFormChange}*/}
                        {/*                    className="profile-textarea textarea-large"*/}
                        {/*                />*/}
                        {/*            </td>*/}
                        {/*        </tr>*/}
                        {/*        <tr>*/}
                        {/*            <td className="table-cell table-cell-label table-cell-top">비고 / 기타</td>*/}
                        {/*            <td className="table-cell-input">*/}
                        {/*                <textarea*/}
                        {/*                    name="projectExperience"*/}
                        {/*                    value={contactFormData.etcInfo}*/}
                        {/*                    onChange={handleContactFormChange}*/}
                        {/*                    className="profile-textarea textarea-large"*/}
                        {/*                />*/}
                        {/*            </td>*/}
                        {/*        </tr>*/}
                        {/*        </tbody>*/}
                        {/*    </table>*/}
                        {/*</div>*/}

                        {/* 컨택 리포트(회의록) */}
                        <div className="profile-section contact-report-section">
                            <h3 className="section-header section-header-attached">
                                ■ 컨택 리포트(회의록) {selectedContact ?
                                `(${selectedContact.contact_name})` :
                                '(신규 등록)'}
                            </h3>

                            {/* 기존 리포트 목록 */}
                            {existingReports.length > 0 && (
                                <div className="existing-reports">
                                    {/*<h4>기존 컨택 리포트</h4>*/}
                                    {existingReports.map((report, index) => (
                                        <div key={index} className="report-item">
                                            <div className="report-date">{report.date}</div>
                                            <div className="report-content">{report.content}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* 신규 리포트 작성 */}
                            <table className="profile-table">
                                <tbody>
                                <tr>
                                    <td className="table-header">날짜</td>
                                    <td className="table-header">주요 내용</td>
                                </tr>
                                <tr>
                                    {/*<td className="table-cell table-cell-label">컨택 날짜</td>*/}
                                    <td className="table-cell table-cell-label table-cell-top">
                                        <input
                                            type="date"
                                            value={newReportDate}
                                            onChange={(e) => setNewReportDate(e.target.value)}
                                            className="profile-date-input"
                                        />
                                    </td>
                                    <td className="table-cell-input">
                                        <textarea
                                            value={newReportContent}
                                            onChange={(e) => setNewReportContent(e.target.value)}
                                            className="profile-textarea textarea-large"
                                            placeholder="미팅 내용을 입력하세요..."
                                        />
                                    </td>
                                </tr>
                                </tbody>
                            </table>

                            <div className="report-actions">
                                <button
                                    type="button"
                                    className="add-report-btn"
                                    onClick={handleAddReport}
                                    disabled={!newReportDate || !newReportContent}
                                >
                                    리포트 추가
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* 하단 버튼 영역 */}
                <div className="profile-actions">
                    <div className="action-group">
                        <button
                            type="button"
                            className="action-btn save-btn"
                            onClick={handleSubmit}
                            disabled={!isFormDirty}
                        >
                            💾 저장
                        </button>
                        <button
                            type="button"
                            className="action-btn cancel-btn"
                            onClick={handleCancelAllChanges}
                            disabled={!isFormDirty}
                        >
                            ↩️ 취소
                        </button>
                        <button
                            type="button"
                            className="action-btn print-btn"
                            onClick={handlePrint}
                        >
                            🖨️ 인쇄
                        </button>
                    </div>

                    {/* 변경사항 알림 */}
                    {isFormDirty && (
                        <div className="dirty-indicator">
                            ⚠️ 저장되지 않은 변경사항이 있습니다.
                        </div>
                    )}
                </div>
            </div>

            {/* 검색 모달 */}
            <CompanySearchModal />
        </div>
    );
};

export default CompanyProfileForm;