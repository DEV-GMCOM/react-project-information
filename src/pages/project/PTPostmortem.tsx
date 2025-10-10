// PTPostmortem.tsx - 오류 수정 완료
import React, { useState, useEffect } from 'react';
import '../../styles/PTPostmortem.css';
import ProjectBasicInfoForm from "../../components/common/ProjectBasicInfoForm.tsx";
import { ExtendedProjectData } from '../../types/project';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/utils/apiClient';

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

        //
        try {
            const response = await apiClient.get(`/projects/${projectId}/pt-postmortem`);
            const data = response.data;

            if (data) {
                setFormData(prev => ({
                    ...prev,
                    ptReview: data.pt_review || '',
                    ptResult: data.pt_result || '',
                    reason: data.reason || '',
                    directionConcept: data.direction_concept || '',
                    program: data.program || '',
                    operation: data.produce || '',  // DB의 produce를 operation으로 매핑
                    quotation: data.quotation || '',
                    managerOpinion: data.pt_manager_opinion || '',
                    writerName: data.writer_name || '',
                    writerDepartment: data.writer_department || ''
                }));
            }
        } catch (error: any) {
            console.error('PT Postmortem 데이터 로드 실패:', error);
            // 404 에러는 데이터가 없는 것이므로 에러 처리하지 않음
            if (error.response?.status === 404) {
                setFormData(prev => ({
                    ...prev,
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
                }));
                return;
            }
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
                operation: data.operation,  // 프론트의 operation이 백엔드의 produce로 전달됨
                quotation: data.quotation,
                manager_opinion: data.managerOpinion,
                writer_name: data.writerName,
                writer_department: data.writerDepartment
            };

            const response = await apiClient.post(`/projects/${projectId}/pt-postmortem`, apiData);
            console.log('PT Postmortem 저장 성공:', response.data);
            return true;

        } catch (error: any) {
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

            // 2. alert로 명확한 피드백
            alert('PT Postmortem이 성공적으로 저장되었습니다.');

            // 3. 배너도 표시 (선택사항)
            setSuccessMessage('PT Postmortem이 성공적으로 저장되었습니다.');
            setTimeout(() => setSuccessMessage(null), 3000);

            // 4. 스크롤을 맨 위로 이동
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

                <form onSubmit={handleSubmit}>
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