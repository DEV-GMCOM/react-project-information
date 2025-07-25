import React, { useState } from 'react';
import '../../styles/ProjectProfile.css';

interface ProjectProfile {
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

    // 프로젝트 검토
    swotAnalysis: string;
    direction: string;
    resourcePlan: string;
    writerOpinion: string;

    // 작성자 정보
    writerName: string;
    writerDepartment: string;
}

const ProjectProfileForm: React.FC = () => {
    const [formData, setFormData] = useState<ProjectProfile>({
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
        swotAnalysis: '',
        direction: '',
        resourcePlan: '',
        writerOpinion: '',
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
        console.log('프로젝트 Profile 저장:', formData);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="project-profile-container">
            {/* 헤더 */}
            <div className="profile-header">
                <div>
                    <h1 className="profile-title">
                        프로젝트 Profile 양식
                    </h1>
                </div>
                <div className="profile-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 프로필 섹션 */}
            <div className="profile-main">
                <div className="profile-title-section">
                    <h2 className="profile-subtitle">
                        - 프로젝트 Profile -
                    </h2>
                    <div className="profile-writer">
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
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 프로젝트 기본 정보
                    </h3>

                    <table className="profile-table">
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
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">유입경로</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="inflowPath"
                                    value={formData.inflowPath}
                                    onChange={handleInputChange}
                                    className="profile-input"
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
                                    className="profile-input"
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
                                        className="profile-input input-with-inner-btn"
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
                                    className="profile-date-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사장소</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventLocation"
                                    value={formData.eventLocation}
                                    onChange={handleInputChange}
                                    className="profile-input"
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
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사성격</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventNature"
                                    value={formData.eventNature}
                                    onChange={handleInputChange}
                                    className="profile-input"
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
                                    className="profile-date-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">제출 / PT 일정</td>
                            <td className="table-cell-input">
                                <input
                                    type="date"
                                    name="submissionSchedule"
                                    value={formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : ''}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.replace(/-/g, '.');
                                            setFormData(prev => ({ ...prev, submissionSchedule: formattedDate }));
                                        } else {
                                            setFormData(prev => ({ ...prev, submissionSchedule: '' }));
                                        }
                                    }}
                                    className="profile-date-input"
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
                                    className="profile-input"
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
                                    className="profile-input"
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
                                    className="profile-input"
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
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 프로젝트 상세 정보 (5x2 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 프로젝트 상세 정보
                    </h3>

                    <table className="profile-table">
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
                                    className="profile-textarea textarea-medium"
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
                                    placeholder="주요 과제, 행사 맥락"
                                    className="profile-textarea textarea-large bullet-textarea"
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
                                    placeholder="- 용역 제안범위&#10;- 운영 및 기타 필수 사항"
                                    className="profile-textarea textarea-large bullet-textarea"
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
                                    className="profile-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 프로젝트 검토 (5x2 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 프로젝트 검토
                    </h3>

                    <table className="profile-table">
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
                                    placeholder="강점: 독보적 경험과 노하우 활요, 높은 수주가능성&#10;약점: 내수율 저조&#10;기회: 매출달성에 기여, 차기 Proj 기약&#10;위험: 내정자에 따른 휴먼 리소스 소모"
                                    className="profile-textarea textarea-xlarge bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">추진방향</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="direction"
                                    value={formData.direction}
                                    onChange={handleBulletTextChange}
                                    placeholder="프로젝트 추진 방향성&#10;리소스 활용방법"
                                    className="profile-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">리소스 활용방안</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="resourcePlan"
                                    value={formData.resourcePlan}
                                    onChange={handleBulletTextChange}
                                    placeholder="내부 전담조직 및 참여자 역량&#10;협업 조직: XX사 3D 디자인, 영상팀"
                                    className="profile-textarea textarea-large bullet-textarea"
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
                                    className="profile-textarea textarea-large bullet-textarea"
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

export default ProjectProfileForm;