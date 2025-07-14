// pages/PTChecklistPage.tsx
import React, { useState } from 'react';
import '../styles/FormPage.css';

interface ChecklistItem {
    id: string;
    category: string;
    item: string;
    checked: boolean;
    notes: string;
}

interface PTChecklist {
    id?: string;
    projectName: string;
    presentationDate: string;
    presenter: string;
    client: string;
    venue: string;
    duration: string;
    audience: string;
    checklistItems: ChecklistItem[];
    overallNotes: string;
    completionStatus: 'not_started' | 'in_progress' | 'completed';
    registeredBy: string;
    department: string;
    presentationType: string;
    presentationGoal: string;
    keyMessage: string;
    expectedQuestions: string;
    competitorInfo: string;
    backupPlan: string;
}

const PTChecklistPage: React.FC = () => {
    const defaultChecklistItems: ChecklistItem[] = [
        // 준비 단계
        { id: '1', category: '준비 단계', item: '제안서 최종 검토 완료', checked: false, notes: '' },
        { id: '2', category: '준비 단계', item: 'PT 자료 준비 완료', checked: false, notes: '' },
        { id: '3', category: '준비 단계', item: '발표자 역할 분담 확정', checked: false, notes: '' },
        { id: '4', category: '준비 단계', item: '리허설 진행 완료 (최소 2회)', checked: false, notes: '' },
        { id: '5', category: '준비 단계', item: '예상 질문 및 답변 준비', checked: false, notes: '' },
        { id: '6', category: '준비 단계', item: '경쟁사 분석 및 차별화 포인트 정리', checked: false, notes: '' },

        // 기술적 준비
        { id: '7', category: '기술적 준비', item: '노트북/프로젝터 연결 테스트', checked: false, notes: '' },
        { id: '8', category: '기술적 준비', item: '백업 장비 준비 (USB, 노트북)', checked: false, notes: '' },
        { id: '9', category: '기술적 준비', item: '인터넷 연결 확인', checked: false, notes: '' },
        { id: '10', category: '기술적 준비', item: '발표 자료 다중 백업 (클라우드, USB)', checked: false, notes: '' },
        { id: '11', category: '기술적 준비', item: '마이크/스피커 테스트', checked: false, notes: '' },
        { id: '12', category: '기술적 준비', item: '조명 및 화면 가시성 점검', checked: false, notes: '' },

        // 자료 준비
        { id: '13', category: '자료 준비', item: '회사 소개 자료 (최신버전)', checked: false, notes: '' },
        { id: '14', category: '자료 준비', item: '프로젝트 제안서 (인쇄본 포함)', checked: false, notes: '' },
        { id: '15', category: '자료 준비', item: '포트폴리오/레퍼런스 (관련 사례)', checked: false, notes: '' },
        { id: '16', category: '자료 준비', item: '기술 설명서 및 시연 자료', checked: false, notes: '' },
        { id: '17', category: '자료 준비', item: '견적서 (상세 내역 포함)', checked: false, notes: '' },
        { id: '18', category: '자료 준비', item: '프로젝트 일정표', checked: false, notes: '' },
        { id: '19', category: '자료 준비', item: '명함 및 회사 브로셔', checked: false, notes: '' },
        { id: '20', category: '자료 준비', item: '계약서 초안 (필요시)', checked: false, notes: '' },

        // 발표 당일
        { id: '21', category: '발표 당일', item: '발표장 30분 전 도착', checked: false, notes: '' },
        { id: '22', category: '발표 당일', item: '복장 점검 (드레스코드 확인)', checked: false, notes: '' },
        { id: '23', category: '발표 당일', item: '발표 자료 최종 점검', checked: false, notes: '' },
        { id: '24', category: '발표 당일', item: '참석자 확인 및 인사', checked: false, notes: '' },
        { id: '25', category: '발표 당일', item: '좌석 배치 및 동선 확인', checked: false, notes: '' },
        { id: '26', category: '발표 당일', item: '휴대폰 무음 설정', checked: false, notes: '' },

        // 발표 진행
        { id: '27', category: '발표 진행', item: '인사 및 참석자 소개', checked: false, notes: '' },
        { id: '28', category: '발표 진행', item: '회사 소개 및 신뢰성 구축', checked: false, notes: '' },
        { id: '29', category: '발표 진행', item: '고객 니즈 파악 및 공감대 형성', checked: false, notes: '' },
        { id: '30', category: '발표 진행', item: '프로젝트 이해도 및 해석 설명', checked: false, notes: '' },
        { id: '31', category: '발표 진행', item: '솔루션 제안 및 차별화 포인트', checked: false, notes: '' },
        { id: '32', category: '발표 진행', item: '기술 역량 및 전문성 소개', checked: false, notes: '' },
        { id: '33', category: '발표 진행', item: '일정 및 예산 설명', checked: false, notes: '' },
        { id: '34', category: '발표 진행', item: 'Q&A 세션 진행', checked: false, notes: '' },
        { id: '35', category: '발표 진행', item: '핵심 메시지 재강조', checked: false, notes: '' },

        // 마무리
        { id: '36', category: '마무리', item: '감사 인사 및 마무리 발언', checked: false, notes: '' },
        { id: '37', category: '마무리', item: '연락처 및 명함 전달', checked: false, notes: '' },
        { id: '38', category: '마무리', item: '후속 조치 일정 확인', checked: false, notes: '' },
        { id: '39', category: '마무리', item: '발표 자료 및 추가 문서 전달', checked: false, notes: '' },
        { id: '40', category: '마무리', item: '참석자들과 개별 대화', checked: false, notes: '' }
    ];

    const [formData, setFormData] = useState<PTChecklist>({
        projectName: '',
        presentationDate: '',
        presenter: '',
        client: '',
        venue: '',
        duration: '',
        audience: '',
        checklistItems: defaultChecklistItems,
        overallNotes: '',
        completionStatus: 'not_started',
        registeredBy: '',
        department: '',
        presentationType: '',
        presentationGoal: '',
        keyMessage: '',
        expectedQuestions: '',
        competitorInfo: '',
        backupPlan: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleChecklistChange = (itemId: string, field: 'checked' | 'notes', value: boolean | string) => {
        setFormData(prev => ({
            ...prev,
            checklistItems: prev.checklistItems.map(item =>
                item.id === itemId ? { ...item, [field]: value } : item
            )
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('PT 체크리스트 저장:', formData);
        // TODO: API 연동 후 실제 저장 로직 구현
    };

    const getCompletionPercentage = () => {
        const checkedItems = formData.checklistItems.filter(item => item.checked).length;
        return Math.round((checkedItems / formData.checklistItems.length) * 100);
    };

    const groupedItems = formData.checklistItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, ChecklistItem[]>);

    return (
        <div className="bidding-page-wrapper">
            <div className="form-page">
                <div className="page-header">
                    <h1>✅ 제안서 PT 체크리스트</h1>
                    <p>프레젠테이션을 위한 체크리스트를 관리합니다.</p>
                    <div className="completion-indicator">
                        <span>완료율: {getCompletionPercentage()}%</span>
                        <div className="progress-bar">
                            <div
                                className="progress-fill"
                                style={{ width: `${getCompletionPercentage()}%` }}
                            ></div>
                        </div>
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
                                <label htmlFor="presentationDate" className="required">발표일</label>
                                <input
                                    type="datetime-local"
                                    id="presentationDate"
                                    name="presentationDate"
                                    value={formData.presentationDate}
                                    onChange={handleInputChange}
                                    required
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
                                <label htmlFor="duration">발표 시간</label>
                                <input
                                    type="text"
                                    id="duration"
                                    name="duration"
                                    value={formData.duration}
                                    onChange={handleInputChange}
                                    placeholder="예: 30분"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="presentationType">발표 유형</label>
                                <select
                                    id="presentationType"
                                    name="presentationType"
                                    value={formData.presentationType}
                                    onChange={handleInputChange}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="proposal">제안 발표</option>
                                    <option value="final">최종 발표</option>
                                    <option value="technical">기술 발표</option>
                                    <option value="demo">데모/시연</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="completionStatus">진행 상태</label>
                                <select
                                    id="completionStatus"
                                    name="completionStatus"
                                    value={formData.completionStatus}
                                    onChange={handleInputChange}
                                >
                                    <option value="not_started">시작 전</option>
                                    <option value="in_progress">진행 중</option>
                                    <option value="completed">완료</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="audience">참석자</label>
                            <textarea
                                id="audience"
                                name="audience"
                                value={formData.audience}
                                onChange={handleInputChange}
                                rows={2}
                                placeholder="발표 참석자들을 입력하세요 (이름, 직책, 역할 등)"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>발표 전략</h2>
                        <div className="form-group">
                            <label htmlFor="presentationGoal">발표 목표</label>
                            <textarea
                                id="presentationGoal"
                                name="presentationGoal"
                                value={formData.presentationGoal}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="이번 발표를 통해 달성하고자 하는 목표를 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="keyMessage">핵심 메시지</label>
                            <textarea
                                id="keyMessage"
                                name="keyMessage"
                                value={formData.keyMessage}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="청중에게 전달하고자 하는 핵심 메시지를 정리하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="competitorInfo">경쟁사 정보</label>
                            <textarea
                                id="competitorInfo"
                                name="competitorInfo"
                                value={formData.competitorInfo}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="경쟁 상황과 우리의 차별화 포인트를 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="expectedQuestions">예상 질문</label>
                            <textarea
                                id="expectedQuestions"
                                name="expectedQuestions"
                                value={formData.expectedQuestions}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="예상되는 질문들과 답변을 미리 준비하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="backupPlan">비상 계획</label>
                            <textarea
                                id="backupPlan"
                                name="backupPlan"
                                value={formData.backupPlan}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="기술적 문제나 예상치 못한 상황에 대한 대비책을 기록하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>체크리스트</h2>
                        {Object.entries(groupedItems).map(([category, items]) => (
                            <div key={category} className="checklist-category">
                                <h3>{category}</h3>
                                <div className="checklist-items">
                                    {items.map((item) => (
                                        <div key={item.id} className="checklist-item">
                                            <div className="checkbox-group">
                                                <input
                                                    type="checkbox"
                                                    id={`item-${item.id}`}
                                                    checked={item.checked}
                                                    onChange={(e) => handleChecklistChange(item.id, 'checked', e.target.checked)}
                                                />
                                                <label htmlFor={`item-${item.id}`} className="checkbox-label">
                                                    {item.item}
                                                </label>
                                            </div>
                                            <textarea
                                                placeholder="메모..."
                                                value={item.notes}
                                                onChange={(e) => handleChecklistChange(item.id, 'notes', e.target.value)}
                                                className="item-notes"
                                                rows={1}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="form-section">
                        <h2>전체 메모</h2>
                        <div className="form-group">
                            <label htmlFor="overallNotes">전체 메모</label>
                            <textarea
                                id="overallNotes"
                                name="overallNotes"
                                value={formData.overallNotes}
                                onChange={handleInputChange}
                                rows={5}
                                placeholder="전체적인 메모나 특이사항을 입력하세요"
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

export default PTChecklistPage;