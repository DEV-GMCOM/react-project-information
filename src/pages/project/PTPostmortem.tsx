// PTPostmortem.tsx - Project Kickoff 버튼 추가된 버전
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

    // 프로젝트 착수 보고 (Project Kickoff 토글)
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

const PTPostmortemForm: React.FC = () => {
    const [showProfileTables, setShowProfileTables] = useState(false);
    const [showKickoffTables, setShowKickoffTables] = useState(false);
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('PT Postmortem 데이터:', formData);
        // TODO: 서버 전송 로직
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="pt-postmortem-container">
            <header className="postmortem-header">
                <h1 className="postmortem-title">별첨 2-4. PT Postmortem</h1>
                <div className="postmortem-logo">GMC</div>
            </header>

            <main className="postmortem-main">
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

                        {/*<div className="postmortem-writer">*/}
                        {/*    <div className="writer-form">*/}
                        {/*        <div className="writer-field">*/}
                        {/*            <label className="writer-field-label">작성자:</label>*/}
                        {/*            <input*/}
                        {/*                type="text"*/}
                        {/*                name="writerName"*/}
                        {/*                value={formData.writerName}*/}
                        {/*                onChange={handleInputChange}*/}
                        {/*                className="writer-field-input"*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*        <div className="writer-field">*/}
                        {/*            <label className="writer-field-label">부서:</label>*/}
                        {/*            <input*/}
                        {/*                type="text"*/}
                        {/*                name="writerDepartment"*/}
                        {/*                value={formData.writerDepartment}*/}
                        {/*                onChange={handleInputChange}*/}
                        {/*                className="writer-field-input"*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*    </div>*/}
                        {/*</div>*/}
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
                                <td className="table-header">내용</td>
                                <td className="table-header">구분</td>
                                <td className="table-header">내용</td>
                                {/*<td className="table-header table-header-empty"></td>*/}
                                {/*<td className="table-header table-header-empty"></td>*/}
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
                                    예 산<br/>( 단위 : 천만원 )
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
                                    (단위 : 천만원)
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

                    {/* 버튼 섹션 - Project Profile과 Project Kickoff 버튼 */}
                    <div className="table-action-section">
                        <button
                            type="button"
                            className="toggle-profile-btn"
                            onClick={() => setShowProfileTables(!showProfileTables)}
                        >
                            Project Profile {showProfileTables ? '숨기기' : '보기'}
                        </button>
                        <button
                            type="button"
                            className="toggle-profile-btn"
                            onClick={() => setShowKickoffTables(!showKickoffTables)}
                        >
                            Project Kickoff {showKickoffTables ? '숨기기' : '보기'}
                        </button>
                    </div>

                    {/* 프로젝트 상세 정보 (Profile 토글) */}
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

                                {/* 프로젝트 검토 테이블 */}
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
                                                    value={formData.swotAnalysis}
                                                    onChange={handleBulletTextChange}
                                                    placeholder="경쟁사 대비 강점과 약점, 기회요인과 위협요인 분석"
                                                    className="postmortem-textarea textarea-large bullet-textarea"
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">방향성</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="direction"
                                                    value={formData.direction}
                                                    onChange={handleBulletTextChange}
                                                    placeholder="PT 컨셉, 프로그램 구성 등"
                                                    className="postmortem-textarea textarea-large bullet-textarea"
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">자원계획</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="resourcePlan"
                                                    value={formData.resourcePlan}
                                                    onChange={handleBulletTextChange}
                                                    placeholder="팀구성, 외주업체, 투입비용"
                                                    className="postmortem-textarea textarea-large bullet-textarea"
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="table-cell table-cell-label">작성자 의견</td>
                                            <td className="table-cell-input">
                                                <textarea
                                                    name="writerOpinion"
                                                    value={formData.writerOpinion}
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

                    {/* 프로젝트 착수 보고 (Kickoff 토글) */}
                    <div
                        className={`profile-tables-container ${showKickoffTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                        style={{
                            opacity: showKickoffTables ? 1 : 0,
                            maxHeight: showKickoffTables ? '2000px' : '0',
                            transform: showKickoffTables ? 'translateY(0)' : 'translateY(-20px)',
                            marginBottom: showKickoffTables ? '0' : '0',
                            transition: 'all 1s ease-in-out'
                        }}
                    >
                        {showKickoffTables && (
                            <div className="postmortem-section">
                                <h3 className="section-header">
                                    ■ 프로젝트 착수보고
                                </h3>
                                <table className="postmortem-table">
                                    <tbody>
                                    <tr>
                                        <td className="table-header">구분</td>
                                        <td className="table-header">내용</td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">담당부서</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="department"
                                                value={formData.department}
                                                onChange={handleBulletTextChange}
                                                placeholder="X본부 Y팀"
                                                className="postmortem-textarea textarea-small bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">PT발표자</td>
                                        <td className="table-cell-input">
                                            <input
                                                type="text"
                                                name="presenter"
                                                value={formData.presenter}
                                                onChange={handleInputChange}
                                                className="postmortem-input"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">
                                            투입인력 및<br/>
                                            역할, 기여도
                                        </td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="personnel"
                                                value={formData.personnel}
                                                onChange={handleBulletTextChange}
                                                placeholder="메인 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">협업조직</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="collaboration"
                                                value={formData.collaboration}
                                                onChange={handleBulletTextChange}
                                                placeholder="키비주얼 : 디자인팀&#10;3D 디자인 : XX 사&#10;영상 : 영상팀"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">기획 예상경비</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="plannedExpense"
                                                value={formData.plannedExpense}
                                                onChange={handleBulletTextChange}
                                                placeholder="출장, 야근택시비, 용역비 등"
                                                className="postmortem-textarea textarea-medium bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">
                                            진행 일정<br/>
                                            (마일스톤)
                                        </td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="progressSchedule"
                                                value={formData.progressSchedule}
                                                onChange={handleBulletTextChange}
                                                placeholder="주차별 또는 월별 주요 일정"
                                                className="postmortem-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">위험요소</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="riskFactors"
                                                value={formData.riskFactors}
                                                onChange={handleBulletTextChange}
                                                placeholder="예상되는 리스크와 대응방안"
                                                className="postmortem-textarea textarea-medium bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">차기 보고</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="nextReport"
                                                value={formData.nextReport}
                                                onChange={handleInputChange}
                                                placeholder="다음 보고 예정일과 내용"
                                                className="postmortem-textarea textarea-small"
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

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

                    {/* 버튼 섹션 */}
                    <div className="button-section">
                        <button type="submit" className="submit-btn">
                            저장
                        </button>
                        <button type="button" className="print-btn" onClick={handlePrint}>
                            인쇄
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default PTPostmortemForm;