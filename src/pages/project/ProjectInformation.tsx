import React, { useState, useEffect, useRef } from 'react';
import { handleApiError } from '../../api/utils/errorUtils';
import apiClient from '../../api/utils/apiClient';
import '../../styles/ProjectInformation.css';
import { useAuth } from '../../contexts/AuthContext'; // ◀◀◀ 1. AuthContext를 사용하기 위해 import 합니다.

// === 기존 인터페이스들 그대로 유지 ===
/** 직원의 간단한 정보를 나타냅니다. (작성자, 수정자 등) */
interface WriterInfo {
    emp_id: number;
    name: string;
    department?: string;
    position?: string;
    email?: string;
}

/** 고객사 담당자의 상세 정보를 나타냅니다. */
interface CompanyContactData {
    id: number;
    contact_name: string;
    position?: string;
    department?: string;
    email?: string;
    phone?: string;
    is_primary: boolean;
}

/** 회사의 상세 정보와 소속된 모든 담당자 목록을 포함합니다. */
interface CompanyProfileData {
    id: number;
    company_name: string;
    contacts: CompanyContactData[];
}

/** [API 응답용] API로부터 받는 프로젝트의 최종 데이터 구조입니다. */
interface ProjectData {
    project_id: number;
    project_name: string;
    status: string;
    created_at: string;
    inflow_path?: string;
    client?: string;
    project_period_start?: string;
    project_period_end?: string;
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
    business_type?: string;

    // ▼▼▼ [추가] 아래 두 줄을 추가하여 API 응답 데이터 타입을 일치시킵니다. ▼▼▼
    score_table?: string;
    bid_amount?: string;

    reports?: Array<{
        id: number;
        report_date: string;
        content: string;
    }>;
    writer_info?: WriterInfo;
    updater_info?: WriterInfo;
    company_profile?: CompanyProfileData;
    selected_contact?: CompanyContactData;
}

/** [폼 상태 관리용] 화면의 입력 필드 상태를 관리하는 인터페이스입니다. */
interface ProjectInformationFormData {
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
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    comparison: string;
    additionalInfo: Array<{
        date: string;
        content: string;
    }>;
    swotAnalysis: string;
    resourcePlan: string;
    writerOpinion: string;
    proceedDecision: string;
    revenueScore: number | '';
    feasibilityScore: number | '';
    // rfpReviewScore: number | '';
    futureValueScore: number | '';
    relationshipScore: number | '';

    scoreTable: string | '';
    bidAmount: string | '';
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

// === 평가 관련 인터페이스 추가 (UI 변경 없음) ===
interface ProjectEvaluationCriteria {
    id: number;
    category: string;
    category_name: string;
    description: string;
    max_score: number;
    sort_order: number;
}

interface ProjectEvaluationScore {
    criteria_id: number;
    score: number;
    notes?: string;
}


const ProjectInformationForm: React.FC = () => {

    const { user } = useAuth(); // ◀◀◀ 2. useAuth()를 호출하여 로그인한 user 객체를 가져옵니다.

// ✅ contactSearchInputRef를 여기서 선언합니다.
    const contactSearchInputRef = useRef<HTMLInputElement>(null);

    // === 기존 상태들 모두 그대로 유지 ===
    const [formData, setFormData] = useState<ProjectInformationFormData>({
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
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        additionalInfo: [{ date: '', content: '' }],
        swotAnalysis: '',
        resourcePlan: '',
        writerOpinion: '',
        proceedDecision: '',
        revenueScore: '',
        feasibilityScore: '',
        // rfpReviewScore: '',
        futureValueScore: '',
        relationshipScore: '',

        scoreTable: '',
        bidAmount: '',
    });
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<ProjectData[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [writerSearchModal, setWriterSearchModal] = useState(false);
    const [writerSearchResults, setWriterSearchResults] = useState<WriterInfo[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [lastUpdater, setLastUpdater] = useState<WriterInfo | null>(null);
    const [showContactSearchModal, setShowContactSearchModal] = useState(false);
    // const [contactSearchTerm, setContactSearchTerm] = useState('');
    const [contactSearchResults, setContactSearchResults] = useState<ContactSearchData[]>([]);
    const [contactSearchLoading, setContactSearchLoading] = useState(false);
    const [showContactDetailModal, setShowContactDetailModal] = useState(false);
    const [contactDetailData, setContactDetailData] = useState<ContactDetailData | null>(null);
    const [showCompanySearchModal, setShowCompanySearchModal] = useState(false);
    const [companySearchResults, setCompanySearchResults] = useState<CompanyData[]>([]);
    const [companySearchLoading, setCompanySearchLoading] = useState(false);
    const [saveMode, setSaveMode] = useState<'insert' | 'update'>('insert');
    const [clientCompanyContacts, setClientCompanyContacts] = useState<CompanyContactData[]>([]);
    const [selectedContact, setSelectedContact] = useState<CompanyContactData | null>(null);
    const [selectedCompany, setSelectedCompany] = useState<CompanyProfileData | null>(null);
    const [showChecklist, setShowChecklist] = useState(false);
    const [checklistTotalScore, setChecklistTotalScore] = useState<number | null>(null);
    const [checklistGrade, setChecklistGrade] = useState<string>('');
    const revenueScoreRef = useRef<HTMLInputElement>(null);
    const feasibilityScoreRef = useRef<HTMLInputElement>(null);
    const futureValueScoreRef = useRef<HTMLInputElement>(null);
    const relationshipScoreRef = useRef<HTMLInputElement>(null);
    const scoreRefMap = { revenueScore: revenueScoreRef, feasibilityScore: feasibilityScoreRef, futureValueScore: futureValueScoreRef, relationshipScore: relationshipScoreRef };
    // 회사명 검색어를 위한 별도의 state를 추가합니다.
    const [companySearchTerm, setCompanySearchTerm] = useState('');


    // === 평가 관련 상태 추가 (내부 로직용) ===
    const [evaluationCriteria, setEvaluationCriteria] = useState<ProjectEvaluationCriteria[]>([]);
    const [evaluationScores, setEvaluationScores] = useState<{ [key: number]: number }>({});

    // // 1. useEffect를 사용하여 contactSearchTerm 변경 시 디바운싱 적용
    // useEffect(() => {
    //     // 모달이 닫혀있으면 아무것도 하지 않음
    //     if (!showContactSearchModal) return;
    //
    //     // 사용자가 입력을 멈추면 300ms 후에 검색 실행
    //     const searchTimer = setTimeout(() => {
    //         // searchContacts 함수를 호출해야 합니다!
    //         searchContacts(contactSearchTerm);
    //     }, 300); // 딜레이를 300ms로 조절하여 반응성을 높입니다.
    //
    //     // 사용자가 다시 타이핑을 시작하면 이전 타이머를 취소
    //     return () => {
    //         clearTimeout(searchTimer);
    //     };
    // }, [contactSearchTerm, showContactSearchModal]); // 이 부분은 그대로 유지


    // 2. 회사명 검색에도 동일하게 디바운싱 적용
    useEffect(() => {
        const handler = setTimeout(() => {
            if (showCompanySearchModal && companySearchTerm) {
                searchCompaniesAPI(companySearchTerm);
            }
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [companySearchTerm, showCompanySearchModal]);


    // === 기존 useEffect들 그대로 유지 ===
    useEffect(() => {
        if (formData.projectName === '') {
            setSelectedProject(null);
            setLastUpdater(null);
            setClientCompanyContacts([]);
            setSelectedContact(null);
            setSaveMode('insert');
            setFormData(prev => ({ ...prev, client: '', manager: '' }));
        }
    }, [formData.projectName]);

    useEffect(() => {
        const { revenueScore, feasibilityScore, futureValueScore, relationshipScore } = formData;
        const revenue = Number(revenueScore) || 0;
        const feasibility = Number(feasibilityScore) || 0;
        const futureValue = Number(futureValueScore) || 0;
        const relationship = Number(relationshipScore) || 0;
        const total = revenue + feasibility + futureValue + relationship;
        setChecklistTotalScore(total);
        if (total <= 70) setChecklistGrade('C');
        else if (total <= 80) setChecklistGrade('B');
        else setChecklistGrade('A');
    }, [formData.revenueScore, formData.feasibilityScore, formData.futureValueScore, formData.relationshipScore]);

    // === 평가 관련 useEffect 추가 ===
    useEffect(() => {
        loadEvaluationCriteria();
    }, []);

    // === 평가 관련 함수들 추가 (UI 변경 없음, 내부 로직만) ===
    const loadEvaluationCriteria = async () => {
        try {
            const response = await apiClient.get('/projects/evaluation/criteria');
            setEvaluationCriteria(response.data || []);
        } catch (error) {
            console.error('평가 기준 로드 실패:', error);
        }
    };

    const loadProjectEvaluation = async (projectId: number) => {
        try {
            const response = await apiClient.get(`/projects/${projectId}/evaluation`);
            if (response.data && response.data.scores) {
                const scoresMap: { [key: number]: number } = {};
                response.data.scores.forEach((score: ProjectEvaluationScore) => {
                    scoresMap[score.criteria_id] = score.score;
                });
                setEvaluationScores(scoresMap);
            }
        } catch (error) {
            console.error('프로젝트 평가 데이터 로드 실패:', error);
        }
    };

    const saveEvaluation = async () => {
        if (!selectedProject?.project_id) {
            return;
        }

        try {
            const scores = evaluationCriteria.map(criteria => ({
                criteria_id: criteria.id,
                score: evaluationScores[criteria.id] || 0
            }));

            await apiClient.post(`/projects/${selectedProject.project_id}/evaluation`, {
                project_id: selectedProject.project_id,
                scores: scores
            });
        } catch (error) {
            console.error('평가 저장 실패:', error);
        }
    };

    // === 기존 함수들 그대로 유지하되, selectProject에 평가 로드 추가 ===
    const handleProjectSearch = async () => {
        setShowSearchModal(true);
        setCurrentPage(1);
        await searchProjects(1);
    };

    const searchProjects = async (page: number) => {
        try {
            setSearchLoading(true);
            const params = {
                skip: (page - 1) * 10,
                limit: 10,
                search: formData.projectName || ''
            };
            const listResponse = await apiClient.get('/projects/', { params });
            const countResponse = await apiClient.get('/projects/count', { params });
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

    const selectProject = async (project: ProjectData) => {
        try {
            // --- 1. 프로젝트 기본 정보 로드 ---
            const response = await apiClient.get(`/projects/${project.project_id}`);
            const detailedProject: ProjectData = response.data;

            // 폼 기본 정보 업데이트 (기존과 동일)
            const reportsData = detailedProject.reports?.map(report => ({
                date: report.report_date,
                content: report.content || ''
            })) || [];
            if (reportsData.length === 0 || (reportsData[reportsData.length - 1] && (reportsData[reportsData.length - 1].date || reportsData[reportsData.length - 1].content))) {
                reportsData.push({ date: '', content: '' });
            }

            setFormData(prev => ({
                ...prev,
                // (기본 정보 필드 매핑은 기존과 동일)
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
                additionalInfo: reportsData,


                // ▼▼▼ [추가] 아래 두 줄을 추가하세요. ▼▼▼
                scoreTable: detailedProject.score_table || '',
                bidAmount: detailedProject.bid_amount || '',

                // 불러오기 전, 관련 필드 초기화
                swotAnalysis: '',
                resourcePlan: '',
                writerOpinion: '',
                proceedDecision: '',
                revenueScore: '',
                feasibilityScore: '',
                futureValueScore: '',
                relationshipScore: '',
            }));

            setLastUpdater(detailedProject.updater_info || detailedProject.writer_info || null);
            setClientCompanyContacts(detailedProject.company_profile?.contacts || []);
            setSelectedContact(detailedProject.selected_contact || null);
            setSelectedProject(detailedProject);
            setSaveMode('update');
            setShowSearchModal(false);

            // --- 2. [핵심] 상세 데이터(검토, 평가) 로드 및 에러 처리 ---

            // '프로젝트 검토' 데이터 로드
            try {
                const profileResponse = await apiClient.get(`/projects/${project.project_id}/profile`);
                const profileData = profileResponse.data;
                setFormData(prev => ({
                    ...prev,
                    swotAnalysis: profileData.swot_analysis || '',
                    resourcePlan: profileData.resource_plan || '',
                    writerOpinion: profileData.writer_opinion || '',
                    proceedDecision: profileData.proceed_decision || ''
                }));
            } catch (error) {
                console.error("⚠️ [로드 실패] 프로젝트 검토(Profile) 데이터를 가져오는 데 실패했습니다.", error);
                // 실패해도 UI는 유지하되, 관련 필드는 비워진 상태가 됩니다.
            }

            // '평가 점수' 데이터 로드
            try {
                const evaluationResponse = await apiClient.get(`/projects/${project.project_id}/evaluation`);
                const evaluationData = evaluationResponse.data;
                console.log("[프론트엔드] ✅ 평가 점수 응답 성공:", evaluationData);

                // ▼▼▼ [최종 수정] criteria와 scores를 조합하는 로직 ▼▼▼
                if (evaluationData && evaluationData.criteria && evaluationData.scores) {

                    // 1. 카테고리 이름과 폼 필드 이름을 매핑하는 객체
                    const categoryToFieldMap: { [key: string]: keyof ProjectInformationFormData } = {
                        'revenue_profit': 'revenueScore',
                        'feasibility': 'feasibilityScore',
                        'future_value': 'futureValueScore',
                        'relationship': 'relationshipScore'
                    };

                    // 2. API 응답의 criteria 배열을 사용하여, criteria_id를 폼 필드 이름으로 변환하는 맵을 생성합니다.
                    //    결과 예시: { 1: 'revenueScore', 2: 'feasibilityScore', ... }
                    const criteriaIdToFieldMap: { [key: number]: keyof ProjectInformationFormData } = {};
                    evaluationData.criteria.forEach((criterion: any) => {
                        const fieldName = categoryToFieldMap[criterion.category];
                        if (fieldName) {
                            criteriaIdToFieldMap[criterion.id] = fieldName;
                        }
                    });

                    // 3. scores 배열을 순회하며, 위에서 만든 맵을 사용해 점수를 업데이트할 객체를 만듭니다.
                    const newScores: Partial<ProjectInformationFormData> = {};
                    evaluationData.scores.forEach((scoreItem: any) => {
                        const fieldName = criteriaIdToFieldMap[scoreItem.criteria_id];
                        if (fieldName) {
                            newScores[fieldName] = scoreItem.score;
                        }
                    });

                    // 4. 최종적으로 formData 상태를 업데이트합니다.
                    setFormData(prev => ({
                        ...prev,
                        revenueScore: newScores.revenueScore ?? '',
                        feasibilityScore: newScores.feasibilityScore ?? '',
                        futureValueScore: newScores.futureValueScore ?? '',
                        relationshipScore: newScores.relationshipScore ?? '',
                    }));
                }
                // ▲▲▲ [최종 수정] 여기까지 ▲▲▲
            } catch (error) {
                console.error("⚠️ [로드 실패] 프로젝트 평가(Evaluation) 데이터를 가져오는 데 실패했습니다.", error);
                // 마찬가지로 점수 칸은 빈 상태로 유지됩니다.
            }

        } catch (error) {
            // '프로젝트 기본 정보' 로드 실패 시의 포괄적 에러 처리
            console.error("🚨 [로드 실패] 프로젝트 기본 정보를 가져오는 데 실패했습니다.", error);
            handleApiError(error);
        }
    };

    // longjaw/react-information-test/longjaw-react-information-test-4eafa308b2e55b44b208032ca1291495f51fea0f/src/pages/project/ProjectInformation.tsx

    const handleSubmit = async () => {

        // --- [핵심] 로그인 상태 확인 ---
        if (!user) {
            alert("로그인 정보가 없습니다. 다시 로그인해주세요.");
            return;
        }

        if (!formData.projectName.trim()) {
            alert('프로젝트명을 입력해주세요.');
            return;
        }

        let action = saveMode;
        if (action === 'update' && selectedProject && formData.projectName !== selectedProject.project_name) {
            if (!window.confirm('프로젝트명이 변경되었습니다.\n\n- "확인": 현재 프로젝트를 수정합니다.\n- "취소": 새 프로젝트로 생성합니다.')) {
                action = 'insert';
            }
        }

        // const currentUser = { id: 1, name: "테스트유저" }; // 실제 인증 로직으로 대체 필요

        // --- 1. [기본 정보] API 전송 데이터 준비 ---
        const apiData = {
            project_name: formData.projectName,
            // ... (나머지 기본 정보 필드들은 기존과 동일)
            inflow_path: formData.inflowPath,
            client: formData.client,
            client_manager_name: formData.manager,
            business_type: formData.eventNature,
            expected_competitors: formData.expectedCompetitors,
            event_location: formData.eventLocation,
            attendees: formData.attendees,
            contract_amount: parseFloat(formData.expectedRevenue) || null,
            project_overview: formData.purposeBackground,
            project_scope: formData.mainContent,
            deliverables: formData.comparison,
            special_requirements: formData.coreRequirements,
            project_period_start: formData.eventDate ? formData.eventDate.replace(/\./g, '-') : null,
            project_period_end: formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : null,
            ot_schedule: formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : null,

            // ▼▼▼ [추가] 아래 두 줄을 추가하세요. ▼▼▼
            scoreTable: formData.scoreTable || '',
            bidAmount: formData.bidAmount || '',

            company_id: selectedCompany?.id,
            client_contact_id: selectedContact?.id,
            writer_emp_id: selectedProject?.writer_info?.emp_id || user.emp_id,
            writer_name: lastUpdater?.name || user.emp_name,
            reports: formData.additionalInfo.filter(info => info.date || info.content).map(info => ({
                report_date: info.date ? info.date.replace(/\./g, '-') : null,
                content: info.content
            }))
        };

        let result; // 저장 성공 후 프로젝트 데이터를 담을 변수

        // --- 2. [기본 정보] 저장 시도 ---
        try {
            if (action === 'update' && selectedProject) {
                const response = await apiClient.put(`/projects/${selectedProject.project_id}`, apiData);
                result = response.data;
            } else {
                const response = await apiClient.post('/projects/', apiData);
                result = response.data;
            }
        } catch (error) {
            console.error("🚨 [저장 실패] 프로젝트 기본 정보 저장 중 오류가 발생했습니다.", error);
            handleApiError(error);
            return; // 기본 정보 저장 실패 시, 더 이상 진행하지 않음
        }

        // --- 기본 정보 저장이 성공한 경우에만 아래 로직 실행 ---
        if (result && result.project_id) {
            // --- 3. [프로젝트 검토] 저장 시도 ---
            const profileData = {
                project_id: result.project_id,
                swot_analysis: formData.swotAnalysis,
                resource_plan: formData.resourcePlan,
                writer_opinion: formData.writerOpinion,
                proceed_decision: formData.proceedDecision
            };
            try {
                await apiClient.put(`/projects/${result.project_id}/profile`, profileData);
            } catch (error: any) {
                if (error.response?.status === 404) {
                    try {
                        await apiClient.post(`/projects/${result.project_id}/profile`, profileData);
                    } catch (postError) {
                        console.error("⚠️ [저장 실패] 프로젝트 검토(Profile) 정보 생성 중 오류가 발생했습니다.", postError);
                    }
                } else {
                    console.error("⚠️ [저장 실패] 프로젝트 검토(Profile) 정보 업데이트 중 오류가 발생했습니다.", error);
                }
            }

            // --- 4. [평가 점수] 저장 시도 (디버깅 강화) ---
            if (evaluationCriteria && evaluationCriteria.length > 0) {
                console.log("--- 🔍 [디버그 시작] scoresPayload 생성 과정을 추적합니다. ---");
                console.log("현재 formData 상태:", formData);
                console.log("현재 evaluationCriteria 상태:", evaluationCriteria);

                const scoresPayload = [
                    { field: 'revenueScore', category: 'revenue_profit' },
                    { field: 'feasibilityScore', category: 'feasibility' },
                    { field: 'futureValueScore', category: 'future_value' },
                    { field: 'relationshipScore', category: 'relationship' }
                ]
                    .map(mapping => {
                        console.log(`\n[디버그] ➡️ 항목: ${mapping.field}`);

                        const criteria = evaluationCriteria.find(c => c.category === mapping.category);
                        const score = formData[mapping.field as keyof ProjectInformationFormData];

                        console.log(`    - formData에서 가져온 score 값:`, score);
                        console.log(`    - score의 타입 (typeof):`, typeof score);
                        console.log(`    - '${mapping.category}'에 해당하는 criteria 발견 여부:`, !!criteria);
                        if(criteria) {
                            console.log(`    - 발견된 criteria ID:`, criteria.id);
                        }

                        if (criteria && typeof score === 'number') {
                            console.log(`    - ✅ [성공] 모든 조건을 통과했습니다. payload에 추가됩니다.`);
                            return { criteria_id: criteria.id, score: score };
                        } else {
                            console.log(`    - ❌ [실패] 조건 불충족으로 payload에서 제외됩니다.`);
                            return null;
                        }
                    })
                    .filter(item => item !== null) as Array<{ criteria_id: number; score: number }>;

                console.log("--- ✅ [디버그 종료] 최종 생성된 scoresPayload: ---", scoresPayload);


                if (scoresPayload.length > 0) {
                    try {
                        const bulkUpdateData = {
                            project_id: result.project_id,
                            evaluator_id: user.emp_id,
                            scores: scoresPayload.map(s => ({
                                criteria_id: s.criteria_id,
                                score: s.score,
                                notes: ""
                            }))
                        };

                        console.log("[프론트엔드] 📤 전송할 데이터(Payload):", bulkUpdateData);
                        await apiClient.post(`/projects/${result.project_id}/evaluation`, bulkUpdateData);
                        console.log("[프론트엔드] ✅ 평가 점수 저장 요청 성공!");

                    } catch (evaluationError) {
                        console.error("⚠️ [프론트엔드] 🚨 평가 점수 저장 중 에러가 발생했습니다!", evaluationError);
                    }
                } else {
                    console.log("[프론트엔드] ℹ️ 전송할 평가 점수가 없어 API를 호출하지 않습니다.");
                }
            } else {
                console.warn("[프론트엔드] ⚠️ 평가 기준(Criteria)이 로드되지 않아 점수를 저장할 수 없습니다.");
            }

            // --- 5. 모든 저장 작업 완료 후 최종 처리 ---
            alert(`프로젝트가 성공적으로 ${action === 'update' ? '수정' : '생성'}되었습니다! (일부 저장에 실패했을 수 있으니 콘솔을 확인하세요)`);
            setSaveMode('update');
            setSelectedProject(result);
            setLastUpdater(result.updater_info || result.writer_info || null);
            setClientCompanyContacts(result.company_profile?.contacts || []);
            setSelectedContact(result.selected_contact || null);
        }
    };

    // === 나머지 모든 기존 함수들 그대로 유지 ===
    const searchWriters = async (searchTerm: string) => {
        try {
            const response = await apiClient.get('/hr/', { params: { search: searchTerm, limit: 20 } });
            setWriterSearchResults(response.data);
        } catch (error) {
            console.error('작성자 검색 오류:', error);
        }
    };

    const searchContacts = async (searchTerm: string) => {
        setContactSearchLoading(true);
        try {
            const response = await apiClient.get('/company-profile/contacts/search', { params: { search: searchTerm } });
            let results: ContactSearchData[] = response.data;
            if (formData.client) {
                results = results.filter(contact => contact.company.company_name === formData.client);
            }
            setContactSearchResults(results);
        } catch (error) {
            handleApiError(error);
        } finally {
            setContactSearchLoading(false);
        }
    };

    const handleOpenContactDetailModal = async () => {
        if (!selectedContact?.id) return;
        setShowContactDetailModal(true);
        try {
            const response = await apiClient.get(`/company-contacts/${selectedContact.id}/details`);
            setContactDetailData(response.data);
        } catch (error) {
            alert(handleApiError(error));
            setShowContactDetailModal(false);
        }
    };

    const searchCompaniesAPI = async (searchTerm: string) => {
        setCompanySearchLoading(true);
        try {
            const response = await apiClient.get('/company-profile/', { params: { search: searchTerm } });
            setCompanySearchResults(response.data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setCompanySearchLoading(false);
        }
    };

    const selectCompany = async (company: CompanyData) => {
        try {
            const response = await apiClient.get(`/company-profile/${company.id}`);
            const detailedCompany: CompanyProfileData = response.data;
            setSelectedCompany(detailedCompany);
            setClientCompanyContacts(detailedCompany.contacts || []);
            setSelectedContact(null);
            setFormData(prev => ({ ...prev, client: detailedCompany.company_name, manager: '' }));
            setShowCompanySearchModal(false);
        } catch (error) {
            handleApiError(error);
        }
    };

    const getStatusText = (status: string): string => {
        const statusMap: { [key: string]: string } = {
            'planning': '기획중', 'active': '진행중', 'completed': '완료', 'cancelled': '취소'
        };
        return statusMap[status] || status;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAdditionalInfoChange = (index: number, field: 'date' | 'content', value: string) => {
        const updatedInfo = [...formData.additionalInfo];
        updatedInfo[index][field] = value;

        const isLastRow = index === updatedInfo.length - 1;
        const currentRowFilled = updatedInfo[index].date.trim() && updatedInfo[index].content.trim();

        if (isLastRow && currentRowFilled) {
            updatedInfo.push({ date: '', content: '' });
        }

        setFormData(prev => ({
            ...prev,
            additionalInfo: updatedInfo
        }));
    };

    const addNewAdditionalInfo = () => {
        setFormData(prev => ({
            ...prev,
            additionalInfo: [...prev.additionalInfo, { date: '', content: '' }]
        }));
    };

    const removeAdditionalInfo = (index: number) => {
        if (formData.additionalInfo.length <= 1) {
            setFormData(prev => ({
                ...prev,
                additionalInfo: [{ date: '', content: '' }]
            }));
            return;
        }
        const updatedInfo = formData.additionalInfo.filter((_, i) => i !== index);
        const lastItem = updatedInfo[updatedInfo.length - 1];
        if (updatedInfo.length === 0 || (lastItem && lastItem.date && lastItem.content)) {
            updatedInfo.push({ date: '', content: '' });
        }
        setFormData(prev => ({
            ...prev,
            additionalInfo: updatedInfo
        }));
    };

    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePrint = () => { window.print(); };

    const selectWriter = (writer: any) => {
        const writerNameInput = document.querySelector('input[name="writerName"]') as HTMLInputElement;
        const writerDeptInput = document.querySelector('input[name="writerDepartment"]') as HTMLInputElement;
        if (writerNameInput) { writerNameInput.value = writer.emp_name; writerNameInput.readOnly = false; writerNameInput.className = 'writer-field-input'; }
        if (writerDeptInput) { writerDeptInput.value = writer.division || ''; writerDeptInput.readOnly = false; writerDeptInput.className = 'writer-field-input'; }
        setWriterSearchModal(false);
    };

    const handleOpenContactSearchModal = () => {
        setContactSearchResults([]);
        setShowContactSearchModal(true);
    };

    // 담당자 검색 API 호출 함수를 ref를 사용하도록 수정합니다.
    const handleContactSearchAPI = async () => {
        // ref에서 현재 값을 직접 읽어옵니다.
        const term = contactSearchInputRef.current?.value || '';
        await searchContacts(term);
    };

    const selectContact = (contact: ContactSearchData) => {
        setSelectedCompany({
            id: contact.company.id,
            company_name: contact.company.company_name,
            contacts: [],
        });
        setSelectedContact({
            id: contact.id,
            contact_name: contact.contact_name,
            is_primary: false,
        });
        setFormData(prev => ({
            ...prev,
            client: contact.company.company_name,
            manager: contact.contact_name,
        }));
        setShowContactSearchModal(false);
    };

    // 모달을 여는 함수를 수정하여, 모달이 열릴 때 state를 초기화하도록 합니다.
    const handleOpenCompanySearchModal = async () => {
        // 현재 발주처 입력값을 기본 검색어로 설정
        setCompanySearchTerm(formData.client);
        setShowCompanySearchModal(true);
        await searchCompaniesAPI(formData.client);
    };

    const resetClientAndContact = () => {
        setSelectedCompany(null);
        setSelectedContact(null);
        setClientCompanyContacts([]);
        setFormData(prev => ({ ...prev, client: '', manager: '' }));
    };

    const handleResetClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        resetClientAndContact();
    };

    const handleChecklistScoreChange = (scoreField: string, value: string, maxScore: number) => {

        // ▼▼▼ [최종 수정] 입력 값 처리를 더 명확하게 변경합니다. ▼▼▼
        let numValue: number | '' = Number(value); // 우선 숫자로 변환 시도

        // 1. 변환 결과가 숫자가 아니거나(NaN), 빈 문자열이 입력된 경우 -> 빈 문자열('')로 통일
        if (isNaN(numValue) || value.trim() === '') {
            numValue = '';
        }
        // 2. 유효 범위를 벗어난 경우 경고 후 함수 종료
        else if (numValue > maxScore || numValue < 0) {
            alert(`점수는 0과 배점(${maxScore}점) 사이여야 합니다.`);
            return;
        }
        // ▲▲▲ [최종 수정] 여기까지 ▲▲▲

        // formData 업데이트
        setFormData(prev => ({ ...prev, [scoreField]: numValue }));

        // evaluationScores도 함께 업데이트
        if (evaluationCriteria.length > 0) {
            const criteriaMap = {
                'revenueScore': evaluationCriteria.find(c => c.category === 'revenue')?.id,
                'feasibilityScore': evaluationCriteria.find(c => c.category === 'feasibility')?.id,
                'futureValueScore': evaluationCriteria.find(c => c.category === 'future_value')?.id,
                'relationshipScore': evaluationCriteria.find(c => c.category === 'relationship')?.id,
            };

            const criteriaId = criteriaMap[scoreField as keyof typeof criteriaMap];
            if (criteriaId) {
                setEvaluationScores(prev => ({
                    ...prev,
                    [criteriaId]: numValue === '' ? 0 : numValue
                }));
            }
        }
    };

    const handleScoreKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, nextField: string | null) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextField && scoreRefMap[nextField as keyof typeof scoreRefMap]) {
                scoreRefMap[nextField as keyof typeof scoreRefMap].current?.focus();
            } else {
                (e.target as HTMLInputElement).blur();
            }
        }
    };

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
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            {project.writer_info?.name || '-'}
                            {project.writer_info?.position && (<small style={{ display: 'block', color: '#666' }}>{project.writer_info.position}</small>)}
                        </td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.writer_info?.department || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{new Date(project.created_at).toLocaleDateString('ko-KR')}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}><button className="select-btn" onClick={() => selectProject(project)}>선택</button></td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };

    const WriterSearchModal: React.FC = () => {
        const [searchTerm, setSearchTerm] = useState('');
        return writerSearchModal ? (
            <div className="modal-overlay" onClick={() => setWriterSearchModal(false)}>
                <div className="modal-content" onClick={e => e.stopPropagation()}>
                    <div className="modal-header"><h3>직원 검색</h3><button onClick={() => setWriterSearchModal(false)}>×</button></div>
                    <div className="modal-body">
                        <div className="search-input-container"><input type="text" placeholder="이름 또는 이메일 입력 시 자동검색 (1글자 이상)" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); if (e.target.value.length >= 1) { searchWriters(e.target.value); }}}/></div>
                        <div className="search-results">{writerSearchResults.map((writer: any) => (<div key={writer.emp_id} className="writer-result-item" onClick={() => selectWriter(writer)}><div><strong>{writer.emp_name || writer.name}</strong><div style={{ fontSize: '12px', color: '#676' }}>{writer.division || writer.department} {writer.position && `· ${writer.position}`}</div></div><div style={{ fontSize: '12px', color: '#666' }}>{writer.email}</div></div>))}</div>
                    </div>
                </div>
            </div>
        ) : null;
    };

    // === 원본 JSX 렌더링 그대로 유지 ===
    return (
        <div className="project-info-container">
            <div className="project-header">
                <div><h1 className="project-title">별첨 2-1. (프로젝트) 정보 수집 양식</h1></div>
                <div className="project-logo">GMCOM</div>
            </div>
            <div className="project-main">
                <div className="project-title-section">
                    <h2 className="project-subtitle">정보 수집</h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>최종 작성자 : {lastUpdater?.name || '정보 없음'}</div>
                            {/*<div>최종 작성자 : {writerInfo ? `${writerInfo.name} (${writerInfo.department || ''})` : '정보 없음'}</div>*/}
                        </div>
                    </div>
                </div>
                <div className="project-section">
                    <h3 className="section-header">■ 프로젝트 기본 정보</h3>
                    <table className="project-table">
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
                            <td className="table-cell-input">
                                {(() => {
                                    const isClientFixed = selectedProject && (selectedProject.company_profile?.company_name || selectedProject.client);
                                    if (isClientFixed) {
                                        return (
                                            <div className="input-with-search">
                                                <input type="text" name="client" value={formData.client} className="project-input readonly-field" readOnly />
                                                <button type="button" className="search-btn" title="발주처 정보 고정됨" disabled>🔍</button>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <div className="input-with-search">
                                                {formData.client && (
                                                    <button type="button" className="status-badge company-badge with-reset" onClick={handleOpenCompanySearchModal} title="발주처 변경">
                                                        <span className="badge-text">{formData.client}</span>
                                                        <span className="badge-reset-icon" onClick={handleResetClick} title="발주처 초기화">×</span>
                                                    </button>
                                                )}
                                                <button type="button" onClick={handleOpenCompanySearchModal} className="search-btn" title="발주처 검색" style={{ marginLeft: 'auto' }}>🔍</button>
                                            </div>
                                        );
                                    }
                                })()}
                            </td>
                            <td className="table-cell table-cell-label">담당자</td>
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    {selectedContact && (
                                        <button type="button" className="status-badge contact-badge" onClick={handleOpenContactDetailModal} title="담당자 상세 정보 보기">
                                            {formData.manager}
                                        </button>
                                    )}
                                    <button type="button" onClick={handleOpenContactSearchModal} className="search-btn" title="담당자 검색" style={{ marginLeft: 'auto' }}>🔍</button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input"><input type="date" name="eventDate" value={formData.eventDate ? formData.eventDate.replace(/\./g, '-') : ''} onChange={(e) => setFormData(prev => ({...prev, eventDate: e.target.value.replace(/-/g,'.')}))} className="project-date-input"/></td>
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
                            <td className="table-cell-input"><input type="date" name="otSchedule" value={formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : ''} onChange={(e) => setFormData(prev => ({...prev, otSchedule: e.target.value.replace(/-/g,'.')}))} className="project-date-input"/></td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input"><input type="date" name="submissionSchedule" value={formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : ''} onChange={(e) => setFormData(prev => ({...prev, submissionSchedule: e.target.value.replace(/-/g,'.')}))} className="project-date-input"/></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">예 산<br/>( 단위 : 천만원 )</td>
                            <td className="table-cell-input"><input type="text" name="expectedRevenue" value={formData.expectedRevenue} onChange={handleInputChange} placeholder="XX.X [ 수익 X.X ]" className="project-input"/></td>
                            <td className="table-cell table-cell-label">예상 경쟁사</td>
                            <td className="table-cell-input"><input type="text" name="expectedCompetitors" value={formData.expectedCompetitors} onChange={handleInputChange} className="project-input"/></td>
                        </tr>


                        <tr>
                            <td className="table-cell table-cell-label">배점표</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="scoreTable"
                                    value={formData.scoreTable}
                                    onChange={handleInputChange}
                                    className={`project-input`}
                                    // className={`kickoff-input ${readOnly ? 'readonly-input' : ''}`}
                                    // readOnly={readOnly}
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
                                    className={`project-input`}
                                    // className={`kickoff-input ${readOnly ? 'readonly-input' : ''}`}
                                    // readOnly={readOnly}
                                />
                            </td>
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
                        <tr><td className="table-cell table-cell-label">비 고</td><td className="table-cell-input"><textarea name="comparison" value={formData.comparison} onChange={handleInputChange} placeholder="- 특이사항 및 중요사항등 추가 기재" className="project-textarea textarea-medium"/></td></tr>
                        </tbody>
                    </table>
                </div>
                <div className="profile-section">
                    <h3 className="section-header">■ 프로젝트 검토</h3>
                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header" colSpan={4}>내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">SWOT 분석</td>
                            <td className="table-cell-input" colSpan={4}>
                                <textarea name="swotAnalysis" value={formData.swotAnalysis} onChange={handleBulletTextChange} placeholder="- 강점: 독보적 경험과 노하우 활요, 높은 수주가능성&#10;- 약점: 내수율 저조&#10;- 기회: 매출달성에 기여, 차기 Proj 기약&#10;- 위험: 내정자에 따른 휴먼 리소스 소모" className="profile-textarea textarea-xlarge bullet-textarea" />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">리소스 활용방안</td>
                            <td className="table-cell-input" colSpan={4}>
                                <textarea name="resourcePlan" value={formData.resourcePlan} onChange={handleBulletTextChange} placeholder="- 내부 전담조직 및 참여자 역량&#10;- 협업 조직: XX사 3D 디자인, 영상팀" className="profile-textarea textarea-large bullet-textarea" />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">작성자 의견</td>
                            <td className="table-cell-input" colSpan={4}>
                                <div className="inner-checklist-container">
                                    <table className="inner-checklist-table">
                                        <thead>
                                        <tr>
                                            <th className="inner-table-header">구분</th>
                                            <th className="inner-table-header">내용</th>
                                            <th className="inner-table-header">배점</th>
                                            <th className="inner-table-header">점수</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">매출액 및 이익</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 예상 매출규모의 충분성<br/>• 예상 수익률의 적정성</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">50</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={revenueScoreRef} type="number" min="0" max="50" name="revenueScore" value={formData.revenueScore} onChange={(e) => handleChecklistScoreChange('revenueScore', e.target.value, 50)} onKeyDown={(e) => handleScoreKeyDown(e, 'feasibilityScore')} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">실행가능성</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 수주가능성 : 유착관계, 당사 리스크 등<br/>• 당사 동원 인력의 역량 및 활용상황<br/>• 참여조건, 심사기준 등의 적합성<br/>• 당사 단독 준비 가능여부, 협업 필요성등<br/>• 수주 가능성 분석 : 유착관계, 당사 리스크 등</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">30</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={feasibilityScoreRef} type="number" min="0" max="30" name="feasibilityScore" value={formData.feasibilityScore} onChange={(e) => handleChecklistScoreChange('feasibilityScore', e.target.value, 30)} onKeyDown={(e) => handleScoreKeyDown(e, 'futureValueScore')} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">미래가치성</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 클라이언트 브랜드 시장가치<br/>• 향후 반복수주의 가능성</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">10</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={futureValueScoreRef} type="number" min="0" max="10" name="futureValueScore" value={formData.futureValueScore} onChange={(e) => handleChecklistScoreChange('futureValueScore', e.target.value, 10)} onKeyDown={(e) => handleScoreKeyDown(e, 'relationshipScore')} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr>
                                            <td className="inner-table-cell inner-table-cell-label">관계성</td>
                                            <td className="inner-table-cell inner-table-cell-content"><div className="bullet-content">• 이전 년도 프로젝트 정보 수집<br/>• 최근 2년간 클라이언트와의 관계성<br/>• 당사와의 관계성</div></td>
                                            <td className="inner-table-cell inner-table-cell-weight">10</td>
                                            <td className="inner-table-cell inner-table-cell-input"><input ref={relationshipScoreRef} type="number" min="0" max="10" name="relationshipScore" value={formData.relationshipScore} onChange={(e) => handleChecklistScoreChange('relationshipScore', e.target.value, 10)} onKeyDown={(e) => handleScoreKeyDown(e, null)} className="checklist-score-input" placeholder="0" /></td>
                                        </tr>
                                        <tr className="total-row">
                                            <td className="inner-table-cell inner-table-cell-merged" colSpan={2}>총점</td>
                                            <td className="inner-table-cell inner-table-cell-weight">100</td>
                                            <td className="inner-table-cell inner-table-cell-total">{checklistTotalScore !== null ? checklistTotalScore : '-'}</td>
                                        </tr>
                                        <tr className="grade-row">
                                            <td className="inner-table-cell inner-table-cell-merged" colSpan={2}>종합 등급&emsp;&emsp;(&emsp;&emsp;C:0~70&emsp;&emsp;&emsp;B:71~80&emsp;&emsp;&emsp;A:81~100&emsp;&emsp;)</td>
                                            <td className="inner-table-cell inner-table-cell-dash">-</td>
                                            <td className="inner-table-cell inner-table-cell-grade">{checklistGrade ? (<span className={`grade-badge grade-${checklistGrade.toLowerCase()}`}>{checklistGrade}</span>) : '-'}</td>
                                        </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <br/>
                                <div><textarea name="writerOpinion" value={formData.writerOpinion} onChange={handleBulletTextChange} placeholder="- 프로젝트 진행여부 판단 의견 요약 ( 팀원들의 첨언 포함 )&#10;- 평가등급 기재 (A~C)&#10;      A : 프로젝트 추진&#10;      B : 재검토후 추진여부 결정&#10;      C : 추진 중지" className="profile-textarea textarea-large bullet-textarea" /></div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label blue-highlight-label">진행 부결 사유</td>
                            <td className="table-cell-input" colSpan={4}>
                                <textarea name="proceedDecision" value={formData.proceedDecision} onChange={handleBulletTextChange} placeholder="부결 사유 기재" className="profile-textarea textarea-large bullet-textarea" />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>
                <div className="project-section">
                    <h3 className="section-header">■ 정보수집 추가 사항</h3>
                    <table className="project-table">
                        <tbody>
                        <tr><td className="table-header contact-date-header">날짜</td><td className="table-header">주요 내용</td></tr>
                        {formData.additionalInfo.map((info, index) => (
                            <tr key={index}>
                                <td className="table-cell contact-date-cell">{index === 0 && info.date === '2025.07.23' ? (<div className="contact-date">{info.date}</div>) : (<input type="date" value={info.date ? info.date.replace(/\./g, '-') : ''} onChange={(e) => { const selectedDate = e.target.value; const formattedDate = selectedDate ? selectedDate.replace(/-/g, '.') : ''; handleAdditionalInfoChange(index, 'date', formattedDate);}} className="project-date-input"/>)}</td>
                                <td className="table-cell-input"><div className="info-content-container"><textarea value={info.content} onChange={(e) => handleAdditionalInfoChange(index, 'content', e.target.value)} placeholder="- 미팅 안건, 협의/논의 했던 내용등을 기재 &#10;- 프로젝트와 연계된 내용 위주로 작성 ( 개인정보, 개인성향 등 지양 )" className="project-textarea textarea-large bullet-textarea" style={{ whiteSpace: 'pre-line' }}/></div></td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                <div className="button-section">
                    <button onClick={handleSubmit} className="submit-btn" disabled={!formData.projectName.trim()}>저장</button>
                </div>
            </div>

            {/* === 모든 기존 모달들 그대로 유지 === */}
            {showSearchModal && (
                <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>프로젝트 검색</h3><button className="modal-close-btn" onClick={() => setShowSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {/* ✅ 입력란 추가 - formData.projectName 직접 사용 */}
                            <div className="input-with-search" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    value={formData.projectName}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        projectName: e.target.value
                                    }))}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            setCurrentPage(1);
                                            searchProjects(1);
                                        }
                                    }}
                                    placeholder="프로젝트명을 입력하세요"
                                    className="project-input"
                                />
                                <button
                                    onClick={() => {
                                        setCurrentPage(1);
                                        searchProjects(1);
                                    }}
                                    className="search-btn"
                                >
                                    🔍
                                </button>
                            </div>
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
            <WriterSearchModal />
            {showContactSearchModal && (
                <div className="modal-overlay" onClick={() => setShowContactSearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>담당자 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowContactSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                <div className="search-prefix">{formData.client ? `${formData.client} :` : '전체 고객사 :'}</div>

                                {/*담당자 검색 모달 JSX를 아래와 같이 수정합니다.*/}
                                {/* ▼▼▼ [핵심] 이 부분을 교체합니다 ▼▼▼ */}
                                <input
                                    ref={contactSearchInputRef}
                                    type="text"
                                    defaultValue="" // value와 onChange를 모두 제거하고 defaultValue 사용
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                            handleContactSearchAPI();
                                        }
                                    }}
                                    placeholder="담당자 이름 검색"
                                    className="project-input"
                                />
                                <button onClick={handleContactSearchAPI} className="search-btn" title="담당자 검색">🔍</button>
                                {/* ▲▲▲ 수정 완료 ▲▲▲ */}

                            </div>
                            {contactSearchLoading ? (
                                <div className="loading">검색 중...</div>
                            ) : (
                                <table className="search-table">
                                    <thead><tr><th>담당자명</th><th>소속 회사</th><th>선택</th></tr></thead>
                                    <tbody>
                                    {contactSearchResults.length > 0 ? (
                                        contactSearchResults.map(contact => (
                                            <tr key={contact.id}>
                                                <td>{contact.contact_name}</td>
                                                <td>{contact.company.company_name}</td>
                                                <td><button className="select-btn" onClick={() => selectContact(contact)}>선택</button></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={3} className="no-results">검색 결과가 없습니다.</td></tr>
                                    )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {showContactDetailModal && contactDetailData && (
                <div className="modal-overlay" onClick={() => setShowContactDetailModal(false)}>
                    <div className="modal-content wide-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>담당자 상세 정보 (읽기 전용)</h3>
                            <button className="modal-close-btn" onClick={() => setShowContactDetailModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="detail-section">
                                <h4>담당자 상세정보</h4>
                                <p><strong>이름:</strong> {contactDetailData.contact_name}</p>
                                <p><strong>소속/부서:</strong> {contactDetailData.department || '-'}</p>
                                <p><strong>직급:</strong> {contactDetailData.position || '-'}</p>
                            </div>
                            <div className="detail-section">
                                <h4>컨택 리포트</h4>
                                <div className="report-list">
                                    {contactDetailData.reports && contactDetailData.reports.length > 0 ? (
                                        contactDetailData.reports.map((report, index) => (
                                            <div key={index} className="report-item"><strong>{report.contact_date}:</strong> {report.content}</div>
                                        ))
                                    ) : ( <p>내역 없음</p> )}
                                </div>
                            </div>
                            <div className="detail-section">
                                <h4>회사정보</h4>
                                <p><strong>회사명:</strong> {contactDetailData.company.company_name}</p>
                                <p><strong>주소:</strong> {contactDetailData.company.address || '정보 없음'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showCompanySearchModal && (
                <div className="modal-overlay" onClick={() => setShowCompanySearchModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>발주처 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowCompanySearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-with-search" style={{ marginBottom: '15px' }}>
                                {/*발주처(회사명) 검색 모달 JSX도 동일한 방식으로 수정합니다.*/}
                                <input
                                    type="text"
                                    value={companySearchTerm}
                                    onChange={(e) => setCompanySearchTerm(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                                            searchCompaniesAPI(companySearchTerm);
                                        }
                                    }}
                                    placeholder="회사 이름으로 검색"
                                    className="project-input"
                                />
                                <button
                                    onClick={() => searchCompaniesAPI(companySearchTerm)}
                                    className="search-btn"
                                    style={{ padding: '0 12px' }}
                                >
                                    🔍
                                </button>
                            </div>
                            {companySearchLoading ? (
                                <div className="loading">검색 중...</div>
                            ) : (
                                <table className="search-table">
                                    <thead><tr><th>회사명</th><th>대표자</th><th>사업자번호</th><th>선택</th></tr></thead>
                                    <tbody>
                                    {companySearchResults.length > 0 ? (
                                        companySearchResults.map(company => (
                                            <tr key={company.id}>
                                                <td>{company.company_name}</td>
                                                <td>{company.representative || '-'}</td>
                                                <td>{company.business_number || '-'}</td>
                                                <td><button className="select-btn" onClick={() => selectCompany(company)}>선택</button></td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan={4} className="no-results">검색 결과가 없습니다.</td></tr>
                                    )}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectInformationForm;