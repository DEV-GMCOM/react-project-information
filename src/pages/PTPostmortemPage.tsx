// pages/PTPostmortemPage.tsx
import React, { useState } from 'react';
import '../styles/FormPage.css';

interface PTPostmortem {
    id?: string;
    projectName: string;
    presentationDate: string;
    presenter: string;
    client: string;
    venue: string;
    actualDuration: string;
    attendees: string;

    // 발표 평가
    presentationRating: number;
    contentRating: number;
    deliveryRating: number;
    qaRating: number;
    overallRating: number;

    // 상세 평가
    whatWentWell: string;
    whatWentWrong: string;
    challenges: string;
    clientFeedback: string;
    audienceReaction: string;
    technicalIssues: string;

    // 질문 및 답변
    questionsReceived: string;
    answersGiven: string;
    unansweredQuestions: string;

    // 결과 및 다음 단계
    presentationOutcome: 'successful' | 'partially_successful' | 'unsuccessful' | 'pending';
    nextSteps: string;
    followUpActions: string;

    // 개선 사항
    improvementAreas: string;
    lessonsLearned: string;
    recommendations: string;

    // 추가 정보
    competitorInfo: string;
    marketInsights: string;
    notes: string;

    // 새로 추가된 필드들
    registeredBy: string;
    department: string;
    clientDecisionTimeline: string;
    proposalStatus: string;
    competitivePosition: string;
    clientConcerns: string;
    strengthsHighlighted: string;
    weaknessesExposed: string;
    surpriseFactors: string;
}

const PTPostmortemPage: React.FC = () => {
    const [formData, setFormData] = useState<PTPostmortem>({
        projectName: '',
        presentationDate: '',
        presenter: '',
        client: '',
        venue: '',
        actualDuration: '',
        attendees: '',
        presentationRating: 5,
        contentRating: 5,
        deliveryRating: 5,
        qaRating: 5,
        overallRating: 5,
        whatWentWell: '',
        whatWentWrong: '',
        challenges: '',
        clientFeedback: '',
        audienceReaction: '',
        technicalIssues: '',
        questionsReceived: '',
        answersGiven: '',
        unansweredQuestions: '',
        presentationOutcome: 'pending',
        nextSteps: '',
        followUpActions: '',
        improvementAreas: '',
        lessonsLearned: '',
        recommendations: '',
        competitorInfo: '',
        marketInsights: '',
        notes: '',
        registeredBy: '',
        department: '',
        clientDecisionTimeline: '',
        proposalStatus: '',
        competitivePosition: '',
        clientConcerns: '',
        strengthsHighlighted: '',
        weaknessesExposed: '',
        surpriseFactors: ''
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
        console.log('PT 포스트모템 저장:', formData);
        // TODO: API 연동 후 실제 저장 로직 구현
    };

    const getRatingColor = (rating: number) => {
        if (rating >= 8) return '#4CAF50';
        if (rating >= 6) return '#FF9800';
        return '#F44336';
    };

    return (
        <div className="bidding-page-wrapper">
            <div className="form-page">
                <div className="page-header">
                    <h1>🔍 PT Postmortem</h1>
                    <p>프레젠테이션 후 결과 분석과 개선점을 기록합니다.</p>
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
                                <label htmlFor="presentationDate">발표일</label>
                                <input
                                    type="datetime-local"
                                    id="presentationDate"
                                    name="presentationDate"
                                    value={formData.presentationDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="presenter">발표자</label>
                                <input
                                    type="text"
                                    id="presenter"
                                    name="presenter"
                                    value={formData.presenter}
                                    onChange={handleInputChange}
                                    placeholder="발표자 이름"
                                />
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
                                <label htmlFor="venue">발표 장소</label>
                                <input
                                    type="text"
                                    id="venue"
                                    name="venue"
                                    value={formData.venue}
                                    onChange={handleInputChange}
                                    placeholder="발표 장소"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="actualDuration">실제 발표 시간</label>
                                <input
                                    type="text"
                                    id="actualDuration"
                                    name="actualDuration"
                                    value={formData.actualDuration}
                                    onChange={handleInputChange}
                                    placeholder="예: 35분"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="presentationOutcome">발표 결과</label>
                                <select
                                    id="presentationOutcome"
                                    name="presentationOutcome"
                                    value={formData.presentationOutcome}
                                    onChange={handleInputChange}
                                >
                                    <option value="pending">결과 대기</option>
                                    <option value="successful">성공</option>
                                    <option value="partially_successful">부분적 성공</option>
                                    <option value="unsuccessful">실패</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="proposalStatus">제안 상태</label>
                                <select
                                    id="proposalStatus"
                                    name="proposalStatus"
                                    value={formData.proposalStatus}
                                    onChange={handleInputChange}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="under_review">검토 중</option>
                                    <option value="shortlisted">최종 후보</option>
                                    <option value="selected">선정</option>
                                    <option value="rejected">탈락</option>
                                    <option value="pending_decision">결정 보류</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="attendees">참석자</label>
                            <textarea
                                id="attendees"
                                name="attendees"
                                value={formData.attendees}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="실제 참석자들을 입력하세요 (이름, 직책, 반응 등)"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="clientDecisionTimeline">고객 의사결정 일정</label>
                            <textarea
                                id="clientDecisionTimeline"
                                name="clientDecisionTimeline"
                                value={formData.clientDecisionTimeline}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="고객이 언급한 의사결정 과정과 일정을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>발표 평가 (1-10점)</h2>
                        <div className="rating-grid">
                            <div className="rating-item">
                                <label htmlFor="presentationRating">전체 발표력</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="presentationRating"
                                        name="presentationRating"
                                        min="1"
                                        max="10"
                                        value={formData.presentationRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.presentationRating) }}
                                    >
                                        {formData.presentationRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="contentRating">내용 구성</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="contentRating"
                                        name="contentRating"
                                        min="1"
                                        max="10"
                                        value={formData.contentRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.contentRating) }}
                                    >
                                        {formData.contentRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="deliveryRating">전달력</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="deliveryRating"
                                        name="deliveryRating"
                                        min="1"
                                        max="10"
                                        value={formData.deliveryRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.deliveryRating) }}
                                    >
                                        {formData.deliveryRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="qaRating">Q&A 대응</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="qaRating"
                                        name="qaRating"
                                        min="1"
                                        max="10"
                                        value={formData.qaRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.qaRating) }}
                                    >
                                        {formData.qaRating}점
                                    </span>
                                </div>
                            </div>

                            <div className="rating-item">
                                <label htmlFor="overallRating">종합 평가</label>
                                <div className="rating-input">
                                    <input
                                        type="range"
                                        id="overallRating"
                                        name="overallRating"
                                        min="1"
                                        max="10"
                                        value={formData.overallRating}
                                        onChange={handleInputChange}
                                    />
                                    <span
                                        className="rating-value"
                                        style={{ color: getRatingColor(formData.overallRating) }}
                                    >
                                        {formData.overallRating}점
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>강점과 약점 분석</h2>
                        <div className="form-group">
                            <label htmlFor="strengthsHighlighted">부각된 강점</label>
                            <textarea
                                id="strengthsHighlighted"
                                name="strengthsHighlighted"
                                value={formData.strengthsHighlighted}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="발표에서 효과적으로 부각된 우리의 강점들을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="weaknessesExposed">드러난 약점</label>
                            <textarea
                                id="weaknessesExposed"
                                name="weaknessesExposed"
                                value={formData.weaknessesExposed}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="발표 중 드러난 약점이나 개선이 필요한 부분들을 솔직하게 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="competitivePosition">경쟁 포지션</label>
                            <textarea
                                id="competitivePosition"
                                name="competitivePosition"
                                value={formData.competitivePosition}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="경쟁사 대비 우리의 포지션과 경쟁 우위/열위를 분석하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>상세 분석</h2>
                        <div className="form-group">
                            <label htmlFor="whatWentWell">잘된 점</label>
                            <textarea
                                id="whatWentWell"
                                name="whatWentWell"
                                value={formData.whatWentWell}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="발표에서 잘된 점들을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="whatWentWrong">아쉬운 점</label>
                            <textarea
                                id="whatWentWrong"
                                name="whatWentWrong"
                                value={formData.whatWentWrong}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="개선이 필요한 점들을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="challenges">어려웠던 점</label>
                            <textarea
                                id="challenges"
                                name="challenges"
                                value={formData.challenges}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="발표 중 어려웠던 상황들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="surpriseFactors">예상외 상황</label>
                            <textarea
                                id="surpriseFactors"
                                name="surpriseFactors"
                                value={formData.surpriseFactors}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="예상하지 못했던 상황이나 질문, 반응 등을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="technicalIssues">기술적 문제</label>
                            <textarea
                                id="technicalIssues"
                                name="technicalIssues"
                                value={formData.technicalIssues}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="발생한 기술적 문제와 해결 과정을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>고객 반응</h2>
                        <div className="form-group">
                            <label htmlFor="clientFeedback">고객 피드백</label>
                            <textarea
                                id="clientFeedback"
                                name="clientFeedback"
                                value={formData.clientFeedback}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="고객이 직접 전달한 피드백을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="clientConcerns">고객 우려사항</label>
                            <textarea
                                id="clientConcerns"
                                name="clientConcerns"
                                value={formData.clientConcerns}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="고객이 표현한 우려사항이나 걱정스러워하는 부분들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="audienceReaction">청중 반응</label>
                            <textarea
                                id="audienceReaction"
                                name="audienceReaction"
                                value={formData.audienceReaction}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="발표 중 관찰된 청중의 반응을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>질문 및 답변</h2>
                        <div className="form-group">
                            <label htmlFor="questionsReceived">받은 질문들</label>
                            <textarea
                                id="questionsReceived"
                                name="questionsReceived"
                                value={formData.questionsReceived}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="발표 중 받은 질문들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="answersGiven">제공한 답변</label>
                            <textarea
                                id="answersGiven"
                                name="answersGiven"
                                value={formData.answersGiven}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="각 질문에 대한 답변 내용을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="unansweredQuestions">미답변 질문</label>
                            <textarea
                                id="unansweredQuestions"
                                name="unansweredQuestions"
                                value={formData.unansweredQuestions}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="즉시 답변하지 못한 질문들과 후속 조치 계획을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>결과 및 후속 조치</h2>
                        <div className="form-group">
                            <label htmlFor="nextSteps">다음 단계</label>
                            <textarea
                                id="nextSteps"
                                name="nextSteps"
                                value={formData.nextSteps}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="발표 후 예정된 다음 단계들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="followUpActions">후속 액션 아이템</label>
                            <textarea
                                id="followUpActions"
                                name="followUpActions"
                                value={formData.followUpActions}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="발표 후 수행해야 할 구체적인 액션 아이템들을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>개선 및 학습</h2>
                        <div className="form-group">
                            <label htmlFor="improvementAreas">개선 영역</label>
                            <textarea
                                id="improvementAreas"
                                name="improvementAreas"
                                value={formData.improvementAreas}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="향후 개선이 필요한 영역들을 구체적으로 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="lessonsLearned">교훈</label>
                            <textarea
                                id="lessonsLearned"
                                name="lessonsLearned"
                                value={formData.lessonsLearned}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="이번 발표를 통해 얻은 교훈들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="recommendations">향후 권고사항</label>
                            <textarea
                                id="recommendations"
                                name="recommendations"
                                value={formData.recommendations}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="향후 유사한 발표를 위한 권고사항을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>시장 인사이트</h2>
                        <div className="form-group">
                            <label htmlFor="competitorInfo">경쟁사 정보</label>
                            <textarea
                                id="competitorInfo"
                                name="competitorInfo"
                                value={formData.competitorInfo}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="발표 중 언급된 경쟁사 정보나 시장 동향을 기록하세요"
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
                                placeholder="고객이나 시장에 대해 새롭게 알게 된 정보를 기록하세요"
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

export default PTPostmortemPage;