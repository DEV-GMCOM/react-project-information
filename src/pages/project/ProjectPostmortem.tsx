import React, { useState } from 'react';
import '../../styles/ProjectPostmortem.css';

interface ProjectPostmortemData {
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

    // 프로젝트 실행 후 보고
    executionDate: string;
    internalDepartment: string;
    internalTeam: Array<{
        category: string;
        details: string;
    }>;
    externalPartners: Array<{
        category: string;
        details: string;
    }>;

    // 실행 후 평가
    quantitativeEvaluation: string;
    qualitativeEvaluation: string;
    issuesAndImprovements: string;
    managerOpinion: string;

    // 메타데이터
    writerName: string;
    writerDepartment: string;
}

const ProjectPostmortemForm: React.FC = () => {
    const [formData, setFormData] = useState<ProjectPostmortemData>({
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
        executionDate: '',
        internalDepartment: '',
        internalTeam: [{ category: '', details: '' }],
        externalPartners: [{ category: '', details: '' }],
        quantitativeEvaluation: '',
        qualitativeEvaluation: '',
        issuesAndImprovements: '',
        managerOpinion: '',
        writerName: '',
        writerDepartment: ''
    });

    const internalCategories = ['기획', 'Proj 메인', '무대 및 연출', '인력', '제작'];
    const externalCategories = ['무대', '전시', '영상장비', '음향', '영상제작', '조명', '음악제작', 'VJ', '진행인력', '경호', '렌탈', '기타'];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleTeamChange = (index: number, field: 'category' | 'details', value: string) => {
        setFormData(prev => ({
            ...prev,
            internalTeam: prev.internalTeam.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const handlePartnerChange = (index: number, field: 'category' | 'details', value: string) => {
        setFormData(prev => ({
            ...prev,
            externalPartners: prev.externalPartners.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        }));
    };

    const addTeamRow = () => {
        setFormData(prev => ({
            ...prev,
            internalTeam: [...prev.internalTeam, { category: '', details: '' }]
        }));
    };

    const addPartnerRow = () => {
        setFormData(prev => ({
            ...prev,
            externalPartners: [...prev.externalPartners, { category: '', details: '' }]
        }));
    };

    const canAddTeamRow = (index: number) => {
        const item = formData.internalTeam[index];
        return item.category && item.details;
    };

    const canAddPartnerRow = (index: number) => {
        const item = formData.externalPartners[index];
        return item.category && item.details;
    };

    const handleSubmit = () => {
        console.log('Project Postmortem 저장:', formData);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="project-postmortem-container">
            {/* 헤더 */}
            <div className="postmortem-header">
                <div>
                    <h1 className="postmortem-title">
                        Project Postmortem 양식
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
                        -- Project Postmortem --
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

                {/* 프로젝트 실행 후 보고 */}
                <div className="postmortem-section">
                    <h3 className="section-header section-header-margin">
                        ■ 프로젝트 실행 후 보고
                    </h3>

                    <table className="postmortem-table">
                        <tbody>
                        <tr>
                            <td className="table-header">타이틀 구분</td>
                            <td className="table-header" colSpan={2}>타이틀 내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">행사일</td>
                            <td className="table-cell-input" colSpan={2}>
                                <input
                                    type="text"
                                    name="executionDate"
                                    value={formData.executionDate}
                                    onChange={handleInputChange}
                                    placeholder="yyyy.mm.dd"
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">내부 실행 부서</td>
                            <td className="table-cell-input" colSpan={2}>
                                <textarea
                                    name="internalDepartment"
                                    value={formData.internalDepartment}
                                    onChange={handleInputChange}
                                    placeholder="• X본부 X팀"
                                    className="postmortem-textarea textarea-small"
                                />
                            </td>
                        </tr>
                        {formData.internalTeam.map((team, index) => (
                            <tr key={`team-${index}`}>
                                {index === 0 && (
                                    <td className="table-cell table-cell-rowspan" rowSpan={formData.internalTeam.length}>
                                        담당자 & 기여도
                                    </td>
                                )}
                                <td className="table-cell-input dropdown-cell">
                                    <select
                                        value={team.category}
                                        onChange={(e) => handleTeamChange(index, 'category', e.target.value)}
                                        className="postmortem-select"
                                    >
                                        <option value="">카테고리 선택</option>
                                        {internalCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="table-cell-input add-button-cell">
                                    <div className="input-with-button">
                                        <textarea
                                            value={team.details}
                                            onChange={(e) => handleTeamChange(index, 'details', e.target.value)}
                                            placeholder="• XXX PM / 기여도 YY %"
                                            className="postmortem-textarea textarea-small"
                                        />
                                        {index === formData.internalTeam.length - 1 && canAddTeamRow(index) && (
                                            <button
                                                type="button"
                                                onClick={addTeamRow}
                                                className="add-row-btn"
                                            >
                                                +추가
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {formData.externalPartners.map((partner, index) => (
                            <tr key={`partner-${index}`}>
                                {index === 0 && (
                                    <td className="table-cell table-cell-rowspan" rowSpan={formData.externalPartners.length}>
                                        외주 협력사 평가
                                    </td>
                                )}
                                <td className="table-cell-input dropdown-cell">
                                    <select
                                        value={partner.category}
                                        onChange={(e) => handlePartnerChange(index, 'category', e.target.value)}
                                        className="postmortem-select"
                                    >
                                        <option value="">카테고리 선택</option>
                                        {externalCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="table-cell-input add-button-cell">
                                    <div className="input-with-button">
                                        <textarea
                                            value={partner.details}
                                            onChange={(e) => handlePartnerChange(index, 'details', e.target.value)}
                                            placeholder="• XXX 업체명 / 평가점수 YY점"
                                            className="postmortem-textarea textarea-small"
                                        />
                                        {index === formData.externalPartners.length - 1 && canAddPartnerRow(index) && (
                                            <button
                                                type="button"
                                                onClick={addPartnerRow}
                                                className="add-row-btn"
                                            >
                                                +추가
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* 실행 후 평가 (5x2 테이블) */}
                <div className="postmortem-section">
                    <h3 className="section-header section-header-margin">
                        ■ 실행 후 평가
                    </h3>

                    <table className="postmortem-table">
                        <tbody>
                        <tr>
                            <td className="table-header">타이틀 구분</td>
                            <td className="table-header">타이틀 내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">정량적 평가</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="quantitativeEvaluation"
                                    value={formData.quantitativeEvaluation}
                                    onChange={handleInputChange}
                                    placeholder="• 일정에 맞게 수행이 되었는지&#10;제시된 수치에 맞게 제작 발주, 관리가 되었는지"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">정성적 평가</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="qualitativeEvaluation"
                                    value={formData.qualitativeEvaluation}
                                    onChange={handleInputChange}
                                    placeholder="• 제시된 프로그램이 좋은 평가를 받았는지&#10;안정적으로 운영이 되었는지"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">이슈 및 보완점</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="issuesAndImprovements"
                                    value={formData.issuesAndImprovements}
                                    onChange={handleInputChange}
                                    placeholder="• 문제점, 이슈사항&#10;현장 해결방안"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">담당자 의견</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="managerOpinion"
                                    value={formData.managerOpinion}
                                    onChange={handleInputChange}
                                    placeholder="• 향후 보완 및 개선점&#10;내부 문제점 및 해법 도출"
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

export default ProjectPostmortemForm;