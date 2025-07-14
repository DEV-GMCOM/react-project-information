// pages/ProjectProfilePage.tsx
import React, { useState } from 'react';
import '../styles/FormPage.css';

interface ProjectProfile {
    id?: string;
    projectName: string;
    projectType: 'web' | 'mobile' | 'system' | 'marketing' | 'consulting' | 'event' | 'other';
    client: string;
    projectManager: string;
    teamLeader: string;
    startDate: string;
    endDate: string;
    budget: string;
    currency: 'KRW' | 'USD' | 'EUR';
    priority: 'high' | 'medium' | 'low';
    status: 'planning' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
    description: string;
    objectives: string;
    scope: string;
    deliverables: string;
    constraints: string;
    assumptions: string;
    risks: string;
    stakeholders: string;
    successCriteria: string;
    techStack: string;
    notes: string;
    registeredBy: string;
    department: string;
    expectedRevenue: string;
    profitMargin: string;
    teamSize: string;
    clientBudget: string;
    competitorAnalysis: string;
    marketResearch: string;
    targetAudience: string;
}

const ProjectProfilePage: React.FC = () => {
    const [formData, setFormData] = useState<ProjectProfile>({
        projectName: '',
        projectType: 'event',
        client: '',
        projectManager: '',
        teamLeader: '',
        startDate: '',
        endDate: '',
        budget: '',
        currency: 'KRW',
        priority: 'medium',
        status: 'planning',
        description: '',
        objectives: '',
        scope: '',
        deliverables: '',
        constraints: '',
        assumptions: '',
        risks: '',
        stakeholders: '',
        successCriteria: '',
        techStack: '',
        notes: '',
        registeredBy: '',
        department: '',
        expectedRevenue: '',
        profitMargin: '',
        teamSize: '',
        clientBudget: '',
        competitorAnalysis: '',
        marketResearch: '',
        targetAudience: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('프로젝트 프로필 저장:', formData);
        // TODO: API 연동 후 실제 저장 로직 구현
    };

    return (
        <div className="bidding-page-wrapper">
            <div className="form-page">
                <div className="page-header">
                    <h1>📝 프로젝트 기본 Profile 작성</h1>
                    <p>새로운 프로젝트의 기본 정보와 프로필을 작성합니다.</p>
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
                        <h2>기본 정보</h2>
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
                                <label htmlFor="projectType" className="required">프로젝트 유형</label>
                                <select
                                    id="projectType"
                                    name="projectType"
                                    value={formData.projectType}
                                    onChange={handleInputChange}
                                    required
                                >
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
                                <label htmlFor="client" className="required">고객사</label>
                                <input
                                    type="text"
                                    id="client"
                                    name="client"
                                    value={formData.client}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="고객사명을 입력하세요"
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
                                <label htmlFor="teamSize">팀 규모</label>
                                <input
                                    type="text"
                                    id="teamSize"
                                    name="teamSize"
                                    value={formData.teamSize}
                                    onChange={handleInputChange}
                                    placeholder="예: 5명"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="priority">우선순위</label>
                                <select
                                    id="priority"
                                    name="priority"
                                    value={formData.priority}
                                    onChange={handleInputChange}
                                >
                                    <option value="high">높음</option>
                                    <option value="medium">보통</option>
                                    <option value="low">낮음</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="status">프로젝트 상태</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="planning">계획 중</option>
                                    <option value="in_progress">진행 중</option>
                                    <option value="on_hold">보류</option>
                                    <option value="completed">완료</option>
                                    <option value="cancelled">취소</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>일정 및 예산</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="startDate" className="required">시작일</label>
                                <input
                                    type="date"
                                    id="startDate"
                                    name="startDate"
                                    value={formData.startDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="endDate" className="required">종료일</label>
                                <input
                                    type="date"
                                    id="endDate"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="clientBudget">고객 예산 [단위:억]</label>
                                <input
                                    type="text"
                                    id="clientBudget"
                                    name="clientBudget"
                                    value={formData.clientBudget}
                                    onChange={handleInputChange}
                                    placeholder="고객사 제시 예산"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="budget">프로젝트 예산 [단위:억]</label>
                                <input
                                    type="text"
                                    id="budget"
                                    name="budget"
                                    value={formData.budget}
                                    onChange={handleInputChange}
                                    placeholder="실제 프로젝트 예산"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="expectedRevenue">예상 매출 [단위:억]</label>
                                <input
                                    type="text"
                                    id="expectedRevenue"
                                    name="expectedRevenue"
                                    value={formData.expectedRevenue}
                                    onChange={handleInputChange}
                                    placeholder="예상 매출액"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="profitMargin">예상 수익률 [%]</label>
                                <input
                                    type="text"
                                    id="profitMargin"
                                    name="profitMargin"
                                    value={formData.profitMargin}
                                    onChange={handleInputChange}
                                    placeholder="예: 15%"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="currency">통화</label>
                                <select
                                    id="currency"
                                    name="currency"
                                    value={formData.currency}
                                    onChange={handleInputChange}
                                >
                                    <option value="KRW">원 (KRW)</option>
                                    <option value="USD">달러 (USD)</option>
                                    <option value="EUR">유로 (EUR)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>프로젝트 개요</h2>
                        <div className="form-group">
                            <label htmlFor="description" className="required">프로젝트 설명</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows={4}
                                required
                                placeholder="프로젝트에 대한 전반적인 설명을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="objectives">프로젝트 목표</label>
                            <textarea
                                id="objectives"
                                name="objectives"
                                value={formData.objectives}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="달성하고자 하는 목표들을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="targetAudience">타겟 고객</label>
                            <textarea
                                id="targetAudience"
                                name="targetAudience"
                                value={formData.targetAudience}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트의 주요 타겟 고객층을 설명하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="scope">프로젝트 범위</label>
                            <textarea
                                id="scope"
                                name="scope"
                                value={formData.scope}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트에 포함되는 작업 범위를 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="deliverables">주요 산출물</label>
                            <textarea
                                id="deliverables"
                                name="deliverables"
                                value={formData.deliverables}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트에서 만들어낼 주요 산출물들을 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>시장 분석</h2>
                        <div className="form-group">
                            <label htmlFor="marketResearch">시장 조사</label>
                            <textarea
                                id="marketResearch"
                                name="marketResearch"
                                value={formData.marketResearch}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="시장 현황과 동향에 대한 조사 내용을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="competitorAnalysis">경쟁사 분석</label>
                            <textarea
                                id="competitorAnalysis"
                                name="competitorAnalysis"
                                value={formData.competitorAnalysis}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="주요 경쟁사와 경쟁 환경을 분석하여 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>제약사항 및 위험요소</h2>
                        <div className="form-group">
                            <label htmlFor="constraints">제약사항</label>
                            <textarea
                                id="constraints"
                                name="constraints"
                                value={formData.constraints}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 수행 시 제약사항들을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="assumptions">가정사항</label>
                            <textarea
                                id="assumptions"
                                name="assumptions"
                                value={formData.assumptions}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 계획 시 가정한 사항들을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="risks">위험요소</label>
                            <textarea
                                id="risks"
                                name="risks"
                                value={formData.risks}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="예상되는 위험요소들을 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>추가 정보</h2>
                        <div className="form-group">
                            <label htmlFor="stakeholders">주요 이해관계자</label>
                            <textarea
                                id="stakeholders"
                                name="stakeholders"
                                value={formData.stakeholders}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 관련 주요 이해관계자들을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="successCriteria">성공 기준</label>
                            <textarea
                                id="successCriteria"
                                name="successCriteria"
                                value={formData.successCriteria}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 성공을 판단할 기준들을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="techStack">기술 스택 / 사용 도구</label>
                            <textarea
                                id="techStack"
                                name="techStack"
                                value={formData.techStack}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="사용할 기술, 도구, 장비 등을 입력하세요"
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
                                placeholder="추가 메모나 특이사항을 입력하세요"
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

export default ProjectProfilePage;