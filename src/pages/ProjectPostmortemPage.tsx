// pages/ProjectPostmortemPage.tsx
import React, { useState } from 'react';
import '../styles/FormPage.css';

interface ProjectPostmortem {
    id?: string;
    projectName: string;
    projectType: string;
    client: string;
    projectManager: string;
    teamLeader: string;
    plannedStartDate: string;
    actualStartDate: string;
    plannedEndDate: string;
    actualEndDate: string;
    plannedBudget: string;
    actualBudget: string;

    // 프로젝트 성과 평가
    scopeRating: number;
    timeRating: number;
    budgetRating: number;
    qualityRating: number;
    clientSatisfactionRating: number;
    teamSatisfactionRating: number;
    overallSuccessRating: number;

    // 목표 달성도
    objectivesAchieved: string;
    deliverablesCompleted: string;
    kpiResults: string;

    // 상세 분석
    whatWentWell: string;
    whatWentWrong: string;
    majorChallenges: string;
    solutionsImplemented: string;
    unexpectedIssues: string;

    // 팀 및 프로세스
    teamPerformance: string;
    communicationEffectiveness: string;
    processEfficiency: string;
    toolsAndTechnology: string;

    // 고객 관계
    clientFeedback: string;
    clientRelationship: string;
    futureOpportunities: string;

    // 재무 분석
    budgetVariance: string;
    profitabilityAnalysis: string;
    costFactors: string;

    // 기술적 측면
    technicalChallenges: string;
    technicalSolutions: string;
    technicalDebt: string;
    technologyDecisions: string;

    // 리스크 관리
    identifiedRisks: string;
    riskMitigation: string;
    unforeseenRisks: string;

    // 학습 및 개선
    lessonsLearned: string;
    improvementRecommendations: string;
    processImprovements: string;
    trainingNeeds: string;

    // 향후 계획
    followUpProjects: string;
    maintenancePlan: string;
    knowledgeTransfer: string;

    // 추가 정보
    competitorAnalysis: string;
    marketInsights: string;
    notes: string;

    // 새로 추가된 필드들
    registeredBy: string;
    department: string;
    revenueGenerated: string;
    profitMargin: string;
    clientRetention: string;
    teamTurnover: string;
    qualityMetrics: string;
    customerSatisfactionScore: string;
    projectComplexity: string;
    innovationAspects: string;
    sustainabilityImpact: string;
    scalabilityAssessment: string;
}

const ProjectPostmortemPage: React.FC = () => {
    const [formData, setFormData] = useState<ProjectPostmortem>({
        projectName: '',
        projectType: '',
        client: '',
        projectManager: '',
        teamLeader: '',
        plannedStartDate: '',
        actualStartDate: '',
        plannedEndDate: '',
        actualEndDate: '',
        plannedBudget: '',
        actualBudget: '',
        scopeRating: 5,
        timeRating: 5,
        budgetRating: 5,
        qualityRating: 5,
        clientSatisfactionRating: 5,
        teamSatisfactionRating: 5,
        overallSuccessRating: 5,
        objectivesAchieved: '',
        deliverablesCompleted: '',
        kpiResults: '',
        whatWentWell: '',
        whatWentWrong: '',
        majorChallenges: '',
        solutionsImplemented: '',
        unexpectedIssues: '',
        teamPerformance: '',
        communicationEffectiveness: '',
        processEfficiency: '',
        toolsAndTechnology: '',
        clientFeedback: '',
        clientRelationship: '',
        futureOpportunities: '',
        budgetVariance: '',
        profitabilityAnalysis: '',
        costFactors: '',
        technicalChallenges: '',
        technicalSolutions: '',
        technicalDebt: '',
        technologyDecisions: '',
        identifiedRisks: '',
        riskMitigation: '',
        unforeseenRisks: '',
        lessonsLearned: '',
        improvementRecommendations: '',
        processImprovements: '',
        trainingNeeds: '',
        followUpProjects: '',
        maintenancePlan: '',
        knowledgeTransfer: '',
        competitorAnalysis: '',
        marketInsights: '',
        notes: '',
        registeredBy: '',
        department: '',
        revenueGenerated: '',
        profitMargin: '',
        clientRetention: '',
        teamTurnover: '',
        qualityMetrics: '',
        customerSatisfactionScore: '',
        projectComplexity: '',
        innovationAspects: '',
        sustainabilityImpact: '',
        scalabilityAssessment: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'number' ? parseInt(value) : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('프로젝트 포스트모템 저장:', formData);
        // TODO: API 연동 후 실제 저장 로직 구현
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 8) return '#4CAF50';
        if (rating >= 6) return '#FF9800';
        return '#F44336';
    };

    const getAverageRating = () => {
        const ratings = [
            formData.scopeRating,
            formData.timeRating,
            formData.budgetRating,
            formData.qualityRating,
            formData.clientSatisfactionRating,
            formData.teamSatisfactionRating
        ];
        return (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1);
    };

    return (
        <div className="bidding-page-wrapper">
            <div className="form-page">
                <div className="page-header">
                    <h1>📊 프로젝트 결과 Postmortem</h1>
                    <p>완료된 프로젝트의 전반적인 결과 분석과 교훈을 정리합니다.</p>
                    <div className="overall-rating">
                        <span>종합 평가: {getAverageRating()}점</span>
                    </div>
                </div>

                <div className="registrant-info">
                    <div className="registrant-input-group">
                        <label htmlFor="registeredBy" className="required">등록자 이름</label>
                        <input
                            type="text"
                            id="registeredBy"
                            name="registeredBy"
                            value={formData.registeredBy}
                            onChange={handleInputChange}
                            required
                            placeholder="이름 입력"
                            className="registrant-input"
                        />
                    </div>
                    <div className="registrant-input-group">
                        <label htmlFor="department" className="required">부서</label>
                        <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            required
                            className="registrant-select"
                        >
                            <option value="" disabled>부서 선택</option>
                            <option value="A팀">A팀</option>
                            <option value="B팀">B팀</option>
                            <option value="C팀">C팀</option>
                            <option value="경영지원">경영지원</option>
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-container">
                    <div className="form-section">
                        <h2>프로젝트 기본 정보</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="projectName" className="required">프로젝트명</label>
                                <input
                                    type="text"
                                    id="projectName"
                                    name="projectName"
                                    value={formData.projectName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="프로젝트 이름을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="projectType">프로젝트 유형</label>
                                <select
                                    id="projectType"
                                    name="projectType"
                                    value={formData.projectType}
                                    onChange={handleInputChange}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="event">이벤트/행사</option>
                                    <option value="marketing">마케팅</option>
                                    <option value="web">웹 개발</option>
                                    <option value="mobile">모바일 앱</option>
                                    <option value="system">시스템 구축</option>
                                    <option value="consulting">컨설팅</option>
                                    <option value="other">기타</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="client">고객사</label>
                                <input
                                    type="text"
                                    id="client"
                                    name="client"
                                    value={formData.client}
                                    onChange={handleInputChange}
                                    placeholder="고객사명"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="projectManager">프로젝트 매니저</label>
                                <input
                                    type="text"
                                    id="projectManager"
                                    name="projectManager"
                                    value={formData.projectManager}
                                    onChange={handleInputChange}
                                    placeholder="PM 이름"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="teamLeader">팀 리더</label>
                                <input
                                    type="text"
                                    id="teamLeader"
                                    name="teamLeader"
                                    value={formData.teamLeader}
                                    onChange={handleInputChange}
                                    placeholder="팀 리더 이름"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="projectComplexity">프로젝트 복잡도</label>
                                <select
                                    id="projectComplexity"
                                    name="projectComplexity"
                                    value={formData.projectComplexity}
                                    onChange={handleInputChange}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="low">낮음</option>
                                    <option value="medium">보통</option>
                                    <option value="high">높음</option>
                                    <option value="very_high">매우 높음</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>일정 및 예산 비교</h2>
                        <div className="comparison-grid">
                            <div className="comparison-group">
                                <h3>일정</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="plannedStartDate">계획 시작일</label>
                                        <input
                                            type="date"
                                            id="plannedStartDate"
                                            name="plannedStartDate"
                                            value={formData.plannedStartDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="actualStartDate">실제 시작일</label>
                                        <input
                                            type="date"
                                            id="actualStartDate"
                                            name="actualStartDate"
                                            value={formData.actualStartDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="plannedEndDate">계획 종료일</label>
                                        <input
                                            type="date"
                                            id="plannedEndDate"
                                            name="plannedEndDate"
                                            value={formData.plannedEndDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="actualEndDate">실제 종료일</label>
                                        <input
                                            type="date"
                                            id="actualEndDate"
                                            name="actualEndDate"
                                            value={formData.actualEndDate}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="comparison-group">
                                <h3>예산</h3>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label htmlFor="plannedBudget">계획 예산 [단위:억]</label>
                                        <input
                                            type="text"
                                            id="plannedBudget"
                                            name="plannedBudget"
                                            value={formData.plannedBudget}
                                            onChange={handleInputChange}
                                            placeholder="계획된 예산"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="actualBudget">실제 예산 [단위:억]</label>
                                        <input
                                            type="text"
                                            id="actualBudget"
                                            name="actualBudget"
                                            value={formData.actualBudget}
                                            onChange={handleInputChange}
                                            placeholder="실제 사용된 예산"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="revenueGenerated">창출 매출 [단위:억]</label>
                                        <input
                                            type="text"
                                            id="revenueGenerated"
                                            name="revenueGenerated"
                                            value={formData.revenueGenerated}
                                            onChange={handleInputChange}
                                            placeholder="프로젝트로 창출된 매출"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="profitMargin">수익률 [%]</label>
                                        <input
                                            type="text"
                                            id="profitMargin"
                                            name="profitMargin"
                                            value={formData.profitMargin}
                                            onChange={handleInputChange}
                                            placeholder="실제 달성된 수익률"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>성과 평가 (1-10점)</h2>
                        <div className="rating-grid">
                            <div className="rating-item">
                                <label htmlFor="scopeRating">범위 달성도</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="scopeRating"
                                        name="scopeRating"
                                        min="1"
                                        max="10"
                                        value={formData.scopeRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.scopeRating) }}
                                    >
                                        {formData.scopeRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="timeRating">일정 준수</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="timeRating"
                                        name="timeRating"
                                        min="1"
                                        max="10"
                                        value={formData.timeRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.timeRating) }}
                                    >
                                        {formData.timeRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="budgetRating">예산 준수</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="budgetRating"
                                        name="budgetRating"
                                        min="1"
                                        max="10"
                                        value={formData.budgetRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.budgetRating) }}
                                    >
                                        {formData.budgetRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="qualityRating">품질</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="qualityRating"
                                        name="qualityRating"
                                        min="1"
                                        max="10"
                                        value={formData.qualityRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.qualityRating) }}
                                    >
                                        {formData.qualityRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="clientSatisfactionRating">고객 만족도</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="clientSatisfactionRating"
                                        name="clientSatisfactionRating"
                                        min="1"
                                        max="10"
                                        value={formData.clientSatisfactionRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.clientSatisfactionRating) }}
                                    >
                                        {formData.clientSatisfactionRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="teamSatisfactionRating">팀 만족도</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="teamSatisfactionRating"
                                        name="teamSatisfactionRating"
                                        min="1"
                                        max="10"
                                        value={formData.teamSatisfactionRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.teamSatisfactionRating) }}
                                    >
                                        {formData.teamSatisfactionRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="overallSuccessRating">종합 성공도</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="overallSuccessRating"
                                        name="overallSuccessRating"
                                        min="1"
                                        max="10"
                                        value={formData.overallSuccessRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.overallSuccessRating) }}
                                    >
                                        {formData.overallSuccessRating}점
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>핵심 지표 및 성과</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="customerSatisfactionScore">고객 만족도 점수</label>
                                <input
                                    type="text"
                                    id="customerSatisfactionScore"
                                    name="customerSatisfactionScore"
                                    value={formData.customerSatisfactionScore}
                                    onChange={handleInputChange}
                                    placeholder="예: 4.5/5.0 또는 90/100"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="clientRetention">고객 유지율</label>
                                <input
                                    type="text"
                                    id="clientRetention"
                                    name="clientRetention"
                                    value={formData.clientRetention}
                                    onChange={handleInputChange}
                                    placeholder="예: 계속 거래 또는 추가 프로젝트 논의"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="teamTurnover">팀 이탈률</label>
                                <input
                                    type="text"
                                    id="teamTurnover"
                                    name="teamTurnover"
                                    value={formData.teamTurnover}
                                    onChange={handleInputChange}
                                    placeholder="프로젝트 중 팀원 교체/이탈 현황"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="qualityMetrics">품질 지표</label>
                                <input
                                    type="text"
                                    id="qualityMetrics"
                                    name="qualityMetrics"
                                    value={formData.qualityMetrics}
                                    onChange={handleInputChange}
                                    placeholder="버그 수, 재작업률, 품질 점검 결과 등"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>목표 달성도</h2>
                        <div className="form-group">
                            <label htmlFor="objectivesAchieved">달성된 목표</label>
                            <textarea
                                id="objectivesAchieved"
                                name="objectivesAchieved"
                                value={formData.objectivesAchieved}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트에서 달성한 주요 목표들을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="deliverablesCompleted">완료된 산출물</label>
                            <textarea
                                id="deliverablesCompleted"
                                name="deliverablesCompleted"
                                value={formData.deliverablesCompleted}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="완료된 주요 산출물들과 그 품질 수준을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="kpiResults">KPI 결과</label>
                            <textarea
                                id="kpiResults"
                                name="kpiResults"
                                value={formData.kpiResults}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="설정했던 KPI들의 실제 달성 결과를 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>혁신 및 영향도</h2>
                        <div className="form-group">
                            <label htmlFor="innovationAspects">혁신적 측면</label>
                            <textarea
                                id="innovationAspects"
                                name="innovationAspects"
                                value={formData.innovationAspects}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트에서 도입한 혁신적인 요소나 새로운 시도들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="sustainabilityImpact">지속가능성 영향</label>
                            <textarea
                                id="sustainabilityImpact"
                                name="sustainabilityImpact"
                                value={formData.sustainabilityImpact}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="환경, 사회적 지속가능성에 미친 영향을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="scalabilityAssessment">확장성 평가</label>
                            <textarea
                                id="scalabilityAssessment"
                                name="scalabilityAssessment"
                                value={formData.scalabilityAssessment}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 결과물의 확장 가능성과 재사용성을 평가하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>상세 분석</h2>
                        <div className="form-group">
                            <label htmlFor="whatWentWell">성공 요인</label>
                            <textarea
                                id="whatWentWell"
                                name="whatWentWell"
                                value={formData.whatWentWell}
                                onChange={handleInputChange}
                                rows={5}
                                placeholder="프로젝트에서 성공적으로 진행된 부분들을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="whatWentWrong">개선이 필요한 점</label>
                            <textarea
                                id="whatWentWrong"
                                name="whatWentWrong"
                                value={formData.whatWentWrong}
                                onChange={handleInputChange}
                                rows={5}
                                placeholder="문제가 있었거나 개선이 필요한 부분들을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="majorChallenges">주요 도전과제</label>
                            <textarea
                                id="majorChallenges"
                                name="majorChallenges"
                                value={formData.majorChallenges}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트 중 직면했던 주요 도전과제들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="solutionsImplemented">구현된 해결책</label>
                            <textarea
                                id="solutionsImplemented"
                                name="solutionsImplemented"
                                value={formData.solutionsImplemented}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="도전과제에 대해 구현했던 해결책들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="unexpectedIssues">예상치 못한 이슈</label>
                            <textarea
                                id="unexpectedIssues"
                                name="unexpectedIssues"
                                value={formData.unexpectedIssues}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="계획 단계에서 예상하지 못했던 이슈들을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>팀 및 프로세스 평가</h2>
                        <div className="form-group">
                            <label htmlFor="teamPerformance">팀 성과</label>
                            <textarea
                                id="teamPerformance"
                                name="teamPerformance"
                                value={formData.teamPerformance}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="팀의 전반적인 성과와 개별 구성원들의 기여도를 평가하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="communicationEffectiveness">커뮤니케이션 효과성</label>
                            <textarea
                                id="communicationEffectiveness"
                                name="communicationEffectiveness"
                                value={formData.communicationEffectiveness}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="팀 내부 및 고객과의 커뮤니케이션 효과성을 평가하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="processEfficiency">프로세스 효율성</label>
                            <textarea
                                id="processEfficiency"
                                name="processEfficiency"
                                value={formData.processEfficiency}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="사용한 개발/관리 프로세스의 효율성을 평가하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="toolsAndTechnology">도구 및 기술</label>
                            <textarea
                                id="toolsAndTechnology"
                                name="toolsAndTechnology"
                                value={formData.toolsAndTechnology}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="사용한 도구와 기술의 적절성과 효과성을 평가하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>고객 관계</h2>
                        <div className="form-group">
                            <label htmlFor="clientFeedback">고객 피드백</label>
                            <textarea
                                id="clientFeedback"
                                name="clientFeedback"
                                value={formData.clientFeedback}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="고객으로부터 받은 공식/비공식 피드백을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="clientRelationship">고객 관계 평가</label>
                            <textarea
                                id="clientRelationship"
                                name="clientRelationship"
                                value={formData.clientRelationship}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트를 통한 고객과의 관계 변화를 평가하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="futureOpportunities">향후 기회</label>
                            <textarea
                                id="futureOpportunities"
                                name="futureOpportunities"
                                value={formData.futureOpportunities}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="이 프로젝트를 통해 발견한 향후 비즈니스 기회들을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>재무 분석</h2>
                        <div className="form-group">
                            <label htmlFor="budgetVariance">예산 차이 분석</label>
                            <textarea
                                id="budgetVariance"
                                name="budgetVariance"
                                value={formData.budgetVariance}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="계획 예산과 실제 예산의 차이와 그 원인을 분석하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="profitabilityAnalysis">수익성 분석</label>
                            <textarea
                                id="profitabilityAnalysis"
                                name="profitabilityAnalysis"
                                value={formData.profitabilityAnalysis}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트의 실제 수익성을 분석하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="costFactors">비용 요인</label>
                            <textarea
                                id="costFactors"
                                name="costFactors"
                                value={formData.costFactors}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="주요 비용 요인들과 예상외 비용 발생 원인을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>기술적 측면</h2>
                        <div className="form-group">
                            <label htmlFor="technicalChallenges">기술적 도전과제</label>
                            <textarea
                                id="technicalChallenges"
                                name="technicalChallenges"
                                value={formData.technicalChallenges}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트 중 직면했던 기술적 도전과제들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="technicalSolutions">기술적 해결책</label>
                            <textarea
                                id="technicalSolutions"
                                name="technicalSolutions"
                                value={formData.technicalSolutions}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="도전과제에 대한 기술적 해결책들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="technicalDebt">기술적 부채</label>
                            <textarea
                                id="technicalDebt"
                                name="technicalDebt"
                                value={formData.technicalDebt}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트에서 발생한 기술적 부채와 향후 대응 계획을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="technologyDecisions">기술 결정 평가</label>
                            <textarea
                                id="technologyDecisions"
                                name="technologyDecisions"
                                value={formData.technologyDecisions}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="주요 기술 선택의 적절성을 평가하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>리스크 관리</h2>
                        <div className="form-group">
                            <label htmlFor="identifiedRisks">식별된 리스크</label>
                            <textarea
                                id="identifiedRisks"
                                name="identifiedRisks"
                                value={formData.identifiedRisks}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 초기에 식별했던 리스크들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="riskMitigation">리스크 완화 조치</label>
                            <textarea
                                id="riskMitigation"
                                name="riskMitigation"
                                value={formData.riskMitigation}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="실행했던 리스크 완화 조치들과 그 효과를 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="unforeseenRisks">예상치 못한 리스크</label>
                            <textarea
                                id="unforeseenRisks"
                                name="unforeseenRisks"
                                value={formData.unforeseenRisks}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="예상하지 못했던 리스크들과 대응 방식을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>학습 및 개선</h2>
                        <div className="form-group">
                            <label htmlFor="lessonsLearned">교훈</label>
                            <textarea
                                id="lessonsLearned"
                                name="lessonsLearned"
                                value={formData.lessonsLearned}
                                onChange={handleInputChange}
                                rows={5}
                                placeholder="이 프로젝트를 통해 얻은 주요 교훈들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="improvementRecommendations">개선 권고사항</label>
                            <textarea
                                id="improvementRecommendations"
                                name="improvementRecommendations"
                                value={formData.improvementRecommendations}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="향후 유사한 프로젝트를 위한 개선 권고사항을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="processImprovements">프로세스 개선안</label>
                            <textarea
                                id="processImprovements"
                                name="processImprovements"
                                value={formData.processImprovements}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="업무 프로세스 개선안을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="trainingNeeds">교육 필요사항</label>
                            <textarea
                                id="trainingNeeds"
                                name="trainingNeeds"
                                value={formData.trainingNeeds}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="팀원들의 역량 향상을 위한 교육 필요사항을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>향후 계획</h2>
                        <div className="form-group">
                            <label htmlFor="followUpProjects">후속 프로젝트</label>
                            <textarea
                                id="followUpProjects"
                                name="followUpProjects"
                                value={formData.followUpProjects}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="이 프로젝트와 연관된 후속 프로젝트 계획을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="maintenancePlan">유지보수 계획</label>
                            <textarea
                                id="maintenancePlan"
                                name="maintenancePlan"
                                value={formData.maintenancePlan}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 결과물의 유지보수 계획을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="knowledgeTransfer">지식 전수</label>
                            <textarea
                                id="knowledgeTransfer"
                                name="knowledgeTransfer"
                                value={formData.knowledgeTransfer}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 지식의 전수 계획과 문서화 상태를 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>시장 인사이트</h2>
                        <div className="form-group">
                            <label htmlFor="competitorAnalysis">경쟁사 분석</label>
                            <textarea
                                id="competitorAnalysis"
                                name="competitorAnalysis"
                                value={formData.competitorAnalysis}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트를 통해 파악한 경쟁사 정보를 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="marketInsights">시장 인사이트</label>
                            <textarea
                                id="marketInsights"
                                name="marketInsights"
                                value={formData.marketInsights}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트를 통해 얻은 시장에 대한 인사이트를 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">기타 메모</label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="추가적인 메모나 특이사항을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary">
                            취소
                        </button>
                        <button type="submit" className="btn-primary">
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProjectPostmortemPage;