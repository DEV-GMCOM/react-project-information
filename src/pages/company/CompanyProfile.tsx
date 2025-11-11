import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
// ▼▼▼ apiClient 경로는 실제 프로젝트 구조에 맞게 확인해주세요. ▼▼▼
import apiClient from '../../api/utils/apiClient';
import { handleApiError } from '../../api/utils/errorUtils';
import { usePermissions } from '../../hooks/usePermissions';
import { useHelp } from '../../contexts/HelpContext';

import '../../styles/CompanyProfile.css';

// --- 타입 정의 (생략 없음) ---
interface ContactReportResponse {
    id: number;
    contact_date: string;
    content: string;
    created_at: string;
    updated_at?: string;
}

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
    notes?: string;
    reports?: ContactReportResponse[];
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
    basic_overview?: string;
    contact_info?: string;
    bank_name?: string;
    account_number?: string;
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
    notes: string;
}

interface ContactSearchData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    phone?: string;
    email?: string;
    is_primary: boolean;
    responsibility?: string;
    work_style?: string;
    personal_info?: string;
    organization_info?: string;
    relationship_info?: string;
    project_experience?: string;
    company: {
        id: number;
        company_name: string;
    };
    notes?: string;
}

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
    notes?: string;
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
    projectExperience: '',
    notes: ''
};


// ==============================================================================
//  ✅ 1. 최종 수정된 담당자 검색 입력 컴포넌트
// ==============================================================================
interface ContactSearchInputProps {
    searchTerm: string;
    // ✨ [수정] onSearch가 searchTerm을 인자로 받도록 변경
    onSearch: (searchTerm: string) => void;
    // ✨ [수정] 부모의 상태를 직접 수정할 수 있도록 setSearchTerm prop 추가
    setSearchTerm: (value: string) => void;
}

// ✨ [수정] props에서 setSearchTerm을 받아옵니다.
const ContactSearchInput: React.FC<ContactSearchInputProps> = ({ searchTerm, onSearch, setSearchTerm }) => {
    // 자체 내부 상태를 사용하여 자소 분리 현상을 방지합니다.
    const [localTerm, setLocalTerm] = useState(searchTerm);

    // 부모의 searchTerm prop이 변경될 때(예: 모달에서 수정)마다 내부 상태를 동기화합니다.
    useEffect(() => {
        setLocalTerm(searchTerm);
    }, [searchTerm]);

    const handleSearch = () => {
        // 검색을 실행할 때, 내부 상태값으로 부모의 onSearch 함수를 호출합니다.
        onSearch(localTerm);
    };

    return (
        <div className="input-with-search contact-search-field contact-search-visible">
            <input
                type="text"
                placeholder="담당자 이름으로 검색"
                value={localTerm}
                onChange={(e) => {
                    // ✨ [수정] onChange에서는 내부 상태와 부모 상태를 모두 업데이트합니다.
                    setLocalTerm(e.target.value);
                    setSearchTerm(e.target.value);
                }}
                className="profile-input"
                onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                        handleSearch();
                    }
                }}
            />
            <button
                type="button"
                className="search-btn"
                onClick={handleSearch}
                title="담당자 검색"
            >
                🔍
            </button>
        </div>
    );
};

const CompanyProfileForm: React.FC = () => {
    const { hasFinanceAccess, canEditFinance } = usePermissions();
    const [formData, setFormData] = useState<CompanyProfile>(initialCompanyState);
    const [contactFormData, setContactFormData] = useState<ContactProfile>(initialContactState);
    const [originalFormData, setOriginalFormData] = useState<CompanyProfile>(initialCompanyState);
    const [originalContactData, setOriginalContactData] = useState<ContactProfile>(initialContactState);
    const [selectedCompany, setSelectedCompany] = useState<CompanyData | null>(null);
    const [companyContacts, setCompanyContacts] = useState<CompanyContactData[]>([]);
    const [selectedContact, setSelectedContact] = useState<CompanyContactData | null>(null);
    const [showContactInformations, setShowContactInformations] = useState(false);
    const [isNewContact, setIsNewContact] = useState(false);
    const [isFormDirty, setIsFormDirty] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<CompanyData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);
    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    const [contactSearchCurrentPage, setContactSearchCurrentPage] = useState(1);
    const [contactSearchTotalPages, setContactSearchTotalPages] = useState(1);

    const [contactReports, setContactReports] = useState<ContactReportResponse[]>([]);
    const [newReportDate, setNewReportDate] = useState('');
    const [newReportContent, setNewReportContent] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    const [tempReports, setTempReports] = useState<Array<{id: string, contact_date: string, content: string, isTemp: boolean}>>([]);
    const [originalTempReports, setOriginalTempReports] = useState<Array<{id: string, contact_date: string, content: string, isTemp: boolean}>>([]);
    const [showSimilarCompaniesModal, setShowSimilarCompaniesModal] = useState(false);
    const [similarCompanies, setSimilarCompanies] = useState<CompanyData[]>([]);

    const { setHelpContent } = useHelp();

    // useEffect로 마운트 시 도움말 컨텐츠 등록
    useEffect(() => {
        setHelpContent({
            pageName: '광고주 기업 프로파일',
            content: (
                <>
                    <div className="help-section">
                        <h3>📋 광고주 기업 프로파일 작성 가이드</h3>
                        <p>
                            광고주 기업 프로파일은 클라이언트 기업에 대한 기본 정보와
                            담당자 정보를 체계적으로 관리하기 위한 페이지입니다.
                        </p>
                    </div>

                    <div className="help-section">
                        <h3>🔍 회사 검색 방법</h3>
                        <ul>
                            <li><strong>회사명 입력 후 검색:</strong> 회사명 입력 필드에 검색어를 입력하고 엔터키를 누르거나 🔍 버튼을 클릭합니다.</li>
                            <li><strong>검색 결과 선택:</strong> 검색 결과 모달에서 원하는 회사를 선택하면 자동으로 정보가 로드됩니다.</li>
                            <li><strong>신규 회사:</strong> 검색 결과가 없으면 신규 회사로 작성할 수 있습니다.</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>👤 담당자 정보 관리</h3>
                        <ul>
                            <li><strong>담당자 선택:</strong> 회사를 선택하면 등록된 담당자 목록이 표시됩니다.</li>
                            <li><strong>주담당자:</strong> <code>주</code> 뱃지가 표시된 담당자가 주담당자입니다.</li>
                            <li><strong>신규 담당자:</strong> '신규 담당자 작성' 버튼을 클릭하여 새 담당자를 추가할 수 있습니다.</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📝 작성 항목 설명</h3>
                        <p><strong>클라이언트 기업 정보:</strong></p>
                        <ul>
                            <li>회사명, 대표자, 사업자등록번호 등 기본 정보</li>
                            <li>회사 개요: 사업 분야, 특징 등</li>
                            <li>은행 정보: 거래 은행 및 계좌번호</li>
                        </ul>

                        <p><strong>담당자 상세 정보:</strong></p>
                        <ul>
                            <li>소속/부서, 직책, 연락처, 이메일</li>
                            <li>담당 업무 및 업무 스타일</li>
                            <li>개별 특화정보 및 조직정보</li>
                        </ul>
                    </div>

                    <div className="help-tip">
                        <strong>💡 TIP:</strong> 저장 버튼은 우측 상단에 있으며,
                        작성 중인 내용은 자동 저장되지 않으므로 주기적으로 저장하세요.
                    </div>
                </>
            )
        });

        // 컴포넌트 언마운트 시 정리
        return () => {
            setHelpContent(null);
        };
    }, [setHelpContent]);

    useEffect(() => {
        const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
        const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);
        const isNewContactTyping = isNewContact && JSON.stringify(contactFormData) !== JSON.stringify(initialContactState);
        const tempReportChanged = JSON.stringify(tempReports) !== JSON.stringify(originalTempReports);

        setIsFormDirty(companyDataChanged || contactDataChanged || isNewContactTyping || tempReportChanged);
    }, [formData, contactFormData, originalFormData, originalContactData, isNewContact, tempReports, originalTempReports]);

    useEffect(() => {
        if (formData.companyName) {
            setContactSearchTerm('');
        }
    }, [formData.companyName]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setContactFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleContactSearch = async (term: string) => {
        setContactSearchTerm(term);
        setShowContactSearchModal(true);
        setContactSearchCurrentPage(1);
        await searchContacts(term, 1);
    };

    const handleAddReport = () => {
        if (!newReportDate || !newReportContent) {
            alert('날짜와 내용을 모두 입력해주세요.');
            return;
        }
        const tempId = `temp_${Date.now()}`;
        const newTempReport = { id: tempId, contact_date: newReportDate, content: newReportContent, isTemp: true };
        setTempReports(prev => {
            const updated = [...prev, newTempReport];
            return updated.sort((a, b) => new Date(a.contact_date).getTime() - new Date(b.contact_date).getTime());
        });
        setNewReportDate('');
        setNewReportContent('');
        alert('리포트가 목록에 추가되었습니다. 저장 버튼을 눌러 최종 저장해주세요.');
    };

    const getAllReports = () => {
        const dbReports = contactReports.map(report => ({ ...report, isTemp: false }));
        return [...dbReports, ...tempReports].sort((a, b) => new Date(a.contact_date).getTime() - new Date(b.contact_date).getTime());
    };

    const handleCancelAllChanges = () => {
        if (window.confirm('수정 중인 모든 내용을 취소하고 원본 상태로 되돌리시겠습니까?')) {
            setFormData(originalFormData);
            setContactFormData(originalContactData);
            setShowContactInformations(selectedContact !== null);
            setIsNewContact(false);
            setIsFormDirty(false);
            setTempReports(originalTempReports);
            setNewReportDate('');
            setNewReportContent('');
        }
    };

    const handleCompanySearch = async () => {
        setSearchKeyword(formData.companyName);
        setShowSearchModal(true);
        setCurrentPage(1);
        await searchCompanies(formData.companyName, 1);
    };

    const searchCompanies = async (keyword: string, page: number) => {
        try {
            setSearchLoading(true);
            const params = { search: keyword, skip: (page - 1) * 10, limit: 10 };
            const listResponse = await apiClient.get('/company-profile/', { params });
            const countResponse = await apiClient.get('/company-profile/count', { params });
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

    const selectCompany = async (companyId: number) => {
        try {
            const response = await apiClient.get(`/company-profile/${companyId}`);
            const detailedCompany = response.data;
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
            setSelectedContact(null);
            setShowContactInformations(false);
            setContactFormData(initialContactState);
            setOriginalContactData(initialContactState);
            setIsFormDirty(false);
            setShowSearchModal(false);
            setContactReports([]);
            setTempReports([]);
            setOriginalTempReports([]);
            alert(`회사 "${detailedCompany.company_name}"이 선택되었습니다.`);
        } catch (error) {
            handleApiError(error);
            alert('회사 정보를 가져오는데 실패했습니다.');
        }
    };

    const searchContacts = async (keyword: string, page: number) => {
        try {
            setContactSearchLoading(true);
            const params = { search: keyword, skip: (page - 1) * 10, limit: 10 };
            const listResponse = await apiClient.get('/company-profile/contacts/search', { params });
            const countResponse = await apiClient.get('/company-profile/contacts/search/count', { params });
            setContactSearchResults(listResponse.data);
            setContactSearchTotalPages(Math.ceil(countResponse.data.total_count / 10));
        } catch (error) {
            console.error('담당자 검색 오류:', error);
            alert('담당자 검색 중 오류가 발생했습니다.');
        } finally {
            setContactSearchLoading(false);
        }
    };

    const selectSearchedContact = async (contact: ContactSearchData) => {
        try {
            await selectCompany(contact.company.id);
            const contactData: CompanyContactData = {
                id: contact.id,
                contact_name: contact.contact_name,
                position: contact.position,
                department: contact.department,
                phone: contact.phone,
                email: contact.email,
                is_primary: contact.is_primary,
                responsibility: contact.responsibility,
                work_style: contact.work_style,
                personal_info: contact.personal_info,
                organization_info: contact.organization_info,
                relationship_info: contact.relationship_info,
                project_experience: contact.project_experience,
                notes: contact.notes
            };
            selectContact(contactData);
            setShowContactSearchModal(false);
            setContactSearchTerm('');
            alert(`${contact.contact_name}(${contact.company.company_name}) 담당자가 선택되었습니다.`);
        } catch (error) {
            console.error('담당자 선택 오류:', error);
            alert('담당자 선택 중 오류가 발생했습니다.');
        }
    };

    const loadContactReports = async (contactId: number) => {
        if (!selectedCompany) return;
        try {
            setReportLoading(true);
            const response = await apiClient.get(`/company-profile/${selectedCompany.id}/contacts/${contactId}/reports`);
            setContactReports(response.data);
        } catch (error) {
            console.error('리포트 로드 오류:', error);
        } finally {
            setReportLoading(false);
        }
    };

    const saveTempReports = async () => {
        if (!selectedCompany || !selectedContact || tempReports.length === 0) return true;
        try {
            for (const tempReport of tempReports) {
                const payload = { contact_date: tempReport.contact_date, content: tempReport.content };
                await apiClient.post(`/company-profile/${selectedCompany.id}/contacts/${selectedContact.id}/reports`, payload);
            }
            await loadContactReports(selectedContact.id);
            setTempReports([]);
            setOriginalTempReports([]);
            return true;
        } catch (error) {
            console.error('리포트 저장 오류:', error);
            throw error;
        }
    };

    const handleSave = async (forceSave: boolean = false) => {
        if (!isFormDirty && !forceSave) {
            alert('변경된 내용이 없습니다.');
            return;
        }

        if (!selectedCompany) {
            if (!formData.companyName.trim()) {
                alert('회사명을 입력해주세요.');
                return;
            }

            try {
                const creationPayload: CompanyCreatePayload = {
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
                        notes: contactFormData.notes,
                        reports: []
                    };
                    creationPayload.contacts.push(contactPayload);
                }

                const response = await apiClient.post('/company-profile/', creationPayload, {
                    params: { force_save: forceSave }
                });

                const newlyCreatedCompany: CompanyData = response.data;
                alert(`"${newlyCreatedCompany.company_name}" 회사가 성공적으로 등록되었습니다.`);

                const newFormData = {
                    companyName: newlyCreatedCompany.company_name,
                    basicOverview: newlyCreatedCompany.basic_overview || '',
                    representative: newlyCreatedCompany.representative || '',
                    businessNumber: newlyCreatedCompany.business_number || '',
                    contactInfo: newlyCreatedCompany.contact_info || '',
                    address: newlyCreatedCompany.address || '',
                    bankName: newlyCreatedCompany.bank_name || '',
                    accountNumber: newlyCreatedCompany.account_number || ''
                };
                setFormData(newFormData);
                setOriginalFormData(newFormData);
                setSelectedCompany(newlyCreatedCompany);
                setCompanyContacts(newlyCreatedCompany.contacts || []);

                if (newlyCreatedCompany.contacts && newlyCreatedCompany.contacts.length > 0) {
                    const newContact = newlyCreatedCompany.contacts[0];
                    selectContact(newContact);
                } else {
                    setShowContactInformations(false);
                    setContactFormData(initialContactState);
                    setOriginalContactData(initialContactState);
                    setIsNewContact(false);
                }
                setIsFormDirty(false);

            } catch (error: any) {
                if (error.response?.status === 409) {
                    const detail = error.response.data.detail;
                    setSimilarCompanies(detail.similar_companies || []);
                    setShowSimilarCompaniesModal(true);
                } else {
                    console.error('신규 회사 생성 오류:', error);
                    alert(`저장 실패: ${handleApiError(error)}`);
                }
            }
        } else {
            try {
                const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
                const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);

                if (companyDataChanged) {
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
                    await apiClient.put(`/company-profile/${selectedCompany.id}`, companyPayload);
                    setOriginalFormData(formData);
                }

                if (contactDataChanged && (isNewContact || selectedContact)) {
                    const url = isNewContact
                        ? `/company-profile/${selectedCompany.id}/contacts`
                        : `/company-profile/${selectedCompany.id}/contacts/${selectedContact!.id}`;
                    const method = isNewContact ? 'post' : 'put';
                    const contactPayload = {
                        contact_name: contactFormData.contactName,
                        position: contactFormData.position,
                        department: contactFormData.department,
                        phone: contactFormData.phone,
                        email: contactFormData.email,
                        is_primary: selectedContact ? selectedContact.is_primary : false,
                        responsibility: contactFormData.responsibility,
                        work_style: contactFormData.workStyle,
                        personal_info: contactFormData.personalInfo,
                        organization_info: contactFormData.organizationInfo,
                        relationship_info: contactFormData.relationship,
                        project_experience: contactFormData.projectExperience,
                        notes: contactFormData.notes
                    };

                    const response = await apiClient[method](url, contactPayload);
                    const savedContact: CompanyContactData = response.data;

                    if (isNewContact) {
                        setCompanyContacts(prev => [...prev, savedContact]);
                    } else {
                        setCompanyContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
                    }
                    selectContact(savedContact);
                }

                if (tempReports.length > 0 && selectedContact) {
                    await saveTempReports();
                }

                alert('성공적으로 저장되었습니다.');
                setIsFormDirty(false);
                setIsNewContact(false);

            } catch (error) {
                console.error('기존 회사/담당자 수정 오류:', error);
                alert(`수정 실패: ${handleApiError(error)}`);
            }
        }
    };

    const SimilarCompaniesModal: React.FC = () => {
        return showSimilarCompaniesModal ? (
            <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>⚠️ 유사한 회사명이 이미 존재합니다</h3>
                        <button
                            className="modal-close-btn"
                            onClick={() => setShowSimilarCompaniesModal(false)}
                        >
                            ✕
                        </button>
                    </div>

                    <div className="modal-body">
                        <p style={{
                            marginBottom: '15px',
                            padding: '10px',
                            backgroundColor: '#fff3e0',
                            borderLeft: '4px solid #ff9800',
                            fontWeight: 'bold'
                        }}>
                            입력한 회사명: "{formData.companyName}"
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            다음과 유사한 회사들이 이미 등록되어 있습니다:
                        </p>

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
                            {similarCompanies.map(company => (
                                <tr key={company.id}>
                                    <td><strong>{company.company_name}</strong></td>
                                    <td>{company.representative || '-'}</td>
                                    <td>{company.business_number || '-'}</td>
                                    <td>
                                        <button
                                            className="select-btn"
                                            onClick={async () => {
                                                await selectCompany(company.id);
                                                setShowSimilarCompaniesModal(false);
                                            }}
                                        >
                                            이 회사 선택
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        <div style={{
                            marginTop: '20px',
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'center',
                            borderTop: '1px solid #eee',
                            paddingTop: '15px'
                        }}>
                            <button
                                className="action-btn"
                                style={{ backgroundColor: '#28a745' }}
                                onClick={async () => {
                                    setShowSimilarCompaniesModal(false);
                                    await handleSave(true);
                                }}
                            >
                                그래도 신규 등록
                            </button>
                            <button
                                className="action-btn"
                                style={{ backgroundColor: '#6c757d' }}
                                onClick={() => setShowSimilarCompaniesModal(false)}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        ) : null;
    };

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
            projectExperience: contact.project_experience || '',
            notes: contact.notes || ''
        };
        setContactFormData(newContactFormData);
        setOriginalContactData(newContactFormData);
        setShowContactInformations(true);
        setIsNewContact(false);
        setIsFormDirty(false);
        loadContactReports(contact.id);
        setTempReports([]);
        setOriginalTempReports([]);
    };

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
        setContactReports([]);
        setTempReports([]);
        setOriginalTempReports([]);
        setNewReportDate('');
        setNewReportContent('');
    };

    const CompanySearchModal: React.FC = () => {
        const [localSearchTerm, setLocalSearchTerm] = useState(searchKeyword);

        useEffect(() => {
            const handleEscKey = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setShowSearchModal(false);
                }
            };

            if (showSearchModal) {
                window.addEventListener('keydown', handleEscKey);
            }

            return () => {
                window.removeEventListener('keydown', handleEscKey);
            };
        }, [showSearchModal]);

        const handleSearch = () => {
            setSearchKeyword(localSearchTerm);
            setCurrentPage(1);
            searchCompanies(localSearchTerm, 1);
        };

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
                        <div className="input-with-search" style={{ marginBottom: '15px' }}>
                            <input
                                type="text"
                                value={localSearchTerm}
                                onChange={(e) => setLocalSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleSearch();
                                    }
                                }}
                                placeholder="회사명으로 검색"
                                className="profile-input"
                                autoFocus
                            />
                            <button
                                onClick={handleSearch}
                                className="search-btn"
                                title="검색"
                            >
                                🔍
                            </button>
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
                                {totalPages > 1 && (
                                    <div className="pagination">
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                                                onClick={() => {
                                                    setCurrentPage(page);
                                                    searchCompanies(localSearchTerm, page);
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

    // ==============================================================================
    //  ✅ 2. 최종 수정된 담당자 검색 모달
    // ==============================================================================
    const ContactSearchModal: React.FC = () => {
        // ✨ 1. 모달 전용 내부 검색어 상태를 생성합니다.
        const [localSearchTerm, setLocalSearchTerm] = useState('');

        useEffect(() => {
            const handleEscKey = (e: KeyboardEvent) => {
                if (e.key === 'Escape') {
                    setShowContactSearchModal(false);
                }
            };

            if (showContactSearchModal) {
                // ✨ 2. 모달이 보일 때만 부모의 검색어를 내부 상태로 복사합니다.
                setLocalSearchTerm(contactSearchTerm);
                window.addEventListener('keydown', handleEscKey);
            }

            return () => {
                window.removeEventListener('keydown', handleEscKey);
            };
        }, [showContactSearchModal]); // 의존성 배열에 contactSearchTerm을 제거해야 합니다.

        // const handleModalSearch = () => {
        //     // ✨ 3. 검색 시, 내부 검색어(localSearchTerm)를 부모 상태(contactSearchTerm)에 반영하고 검색을 실행합니다.
        //     setContactSearchTerm(localSearchTerm);
        //     setContactSearchCurrentPage(1);
        //     searchContacts(localSearchTerm, 1);
        // };
        const handleModalSearch = () => {
            setContactSearchCurrentPage(1);
            // ✨ 2. 검색 시, 항상 내부 검색어(localSearchTerm)를 사용합니다.
            searchContacts(localSearchTerm, 1);
            // 부모 상태도 업데이트하여 동기화를 유지합니다.
            setContactSearchTerm(localSearchTerm);
        };

        return showContactSearchModal ? (
            <div className="modal-overlay" onClick={() => setShowContactSearchModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h3>담당자 검색</h3>
                        <button
                            className="modal-close-btn"
                            onClick={() => setShowContactSearchModal(false)}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="modal-body">
                        <div className="input-with-search" style={{ marginBottom: '15px' }}>
                            <input
                                type="text"
                                // ✨ 4. value와 onChange를 모두 내부 상태(localSearchTerm)에 연결합니다.
                                value={localSearchTerm}
                                onChange={(e) => setLocalSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleModalSearch();
                                    }
                                }}
                                placeholder="담당자 이름으로 검색 (Enter: 검색, ESC: 닫기)"
                                className="profile-input"
                                autoFocus
                            />
                            <button
                                onClick={handleModalSearch}
                                className="search-btn"
                                title="검색"
                            >
                                🔍
                            </button>
                        </div>

                        {/* ... (이하 검색 결과 렌더링 로직은 기존과 동일) ... */}
                        {contactSearchLoading ? (
                            <div className="loading">검색 중...</div>
                        ) : (
                            <>
                                {contactSearchResults.length === 0 ? (
                                    <div className="no-results">검색 결과가 없습니다.</div>
                                ) : (
                                    // ✨✨✨ 2. 누락되었던 테이블 구현 부분을 여기에 추가합니다. ✨✨✨
                                    <table className="search-table">
                                        <thead>
                                        <tr>
                                            <th>담당자명</th>
                                            <th>직책</th>
                                            <th>부서</th>
                                            <th>회사명</th>
                                            <th>연락처</th>
                                            <th>선택</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {contactSearchResults.map((contact: ContactSearchData) => (
                                            <tr key={contact.id}>
                                                <td>
                                                    <strong>{contact.contact_name}</strong>
                                                    {contact.is_primary &&
                                                        <span className="primary-badge">주담당자</span>
                                                    }
                                                </td>
                                                <td>{contact.position || '-'}</td>
                                                <td>{contact.department || '-'}</td>
                                                <td>{contact.company ? contact.company.company_name : '회사 정보 없음'}</td>
                                                <td>{contact.phone || '-'}</td>
                                                <td>
                                                    <button
                                                        className="select-btn"
                                                        onClick={() => selectSearchedContact(contact)}
                                                    >
                                                        선택
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                )}
                                {contactSearchTotalPages > 1 && (
                                    <div className="pagination">
                                        {Array.from({ length: contactSearchTotalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                className={`page-btn ${contactSearchCurrentPage === page ? 'active' : ''}`}
                                                onClick={() => {
                                                    setContactSearchCurrentPage(page);
                                                    // ✨ 5. 페이지네이션 시에도 부모 상태(contactSearchTerm)를 사용합니다.
                                                    searchContacts(contactSearchTerm, page);
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
            <div className="profile-header">
                <div className="profile-title-section">
                    <h1 className="profile-title">
                        광고주 Profile 양식 1
                    </h1>
                </div>
                <div className="profile-logo">
                    GMCOM
                </div>
            </div>

            <div className="profile-main">
                <div className="profile-title-section">
                    <h2 className="profile-subtitle">
                        광고주 Profile
                    </h2>
                    {/*<div className="profile-writer">*/}
                    {/*    <div className="writer-form">*/}
                    {/*        <div>*/}
                    {/*            최초 생성 : 부서/직책/이름 ( 연월일시 )*/}
                    {/*        </div>*/}
                    {/*        <div>*/}
                    {/*            마지막 수정 : 부서/직책/이름 ( 연월일시 )*/}
                    {/*        </div>*/}

                    {/*        /!*<div>최종 작성자 : {lastUpdater?.name || '정보 없음'}</div>*!/*/}
                    {/*        /!*<div>최종 작성자 : {writerInfo ? `${writerInfo.name} (${writerInfo.department || ''})` : '정보 없음'}</div>*!/*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                {/*const handleNewMeeting = () => {*/}
                {/*// TODO: 신규 작성 로직 구현*/}
                {/*};*/}
                {/*<div style={{ textAlign: 'right', margin: '2rem 0' }}>*/}
                {/*    <button*/}
                {/*        className="btn-new-item"*/}
                {/*        // onClick={handleNewMeeting}*/}
                {/*    >*/}
                {/*        신규 작성*/}
                {/*    </button>*/}
                {/*</div>*/}

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
                                        className={clsx('profile-input', {
                                            'input-modified': formData.companyName !== originalFormData.companyName
                                        })}
                                        placeholder="회사명을 입력하고 검색하세요 (Enter 또는 🔍)"
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
                                    className={clsx('profile-input', {
                                        'input-modified': formData.basicOverview !== originalFormData.basicOverview
                                    })}
                                    placeholder="삼성계열 광고대행사, 외국계 유한회사 등등.."
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
                                    className={clsx('profile-input', {
                                        'input-modified': formData.representative !== originalFormData.representative
                                    })}
                                />
                            </td>
                            <td className="table-cell table-cell-label">사업자번호</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="businessNumber"
                                    value={formData.businessNumber}
                                    onChange={handleInputChange}
                                    className={clsx('profile-input', {
                                        'input-modified': formData.businessNumber !== originalFormData.businessNumber
                                    })}
                                    placeholder="사업자번호 형식은 10자리 숫자로만 구성해야 합니다"
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
                                    className={clsx('profile-input', {
                                        'input-modified': formData.contactInfo !== originalFormData.contactInfo
                                    })}
                                    placeholder="하이픈(-)을 제외한 숫자로만"
                                />
                            </td>
                            <td className="table-cell table-cell-label">주소</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    className={clsx('profile-input', {
                                        'input-modified': formData.address !== originalFormData.address
                                    })}
                                />
                            </td>
                        </tr>
                        {hasFinanceAccess() && (
                            <tr>
                                <td className="table-cell table-cell-label">거래은행</td>
                                <td className="table-cell-input">
                                    <input
                                        type="text"
                                        name="bankName"
                                        value={formData.bankName}
                                        disabled={!canEditFinance()}
                                        onChange={handleInputChange}
                                        className={clsx('profile-input', {
                                            'input-modified': formData.bankName !== originalFormData.bankName
                                        })}
                                    />
                                </td>
                                <td className="table-cell table-cell-label">계좌번호</td>
                                <td className="table-cell-input">
                                    <input
                                        type="text"
                                        name="accountNumber"
                                        value={formData.accountNumber}
                                        disabled={!canEditFinance()}
                                        onChange={handleInputChange}
                                        className={clsx('profile-input', {
                                            'input-modified': formData.accountNumber !== originalFormData.accountNumber
                                        })}
                                    />
                                </td>
                            </tr>
                        )}
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">담당자</td>
                            <td className="table-cell-input" colSpan={3}>
                                <div className="contact-section">
                                    {/* ✅ 2. ContactSearchInput에 필요한 모든 props (searchTerm, setSearchTerm, onSearch)를 전달합니다. */}
                                    <ContactSearchInput
                                        searchTerm={contactSearchTerm}
                                        setSearchTerm={setContactSearchTerm}
                                        onSearch={handleContactSearch}
                                    />

                                    {companyContacts.length > 0 ? (
                                        <div className="contact-list">
                                            {companyContacts.map((contact) => (
                                                <div
                                                    key={contact.id}
                                                    className={`contact-item ${selectedContact?.id === contact.id ? 'selected' : ''}`}
                                                    onClick={() => selectContact(contact)}
                                                >
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
                                                : '회사가 선택 되어야 담당자 정보가 표시됩니다.'
                                            }
                                        </div>
                                    )}
                                    <div className="add-contact-section">
                                        <button
                                            type="button"
                                            className="add-contact-btn"
                                            onClick={handleNewContactRegistration}
                                            disabled={!selectedCompany}
                                            style={{ flex: '0 1 auto' }}
                                            title={!selectedCompany ? "먼저 담당자가 등록될 회사를 선택하세요" : "담당자 정보를 새롭게 입력 합니다"}
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
                {showContactInformations && (
                    <>
                        <div className="profile-section contact-detail-section">
                            <h3 className="section-header section-header-attached">
                                ■ 담당자 상세 정보 {selectedContact ?
                                `(${selectedContact.contact_name})` :
                                '(신규 등록)'}
                            </h3>
                            <table className="profile-table">
                                <tbody>
                                <tr>
                                    <td className="table-header">구분</td>
                                    <td className="table-header" colSpan={4}>내용</td>
                                </tr>
                                <tr>
                                    <td className="table-cell table-cell-label">소속/부서</td>
                                    <td className="table-cell-input" colSpan={2}>
                                        <input
                                            type="text"
                                            name="department"
                                            value={contactFormData.department}
                                            onChange={handleContactFormChange}
                                            className={clsx('profile-input', {
                                                'input-modified': contactFormData.department !== originalContactData.department
                                            })}
                                        />
                                    </td>
                                    <td className="table-cell table-cell-label">이름/직책</td>
                                    <td className="table-cell-input">
                                        <input
                                            type="text"
                                            name="contactName"
                                            value={contactFormData.contactName}
                                            onChange={handleContactFormChange}
                                            className={clsx('profile-input', {
                                                'input-modified': contactFormData.contactName !== originalContactData.contactName
                                            })}
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
                                            className={clsx('profile-input', {
                                                'input-modified': contactFormData.position !== originalContactData.position
                                            })}
                                        />
                                    </td>
                                    <td className="table-cell table-cell-label">연락처</td>
                                    <td className="table-cell-input">
                                        <input
                                            type="text"
                                            name="phone"
                                            value={contactFormData.phone}
                                            onChange={handleContactFormChange}
                                            className={clsx('profile-input', {
                                                'input-modified': contactFormData.phone !== originalContactData.phone
                                            })}
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
                                            className={clsx('profile-input', {
                                                'input-modified': contactFormData.email !== originalContactData.email
                                            })}
                                        />
                                    </td>
                                    <td className="table-cell table-cell-label">담당업무</td>
                                    <td className="table-cell-input">
                                        <input
                                            type="text"
                                            name="responsibility"
                                            value={contactFormData.responsibility}
                                            onChange={handleContactFormChange}
                                            className={clsx('profile-input', {
                                                'input-modified': contactFormData.responsibility !== originalContactData.responsibility
                                            })}
                                        />
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                        {selectedContact && !isNewContact && (
                            <div className="profile-section contact-report-section">
                                <h3 className="section-header section-header-attached">
                                    ■ 컨택 리포트(회의록) ({selectedContact.contact_name})
                                </h3>
                                {reportLoading ? (
                                    <div className="loading">리포트 로딩 중...</div>
                                ) : getAllReports().length > 0 && (
                                    <div className="existing-reports">
                                        {getAllReports().map((report) => (
                                            <div
                                                key={report.id}
                                                className="report-item"
                                                style={{
                                                    border: report.isTemp ? '2px solid #dc3545' : '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    marginBottom: '8px'
                                                }}
                                            >
                                                <div className="report-date">{report.contact_date}</div>
                                                <div className="report-content" style={{ fontSize: '12px', lineHeight: '1.4' }}>
                                                    {report.content}
                                                    {report.isTemp && <span style={{ color: '#dc3545', fontSize: '10px', marginLeft: '8px' }}>(저장 대기중)</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <table className="profile-table">
                                    <tbody>
                                    <tr>
                                        <td className="table-header">날짜</td>
                                        <td className="table-header">주요 내용</td>
                                    </tr>
                                    <tr>
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
                                            placeholder="- 미팅 안건, 협의 / 논의했던 내용등을 기재&#10;- 프로젝트와 연계된 내용 위주로 작성 ( 개인정보, 개인성향 등 지양 )"
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
                        )}
                    </>
                )}
                <div className="profile-actions">
                    <div className="action-group">
                        <button
                            type="button"
                            className="action-btn save-btn"
                            onClick={() => handleSave(false)}
                            disabled={!isFormDirty}
                            title={!isFormDirty ? "변경된 데이터가 있어야만 저장 가능합니다." : ""}
                        >
                            💾 저장
                        </button>
                    </div>
                    {isFormDirty && (
                        <div className="dirty-indicator">
                            ⚠️ 저장되지 않은 변경사항이 있습니다.
                        </div>
                    )}
                </div>
            </div>
            <CompanySearchModal />
            <ContactSearchModal />
            <SimilarCompaniesModal />
        </div>
    );
};

export default CompanyProfileForm;