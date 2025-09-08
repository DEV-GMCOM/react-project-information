// CompanyProfile.tsx - 완전한 소스 코드 (모든 수정 사항 반영)

import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import { handleApiError } from '../../api/utils/errorUtils';
import { usePermissions } from '../../hooks/usePermissions';
import '../../styles/CompanyProfile.css';

// --- 타입 정의 ---
// API 응답용 (ID 항상 존재)
interface ContactReportResponse {
    id: number;
    contact_date: string;
    content: string;
    created_at: string;
    updated_at?: string;
}

// 생성 요청용 (ID 없음)
interface ContactReportCreate {
    contact_date: string;
    content: string;
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

// 담당자 검색 결과 전용 타입
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
    notes?: string; // 👈 수정: optional로 변경
}

// API 요청용 타입 정의
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

const CompanyProfileForm: React.FC = () => {
    // 권한 hook 추가
    const { hasFinanceAccess, canEditFinance, canAccessField } = usePermissions();

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

    // 회사 검색 관련 상태
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<CompanyData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 담당자 검색 관련 상태
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);
    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    const [contactSearchCurrentPage, setContactSearchCurrentPage] = useState(1);
    const [contactSearchTotalPages, setContactSearchTotalPages] = useState(1);

    // 컨택 리포트 관련 상태
    const [contactReports, setContactReports] = useState<ContactReportResponse[]>([]);
    const [newReportDate, setNewReportDate] = useState('');
    const [newReportContent, setNewReportContent] = useState('');
    const [reportLoading, setReportLoading] = useState(false);
    // 👉 추가: 임시 리포트 목록 (아직 저장되지 않은 리포트들)
    const [tempReports, setTempReports] = useState<Array<{id: string, contact_date: string, content: string, isTemp: boolean}>>([]);
    // 👉 추가: 리포트 원본 상태 (수정 감지용)
    const [originalTempReports, setOriginalTempReports] = useState<Array<{id: string, contact_date: string, content: string, isTemp: boolean}>>([]);

    // --- useEffect ---
    useEffect(() => {
        const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
        const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);
        const isNewContactTyping = isNewContact && JSON.stringify(contactFormData) !== JSON.stringify(initialContactState);
        // 👉 수정: 임시 리포트 변경 감지
        const tempReportChanged = JSON.stringify(tempReports) !== JSON.stringify(originalTempReports);

        setIsFormDirty(companyDataChanged || contactDataChanged || isNewContactTyping || tempReportChanged);
    }, [formData, contactFormData, originalFormData, originalContactData, isNewContact, tempReports, originalTempReports]);

    // 회사명 변경 시 담당자 검색 초기화
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

    // 담당자 검색 핸들러
    const handleContactSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setContactSearchTerm(e.target.value);
    };

    // 담당자 검색 실행
    const handleContactSearch = async () => {
        setShowContactSearchModal(true);
        setContactSearchCurrentPage(1);
        await searchContacts(contactSearchTerm, 1);
    };

    // 담당자 검색 API 호출
    const searchContacts = async (keyword: string, page: number) => {
        try {
            setContactSearchLoading(true);
            const params = new URLSearchParams({
                search: keyword,
                skip: ((page - 1) * 10).toString(),
                limit: '10'
            });

            // const listUrl = `http://localhost:8001/api/company-profile/contacts/search?${params.toString()}`;
            // const countUrl = `http://localhost:8001/api/company-profile/contacts/search/count?${params.toString()}`;
            const listUrl = `/api/company-profile/contacts/search?${params.toString()}`;
            const countUrl = `/api/company-profile/contacts/search/count?${params.toString()}`;

            const [listResponse, countResponse] = await Promise.all([
                fetch(listUrl),
                fetch(countUrl)
            ]);

            if (!listResponse.ok) throw new Error(`HTTP ${listResponse.status}`);
            const contacts: ContactSearchData[] = await listResponse.json();
            setContactSearchResults(contacts);

            if (countResponse.ok) {
                const countData = await countResponse.json();
                setContactSearchTotalPages(Math.ceil(countData.total_count / 10));
            } else {
                setContactSearchTotalPages(1);
            }
        } catch (error) {
            console.error('담당자 검색 오류:', error);
            alert('담당자 검색 중 오류가 발생했습니다.');
        } finally {
            setContactSearchLoading(false);
        }
    };

    // 검색된 담당자 선택
    const selectSearchedContact = async (contact: ContactSearchData) => {
        try {
            // 해당 담당자의 회사를 선택
            await selectCompany(contact.company.id);

            // ContactSearchData를 CompanyContactData로 변환하여 선택
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

            // 검색 모달 닫기
            setShowContactSearchModal(false);
            setContactSearchTerm('');

            alert(`${contact.contact_name}(${contact.company.company_name}) 담당자가 선택되었습니다.`);
        } catch (error) {
            console.error('담당자 선택 오류:', error);
            alert('담당자 선택 중 오류가 발생했습니다.');
        }
    };

    // 컨택 리포트 추가 - 👉 수정: 화면 리스트에 즉시 추가, DB 저장은 나중에
    const handleAddReport = () => {
        if (!newReportDate || !newReportContent) {
            alert('날짜와 내용을 모두 입력해주세요.');
            return;
        }

        // 임시 ID 생성 (현재 시간 기준)
        const tempId = `temp_${Date.now()}`;

        // 임시 리포트 객체 생성
        const newTempReport = {
            id: tempId,
            contact_date: newReportDate,
            content: newReportContent,
            isTemp: true
        };

        // 임시 리포트 목록에 추가하고 날짜순 정렬
        setTempReports(prev => {
            const updated = [...prev, newTempReport];
            // 날짜 오름차순 정렬 (과거순)
            return updated.sort((a, b) => new Date(a.contact_date).getTime() - new Date(b.contact_date).getTime());
        });

        // 입력 필드 초기화
        setNewReportDate('');
        setNewReportContent('');

        alert('리포트가 목록에 추가되었습니다. 저장 버튼을 눌러 최종 저장해주세요.');
    };

    // 컨택 리포트 로드 함수
    const loadContactReports = async (contactId: number) => {
        if (!selectedCompany) return;

        try {
            setReportLoading(true);
            const response = await fetch(
                // `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts/${contactId}/reports`
                `/api/company-profile/${selectedCompany.id}/contacts/${contactId}/reports`
            );

            if (response.ok) {
                const reports = await response.json();
                setContactReports(reports);
            }
        } catch (error) {
            console.error('리포트 로드 오류:', error);
        } finally {
            setReportLoading(false);
        }
    };

    // 👉 수정: 여러 임시 리포트를 실제로 저장하는 함수
    const saveTempReports = async () => {
        if (!selectedCompany || !selectedContact || tempReports.length === 0) {
            return; // 저장할 리포트가 없으면 그냥 리턴
        }

        try {
            // 모든 임시 리포트를 순차적으로 저장
            for (const tempReport of tempReports) {
                const response = await fetch(
                    // `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts/${selectedContact.id}/reports`,
                    `/api/company-profile/${selectedCompany.id}/contacts/${selectedContact.id}/reports`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contact_date: tempReport.contact_date,
                            content: tempReport.content
                        })
                    }
                );

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(`리포트 저장 실패: ${errorData.detail}`);
                }
            }

            // 저장 완료 후 리포트 목록 다시 로드
            await loadContactReports(selectedContact.id);

            // 임시 리포트 목록 초기화
            setTempReports([]);
            setOriginalTempReports([]);

            return true;
        } catch (error) {
            console.error('리포트 저장 오류:', error);
            throw error;
        }
    };

    // 👉 추가: 전체 리포트 목록 생성 함수 (DB 리포트 + 임시 리포트 합쳐서 정렬)
    const getAllReports = () => {
        // DB에서 가져온 리포트와 임시 리포트를 합치고 날짜순 정렬
        const dbReports = contactReports.map(report => ({
            ...report,
            isTemp: false
        }));

        const allReports = [...dbReports, ...tempReports];

        // 날짜 내림차순 정렬 (최신순)
        return allReports.sort((a, b) => new Date(a.contact_date).getTime() - new Date(b.contact_date).getTime());
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

            // 👉 수정: 임시 리포트도 원본으로 되돌리기
            setTempReports(originalTempReports);
            setNewReportDate('');
            setNewReportContent('');
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

            // const listUrl = `http://localhost:8001/api/company-profile/?${params.toString()}`;
            // const countUrl = `http://localhost:8001/api/company-profile/count?${params.toString()}`;
            const listUrl = `/api/company-profile/?${params.toString()}`;
            const countUrl = `/api/company-profile/count?${params.toString()}`;

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
            // const response = await fetch(`http://localhost:8001/api/company-profile/${companyId}`);
            const response = await fetch(`/api/company-profile/${companyId}`);
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

            // 👉 수정: 리포트 상태 초기화 추가
            setContactReports([]);
            setTempReports([]);
            setOriginalTempReports([]);
            setNewReportDate('');
            setNewReportContent('');
            setReportLoading(false);

            alert(`회사 "${detailedCompany.company_name}"이 선택되었습니다.`);
        } catch (error) {
            handleApiError(error);
            alert('회사 정보를 가져오는데 실패했습니다.');
        }
    };

    // 담당자 선택 함수
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

        // 컨택 리포트 로드
        loadContactReports(contact.id);

        // 👉 수정: 임시 리포트 원본 상태 설정 (기존 담당자 선택 시는 빈 상태가 원본)
        setTempReports([]);
        setOriginalTempReports([]);
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

        // 👉 수정: 리포트 상태 초기화 추가
        setContactReports([]);
        setTempReports([]);
        setOriginalTempReports([]);
        setNewReportDate('');
        setNewReportContent('');
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
                // const url = `http://localhost:8001/api/company-profile/`;
                const url = `/api/company-profile/`;
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

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(creationPayload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.detail || '신규 회사 생성에 실패했습니다.');
                }

                const newlyCreatedCompany: CompanyData = await response.json();
                alert(`"${newlyCreatedCompany.company_name}" 회사가 성공적으로 등록되었습니다.`);

                // 상태를 직접 업데이트하여 UI 연속성 유지
                const newFormData = {
                    companyName: newlyCreatedCompany.company_name,
                    basicOverview: (newlyCreatedCompany as any).basic_overview || '',
                    representative: newlyCreatedCompany.representative || '',
                    businessNumber: newlyCreatedCompany.business_number || '',
                    contactInfo: (newlyCreatedCompany as any).contact_info || '',
                    address: newlyCreatedCompany.address || '',
                    bankName: (newlyCreatedCompany as any).bank_name || '',
                    accountNumber: (newlyCreatedCompany as any).account_number || ''
                };
                setFormData(newFormData);
                setOriginalFormData(newFormData);
                setSelectedCompany(newlyCreatedCompany);
                setCompanyContacts(newlyCreatedCompany.contacts || []);

                // 만약 담당자도 함께 생성되었다면, 그 담당자를 선택 상태로 만듭니다.
                if (newlyCreatedCompany.contacts && newlyCreatedCompany.contacts.length > 0) {
                    const newContact = newlyCreatedCompany.contacts[0];
                    selectContact(newContact);
                } else {
                    // 담당자가 없다면 상세 정보 폼을 닫고 상태를 초기화합니다.
                    setShowContactInformations(false);
                    setContactFormData(initialContactState);
                    setOriginalContactData(initialContactState);
                    setIsNewContact(false);
                }
                setIsFormDirty(false);

            } catch (error) {
                console.error('신규 회사 생성 오류:', error);
                alert(`저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        } else {
            // 기존 회사 및 담당자 수정 로직
            try {
                const companyDataChanged = JSON.stringify(formData) !== JSON.stringify(originalFormData);
                const contactDataChanged = JSON.stringify(contactFormData) !== JSON.stringify(originalContactData);

                // 1. 회사 정보 수정 API 호출 (필요한 경우)
                if (companyDataChanged) {
                    // const companyUpdateUrl = `http://localhost:8001/api/company-profile/${selectedCompany.id}`;
                    const companyUpdateUrl = `/api/company-profile/${selectedCompany.id}`;
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
                    const response = await fetch(companyUpdateUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(companyPayload)
                    });
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`회사 정보 수정 실패: ${errorData.detail || '알 수 없는 오류'}`);
                    }
                    // 회사 정보 수정 성공 시, 원본 데이터를 현재 데이터와 동기화
                    setOriginalFormData(formData);
                }

                // 2. 담당자 정보 수정/생성 API 호출 (필요한 경우)
                if (contactDataChanged && (isNewContact || selectedContact)) {
                    const contactUrl = isNewContact
                        // ? `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts`
                        // : `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts/${selectedContact!.id}`;
                        ? `/api/company-profile/${selectedCompany.id}/contacts`
                        : `/api/company-profile/${selectedCompany.id}/contacts/${selectedContact!.id}`;
                    const method = isNewContact ? 'POST' : 'PUT';
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

                    const response = await fetch(contactUrl, {
                        method,
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(contactPayload)
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(`담당자 정보 저장 실패: ${errorData.detail || '알 수 없는 오류'}`);
                    }

                    const savedContact: CompanyContactData = await response.json();

                    // 3. 상태 직접 업데이트
                    if (isNewContact) {
                        // 새 담당자 추가 시: 담당자 목록에 추가
                        setCompanyContacts(prev => [...prev, savedContact]);
                    } else {
                        // 기존 담당자 수정 시: 담당자 목록에서 해당 항목 교체
                        setCompanyContacts(prev => prev.map(c => c.id === savedContact.id ? savedContact : c));
                    }

                    // 방금 저장된 담당자를 선택된 상태로 유지하고 폼 데이터 업데이트
                    selectContact(savedContact);
                }

                // 👉 수정: 임시 리포트 저장 처리
                if (tempReports.length > 0 && selectedContact) {
                    try {
                        await saveTempReports();
                    } catch (error) {
                        throw new Error(`리포트 저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
                    }
                }

                alert('성공적으로 저장되었습니다.');
                setIsFormDirty(false);
                setIsNewContact(false);

            } catch (error) {
                console.error('기존 회사/담당자 수정 오류:', error);
                alert(`수정 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            }
        }
    };

    // 새 컨택 리포트 추가
    const addContactReport = async () => {
        if (!selectedCompany || !selectedContact || !newReportDate || !newReportContent) {
            alert('날짜와 내용을 모두 입력해주세요.');
            return;
        }

        try {
            const response = await fetch(
                // `http://localhost:8001/api/company-profile/${selectedCompany.id}/contacts/${selectedContact.id}/reports`,
                `/api/company-profile/${selectedCompany.id}/contacts/${selectedContact.id}/reports`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contact_date: newReportDate,
                        content: newReportContent
                    })
                }
            );

            if (response.ok) {
                const newReport = await response.json();
                setContactReports(prev => [newReport, ...prev]);
                setNewReportDate('');
                setNewReportContent('');
                alert('리포트가 추가되었습니다.');
            } else {
                const errorData = await response.json();
                alert(`리포트 추가 실패: ${errorData.detail}`);
            }
        } catch (error) {
            console.error('리포트 추가 오류:', error);
            alert('리포트 추가 중 오류가 발생했습니다.');
        }
    };

    // 컨택 리포트 삭제 - 삭제 기능 제거됨
    // const deleteContactReport = async (reportId: number) => {
    //     // 삭제 기능은 지원하지 않음 (요구사항에 따라 INSERT와 READ만 지원)
    // };

    // --- 렌더링 컴포넌트 ---

    // 담당자 검색 모달 컴포넌트
    const ContactSearchModal: React.FC = () => {
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
                        <div className="search-info">
                            <p>검색어: "{contactSearchTerm}"</p>
                        </div>

                        {contactSearchLoading ? (
                            <div className="loading">검색 중...</div>
                        ) : (
                            <>
                                {contactSearchResults.length === 0 ? (
                                    <div className="no-results">검색 결과가 없습니다.</div>
                                ) : (
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

                                {/* 페이지네이션 */}
                                {contactSearchTotalPages > 1 && (
                                    <div className="pagination">
                                        {Array.from({ length: contactSearchTotalPages }, (_, i) => i + 1).map(page => (
                                            <button
                                                key={page}
                                                className={`page-btn ${contactSearchCurrentPage === page ? 'active' : ''}`}
                                                onClick={() => {
                                                    setContactSearchCurrentPage(page);
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
                                        className={clsx('profile-input', {
                                            'input-modified': formData.companyName !== originalFormData.companyName
                                        })}
                                        placeholder="회사명을 입력하고 검색하세요"
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
                                    placeholder="사업자번호 형식 검증은 추후 적용 예정"
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
                        {/*<tr>*/}
                        {/*    <td className="table-cell table-cell-label">거래은행</td>*/}
                        {/*    <td className="table-cell-input">*/}
                        {/*        <input*/}
                        {/*            type="text"*/}
                        {/*            name="bankName"*/}
                        {/*            value={formData.bankName}*/}
                        {/*            onChange={handleInputChange}*/}
                        {/*            className={clsx('profile-input', {*/}
                        {/*                'input-modified': formData.bankName !== originalFormData.bankName*/}
                        {/*            })}*/}
                        {/*        />*/}
                        {/*    </td>*/}
                        {/*    <td className="table-cell table-cell-label">계좌번호</td>*/}
                        {/*    <td className="table-cell-input">*/}
                        {/*        <input*/}
                        {/*            type="text"*/}
                        {/*            name="accountNumber"*/}
                        {/*            value={formData.accountNumber}*/}
                        {/*            onChange={handleInputChange}*/}
                        {/*            className={clsx('profile-input', {*/}
                        {/*                'input-modified': formData.accountNumber !== originalFormData.accountNumber*/}
                        {/*            })}*/}
                        {/*        />*/}
                        {/*    </td>*/}
                        {/*</tr>*/}

                        {/* 담당자 섹션 */}
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">담당자</td>
                            <td className="table-cell-input" colSpan={3}>
                                <div className="contact-section">
                                    {/* 담당자 검색 필드 */}
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

                                    {/* 담당자 신규 등록 버튼 */}
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
                                {/*<tr>*/}
                                {/*    <td className="table-cell table-cell-label table-cell-top" rowSpan={6}>부가 정보</td>*/}
                                {/*    <td className="table-cell table-cell-label table-cell-top">업무 스타일</td>*/}
                                {/*    <td className="table-cell-input" colSpan={3}>*/}
                                {/*    <textarea*/}
                                {/*        name="workStyle"*/}
                                {/*        value={contactFormData.workStyle}*/}
                                {/*        onChange={handleContactFormChange}*/}
                                {/*        className={clsx('profile-textarea', 'textarea-medium', {*/}
                                {/*            'input-modified': contactFormData.workStyle !== originalContactData.workStyle*/}
                                {/*        })}*/}
                                {/*    />*/}
                                {/*    </td>*/}
                                {/*</tr>*/}
                                {/*<tr>*/}
                                {/*    <td className="table-cell table-cell-label table-cell-top">개별 특화정보</td>*/}
                                {/*    <td className="table-cell-input" colSpan={3}>*/}
                                {/*        <textarea*/}
                                {/*            name="personalInfo"*/}
                                {/*            value={contactFormData.personalInfo}*/}
                                {/*            onChange={handleContactFormChange}*/}
                                {/*            className={clsx('profile-textarea', 'textarea-medium', {*/}
                                {/*                'input-modified': contactFormData.personalInfo !== originalContactData.personalInfo*/}
                                {/*            })}*/}
                                {/*        />*/}
                                {/*    </td>*/}
                                {/*</tr>*/}
                                {/*<tr>*/}
                                {/*    <td className="table-cell table-cell-label table-cell-top">부서 및 조직정보</td>*/}
                                {/*    <td className="table-cell-input" colSpan={3}>*/}
                                {/*        <textarea*/}
                                {/*            name="organizationInfo"*/}
                                {/*            value={contactFormData.organizationInfo}*/}
                                {/*            onChange={handleContactFormChange}*/}
                                {/*            className={clsx('profile-textarea', 'textarea-medium', {*/}
                                {/*                'input-modified': contactFormData.organizationInfo !== originalContactData.organizationInfo*/}
                                {/*            })}*/}
                                {/*        />*/}
                                {/*    </td>*/}
                                {/*</tr>*/}
                                {/*<tr>*/}
                                {/*    <td className="table-cell table-cell-label table-cell-top">지엠컴과 관계성</td>*/}
                                {/*    <td className="table-cell-input" colSpan={4}>*/}
                                {/*        <textarea*/}
                                {/*            name="relationship"*/}
                                {/*            value={contactFormData.relationship}*/}
                                {/*            onChange={handleContactFormChange}*/}
                                {/*            className={clsx('profile-textarea', 'textarea-medium', {*/}
                                {/*                'input-modified': contactFormData.relationship !== originalContactData.relationship*/}
                                {/*            })}*/}
                                {/*        />*/}
                                {/*    </td>*/}
                                {/*</tr>*/}
                                {/*<tr>*/}
                                {/*    <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>*/}
                                {/*    <td className="table-cell-input" colSpan={4}>*/}
                                {/*        <textarea*/}
                                {/*            name="projectExperience"*/}
                                {/*            value={contactFormData.projectExperience}*/}
                                {/*            onChange={handleContactFormChange}*/}
                                {/*            className={clsx('profile-textarea', 'textarea-medium', {*/}
                                {/*                'input-modified': contactFormData.projectExperience !== originalContactData.projectExperience*/}
                                {/*            })}*/}
                                {/*        />*/}
                                {/*    </td>*/}
                                {/*</tr>*/}
                                {/*<tr>*/}
                                {/*    <td className="table-cell table-cell-label table-cell-top">비고 / 기타</td>*/}
                                {/*    <td className="table-cell-input" colSpan={4}>*/}
                                {/*        <textarea*/}
                                {/*            name="notes"*/}
                                {/*            value={contactFormData.notes}*/}
                                {/*            onChange={handleContactFormChange}*/}
                                {/*            className={clsx('profile-textarea', 'textarea-medium', {*/}
                                {/*                'input-modified': contactFormData.notes !== originalContactData.notes*/}
                                {/*            })}*/}
                                {/*        />*/}
                                {/*    </td>*/}
                                {/*</tr>*/}
                                </tbody>
                            </table>
                        </div>

                        {/* 컨택 리포트는 기존 담당자에 대해서만 표시 */}
                        {selectedContact && !isNewContact && (
                            <div className="profile-section contact-report-section">
                                <h3 className="section-header section-header-attached">
                                    ■ 컨택 리포트(회의록) ({selectedContact.contact_name})
                                </h3>

                                {/* 기존 리포트 목록 */}
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

                                {/* 신규 리포트 작성 */}
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

                {/* 하단 버튼 영역 */}
                <div className="profile-actions">
                    <div className="action-group">
                        <button
                            type="button"
                            className="action-btn save-btn"
                            onClick={handleSubmit}
                            disabled={!isFormDirty}
                            title={!isFormDirty ? "변경된 데이터가 있어야만 저장 가능합니다." : ""}
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

            {/*/!* 재무 정보 섹션 - 조건부 렌더링 *!/*/}
            {/*{hasFinanceAccess() && (*/}
            {/*    <div className="form-section">*/}
            {/*        <h3>💰 재무 정보</h3>*/}
            {/*        <div className="form-row">*/}
            {/*            <div className="form-group">*/}
            {/*                <label htmlFor="bankName">거래은행:</label>*/}
            {/*                <input*/}
            {/*                    type="text"*/}
            {/*                    id="bankName"*/}
            {/*                    name="bankName"*/}
            {/*                    value={formData.bankName}*/}
            {/*                    onChange={handleInputChange}*/}
            {/*                    disabled={!canEditFinance()}*/}
            {/*                    placeholder="거래은행을 입력하세요"*/}
            {/*                />*/}
            {/*            </div>*/}
            {/*            <div className="form-group">*/}
            {/*                <label htmlFor="accountNumber">계좌번호:</label>*/}
            {/*                <input*/}
            {/*                    type="text"*/}
            {/*                    id="accountNumber"*/}
            {/*                    name="accountNumber"*/}
            {/*                    value={formData.accountNumber}*/}
            {/*                    onChange={handleInputChange}*/}
            {/*                    disabled={!canEditFinance()}*/}
            {/*                    placeholder="계좌번호를 입력하세요"*/}
            {/*                />*/}
            {/*            </div>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*)}*/}

            {/*/!* 권한이 없을 때 메시지 표시 *!/*/}
            {/*{!hasFinanceAccess() && (*/}
            {/*    <div className="finance-access-denied">*/}
            {/*        <p>💡 재무 정보는 재무부서 또는 임원진만 열람할 수 있습니다.</p>*/}
            {/*    </div>*/}
            {/*)}*/}


            {/* 검색 모달들 */}
            <CompanySearchModal />
            <ContactSearchModal />
        </div>
    );
};

export default CompanyProfileForm;