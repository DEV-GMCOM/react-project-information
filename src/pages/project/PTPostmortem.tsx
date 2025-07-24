import React, { useState } from 'react';
import '../../styles/PTPostmortem.css';

interface PTPostmortemData {
    // 프로젝트 기본 정보
    projectName: string;
    inflowRoute: string;
    client: string;
    manager: string;
    eventDate: string;
    eventLocation: string;
    attendeeInfo: string;
    eventType: string;
    otSchedule: string;
    ptSchedule: string;
    expectedRevenue: string;
    expectedCompetitors: string;
    scoreTable: string;
    bidAmount: string;

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

const PTPostmortemForm: React.FC = () => {
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        console.log('PT Postmortem 저장:', formData);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="pt-postmortem-container">
            {/* 헤더 */}
            <div className="postmortem-header">
                <div>
                    <h1 className="postmortem-title">
                        PT Postmortem 양식
                    </h1>
                </div>
                <div className="postmortem-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="postmortem-main">
                <div className="postmortem-title-section">
                    <h2 className="postmortem-subtitle">
                        -- PT Postmortem --
                    </h2>
                    <div className="postmortem-writer">
                        <div className="writer-form">
                            <div className="writer-field">
                                <label className="writer-field-label">등록자 이름:</label>
                                <input
                                    type="text"
                                    name="writerName"
                                    value={formData.writerName}
                                    onChange={handleInputChange}
                                    placeholder="홍길동"
                                    className="writer-field-input"
                                />
                            </div>
                            <div className="writer-field">
                                <label className="writer-field-label">부서:</label>
                                <input
                                    type="text"
                                    name="writerDepartment"
                                    value={formData.writerDepartment}
                                    onChange={handleInputChange}
                                    placeholder="기획팀"
                                    className="writer-field-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로젝트 기본 정보 (8x4 테이블) */}
                <div className="postmortem-section">
                    <h3 className="section-header">
                        ■ 프로젝트 기본 정보
                    </h3>

                    <table className="postmortem-table">
                        <tbody>
                        <tr>
                            <td className="table-header">타이틀 구분</td>
                            <td className="table-header table-header-empty"></td>
                            <td className="table-header">타이틀 내용</td>
                            <td className="table-header table-header-empty"></td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">프로젝트명</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="projectName"
                                    value={formData.projectName}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">유입경로</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="inflowRoute"
                                    value={formData.inflowRoute}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">발주처</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="client"
                                    value={formData.client}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">담당자</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="manager"
                                    value={formData.manager}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventDate"
                                    value={formData.eventDate}
                                    onChange={handleInputChange}
                                    placeholder="yyyy.mm.dd"
                                    className="postmortem-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사장소</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventLocation"
                                    value={formData.eventLocation}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">참석대상</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="attendeeInfo"
                                    value={formData.attendeeInfo}
                                    onChange={handleInputChange}
                                    placeholder="VIP XX명, 약 XX명 예상"
                                    className="postmortem-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사성격</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventType"
                                    value={formData.eventType}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">OT 일정</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="otSchedule"
                                    value={formData.otSchedule}
                                    onChange={handleInputChange}
                                    placeholder="yyyy.mm.dd"
                                    className="postmortem-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="ptSchedule"
                                    value={formData.ptSchedule}
                                    onChange={handleInputChange}
                                    placeholder="yyyy.mm.dd"
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">예상 매출<br/>( 단위 : 억원 )</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="expectedRevenue"
                                    value={formData.expectedRevenue}
                                    onChange={handleInputChange}
                                    placeholder="XX.X [ 수익 X.X ]"
                                    className="postmortem-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">예상 경쟁사</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="expectedCompetitors"
                                    value={formData.expectedCompetitors}
                                    onChange={handleInputChange}
                                    placeholder="XX, YY 등 N개사"
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">배점표</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="scoreTable"
                                    value={formData.scoreTable}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">제출/투찰 금액<br/>(단위:억원)</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="bidAmount"
                                    value={formData.bidAmount}
                                    onChange={handleInputChange}
                                    placeholder="XX.X, Y%"
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* PT 결과 분석 (9x3 테이블) */}
                <div className="postmortem-section">
                    <h3 className="section-header section-header-margin">
                        ■ PT 결과 분석
                    </h3>

                    <table className="postmortem-table">
                        <tbody>
                        <tr>
                            <td className="table-header">타이틀 구분</td>
                            <td className="table-header" colSpan={2}>타이틀 내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">PT 리뷰</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="ptReview"
                                    value={formData.ptReview}
                                    onChange={handleInputChange}
                                    placeholder="• 분위기, 광고주 질의 응답"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">PT 결과</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="ptResult"
                                    value={formData.ptResult}
                                    onChange={handleInputChange}
                                    placeholder="• 수주 여부"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">사유</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    placeholder="• 수주 / 실패 이유 분석"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={4}>부문별 결과분석</td>
                            <td className="table-cell table-cell-label">방향 / 컨셉</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="directionConcept"
                                    value={formData.directionConcept}
                                    onChange={handleInputChange}
                                    placeholder="• 독창성, 창의성"
                                    className="postmortem-textarea textarea-small"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">프로그램</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="program"
                                    value={formData.program}
                                    onChange={handleInputChange}
                                    placeholder="• 구체성, 현실가능성"
                                    className="postmortem-textarea textarea-small"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">운영</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="operation"
                                    value={formData.operation}
                                    onChange={handleInputChange}
                                    placeholder="• 안정성, 정확성"
                                    className="postmortem-textarea textarea-small"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">제출 견적</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="quotation"
                                    value={formData.quotation}
                                    onChange={handleInputChange}
                                    placeholder="• 효율성, 적정성"
                                    className="postmortem-textarea textarea-small"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">담당자 의견</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="managerOpinion"
                                    value={formData.managerOpinion}
                                    onChange={handleInputChange}
                                    placeholder="• "
                                    className="postmortem-textarea textarea-large"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="postmortem-actions">
                    <button onClick={handleSubmit} className="btn-primary">저장</button>
                    <button onClick={handlePrint} className="btn-secondary">인쇄</button>
                </div>
            </div>
        </div>
    );
};

export default PTPostmortemForm;