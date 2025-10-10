// PTPostmortem.tsx - 오류 수정 완료
import React, { useState, useEffect } from 'react';
import '../../styles/PTPostmortem.css';
import ProjectBasicInfoForm from "../../components/common/ProjectBasicInfoForm.tsx";
import { ExtendedProjectData } from '../../types/project';
import { useNavigate } from 'react-router-dom';

interface PTPostmortemData {
    // 프로젝트 기본 정보 (Profile/Kickoff 토글에서 사용)
    projectName?: string;
    inflowRoute?: string;
    client?: string;
    manager?: string;
    eventDate?: string;
    eventLocation?: string;
    attendeeInfo?: string;
    eventType?: string;
    otSchedule?: string;
    ptSchedule?: string;
    expectedRevenue?: string;
    expectedCompetitors?: string;
    scoreTable?: string;
    bidAmount?: string;

    // 프로젝트 상세 정보 (Profile 토글)
    purposeBackground?: string;
    mainContent?: string;
    coreRequirements?: string;
    comparison?: string;

    // 프로젝트 검토 (Profile 토글)
    swotAnalysis?: string;
    direction?: string;
    resourcePlan?: string;
    writerOpinion?: string;

    // 프로젝트 착수 보고 (Kickoff 토글)
    department?: string;
    presenter?: string;
    personnel?: string;
    collaboration?: string;
    plannedExpense?: string;
    progressSchedule?: string;
    riskFactors?: string;
    nextReport?: string;

    // PT 결과 분석
    ptReview: string;
    ptResult: string;
    reason: string;
    directionConcept: string;
    program: string;
    operation: string;
    quotation: string;
    managerOpinion: string;

    // 메타데이터
    writerName: string;
    writerDepartment: string;
}

// API 응답 타입
interface PTPostmortemResponse {
    id: string;
    project_id: string;
    pt_review?: string;
    pt_result?: string;
    reason?: string;
    direction_concept?: string;
    program?: string;
    operation?: string;
    quotation?: string;
    manager_opinion?: string;
    writer_name?: string;
    writer_department?: string;
    created_at: string;
    updated_at: string;
}

const PTPostmortemForm: React.FC = () => {
    const navigate = useNavigate();
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showProfileTables, setShowProfileTables] = useState(false);
    const [showKickoffTables, setShowKickoffTables] = useState(false);

    // ProjectBasicInfoForm용 상태
    const [basicFormData, setBasicFormData] = useState<ExtendedProjectData>({
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
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        writerName: '',
        writerDepartment: ''
    });

    const [formData, setFormData] = useState<PTPostmortemData>({
        projectName: '',
        inflowRoute: '',
        client: '',
        manager: '',
        eventDate: '',
        eventLocation: '',
        attendeeInfo: '',
        eventType: '',
        otSchedule: '',
        ptSchedule: '',
        expectedRevenue: '',
        expectedCompetitors: '',
        scoreTable: '',
        bidAmount: '',
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        swotAnalysis: '',
        direction: '',
        resourcePlan: '',
        writerOpinion: '',
        department: '',
        presenter: '',
        personnel: '',
        collaboration: '',
        plannedExpense: '',
        progressSchedule: '',
        riskFactors: '',
        nextReport: '',
        ptReview: '',
        ptResult: '',
        reason: '',
        directionConcept: '',
        program: '',
        operation: '',
        quotation: '',
        managerOpinion: '',
        writerName: '',
        writerDepartment: ''
    });

    // 로딩 및 에러 상태 관리
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<number | null>(null);

    const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

    // PT Postmortem 데이터 로드
    const loadPTPostmortemData = async (projectId: number) => {
        if (!projectId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${apiBase}/api/projects/${projectId}/pt-postmortem`);

            if (!response.ok) {
                if (response.status === 404) {
                    return;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: PTPostmortemResponse = await response.json();

            setFormData(prev => ({
                ...prev,
                ptReview: data.pt_review || '',
                ptResult: data.pt_result || '',
                reason: data.reason || '',
                directionConcept: data.direction_concept || '',
                program: data.program || '',
                operation: data.operation || '',
                quotation: data.quotation || '',
                managerOpinion: data.manager_opinion || '',
                writerName: data.writer_name || '',
                writerDepartment: data.writer_department || ''
            }));

        } catch (error) {
            console.error('PT Postmortem 데이터 로드 실패:', error);
            setError('PT Postmortem 데이터를 불러오는데 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    // PT Postmortem 데이터 저장
    const savePTPostmortemData = async (data: PTPostmortemData) => {
        if (!projectId) {
            setError('프로젝트가 선택되지 않았습니다.');
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const apiData = {
                pt_review: data.ptReview,
                pt_result: data.ptResult,
                reason: data.reason,
                direction_concept: data.directionConcept,
                program: data.program,
                operation: data.operation,
                quotation: data.quotation,
                manager_opinion: data.managerOpinion,
                writer_name: data.writerName,
                writer_department: data.writerDepartment
            };

            const response = await fetch(`${apiBase}/api/projects/${projectId}/pt-postmortem`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const result: PTPostmortemResponse = await response.json();
            console.log('PT Postmortem 저장 성공:', result);

            return true;

        } catch (error) {
            console.error('PT Postmortem 저장 실패:', error);
            setError(`저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 프로젝트 선택 시 데이터 로드
    useEffect(() => {
        if (projectId) {
            loadPTPostmortemData(projectId);
        }
    }, [projectId]);

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

    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const formattedValue = formatWithBullets(value);
        setFormData(prev => ({
            ...prev,
            [name]: formattedValue
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('PT Postmortem 데이터 저장 시작:', formData);

        const success = await savePTPostmortemData(formData);
        if (success) {
            // 1. 최신 데이터 다시 로드
            if (projectId) {
                await loadPTPostmortemData(projectId);
            }

            // 2. 성공 메시지 표시
            setSuccessMessage('PT Postmortem이 성공적으로 저장되었습니다.');
            setTimeout(() => setSuccessMessage(null), 3000);

            // 3. 스크롤을 맨 위로 이동
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // ProjectBasicInfoForm 핸들러들
    const handleBasicInfoChange = (name: keyof ExtendedProjectData, value: string) => {
        setBasicFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleProjectIdSelected = (selectedProjectId: number) => {
        setProjectId(selectedProjectId);
    };

    const handleToggleStateChange = (isOpen: boolean) => {
        setShowProfileTables(isOpen);
    };

    return (
        <div className="pt-postmortem-container">
            <header className="postmortem-header">
                <h1 className="postmortem-title">별첨 2-4. PT Postmortem</h1>
                <div className="postmortem-logo">GMC</div>
            </header>

            <main className="postmortem-main">
                {/* 성공 메시지 표시 */}
                {successMessage && (
                    <div className="success-banner" style={{
                        padding: '15px',
                        marginBottom: '20px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        border: '1px solid #c3e6cb',
                        borderRadius: '4px',
                        textAlign: 'center'
                    }}>
                        {successMessage}
                    </div>
                )}

                {/* 로딩 및 에러 상태 표시 */}
                {isLoading && (
                    <div className="loading-indicator">
                        데이터를 처리 중입니다...
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        오류: {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    {/* PT 결과 보고서 타이틀 영역 */}
                    <div className="postmortem-title-section">
                        <h2 className="postmortem-subtitle">프로젝트 PT결과 사후분석</h2>
                        <div className="profile-writer">
                            <div className="writer-form">
                                <div>
                                    최종 작성자 :
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-main">
                        {/* ProjectBasicInfoForm 컴포넌트 - 기본/상세 정보 관리 */}
                        <ProjectBasicInfoForm
                            formData={basicFormData}
                            readOnly={true}

                            // onChange={handleBasicInfoChange}
                            showSearch={true}
                            onProjectIdSelected={handleProjectIdSelected}

                            // Project Profile
                            enableDetailSectionToggle={true}
                            showDetailSection={showProfileTables}
                            onDetailSectionChange={handleToggleStateChange}
                            // showReviewSection={true} // 바로 밑에 있는 프로젝트 검토 테이블 영역 표시 여부

                            // Project Kickoff
                            enableKickoffSectionToggle={true}
                            showKickoffSection={showKickoffTables}
                            onKickoffSectionChange={setShowKickoffTables}

                            includeDataSections={["basic", "detail"]}
                            className="project-section"
                            tableClassName="project-table"
                            inputClassName="project-input"
                        />
                    </div>

                    {/*/!* 버튼 섹션 - Project Profile과 Project Kickoff 버튼 *!/*/}
                    {/*<div className="table-action-section">*/}
                    {/*    /!*<button*!/*/}
                    {/*    /!*    type="button"*!/*/}
                    {/*    /!*    className="toggle-profile-btn"*!/*/}
                    {/*    /!*    onClick={() => setShowProfileTables(!showProfileTables)}*!/*/}
                    {/*    /!*>*!/*/}
                    {/*    /!*    Project Profile {showProfileTables ? '숨기기' : '보기'}*!/*/}
                    {/*    /!*</button>*!/*/}
                    {/*    <button*/}
                    {/*        type="button"*/}
                    {/*        className="toggle-profile-btn"*/}
                    {/*        onClick={() => setShowKickoffTables(!showKickoffTables)}*/}
                    {/*    >*/}
                    {/*        Project Kickoff {showKickoffTables ? '숨기기' : '보기'}*/}
                    {/*    </button>*/}
                    {/*</div>*/}

                    {/* 프로젝트 상세 정보 (Profile 토글) */}
                    {/*<div*/}
                    {/*    className={`profile-tables-container ${showProfileTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}*/}
                    {/*    style={{*/}
                    {/*        opacity: showProfileTables ? 1 : 0,*/}
                    {/*        maxHeight: showProfileTables ? '2000px' : '0',*/}
                    {/*        transform: showProfileTables ? 'translateY(0)' : 'translateY(-20px)',*/}
                    {/*        marginBottom: showProfileTables ? '0' : '0',*/}
                    {/*        transition: 'all 1s ease-in-out'*/}
                    {/*    }}*/}
                    {/*>*/}
                    {/*    {showProfileTables && (*/}
                    {/*        <>*/}
                    {/*            <div className="postmortem-section">*/}
                    {/*                <h3 className="section-header">*/}
                    {/*                    ■ 프로젝트 상세 정보*/}
                    {/*                </h3>*/}
                    {/*                <table className="postmortem-table">*/}
                    {/*                    <tbody>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-header">구분</td>*/}
                    {/*                        <td className="table-header">내용</td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">목적 및 배경</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="purposeBackground"*/}
                    {/*                                value={formData.purposeBackground}*/}
                    {/*                                onChange={handleInputChange}*/}
                    {/*                                className="postmortem-textarea textarea-medium"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">주요 내용</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="mainContent"*/}
                    {/*                                value={formData.mainContent}*/}
                    {/*                                onChange={handleBulletTextChange}*/}
                    {/*                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"*/}
                    {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">핵심 요구사항</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="coreRequirements"*/}
                    {/*                                value={formData.coreRequirements}*/}
                    {/*                                onChange={handleBulletTextChange}*/}
                    {/*                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"*/}
                    {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">비고</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="comparison"*/}
                    {/*                                value={formData.comparison}*/}
                    {/*                                onChange={handleInputChange}*/}
                    {/*                                className="postmortem-textarea textarea-medium"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    </tbody>*/}
                    {/*                </table>*/}
                    {/*            </div>*/}

                    {/*            /!* 프로젝트 검토 테이블 *!/*/}
                    {/*            <div className="postmortem-section">*/}
                    {/*                <h3 className="section-header">*/}
                    {/*                    ■ 프로젝트 검토*/}
                    {/*                </h3>*/}
                    {/*                <table className="postmortem-table">*/}
                    {/*                    <tbody>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-header">구분</td>*/}
                    {/*                        <td className="table-header">내용</td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">SWOT 분석</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="swotAnalysis"*/}
                    {/*                                value={formData.swotAnalysis}*/}
                    {/*                                onChange={handleBulletTextChange}*/}
                    {/*                                placeholder="경쟁사 대비 강점과 약점, 기회요인과 위협요인 분석"*/}
                    {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">방향성</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="direction"*/}
                    {/*                                value={formData.direction}*/}
                    {/*                                onChange={handleBulletTextChange}*/}
                    {/*                                placeholder="PT 컨셉, 프로그램 구성 등"*/}
                    {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">자원계획</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="resourcePlan"*/}
                    {/*                                value={formData.resourcePlan}*/}
                    {/*                                onChange={handleBulletTextChange}*/}
                    {/*                                placeholder="팀구성, 외주업체, 투입비용"*/}
                    {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    <tr>*/}
                    {/*                        <td className="table-cell table-cell-label">작성자 의견</td>*/}
                    {/*                        <td className="table-cell-input">*/}
                    {/*                            <textarea*/}
                    {/*                                name="writerOpinion"*/}
                    {/*                                value={formData.writerOpinion}*/}
                    {/*                                onChange={handleBulletTextChange}*/}
                    {/*                                placeholder="프로젝트 진행여부 판단 의견 요약"*/}
                    {/*                                className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                            />*/}
                    {/*                        </td>*/}
                    {/*                    </tr>*/}
                    {/*                    </tbody>*/}
                    {/*                </table>*/}
                    {/*            </div>*/}
                    {/*        </>*/}
                    {/*    )}*/}
                    {/*</div>*/}

                    {/*/!* 프로젝트 착수 보고 (Kickoff 토글) *!/*/}
                    {/*<div*/}
                    {/*    className={`profile-tables-container ${showKickoffTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}*/}
                    {/*    style={{*/}
                    {/*        opacity: showKickoffTables ? 1 : 0,*/}
                    {/*        maxHeight: showKickoffTables ? '2000px' : '0',*/}
                    {/*        transform: showKickoffTables ? 'translateY(0)' : 'translateY(-20px)',*/}
                    {/*        marginBottom: showKickoffTables ? '0' : '0',*/}
                    {/*        transition: 'all 1s ease-in-out'*/}
                    {/*    }}*/}
                    {/*>*/}
                    {/*    {showKickoffTables && (*/}
                    {/*        <div className="postmortem-section">*/}
                    {/*            <h3 className="section-header">*/}
                    {/*                ■ 프로젝트 착수보고*/}
                    {/*            </h3>*/}
                    {/*            <table className="postmortem-table">*/}
                    {/*                <tbody>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-header">구분</td>*/}
                    {/*                    <td className="table-header">내용</td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">담당부서</td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <textarea*/}
                    {/*                            name="department"*/}
                    {/*                            value={formData.department}*/}
                    {/*                            onChange={handleBulletTextChange}*/}
                    {/*                            placeholder="X본부 Y팀"*/}
                    {/*                            className="postmortem-textarea textarea-small bullet-textarea"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">PT발표자</td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <input*/}
                    {/*                            type="text"*/}
                    {/*                            name="presenter"*/}
                    {/*                            value={formData.presenter}*/}
                    {/*                            onChange={handleInputChange}*/}
                    {/*                            className="postmortem-input"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">*/}
                    {/*                        투입인력 및<br/>*/}
                    {/*                        역할, 기여도*/}
                    {/*                    </td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <textarea*/}
                    {/*                            name="personnel"*/}
                    {/*                            value={formData.personnel}*/}
                    {/*                            onChange={handleBulletTextChange}*/}
                    {/*                            placeholder="메인 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )"*/}
                    {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">협업조직</td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <textarea*/}
                    {/*                            name="collaboration"*/}
                    {/*                            value={formData.collaboration}*/}
                    {/*                            onChange={handleBulletTextChange}*/}
                    {/*                            placeholder="키비주얼 : 디자인팀&#10;3D 디자인 : XX 사&#10;영상 : 영상팀"*/}
                    {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">기획 예상경비</td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <textarea*/}
                    {/*                            name="plannedExpense"*/}
                    {/*                            value={formData.plannedExpense}*/}
                    {/*                            onChange={handleBulletTextChange}*/}
                    {/*                            placeholder="출장, 야근택시비, 용역비 등"*/}
                    {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">*/}
                    {/*                        진행 일정<br/>*/}
                    {/*                        (마일스톤)*/}
                    {/*                    </td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <textarea*/}
                    {/*                            name="progressSchedule"*/}
                    {/*                            value={formData.progressSchedule}*/}
                    {/*                            onChange={handleBulletTextChange}*/}
                    {/*                            placeholder="주차별 또는 월별 주요 일정"*/}
                    {/*                            className="postmortem-textarea textarea-large bullet-textarea"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">위험요소</td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <textarea*/}
                    {/*                            name="riskFactors"*/}
                    {/*                            value={formData.riskFactors}*/}
                    {/*                            onChange={handleBulletTextChange}*/}
                    {/*                            placeholder="예상되는 리스크와 대응방안"*/}
                    {/*                            className="postmortem-textarea textarea-medium bullet-textarea"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                <tr>*/}
                    {/*                    <td className="table-cell table-cell-label">차기 보고</td>*/}
                    {/*                    <td className="table-cell-input">*/}
                    {/*                        <textarea*/}
                    {/*                            name="nextReport"*/}
                    {/*                            value={formData.nextReport}*/}
                    {/*                            onChange={handleInputChange}*/}
                    {/*                            placeholder="다음 보고 예정일과 내용"*/}
                    {/*                            className="postmortem-textarea textarea-small"*/}
                    {/*                        />*/}
                    {/*                    </td>*/}
                    {/*                </tr>*/}
                    {/*                </tbody>*/}
                    {/*            </table>*/}
                    {/*        </div>*/}
                    {/*    )}*/}
                    {/*</div>*/}

                    {/* PT 결과 분석 (8x2 테이블) */}
                    <div className="postmortem-section">
                        <h3 className="section-header">
                            ■ PT 결과 분석
                        </h3>

                        <table className="postmortem-table">
                            <tbody>
                            <tr>
                                <td className="table-header">구분</td>
                                <td className="table-header">내용</td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">PT 내용 Review</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="ptReview"
                                        value={formData.ptReview}
                                        onChange={handleBulletTextChange}
                                        placeholder="발표 과정, 질의응답, 분위기 등"
                                        className="postmortem-textarea textarea-large bullet-textarea"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">PT 결과</td>
                                <td className="table-cell-input">
                                    <input
                                        type="text"
                                        name="ptResult"
                                        value={formData.ptResult}
                                        onChange={handleInputChange}
                                        placeholder="낙찰 / 탈락"
                                        className="postmortem-input"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">이유</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleBulletTextChange}
                                        placeholder="성공/실패 요인 분석"
                                        className="postmortem-textarea textarea-large bullet-textarea"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">방향성 / 컨셉</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="directionConcept"
                                        value={formData.directionConcept}
                                        onChange={handleBulletTextChange}
                                        className="postmortem-textarea textarea-medium bullet-textarea"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">프로그램</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="program"
                                        value={formData.program}
                                        onChange={handleBulletTextChange}
                                        className="postmortem-textarea textarea-medium bullet-textarea"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">연출</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="operation"
                                        value={formData.operation}
                                        onChange={handleBulletTextChange}
                                        className="postmortem-textarea textarea-medium bullet-textarea"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">견적</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="quotation"
                                        value={formData.quotation}
                                        onChange={handleBulletTextChange}
                                        className="postmortem-textarea textarea-medium bullet-textarea"
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">담당PM 의견</td>
                                <td className="table-cell-input">
                                    <textarea
                                        name="managerOpinion"
                                        value={formData.managerOpinion}
                                        onChange={handleBulletTextChange}
                                        placeholder="향후 개선사항, 교훈 등"
                                        className="postmortem-textarea textarea-large bullet-textarea"
                                    />
                                </td>
                            </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="button-section">
                        <button
                            type="submit"
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default PTPostmortemForm;