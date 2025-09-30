import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../../styles/ProjectProfile.css';
import { handleApiError } from '../../api/utils/errorUtils';

import apiClient from '../../api/utils/apiClient';


// 한글 상태와 CSS 클래스명을 매핑하는 객체
const statusClassMap = {
    '논의중': 'discussion',
    '취소': 'canceled',
    '진행중': 'inprogress',
    '완료': 'completed',
    '보류': 'onhold',
};

/** 직원의 간단한 정보를 나타냅니다. (작성자, 수정자 등) */
export interface WriterInfo {
    emp_id: number;
    name: string;
    department?: string;
    position?: string;
    email?: string;
}

/** 담당자 검색 결과 항목의 타입을 정의합니다. */
interface ContactSearchData {
    id: number;
    contact_name: string;
    company: {
        id: number;
        company_name: string;
    };
}

/** 고객사 담당자의 상세 정보를 나타냅니다. */
export interface CompanyContactData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    is_primary: boolean;
}

/** 회사의 상세 정보와 소속된 모든 담당자 목록을 포함합니다. */
export interface CompanyProfileData {
    id: number;
    company_name: string;
    contacts: CompanyContactData[]; // 해당 회사의 모든 담당자 목록
}

interface ProjectProfile {
    // 프로젝트 기본 정보
    projectName: string;
    inflowPath: string;
    client: string;
    manager: string;
    eventDate: string;
    eventLocation: string;
    attendees: string;
    eventNature: string;
    otSchedule: string;
    submissionSchedule: string;
    expectedRevenue: string;
    expectedCompetitors: string;
    scoreTable: string;
    bidAmount: string;
    // projectStatus: string;
    projectStatus: keyof typeof statusClassMap;

    // 프로젝트 상세 정보
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    comparison: string;

    // 프로젝트 검토 - 🔥 누락된 필드들 추가
    swotAnalysis: string;
    marketSize?: string;           // 새로 추가
    competitorAnalysis?: string;   // 새로 추가
    coreSuccessFactors?: string;   // 새로 추가
    otherNotes?: string;           // 새로 추가
    direction: string;
    resourcePlan: string;
    writerOpinion: string;
    proceedDecision?: string;

    // 작성자 정보
    writerName: string;
    writerDepartment: string;
}


/** [API 응답용] API로부터 받는 프로젝트의 최종 데이터 구조입니다. */
interface ProjectData {
    // --- 프로젝트 기본 속성 (DB 컬럼과 일치) ---
    project_id: number;
    project_name: string;
    status: string;
    created_at: string;
    inflow_path?: string;
    client?: string;
    project_period_start?: string;
    project_period_end?: string;

    // --- 💡 [추가] 누락되었던 모든 상세 정보 필드를 여기에 선언합니다. ---
    event_location?: string;
    attendees?: string;
    event_nature?: string;
    ot_schedule?: string;
    contract_amount?: number;
    expected_competitors?: string;
    project_overview?: string;
    project_scope?: string;
    deliverables?: string;
    special_requirements?: string;
    project_background?: string;
    expected_effects?: string;
    risk_factors?: string;
    business_type?: string; // 💡 이 필드를 추가합니다.

    // --- 💡 [추가] 새로 만든 리포트(정보수집 추가사항) 배열을 선언합니다. ---
    reports?: Array<{
        id: number;
        report_date: string;
        content: string;
    }>;

    // --- 관계를 통해 표현되는 중첩 객체 ---
    writer_info?: WriterInfo;
    updater_info?: WriterInfo;
    company_profile?: CompanyProfileData;
    selected_contact?: CompanyContactData;
}

/** 회사(발주처) 검색 결과 항목의 타입을 정의합니다. */
interface CompanyData {
    id: number;
    company_name: string;
    representative?: string;
    business_number?: string;
}

/** 담당자 상세 정보 모달에 사용될 데이터 타입을 정의합니다. */
interface ContactDetailData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    company: {
        id: number;
        company_name: string;
        address?: string;
    };
    reports?: Array<{
        contact_date: string;
        content: string;
    }>;
}


const ProjectProfileForm: React.FC = () => {
    const [formData, setFormData] = useState<ProjectProfile>({
        projectName: '',
        inflowPath: '',
        client: '',
        manager: '',
        eventDate: '',
        eventLocation: '',
        attendees: '',
        eventNature: '',
        otSchedule: '',
        submissionSchedule: '',
        expectedRevenue: '',
        expectedCompetitors: '',
        scoreTable: '',
        bidAmount: '',
        // projectStatus: Object.keys(statusClassMap)[0],
        projectStatus: "논의중",
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        swotAnalysis: '',
        direction: '',
        resourcePlan: '',
        writerOpinion: '',
        proceedDecision: '',
        writerName: '',
        writerDepartment: ''
    });



    const [showSearchModal, setShowSearchModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);

    const [showCompanySearchModal, setShowCompanySearchModal] = useState(false);
    const [companySearchLoading, setCompanySearchLoading] = useState(false);
    const [companySearchResults, setCompanySearchResults] = useState<CompanyData[]>([]);
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfileData | null>(null);
    const [selectedContact, setSelectedContact] = useState<CompanyContactData | null>(null);
    const [saveMode, setSaveMode] = useState<'insert' | 'update'>('insert');    const [clientCompanyContacts, setClientCompanyContacts] = useState<CompanyContactData[]>([]);

    const [showContactDetailModal, setShowContactDetailModal] = useState(false);
    const [contactDetailData, setContactDetailData] = useState<ContactDetailData | null>(null);

    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);

    const [lastUpdater, setLastUpdater] = useState<WriterInfo | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [existingProfileId, setExistingProfileId] = useState<number | null>(null);

    // URL에서 project_id 가져오기 (기존 코드와 동일한 방식)
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get('project_id');
    const urlProjectId = searchParams.get('project_id');
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
        urlProjectId ? parseInt(urlProjectId) : null
    );

    // 컴포넌트 마운트 시 기존 프로파일 데이터 로드
    useEffect(() => {
        if (projectId) {
            loadExistingProfile(parseInt(projectId));
        }
    }, [projectId]);

    /**
     * 기존 프로파일 데이터 로드
     */
    const loadExistingProfile = async (projectId: number) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/project-profile/${projectId}`);

            if (response.ok) {
                const profile = await response.json();
                if (profile) {
                    setExistingProfileId(profile.id);
                    // 기존 데이터로 form 채우기
                    setFormData(prev => ({
                        ...prev,
                        swotAnalysis: profile.swot_analysis || '',
                        direction: profile.direction || '',
                        resourcePlan: profile.resource_plan || '',
                        writerOpinion: profile.writer_opinion || '',
                        proceedDecision: profile.proceed_decision || ''
                    }));
                }
            } else if (response.status !== 404) {
                // 404가 아닌 다른 에러인 경우에만 에러 처리
                throw new Error('프로파일 데이터를 불러오는 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('프로파일 로드 중 오류:', error);
            setError('기존 프로파일 데이터를 불러오는 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 텍스트에 자동으로 bullet point 추가하는 함수
    const formatWithBullets = (text: string): string => {
        if (!text) return text;

        const lines = text.split('\n');
        return lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
                return `• ${trimmedLine}`;
            }
            return line;
        }).join('\n');
    };

    const handleProjectSearch = async () => {

        // 🔥 검색 모달 열 때 프로파일 필드 초기화
        setFormData(prev => ({
            ...prev,
            swotAnalysis: '',
            direction: '',
            resourcePlan: '',
            writerOpinion: '',
            proceedDecision: ''
        }));
        setExistingProfileId(null);

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

            // const listUrl = `http://localhost:8001/api/projects/?${params.toString()}`;
            // const countUrl = `http://localhost:8001/api/projects/count?${params.toString()}`;
            const listUrl = `/api/projects/?${params.toString()}`;
            const listUrlAxios = `/projects/?${params.toString()}`;

            const countUrl = `/api/projects/count?${params.toString()}`;

            // const response = await fetch(listUrl);
            const response = await apiClient.get(listUrlAxios)

            // const response = await fetch(listUrl, {
            //     headers: {
            //         'Authorization': `Bearer ${sessionId}`, // 또는
            //         'X-Session-Id': sessionId,
            //         'Content-Type': 'application/json'
            //     }
            // });

            // axios는 응답 구조가 다르므로 이 부분들 제거
            // if (!response.ok) {
            //     throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            // }

            // const data = await response.json();
            const data = response.data; // axios는 .data에 파싱된 데이터가 있음
            setSearchResults(data);

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

    const selectProject = async (project: ProjectData) => {
        console.log('🔍 프로젝트 선택됨:', {
            project_id: project.project_id,
            project_name: project.project_name,
            urlProjectId: urlProjectId,
            selectedProjectId: selectedProjectId
        });
        try {
            const response = await fetch(`/api/projects/${project.project_id}`);
            if (!response.ok) throw new Error('프로젝트 정보를 가져올 수 없습니다.');
            const detailedProject: ProjectData = await response.json();

            // --- 💡 [핵심 수정] additionalInfo 데이터를 미리 가공하는 로직 ---
            // 1. API 응답의 reports를 기본 형태로 변환합니다. 데이터가 없으면 빈 배열이 됩니다.
            const reportsData = detailedProject.reports?.map(report => ({
                date: report.report_date,
                content: report.content || ''
            })) || [];

            // 2. 마지막 항목을 확인합니다.
            const lastReport = reportsData[reportsData.length - 1];

            // 3. 데이터가 아예 없거나, 마지막 항목이 비어있지 않으면 새로운 빈 행을 추가합니다.
            if (reportsData.length === 0 || (lastReport && (lastReport.date || lastReport.content))) {
                reportsData.push({ date: '', content: '' });
            }
            // ----------------------------------------------------------------

            setFormData(prev => ({
                ...prev,
                projectName: detailedProject.project_name || '',
                inflowPath: detailedProject.inflow_path || '',
                client: detailedProject.company_profile?.company_name || detailedProject.client || '',
                manager: detailedProject.selected_contact?.contact_name || '',
                eventDate: detailedProject.project_period_start || '',
                submissionSchedule: detailedProject.project_period_end || '',
                eventLocation: detailedProject.event_location || '',
                attendees: detailedProject.attendees || '',
                eventNature: detailedProject.business_type || '',
                otSchedule: detailedProject.ot_schedule || '',
                expectedRevenue: detailedProject.contract_amount?.toString() || '',
                expectedCompetitors: detailedProject.expected_competitors || '',
                purposeBackground: detailedProject.project_overview || '',
                mainContent: detailedProject.project_scope || '',
                comparison: detailedProject.deliverables || '',
                coreRequirements: detailedProject.special_requirements || '',

                // 💡 위에서 가공한 최종 데이터를 상태에 반영합니다.
                additionalInfo: reportsData
            }));

            // --- 나머지 상태 업데이트 로직은 그대로 ---
            setLastUpdater(detailedProject.updater_info || detailedProject.writer_info || null);
            setClientCompanyContacts(detailedProject.company_profile?.contacts || []);
            setSelectedContact(detailedProject.selected_contact || null);
            setSelectedProject(detailedProject);
            setSelectedProjectId(project.project_id);
            setSaveMode('update');

            // 🔥 해당 프로젝트의 프로파일 데이터도 함께 로드
            await loadExistingProfile(project.project_id);

            setShowSearchModal(false);

            console.log('✅ 프로젝트 선택 완료:', {
                새로_설정된_selectedProjectId: project.project_id,
                detailedProject: detailedProject.project_name
            });

        } catch (error) {
            handleApiError(error);
        }
    };

    const renderSearchResults = () => {
        if (searchLoading) {
            return <div className="loading">검색 중...</div>;
        }

        if (searchResults.length === 0) {
            return <div className="no-results">검색 결과가 없습니다.</div>;
        }

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>프로젝트명</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>고객사</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>상태</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>작성자</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>부서</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>생성일</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>선택</th>
                </tr>
                </thead>
                <tbody>
                {searchResults.map((project: ProjectData) => (
                    <tr key={project.project_id}>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.project_name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.client || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}><span className={`status-badge status-${project.status}`}>{getStatusText(project.status)}</span></td>
                        {/*<td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.writer_name || '-'}{project.writer_position && (<small style={{ display: 'block', color: '#666' }}>{project.writer_position}</small>)}</td>*/}
                        {/*<td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.writer_department || '-'}</td>*/}
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {project.writer_info?.name || '-'}
                            {project.writer_info?.position && (
                                <small style={{ display: 'block', color: '#666' }}>
                                    {project.writer_info.position}
                                </small>
                            )}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {project.writer_info?.department || '-'}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(project.created_at).toLocaleDateString('ko-KR')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}><button className="select-btn" onClick={() => selectProject(project)}>선택</button></td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    const getStatusText = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'planning': '기획중', 'active': '진행중', 'completed': '완료', 'cancelled': '취소'
        };
        return statusMap[status] || status;
    };

    // [이 코드 블록을 기존 함수 선언부 아래에 새로 추가하세요]
    const handleOpenCompanySearchModal = async () => {
        setShowCompanySearchModal(true);
        // 모달이 열릴 때 현재 발주처 이름으로 기본 검색을 수행할 수 있습니다.
        await searchCompaniesAPI(formData.client);
    };

    const searchCompaniesAPI = async (searchTerm: string) => {
        setCompanySearchLoading(true);
        try {
            // CompanyProfile 검색과 동일한 API 엔드포인트를 사용합니다.
            // const response = await fetch(`http://localhost:8001/api/company-profile/?search=${encodeURIComponent(searchTerm)}`);
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

            // 💡 [추가] 선택된 회사 정보를 새 상태에 저장합니다.
            setSelectedCompany(detailedCompany);

            // 담당자 목록 상태를 업데이트하고, 기존 담당자 선택은 해제합니다.
            setClientCompanyContacts(detailedCompany.contacts || []);
            setSelectedContact(null);

            // 폼 UI를 업데이트합니다.
            setFormData(prev => ({
                ...prev,
                client: detailedCompany.company_name,
                manager: '', // 발주처를 바꾸면 담당자는 초기화
            }));

            setShowCompanySearchModal(false);
        } catch (error) {
            handleApiError(error);
        }
    };

    const selectContact = (contact: ContactSearchData) => {
        // 💡 [추가] 담당자 정보에 포함된 회사 정보로 selectedCompany 상태도 함께 업데이트합니다.
        setSelectedCompany({
            id: contact.company.id,
            company_name: contact.company.company_name,
            contacts: [], // 이 시점에서는 전체 목록을 모르므로 비워두거나 기존 목록 유지
        });

        // 선택된 담당자 정보를 상태에 저장합니다.
        setSelectedContact({
            id: contact.id,
            contact_name: contact.contact_name,
            is_primary: false,
        });

        // 폼 UI 필드를 업데이트합니다.
        setFormData(prev => ({
            ...prev,
            client: contact.company.company_name,
            manager: contact.contact_name,
        }));

        setShowContactSearchModal(false);
    };


    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetClientAndContact = () => {
        // 1. 선택된 회사와 담당자 객체 상태를 null로 초기화합니다.
        setSelectedCompany(null);
        setSelectedContact(null);

        // 2. 담당자 목록을 비웁니다.
        setClientCompanyContacts([]);

        // 3. 폼 데이터에서 발주처와 담당자 이름 필드를 비웁니다.
        setFormData(prev => ({
            ...prev,
            client: '',
            manager: '',
        }));
    };

    const handleResetClick = (e: React.MouseEvent) => {
        // 부모 버튼의 onClick(검색 모달 열기)이 실행되지 않도록 이벤트 전파를 막습니다.
        e.stopPropagation();
        resetClientAndContact();
    };

    const searchContacts = async (searchTerm: string) => {
        setContactSearchLoading(true);
        try {
            // API는 우선 담당자 이름으로 검색합니다 (초기 검색 시 searchTerm은 '' 입니다).
            // const url = `http://localhost:8001/api/company-profile/contacts/search?search=${encodeURIComponent(searchTerm)}`;
            const url = `/api/company-profile/contacts/search?search=${encodeURIComponent(searchTerm)}`;
            const response = await fetch(url);

            if (!response.ok) throw new Error('담당자 검색에 실패했습니다.');

            let results: ContactSearchData[] = await response.json();

            // [핵심] 발주처(formData.client) 값의 유무에 따라 프론트에서 한번 더 필터링합니다.
            if (formData.client) {
                results = results.filter(contact =>
                    contact.company.company_name === formData.client
                );
            }

            // 최종 결과를 상태에 저장합니다.
            setContactSearchResults(results);

        } catch (error) {
            handleApiError(error);
        } finally {
            setContactSearchLoading(false);
        }
    };

    const handleOpenContactSearchModal = () => {
        setContactSearchTerm(''); // 모달 열 때 검색어 초기화
        setContactSearchResults([]); // 모달 열 때 결과 초기화
        setShowContactSearchModal(true);

        // 모달을 열자마자 초기 검색을 실행합니다.
        searchContacts('');
    };

    const handleContactSearchAPI = async () => {
        // 사용자가 입력한 검색어(contactSearchTerm)로 검색 함수를 호출합니다.
        await searchContacts(contactSearchTerm);
    };

    const handleOpenContactDetailModal = async () => {
        // if (!formData.clientContactId) return;
        if (!selectedContact?.id) return;

        // 실제로는 로딩 상태를 true로 설정하는 것이 좋습니다.
        setShowContactDetailModal(true);
        try {
            // 이 API는 백엔드에 담당자의 모든 상세 정보를 내려주도록 구현해야 합니다.
            const response = await fetch(`/api/company-contacts/${selectedContact.id}/details`);

            if (!response.ok) throw new Error('담당자 상세 정보 조회에 실패했습니다.');

            const data: ContactDetailData = await response.json();
            setContactDetailData(data);
        } catch (error) {
            alert(handleApiError(error));
            setShowContactDetailModal(false); // 실패 시 모달 닫기
        }
    };

    /**
     * 프로젝트 프로파일 저장 함수 (기존 handleSubmit 함수 대체)
     */
    const handleSubmit = async () => {
        console.log('💾 저장 버튼 클릭됨:', {
            urlProjectId: urlProjectId,
            selectedProjectId: selectedProjectId,
            selectedProject_id: selectedProject?.project_id,
            existingProfileId: existingProfileId,
            formData_projectName: formData.projectName
        });

        // 우선순위: selectedProject.project_id > selectedProjectId > urlProjectId
        const finalProjectId = selectedProject?.project_id ||
            selectedProjectId ||
            (urlProjectId ? parseInt(urlProjectId) : null);
        console.log('🎯 사용할 프로젝트 ID:', finalProjectId);

        if (!finalProjectId) {
            console.error('❌ 프로젝트 ID 없음 - 모든 값들:', {
                selectedProjectId,
                urlProjectId,
                selectedProject: selectedProject?.project_id
            });
            setError('프로젝트 ID가 필요합니다.');
            return;
        }

        try {
            setLoading(true);
            setError('');

            const profileData = {
                // project_id: parseInt(projectId),
                project_id: finalProjectId,
                swot_analysis: formData.swotAnalysis || null,
                direction: formData.direction || null,
                resource_plan: formData.resourcePlan || null,
                writer_opinion: formData.writerOpinion || null,
                proceed_decision: formData.proceedDecision || null
            };

            const method = existingProfileId ? 'PUT' : 'POST';
            const response = await fetch(`/api/project-profile/${finalProjectId}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData),
            });


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            console.log('프로젝트 프로파일 저장 완료:', result);

            // 새로 생성한 경우 ID 업데이트
            if (!existingProfileId) {
                setExistingProfileId(result.id);
            }

            alert('프로젝트 프로파일이 성공적으로 저장되었습니다.');

        } catch (error) {
            console.error('프로파일 저장 중 오류:', error);
            const errorMessage = error instanceof Error ? error.message : '저장 중 오류가 발생했습니다.';
            setError(errorMessage);
            alert(`저장 실패: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // handleApiError 함수 추가 (다른 컴포넌트와 동일한 패턴)
    const handleApiError = (error: any): string => {
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
            return '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.';
        }
        if (error?.response?.data?.detail) {
            return error.response.data.detail;
        }
        if (error?.message) {
            return error.message;
        }
        return '알 수 없는 오류가 발생했습니다.';
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="project-profile-container">
            {/* 헤더 */}
            <div className="profile-header">
                <div>
                    <h1 className="profile-title">
                        별첨 2-2. 프로젝트 Profile 양식
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
                        프로젝트 Profile
                    </h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>
                                최종 작성자 :
                                {/*{writerInfo ? `${writerInfo.name} (${writerInfo.department || ''})` : '정보 없음'}*/}
                            </div>
                        </div>
                    </div>
                    {/*<div className="profile-writer">*/}
                    {/*    <div className="writer-form">*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">등록자 이름:</label>*/}
                    {/*            <input*/}
                    {/*                type="text"*/}
                    {/*                name="writerName"*/}
                    {/*                value={formData.writerName}*/}
                    {/*                onChange={handleInputChange}*/}
                    {/*                placeholder="홍길동"*/}
                    {/*                className="writer-field-input"*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">부서:</label>*/}
                    {/*            <input*/}
                    {/*                type="text"*/}
                    {/*                name="writerDepartment"*/}
                    {/*                value={formData.writerDepartment}*/}
                    {/*                onChange={handleInputChange}*/}
                    {/*                placeholder="영업팀"*/}
                    {/*                className="writer-field-input"*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                {/* --- 아래의 모든 JSX 코드는 원본 파일과 완전히 동일합니다. --- */}
                <div className="project-section">
                    <h3 className="section-header">■ 프로젝트 기본 정보</h3>
                    <table className="project-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td><td className="table-header">내용</td><td className="table-header">구분</td><td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">프로젝트명</td>
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    <input type="text" name="projectName" value={formData.projectName} onChange={handleInputChange} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleProjectSearch(); }}} className="project-input" placeholder="프로젝트명 입력 후 엔터 또는 🔍 클릭"/>
                                    <button type="button" onClick={handleProjectSearch} className="search-btn" title="프로젝트 검색">🔍</button>
                                </div>
                            </td>
                            <td className="table-cell table-cell-label">유입경로</td>
                            <td className="table-cell-input"><input type="text" name="inflowPath" value={formData.inflowPath} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">발주처</td>
                            {/* [새로운 발주처 UI] */}
                            <td className="table-cell-input">
                                {(() => {
                                    const isClientFixed = selectedProject && (selectedProject.company_profile?.company_name || selectedProject.client);

                                    if (isClientFixed) {
                                        // [고정 상태] - 기존 로직 유지
                                        // 선택된 프로젝트에 발주처가 원래부터 있었던 경우 -> 고정된 input으로 표시
                                        return (
                                            <div className="input-with-search">
                                                <input
                                                    type="text"
                                                    name="client"
                                                    value={formData.client}
                                                    className="project-input readonly-field"
                                                    readOnly
                                                />
                                                <button type="button" className="search-btn" title="발주처 정보 고정됨" disabled>
                                                    🔍
                                                </button>
                                            </div>
                                        );
                                    } else {
                                        // [활성화 상태] - ✨ 새로운 UI 로직 적용
                                        // 신규 작성이거나, 선택된 프로젝트에 발주처 정보가 없었던 모든 경우
                                        return (
                                            <div className="input-with-search">
                                                {/* 조건부 뱃지: 선택된 회사가 있으면 왼쪽에 뱃지로 표시 */}
                                                {formData.client && (
                                                    <button
                                                        type="button"
                                                        className="status-badge company-badge with-reset"
                                                        onClick={handleOpenCompanySearchModal}
                                                        title="발주처 변경"
                                                    >
                                                        {/* 발주처 이름 */}
                                                        <span className="badge-text">{formData.client}</span>

                                                        {/* 'x' 리셋 아이콘 */}
                                                        <span className="badge-reset-icon" onClick={handleResetClick} title="발주처 초기화">
                                                        ×
                                                    </span>
                                                    </button>

                                                )}

                                                {/* 항상 보이는 검색 버튼: 우측 정렬되어 항상 표시 */}
                                                <button
                                                    type="button"
                                                    onClick={handleOpenCompanySearchModal}
                                                    className="search-btn"
                                                    title="발주처 검색"
                                                    style={{ marginLeft: 'auto' }} // 뱃지 유무와 관계없이 항상 오른쪽에 위치
                                                >
                                                    🔍
                                                </button>
                                            </div>
                                        );
                                    }
                                })()}
                            </td>

                            <td className="table-cell table-cell-label">담당자</td>
                            {/* [새로운 담당자 UI] */}
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    {/* 조건부 뱃지: 선택된 담당자가 있으면 왼쪽에 뱃지로 표시 */}
                                    {/*{formData.clientContactId && (*/}
                                    {/*    <button*/}
                                    {/*        type="button"*/}
                                    {/*        className="status-badge contact-badge"*/}
                                    {/*        onClick={handleOpenContactDetailModal}*/}
                                    {/*        title="담당자 상세 정보 보기"*/}
                                    {/*    >*/}
                                    {/*        {formData.manager}*/}
                                    {/*    </button>*/}
                                    {/*)}*/}
                                    {/* 💡 조건문을 selectedContact로 변경 */}
                                    {selectedContact && (
                                        <button
                                            type="button"
                                            className="status-badge contact-badge"
                                            onClick={handleOpenContactDetailModal}
                                            title="담당자 상세 정보 보기"
                                        >
                                            {formData.manager}
                                        </button>
                                    )}

                                    {/* 항상 보이는 검색 버튼: 우측 정렬되어 항상 표시 */}
                                    <button
                                        type="button"
                                        onClick={handleOpenContactSearchModal}
                                        className="search-btn"
                                        title="담당자 검색"
                                        style={{ marginLeft: 'auto' }} // 뱃지 유무와 관계없이 항상 오른쪽에 위치
                                    >
                                        🔍
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input"><input type="date" name="eventDate" value={formData.eventDate ? formData.eventDate.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; if (selectedDate) { const formattedDate = selectedDate.replace(/-/g, '.'); setFormData(prev => ({ ...prev, eventDate: formattedDate }));} else { setFormData(prev => ({ ...prev, eventDate: '' }));}}} className="project-date-input"/></td>
                            <td className="table-cell table-cell-label">행사장소</td>
                            <td className="table-cell-input"><input type="text" name="eventLocation" value={formData.eventLocation} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">참석대상</td>
                            <td className="table-cell-input"><input type="text" name="attendees" value={formData.attendees} onChange={handleInputChange} placeholder="VIP XX명, 약 XX명 예상" className="project-input"/></td>
                            <td className="table-cell table-cell-label">행사성격</td>
                            <td className="table-cell-input"><input type="text" name="eventNature" value={formData.eventNature} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">OT 일정</td>
                            <td className="table-cell-input"><input type="date" name="otSchedule" value={formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; if (selectedDate) { const formattedDate = selectedDate.replace(/-/g, '.'); setFormData(prev => ({ ...prev, otSchedule: formattedDate }));} else { setFormData(prev => ({ ...prev, otSchedule: '' }));}}} className="project-date-input"/></td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input"><input type="date" name="submissionSchedule" value={formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; if (selectedDate) { const formattedDate = selectedDate.replace(/-/g, '.'); setFormData(prev => ({ ...prev, submissionSchedule: formattedDate }));} else { setFormData(prev => ({ ...prev, submissionSchedule: '' }));}}} className="project-date-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">
                                예 산<br/>( 단위 : 천만원 )
                            </td>
                            <td className="table-cell-input"><input type="text" name="expectedRevenue" value={formData.expectedRevenue} onChange={handleInputChange} placeholder="XX.X [ 수익 X.X ]" className="project-input"/></td>
                            <td className="table-cell table-cell-label">예상 경쟁사</td>
                            <td className="table-cell-input"><input type="text" name="expectedCompetitors" value={formData.expectedCompetitors} onChange={handleInputChange} className="project-input"/></td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className="project-section">
                    <h3 className="section-header">■ 프로젝트 상세 정보</h3>
                    <table className="project-table">
                        <tbody>
                        <tr><td className="table-header">구분</td><td className="table-header">내용</td></tr>
                        <tr><td className="table-cell table-cell-label">목적 및 배경</td><td className="table-cell-input"><textarea name="purposeBackground" value={formData.purposeBackground} onChange={handleInputChange} className="project-textarea textarea-medium"/></td></tr>
                        <tr><td className="table-cell table-cell-label">주요 내용<br/>및<br/>핵심 요구사항</td><td className="table-cell-input"><textarea name="mainContent" value={formData.mainContent} onChange={handleBulletTextChange} placeholder="- 주요 과제, 행사 맥락, 주요 프로그램 등&#10;- 과업 제안범위, 제출금액, 운영 시 필수 고려사항등&#10;- 프로젝트 추진 방향성&#10;- 내외부 리소스 활용방법" className="project-textarea textarea-large bullet-textarea"/></td></tr>
                        {/*<tr><td className="table-cell table-cell-label">핵심 요구사항</td><td className="table-cell-input"><textarea name="coreRequirements" value={formData.coreRequirements} onChange={handleBulletTextChange} placeholder="- 과업 제안범위, 제출금액, 운영 시 필수 고려사항등" className="project-textarea textarea-large bullet-textarea"/></td></tr>*/}
                        <tr><td className="table-cell table-cell-label">비 고</td><td className="table-cell-input"><textarea name="comparison" value={formData.comparison} onChange={handleInputChange} placeholder="- 특이사항 및 중요사항등 추가 기재" className="project-textarea textarea-medium"/></td></tr>
                        </tbody>
                    </table>
                </div>


                {/* 프로젝트 검토 (5x2 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 프로젝트 검토
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">SWOT 분석</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="swotAnalysis"
                                    value={formData.swotAnalysis}
                                    onChange={handleBulletTextChange}
                                    placeholder="- 강점: 독보적 경험과 노하우 활요, 높은 수주가능성&#10;- 약점: 내수율 저조&#10;- 기회: 매출달성에 기여, 차기 Proj 기약&#10;- 위험: 내정자에 따른 휴먼 리소스 소모"
                                    className="profile-textarea textarea-xlarge bullet-textarea"
                                />
                            </td>
                        </tr>
                        {/*<tr>*/}
                        {/*    <td className="table-cell table-cell-label blue-highlight-label">추진방향</td>*/}
                        {/*    <td className="table-cell-input">*/}
                        {/*        <textarea*/}
                        {/*            name="direction"*/}
                        {/*            value={formData.direction}*/}
                        {/*            onChange={handleBulletTextChange}*/}
                        {/*            placeholder="- 프로젝트 추진 방향성&#10;- 내외부 리소스 활용방법"*/}
                        {/*            className="profile-textarea textarea-large bullet-textarea"*/}
                        {/*        />*/}
                        {/*    </td>*/}
                        {/*</tr>*/}
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">리소스 활용방안</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="resourcePlan"
                                    value={formData.resourcePlan}
                                    onChange={handleBulletTextChange}
                                    placeholder="- 내부 전담조직 및 참여자 역량&#10;- 협업 조직: XX사 3D 디자인, 영상팀"
                                    className="profile-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">작성자 의견</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="writerOpinion"
                                    value={formData.writerOpinion}
                                    onChange={handleBulletTextChange}
                                    placeholder="- 프로젝트 진행여부 판단 의견 요약 ( 팀원들의 첨언 포함 )&#10;- 평가등급 기재 (A~C)&#10;      A : 프로젝트 추진&#10;      B : 재검토후 추진여부 결정&#10;      C : 추진 중지"
                                    className="profile-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">진행 부결 사유</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="proceedDecision"
                                    value={formData.proceedDecision}
                                    onChange={handleBulletTextChange}
                                    placeholder="부결 사유 기재"
                                    className="profile-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="button-section">
                    <button
                        onClick={handleSubmit}
                        className="submit-btn"
                        disabled={loading}
                        style={{
                            opacity: loading ? 0.6 : 1,
                            cursor: loading ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {loading ? '저장 중...' : (existingProfileId ? '업데이트' : '저장')}
                    </button>
                    {/*<button onClick={handlePrint} className="print-btn" disabled={loading}>*/}
                    {/*    인쇄*/}
                    {/*</button>*/}
                </div>
            </div>

            {showSearchModal && (
                <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>프로젝트 검색</h3><button className="modal-close-btn" onClick={() => setShowSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {searchLoading ? (<div className="loading">검색 중...</div>) : (
                                <>
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
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* [이 코드 블록을 return문의 최하단에 새로 추가하세요] */}
            {showCompanySearchModal && (
                <div className="modal-overlay" onClick={() => setShowCompanySearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>발주처 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowCompanySearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* 검색 UI는 담당자 검색과 유사하지만, searchCompaniesAPI를 호출합니다. */}
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    defaultValue={formData.client} // 현재 발주처 이름을 기본값으로
                                    onKeyDown={e => { if (e.key === 'Enter') searchCompaniesAPI((e.target as HTMLInputElement).value); }}
                                    placeholder="회사 이름으로 검색"
                                    className="project-input"
                                />
                                <button onClick={() => {
                                    const input = document.querySelector('.modal-body .project-input') as HTMLInputElement;
                                    if (input) searchCompaniesAPI(input.value);
                                }} className="search-btn" style={{ padding: '0 12px' }}>
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

            {/* [이 코드 블록을 return문의 최하단에 추가하세요] */}
            {showContactSearchModal && (
                <div className="modal-overlay" onClick={() => setShowContactSearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>담당자 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowContactSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* [새로운 검색 UI] */}
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                {/* 발주처 값에 따라 동적으로 텍스트를 표시하는 부분 */}
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
                                <button onClick={handleContactSearchAPI} className="search-btn" title="담당자 검색">
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

            {/* 에러 메시지 표시 */}
            {error && (
                <div className="error-message" style={{
                    color: '#d32f2f',
                    backgroundColor: '#ffebee',
                    padding: '12px',
                    borderRadius: '4px',
                    margin: '10px 0',
                    border: '1px solid #ffcdd2'
                }}>
                    <strong>오류:</strong> {error}
                </div>
            )}

        </div>
    );
};

export default ProjectProfileForm;