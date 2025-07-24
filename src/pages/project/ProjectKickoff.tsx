import React, { useState } from 'react';
import '../../styles/ProjectKickoff.css';

interface ProjectKickoff {
    // 프로젝트 기본 정보
    projectName: string;
    inflowPath: string;
    client: string;
    manager: string;
    eventDate: string;
    eventLocation: string;
    attendees: string;
    eventNature: string;
    otSchedule: string;
    submissionSchedule: string;
    expectedRevenue: string;
    expectedCompetitors: string;
    scoreTable: string;
    bidAmount: string;

    // 프로젝트 상세 정보
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    comparison: string;

    // 프로젝트 착수보고
    department: string;
    presenter: string;
    personnel: string;
    collaboration: string;
    plannedExpense: string;
    schedule: string;
    others: string;

    // 작성자 정보
    writerName: string;
    writerDepartment: string;
}

const ProjectKickoffForm: React.FC = () => {
    const [formData, setFormData] = useState<ProjectKickoff>({
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
        department: '',
        presenter: '',
        personnel: '',
        collaboration: '',
        plannedExpense: '',
        schedule: '',
        others: '',
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
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        console.log('프로젝트 착수서 저장:', formData);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="project-kickoff-container">
            {/* 헤더 */}
            <div className="kickoff-header">
                <div>
                    <h1 className="kickoff-title">
                        프로젝트 착수서
                    </h1>
                </div>
                <div className="kickoff-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 착수서 섹션 */}
            <div className="kickoff-main">
                <div className="kickoff-title-section">
                    <h2 className="kickoff-subtitle">
                        - 프로젝트 착수서 -
                    </h2>
                    <div className="kickoff-writer">
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
                                    placeholder="영업팀"
                                    className="writer-field-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로젝트 기본 정보 (8x4 테이블) */}
                <div className="kickoff-section">
                    <h3 className="section-header">
                        ■ 프로젝트 기본 정보
                    </h3>

                    <table className="kickoff-table">
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
                                    className="kickoff-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">유입경로</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="inflowPath"
                                    value={formData.inflowPath}
                                    onChange={handleInputChange}
                                    className="kickoff-input"
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
                                    className="kickoff-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">담당자</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="manager"
                                    value={formData.manager}
                                    onChange={handleInputChange}
                                    className="kickoff-input"
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
                                    className="kickoff-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사장소</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventLocation"
                                    value={formData.eventLocation}
                                    onChange={handleInputChange}
                                    className="kickoff-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">참석대상</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="attendees"
                                    value={formData.attendees}
                                    onChange={handleInputChange}
                                    placeholder="VIP XX명, 약 XX명 예상"
                                    className="kickoff-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사성격</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventNature"
                                    value={formData.eventNature}
                                    onChange={handleInputChange}
                                    className="kickoff-input"
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
                                    className="kickoff-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="submissionSchedule"
                                    value={formData.submissionSchedule}
                                    onChange={handleInputChange}
                                    placeholder="yyyy.mm.dd"
                                    className="kickoff-input"
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
                                    className="kickoff-input"
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
                                    className="kickoff-input"
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
                                    className="kickoff-input"
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
                                    className="kickoff-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 프로젝트 상세 정보 (5x2 테이블) */}
                <div className="kickoff-section">
                    <h3 className="section-header">
                        ■ 프로젝트 상세 정보
                    </h3>

                    <table className="kickoff-table">
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
                                    className="kickoff-textarea textarea-medium"
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
                                    className="kickoff-textarea textarea-large bullet-textarea"
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
                                    className="kickoff-textarea textarea-large bullet-textarea"
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
                                    className="kickoff-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 프로젝트 착수보고 (8x2 테이블) */}
                <div className="kickoff-section">
                    <h3 className="section-header">
                        ■ 프로젝트 착수보고
                    </h3>

                    <table className="kickoff-table">
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
                                    className="kickoff-textarea textarea-small bullet-textarea"
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
                                    className="kickoff-input"
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
                                    className="kickoff-textarea textarea-large bullet-textarea"
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
                                    className="kickoff-textarea textarea-large bullet-textarea"
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
                                    className="kickoff-textarea textarea-medium bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">추진 일정</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="schedule"
                                    value={formData.schedule}
                                    onChange={handleBulletTextChange}
                                    placeholder="기획 Kickoff, Ideation 회의, 디자인 의뢰, 제안서 리뷰, PT 리허설 등 일정&#10;*D-0 일 기준으로 작성"
                                    className="kickoff-textarea textarea-xlarge bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">기타</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="others"
                                    value={formData.others}
                                    onChange={handleBulletTextChange}
                                    className="kickoff-textarea textarea-medium bullet-textarea"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="button-section">
                    <button onClick={handleSubmit} className="submit-btn">
                        저장
                    </button>
                    <button onClick={handlePrint} className="print-btn">
                        인쇄
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectKickoffForm;