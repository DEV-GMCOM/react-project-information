// CompanyProfile.tsx - 완전히 새로 정리된 코드

import React, { useState } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import '../../styles/CompanyProfile.css';

// 담당자 데이터 타입 정의
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

// 회사 데이터 타입 정의 (담당자 정보 포함)
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
    existingReports: Array<{
        date: string;
        content: string;
    }>;
    newReportDate: string;
    newReportContent: string;
    selectedCompanyId?: number;
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

    // 담당자 관련 상태
    const [companyContacts, setCompanyContacts] = useState<CompanyContactData[]>([]);
    const [selectedContact, setSelectedContact] = useState<CompanyContactData | null>(null);

    // 담당자 폼 데이터 상태 (신규/수정용)
    const [contactFormData, setContactFormData] = useState({
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
    });

    // 원본 데이터 (수정 감지용)
    const [originalContactData, setOriginalContactData] = useState({
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
    });

    // 수정 상태 관리
    const [hasChanges, setHasChanges] = useState(false);
    const [isNewContact, setIsNewContact] = useState(false);

    // 수정 감지 함수
    const checkForChanges = (newData: typeof contactFormData) => {
        const changed = Object.keys(newData).some(key => {
            return newData[key as keyof typeof newData] !== originalContactData[key as keyof typeof originalContactData];
        });
        setHasChanges(changed);
    };

    // 담당자 폼 데이터 변경 핸들러
    const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const newFormData = { ...contactFormData, [name]: value };
        setContactFormData(newFormData);
        checkForChanges(newFormData);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        // 회사명이 변경될 때 모든 관련 상태 초기화
        if (name === 'companyName') {
            setSelectedCompany(null);
            setCompanyContacts([]);
            setSelectedContact(null);
            setShowContactInformations(false);
            setHasChanges(false);
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

    // 회사 검색 함수
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

    // 회사 선택 함수 (담당자 정보 포함)
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

            // 선택 상태 초기화
            setSelectedContact(null);
            setShowContactInformations(false);
            setSelectedCompany(detailedCompany);
            setShowSearchModal(false);

            alert(`회사 "${detailedCompany.company_name}"이 선택되었습니다.${detailedCompany.contacts?.length ? ` (담당자 ${detailedCompany.contacts.length}명)` : ''}`);

        } catch (error) {
            console.error('회사 선택 오류:', error);
            alert('회사 정보를 가져오는데 실패했습니다.');
        }
    };

    // 담당자 선택 함수 (클릭 시 상세정보와 컨택리포트 모두 표시)
    const handleContactSelect = (contact: CompanyContactData) => {
        console.log('담당자 선택됨:', contact);
        setSelectedContact(contact);
        setShowContactInformations(true);

        // 선택된 담당자 정보를 폼에 설정
        const formData = {
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

        setContactFormData(formData);
        setOriginalContactData(formData); // 원본 데이터로 설정
        setIsNewContact(false);
        setHasChanges(false);
    };

    // 담당자 신규 등록 버튼 함수
    const handleNewContactRegistration = () => {
        if (!selectedCompany) {
            alert('먼저 회사를 선택해주세요.');
            return;
        }

        // 항상 신규 등록 모드로 설정
        setSelectedContact(null);
        setShowContactInformations(true);

        // 빈 폼으로 초기화
        const emptyFormData = {
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

        setContactFormData(emptyFormData);
        setOriginalContactData(emptyFormData);
        setIsNewContact(true);
        setHasChanges(false);
    };

    // 회사 정보와 담당자 정보를 함께 조회하는 함수
    const fetchCompanyDetailsWithContacts = async (companyId: number) => {
        try {
            const response = await fetch(`http://localhost:8001/api/company-profile/${companyId}`);
            if (response.ok) {
                const companyData = await response.json();

                // 담당자 정보 설정
                if (companyData.contacts && companyData.contacts.length > 0) {
                    setCompanyContacts(companyData.contacts);
                } else {
                    setCompanyContacts([]);
                }

                setSelectedCompany(companyData);
            }
        } catch (error) {
            console.error('회사 정보 조회 실패:', error);
        }
    };

    // 담당자 저장 API 호출
    const handleSaveContact = async () => {
        if (!selectedCompany || !hasChanges) return;

        try {
            const apiData = {
                companyId: selectedCompany.id,
                contactData: {
                    // 담당자 기본 정보 (company_contacts 테이블)
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
                    is_primary: false // 기본값
                },
                isNew: isNewContact, // 신규/수정 구분
                contactId: selectedContact?.id || null // 수정시 담당자 ID
            };

            const url = isNewContact
                ? `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts`
                : `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts/${selectedContact?.id}`;

            const method = isNewContact ? 'POST' : 'PUT';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });

            if (response.ok) {
                const result = await response.json();
                console.log('담당자 저장 완료:', result);
                alert(isNewContact ? '신규 담당자가 등록되었습니다.' : '담당자 정보가 수정되었습니다.');

                // 회사 정보 다시 로드하여 담당자 리스트 갱신
                await fetchCompanyDetailsWithContacts(selectedCompany.id);

                // 폼 상태 초기화
                setOriginalContactData(contactFormData);
                setHasChanges(false);

            } else {
                const errorData = await response.json();
                alert('저장 실패: ' + (errorData.detail || '알 수 없는 오류'));
            }
        } catch (error) {
            console.error('담당자 저장 오류:', error);
            alert('저장 실패: 네트워크 오류');
        }
    };

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

                                    {/* 담당자 신규 등록 버튼을 리스트 하단에 배치 */}
                                    <div className="add-contact-section">
                                        <button
                                            type="button"
                                            className="add-contact-btn"
                                            onClick={handleNewContactRegistration}
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
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                type="text"
                                                name="position"
                                                value={contactFormData.position}
                                                onChange={handleContactFormChange}
                                                className="profile-input"
                                                placeholder="직책"
                                                style={{ flex: '0 0 80px' }}
                                            />
                                            <input
                                                type="text"
                                                name="contactName"
                                                value={contactFormData.contactName}
                                                onChange={handleContactFormChange}
                                                className="profile-input"
                                                placeholder="이름"
                                                style={{ flex: '1' }}
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

                        {/* 컨택 리포트(회의록) - 선택된 담당자가 있을 때만 또는 신규 등록 모드일 때 */}
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

                                {/* 선택된 담당자가 있을 때만 기존 리포트 표시 (읽기 전용) */}
                                {selectedContact && (
                                    <tr>
                                        <td className="contact-date-cell">
                                            <div className="contact-date">2025.01.15</div>
                                        </td>
                                        <td className="table-cell-input">
                                            <div className="contact-content readonly-content" style={{
                                                backgroundColor: '#f8f9fa',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                color: '#6c757d'
                                            }}>
                                                • 제목 및 안건: {selectedContact.contact_name}과의 프로젝트 논의{'\n'}
                                                • 회의 및 내용: 담당 업무 범위 및 일정 협의{'\n'}
                                                • 결과: 다음 주 세부 계획 수립 예정
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* 새 리포트 입력 행 - 항상 수정 가능 */}
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

                        {/* 저장/취소 버튼 - 항상 표시 */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                            marginTop: '20px',
                            paddingTop: '20px',
                            borderTop: '1px solid #ddd'
                        }}>
                            <button
                                type="button"
                                className="submit-btn"
                                onClick={handleSaveContact}
                                disabled={!hasChanges}
                                style={{
                                    opacity: hasChanges ? 1 : 0.5,
                                    cursor: hasChanges ? 'pointer' : 'not-allowed'
                                }}
                            >
                                {isNewContact ? '신규 담당자 저장' : '담당자 수정 저장'}
                            </button>
                            <button
                                type="button"
                                className="print-btn"
                                onClick={() => {
                                    setShowContactInformations(false);
                                    setSelectedContact(null);
                                    setHasChanges(false);
                                }}
                                style={{ backgroundColor: '#6c757d' }}
                            >
                                취소
                            </button>
                        </div>
                    </>
                )}

                {/* 버튼 섹션 */}
                <div className="button-section">
                    <button type="button" className="submit-btn" onClick={handleSubmit}>
                        저장
                    </button>
                    <button type="button" className="print-btn" onClick={handlePrint}>
                        인쇄
                    </button>
                </div>
            </div>

            {/* 검색 모달 */}
            <CompanySearchModal />
        </div>
    );
};

export default CompanyProfileForm;