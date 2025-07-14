// pages/ProjectKickoffPage.tsx
import React, { useState } from 'react';
import '../styles/FormPage.css';

interface ProjectKickoff {
    id?: string;
    projectName: string;
    kickoffDate: string;
    projectManager: string;
    clientContact: string;
    teamMembers: string;
    projectGoals: string;
    deliverables: string;
    timeline: string;
    budget: string;
    roles: string;
    communication: string;
    meetingSchedule: string;
    reportingStructure: string;
    qualityStandards: string;
    riskManagement: string;
    changeManagement: string;
    approvals: string;
    nextSteps: string;
    notes: string;
    registeredBy: string;
    department: string;
    kickoffMeetingAttendees: string;
    projectScope: string;
    successMetrics: string;
    resourceRequirements: string;
    communicationPlan: string;
    issueEscalation: string;
    documentManagement: string;
    clientExpectations: string;
}

const ProjectKickoffPage: React.FC = () => {
    const [formData, setFormData] = useState<ProjectKickoff>({
        projectName: '',
        kickoffDate: '',
        projectManager: '',
        clientContact: '',
        teamMembers: '',
        projectGoals: '',
        deliverables: '',
        timeline: '',
        budget: '',
        roles: '',
        communication: '',
        meetingSchedule: '',
        reportingStructure: '',
        qualityStandards: '',
        riskManagement: '',
        changeManagement: '',
        approvals: '',
        nextSteps: '',
        notes: '',
        registeredBy: '',
        department: '',
        kickoffMeetingAttendees: '',
        projectScope: '',
        successMetrics: '',
        resourceRequirements: '',
        communicationPlan: '',
        issueEscalation: '',
        documentManagement: '',
        clientExpectations: ''
    });

    // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    //     const { name, value } = e.target;
    //     setFormData(prev => ({
    //         ...prev,
    //         [name]: value
    //     }));
    // };
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('프로젝트 착수서 저장:', formData);
        // TODO: API 연동 후 실제 저장 로직 구현
    };

    return (
        <div className="bidding-page-wrapper">
            <div className="form-page">
                <div className="page-header">
                    <h1>🚀 프로젝트 착수서 작성</h1>
                    <p>프로젝트 시작을 위한 착수서를 작성합니다.</p>
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
                                <label htmlFor="kickoffDate" className="required">착수일</label>
                                <input
                                    type="date"
                                    id="kickoffDate"
                                    name="kickoffDate"
                                    value={formData.kickoffDate}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="projectManager" className="required">프로젝트 매니저</label>
                                <input
                                    type="text"
                                    id="projectManager"
                                    name="projectManager"
                                    value={formData.projectManager}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="PM 이름"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="clientContact">고객 담당자</label>
                                <input
                                    type="text"
                                    id="clientContact"
                                    name="clientContact"
                                    value={formData.clientContact}
                                    onChange={handleInputChange}
                                    placeholder="고객사 담당자 이름"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>킥오프 미팅 정보</h2>
                        <div className="form-group">
                            <label htmlFor="kickoffMeetingAttendees">킥오프 미팅 참석자</label>
                            <textarea
                                id="kickoffMeetingAttendees"
                                name="kickoffMeetingAttendees"
                                value={formData.kickoffMeetingAttendees}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="킥오프 미팅 참석자들과 각자의 역할을 입력하세요&#10;예:&#10;- 홍길동 (PM, 내부)&#10;- 김철수 (클라이언트 담당자)&#10;- 이영희 (디자인 팀장)"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="clientExpectations">고객 기대사항</label>
                            <textarea
                                id="clientExpectations"
                                name="clientExpectations"
                                value={formData.clientExpectations}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="킥오프 미팅에서 확인된 고객의 기대사항과 요구사항을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>팀 구성</h2>
                        <div className="form-group">
                            <label htmlFor="teamMembers">팀 구성원</label>
                            <textarea
                                id="teamMembers"
                                name="teamMembers"
                                value={formData.teamMembers}
                                onChange={handleInputChange}
                                rows={5}
                                placeholder="팀 구성원들과 각자의 역할을 입력하세요&#10;예:&#10;- 홍길동 (PM) - 전체 프로젝트 관리&#10;- 김철수 (개발팀장) - 기술 개발 총괄&#10;- 이영희 (디자이너) - UI/UX 디자인"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="roles">역할 및 책임</label>
                            <textarea
                                id="roles"
                                name="roles"
                                value={formData.roles}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="각 팀원의 구체적인 역할과 책임을 정의하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="resourceRequirements">필요 자원</label>
                            <textarea
                                id="resourceRequirements"
                                name="resourceRequirements"
                                value={formData.resourceRequirements}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트 수행에 필요한 인적/물적 자원을 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>프로젝트 개요</h2>
                        <div className="form-group">
                            <label htmlFor="projectGoals" className="required">프로젝트 목표</label>
                            <textarea
                                id="projectGoals"
                                name="projectGoals"
                                value={formData.projectGoals}
                                onChange={handleInputChange}
                                rows={4}
                                required
                                placeholder="프로젝트의 주요 목표를 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="projectScope">프로젝트 범위</label>
                            <textarea
                                id="projectScope"
                                name="projectScope"
                                value={formData.projectScope}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트 범위와 포함/제외 사항을 명확히 기록하세요"
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
                                placeholder="프로젝트에서 생산할 주요 산출물들을 나열하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="successMetrics">성공 지표</label>
                            <textarea
                                id="successMetrics"
                                name="successMetrics"
                                value={formData.successMetrics}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 성공을 측정할 구체적인 지표들을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="timeline">일정 계획</label>
                            <textarea
                                id="timeline"
                                name="timeline"
                                value={formData.timeline}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="주요 마일스톤과 일정을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="budget">예산 계획</label>
                            <textarea
                                id="budget"
                                name="budget"
                                value={formData.budget}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="예산 배분 계획을 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>커뮤니케이션 계획</h2>
                        <div className="form-group">
                            <label htmlFor="communicationPlan">커뮤니케이션 계획</label>
                            <textarea
                                id="communicationPlan"
                                name="communicationPlan"
                                value={formData.communicationPlan}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="프로젝트 전반의 커뮤니케이션 전략과 방법을 정의하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="meetingSchedule">회의 일정</label>
                            <textarea
                                id="meetingSchedule"
                                name="meetingSchedule"
                                value={formData.meetingSchedule}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="정기 회의 및 리뷰 일정을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="reportingStructure">보고 체계</label>
                            <textarea
                                id="reportingStructure"
                                name="reportingStructure"
                                value={formData.reportingStructure}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 진행 상황 보고 체계를 정의하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="issueEscalation">이슈 에스컬레이션</label>
                            <textarea
                                id="issueEscalation"
                                name="issueEscalation"
                                value={formData.issueEscalation}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="문제 발생 시 에스컬레이션 절차를 정의하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="documentManagement">문서 관리</label>
                            <textarea
                                id="documentManagement"
                                name="documentManagement"
                                value={formData.documentManagement}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 문서 관리 방식과 공유 방법을 정의하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>품질 및 위험 관리</h2>
                        <div className="form-group">
                            <label htmlFor="qualityStandards">품질 기준</label>
                            <textarea
                                id="qualityStandards"
                                name="qualityStandards"
                                value={formData.qualityStandards}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트의 품질 기준과 검증 방법을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="riskManagement">위험 관리 계획</label>
                            <textarea
                                id="riskManagement"
                                name="riskManagement"
                                value={formData.riskManagement}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="예상 위험요소와 대응 방안을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="changeManagement">변경 관리 절차</label>
                            <textarea
                                id="changeManagement"
                                name="changeManagement"
                                value={formData.changeManagement}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="프로젝트 변경 사항 처리 절차를 정의하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>승인 및 다음 단계</h2>
                        <div className="form-group">
                            <label htmlFor="approvals">승인 사항</label>
                            <textarea
                                id="approvals"
                                name="approvals"
                                value={formData.approvals}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="필요한 승인 사항들을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="nextSteps">다음 단계</label>
                            <textarea
                                id="nextSteps"
                                name="nextSteps"
                                value={formData.nextSteps}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="착수 후 바로 진행할 다음 단계들을 입력하세요"
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
                                placeholder="추가 사항이나 특이사항을 입력하세요"
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

export default ProjectKickoffPage;