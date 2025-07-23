// ProjectPage.tsx
import React, { useState } from 'react';
import '../../styles/FormPage.css';

interface ProjectInfo {
    id?: string;
    title: string;
    organization: string;
    announcementDate: string;
    submissionDeadline: string;
    biddingAmount: string;
    projectPeriod: string;
    requirements: string;
    contactPerson: string;
    contactPhone: string;
    contactEmail: string;
    documentUrl: string;
    status: 'preparation' | 'submitted' | 'evaluation' | 'result';
    notes: string;
    registeredBy: string;
    department: string;
    ptExpectedDate: string;
    resultAnnouncementDate: string;
    executionPeriodStart: string;
    executionPeriodEnd: string;
    biddingLocation: string;
    biddingType: string;
    attendanceTarget: string;
    biddingProfit: string;
}

// const ProjectPage: React.FC = () => {
const ProjectPage: React.FC = () => {
    const [formData, setFormData] = useState<ProjectInfo>({
        title: '',
        organization: '',
        announcementDate: '',
        submissionDeadline: '',
        biddingAmount: '',
        projectPeriod: '',
        requirements: '',
        contactPerson: '',
        contactPhone: '',
        contactEmail: '',
        documentUrl: '',
        status: 'preparation',
        notes: '',
        registeredBy: '',
        department: '',
        ptExpectedDate: '',
        resultAnnouncementDate: '',
        executionPeriodStart: '',
        executionPeriodEnd: '',
        biddingLocation: '',
        biddingType: '',
        attendanceTarget: '',
        biddingProfit: ''
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
        console.log('입찰 정보 저장:', formData);
        // TODO: API 연동 후 실제 저장 로직 구현
    };

    return (
        <div className="bidding-page-wrapper">
            <div className="form-page">
                <div className="page-header">
                    <h1>📋 프로젝트 정보 수집</h1>
                    <p>프로젝트 기반 정보를 등록 / 관리합니다.</p>
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
                        <h2>일정 정보</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="announcementDate">공고일</label>
                                <input
                                    type="date"
                                    id="announcementDate"
                                    name="announcementDate"
                                    value={formData.announcementDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="submissionDeadline" className="required">제출 마감일</label>
                                <input
                                    type="date"
                                    id="submissionDeadline"
                                    name="submissionDeadline"
                                    value={formData.submissionDeadline}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="ptExpectedDate">PT 예상일</label>
                                <input
                                    type="date"
                                    id="ptExpectedDate"
                                    name="ptExpectedDate"
                                    value={formData.ptExpectedDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="resultAnnouncementDate">결과발표 예상일</label>
                                <input
                                    type="date"
                                    id="resultAnnouncementDate"
                                    name="resultAnnouncementDate"
                                    value={formData.resultAnnouncementDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="executionPeriodStart">행사실행 시작일</label>
                                <input
                                    type="date"
                                    id="executionPeriodStart"
                                    name="executionPeriodStart"
                                    value={formData.executionPeriodStart}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="executionPeriodEnd">행사실행 종료일</label>
                                <input
                                    type="date"
                                    id="executionPeriodEnd"
                                    name="executionPeriodEnd"
                                    value={formData.executionPeriodEnd}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>기본 정보</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="title" className="required">입찰 제목</label>
                                <input
                                    type="text"
                                    id="title"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="입찰 공고 제목을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="organization" className="required">발주 기관</label>
                                <input
                                    type="text"
                                    id="organization"
                                    name="organization"
                                    value={formData.organization}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="발주 기관명을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="biddingLocation">장소</label>
                                <input
                                    type="text"
                                    id="biddingLocation"
                                    name="biddingLocation"
                                    value={formData.biddingLocation}
                                    onChange={handleInputChange}
                                    placeholder="예: [국내/해외] 장소명 & 주소"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="biddingType">행사 타입</label>
                                <input
                                    type="text"
                                    id="biddingType"
                                    name="biddingType"
                                    value={formData.biddingType}
                                    onChange={handleInputChange}
                                    placeholder="예: 호스피 / 전시 / 프로모션 등"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="attendanceTarget">참석 대상</label>
                                <input
                                    type="text"
                                    id="attendanceTarget"
                                    name="attendanceTarget"
                                    value={formData.attendanceTarget}
                                    onChange={handleInputChange}
                                    placeholder="예: VIP 〇〇명 포함, 약 〇〇〇명 예정"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="biddingAmount">행사 금액 규모 [단위:억]</label>
                                <input
                                    type="text"
                                    id="biddingAmount"
                                    name="biddingAmount"
                                    value={formData.biddingAmount}
                                    onChange={handleInputChange}
                                    placeholder="예: 1.00"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="biddingProfit">예상 매출 (수익) [단위:억]</label>
                                <input
                                    type="text"
                                    id="biddingProfit"
                                    name="biddingProfit"
                                    value={formData.biddingProfit}
                                    onChange={handleInputChange}
                                    placeholder="예: 00.00 (00.00)"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>상세 정보</h2>
                        <div className="form-group">
                            <label htmlFor="requirements">사업 요구사항. RFP⋅OT 주요내용 ( 원본 보유 시 첨부 )</label>
                            <textarea
                                id="requirements"
                                name="requirements"
                                value={formData.requirements}
                                onChange={handleInputChange}
                                rows={10}
                                placeholder="주요 요구사항과 사업 내용을 입력하세요&#10;&#10;[행사 목적 및 배경]&#10;- 프로젝트 추진 목적 및 배경&#10;- 광고주 측 주요 과제 또는 행사 맥락&#10;&#10;[핵심 요구사항 요약]&#10;- 프로그램 제안범위 ( 예: 이색 퍼포먼스, 콜라보, 신기술 체험 콘텐츠 등 )&#10;- 운영 및 기타 필수사항 ( 장소 제안, 비상대책, 협찬사 등 )"
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="contactPerson">담당자명</label>
                                <input
                                    type="text"
                                    id="contactPerson"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
                                    placeholder="담당자 이름"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactPhone">담당자 연락처</label>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleInputChange}
                                    placeholder="010-0000-0000"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactEmail">담당자 이메일</label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleInputChange}
                                    placeholder="contact@example.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="documentUrl">공고문 URL</label>
                                <input
                                    type="url"
                                    id="documentUrl"
                                    name="documentUrl"
                                    value={formData.documentUrl}
                                    onChange={handleInputChange}
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>진행 상태</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="status">현재 상태</label>
                                <select
                                    id="status"
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="preparation">준비 중</option>
                                    <option value="submitted">제출 완료</option>
                                    <option value="evaluation">평가 중</option>
                                    <option value="result">결과 발표</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">특이사항 및 메모</label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="특이사항이나 추가 메모를 입력하세요"
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

export default ProjectPage;
// export default BiddingPage;