// PTPostmortem.tsx - 완전 업데이트된 버전
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

    // 프로젝트 상세 정보 (토글)
    purposeBackground?: string;
    mainContent?: string;
    coreRequirements?: string;
    comparison?: string;

    // 프로젝트 검토 (토글)
    swotAnalysis?: string;
    direction?: string;
    resourcePlan?: string;
    writerOpinion?: string;

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
    const [showProfileTables, setShowProfileTables] = useState(false);
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
                            <td className="table-header">구분</td>
                            <td className="table-header table-header-empty"></td>
                            <td className="table-header">내용</td>
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
                                <div className="input-container">
                                    <input
                                        type="text"
                                        name="manager"
                                        value={formData.manager}
                                        onChange={handleInputChange}
                                        className="postmortem-input input-with-inner-btn"
                                    />
                                    <button
                                        type="button"
                                        className="inner-profile-btn"
                                        onClick={() => {
                                            console.log('광고주 Profile 버튼 클릭');
                                            // TODO: 광고주 Profile 페이지로 이동 또는 모달 열기
                                        }}
                                    >
                                        광고주 Profile
                                    </button>
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input">
                                <input
                                    type="date"
                                    name="eventDate"
                                    value={formData.eventDate ? formData.eventDate.replace(/\./g, '-') : ''}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.replace(/-/g, '.');
                                            setFormData(prev => ({ ...prev, eventDate: formattedDate }));
                                        } else {
                                            setFormData(prev => ({ ...prev, eventDate: '' }));
                                        }
                                    }}
                                    className="postmortem-date-input"
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
                                    type="date"
                                    name="otSchedule"
                                    value={formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : ''}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.replace(/-/g, '.');
                                            setFormData(prev => ({ ...prev, otSchedule: formattedDate }));
                                        } else {
                                            setFormData(prev => ({ ...prev, otSchedule: '' }));
                                        }
                                    }}
                                    className="postmortem-date-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input">
                                <input
                                    type="date"
                                    name="ptSchedule"
                                    value={formData.ptSchedule ? formData.ptSchedule.replace(/\./g, '-') : ''}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.replace(/-/g, '.');
                                            setFormData(prev => ({ ...prev, ptSchedule: formattedDate }));
                                        } else {
                                            setFormData(prev => ({ ...prev, ptSchedule: '' }));
                                        }
                                    }}
                                    className="postmortem-date-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">
                                예상매출<br/>
                                ( 단위 : 억원 )
                            </td>
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
                            <td className="table-cell table-cell-label">
                                제출/투찰 금액<br/>
                                (단위:억원)
                            </td>
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

                {/* Project Profile 토글 버튼 */}
                <div className="table-action-section">
                    <button
                        type="button"
                        className="toggle-profile-btn"
                        onClick={() => setShowProfileTables(!showProfileTables)}
                    >
                        Project Profile {showProfileTables ? '숨기기' : '보기'}
                    </button>
                </div>

                {/* 프로젝트 상세 정보 (5x2 테이블) - 토글 애니메이션 */}
                <div
                    className={`profile-tables-container ${showProfileTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                    style={{
                        opacity: showProfileTables ? 1 : 0,
                        maxHeight: showProfileTables ? '2000px' : '0',
                        transform: showProfileTables ? 'translateY(0)' : 'translateY(-20px)',
                        marginBottom: showProfileTables ? '0' : '0',
                        transition: 'all 1s ease-in-out'
                    }}
                >
                    {showProfileTables && (
                        <>
                            <div className="postmortem-section">
                                <h3 className="section-header">
                                    ■ 프로젝트 상세 정보
                                </h3>
                                <table className="postmortem-table">
                                    <tbody>
                                    <tr>
                                        <td className="table-header">구분</td>
                                        <td className="table-header">내용</td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">목적 및 배경</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="purposeBackground"
                                                value={formData.purposeBackground}
                                                onChange={handleInputChange}
                                                className="postmortem-textarea textarea-medium"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">주요 내용</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="mainContent"
                                                value={formData.mainContent}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">핵심 요구사항</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="coreRequirements"
                                                value={formData.coreRequirements}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">비교</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="comparison"
                                                value={formData.comparison}
                                                onChange={handleInputChange}
                                                className="postmortem-textarea textarea-medium"
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* 프로젝트 검토 */}
                            <div className="postmortem-section">
                                <h3 className="section-header">
                                    ■ 프로젝트 검토
                                </h3>

                                <table className="postmortem-table">
                                    <tbody>
                                    <tr>
                                        <td className="table-header">구분</td>
                                        <td className="table-header">내용</td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">SWOT 분석</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="swotAnalysis"
                                                value={formData.swotAnalysis || ''}
                                                onChange={handleBulletTextChange}
                                                placeholder="강점: 독보적 경험과 노하우 활요, 높은 수주가능성&#10;약점: 내수율 저조&#10;기회: 매출달성에 기여, 차기 Proj 기약&#10;위험: 내정자에 따른 휴먼 리소스 소모"
                                                className="postmortem-textarea textarea-xlarge bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">추진방향</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="direction"
                                                value={formData.direction || ''}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 추진 방향성&#10;리소스 활용방법"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">리소스 활용방안</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="resourcePlan"
                                                value={formData.resourcePlan || ''}
                                                onChange={handleBulletTextChange}
                                                placeholder="내부 전담조직 및 참여자 역량&#10;협업 조직: XX사 3D 디자인, 영상팀"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">작성자 의견</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="writerOpinion"
                                                value={formData.writerOpinion || ''}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 진행여부 판단 의견 요약"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
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
                                    placeholder="• 낙찰/탈락"
                                    className="postmortem-textarea textarea-small"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">이유</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="reason"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    placeholder="• 결과에 대한 이유 분석"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">방향성/컨셉</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="directionConcept"
                                    value={formData.directionConcept}
                                    onChange={handleInputChange}
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">프로그램</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="program"
                                    value={formData.program}
                                    onChange={handleInputChange}
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">운영</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="operation"
                                    value={formData.operation}
                                    onChange={handleInputChange}
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">견적</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="quotation"
                                    value={formData.quotation}
                                    onChange={handleInputChange}
                                    className="postmortem-textarea textarea-medium"
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
                                    className="postmortem-textarea textarea-large"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="button-section">
                    <button type="button" onClick={handleSubmit} className="submit-btn">
                        저장
                    </button>
                    <button type="button" onClick={handlePrint} className="print-btn">
                        인쇄
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PTPostmortemForm;