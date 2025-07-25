// ProjectPostmortem.tsx - 완전 업데이트된 버전
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
    const [showProfileTables, setShowProfileTables] = useState(false);
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
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        swotAnalysis: '',
        direction: '',
        resourcePlan: '',
        writerOpinion: '',
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
        if (formData.internalTeam.length < 10) {
            setFormData(prev => ({
                ...prev,
                internalTeam: [...prev.internalTeam, { category: '', details: '' }]
            }));
        }
    };

    const addPartnerRow = () => {
        if (formData.externalPartners.length < 15) {
            setFormData(prev => ({
                ...prev,
                externalPartners: [...prev.externalPartners, { category: '', details: '' }]
            }));
        }
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
                            <td className="table-cell table-cell-label">실행일</td>
                            <td className="table-cell-input" colSpan={2}>
                                <input
                                    type="date"
                                    name="executionDate"
                                    value={formData.executionDate ? formData.executionDate.replace(/\./g, '-') : ''}
                                    onChange={(e) => {
                                        const selectedDate = e.target.value;
                                        if (selectedDate) {
                                            const formattedDate = selectedDate.replace(/-/g, '.');
                                            setFormData(prev => ({ ...prev, executionDate: formattedDate }));
                                        } else {
                                            setFormData(prev => ({ ...prev, executionDate: '' }));
                                        }
                                    }}
                                    className="postmortem-date-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">내부 담당부서</td>
                            <td className="table-cell-input" colSpan={2}>
                                <input
                                    type="text"
                                    name="internalDepartment"
                                    value={formData.internalDepartment}
                                    onChange={handleInputChange}
                                    className="postmortem-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={formData.internalTeam.length + 1}>
                                내부팀
                            </td>
                            <td className="table-cell table-cell-label dropdown-cell">구분</td>
                            <td className="table-cell table-cell-label add-button-cell">
                                내용
                                <button
                                    type="button"
                                    onClick={addTeamRow}
                                    className="add-row-btn"
                                    disabled={formData.internalTeam.length >= 10}
                                >
                                    행 추가
                                </button>
                            </td>
                        </tr>
                        {formData.internalTeam.map((team, index) => (
                            <tr key={`team-${index}`}>
                                <td className="table-cell-input dropdown-cell">
                                    <select
                                        value={team.category}
                                        onChange={(e) => handleTeamChange(index, 'category', e.target.value)}
                                        className="postmortem-select"
                                    >
                                        <option value="">선택</option>
                                        {internalCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="table-cell-input">
                                    <input
                                        type="text"
                                        value={team.details}
                                        onChange={(e) => handleTeamChange(index, 'details', e.target.value)}
                                        className="postmortem-input"
                                    />
                                </td>
                            </tr>
                        ))}
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={formData.externalPartners.length + 1}>
                                외부 협력업체
                            </td>
                            <td className="table-cell table-cell-label dropdown-cell">구분</td>
                            <td className="table-cell table-cell-label add-button-cell">
                                내용
                                <button
                                    type="button"
                                    onClick={addPartnerRow}
                                    className="add-row-btn"
                                    disabled={formData.externalPartners.length >= 15}
                                >
                                    행 추가
                                </button>
                            </td>
                        </tr>
                        {formData.externalPartners.map((partner, index) => (
                            <tr key={`partner-${index}`}>
                                <td className="table-cell-input dropdown-cell">
                                    <select
                                        value={partner.category}
                                        onChange={(e) => handlePartnerChange(index, 'category', e.target.value)}
                                        className="postmortem-select"
                                    >
                                        <option value="">선택</option>
                                        {externalCategories.map(category => (
                                            <option key={category} value={category}>{category}</option>
                                        ))}
                                    </select>
                                </td>
                                <td className="table-cell-input">
                                    <input
                                        type="text"
                                        value={partner.details}
                                        onChange={(e) => handlePartnerChange(index, 'details', e.target.value)}
                                        className="postmortem-input"
                                    />
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
                                    placeholder="• 참석률, 만족도, 매출 등 수치화 가능한 평가"
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
                                    placeholder="• 브랜드 이미지 향상, 고객 반응, 미디어 노출 등"
                                    className="postmortem-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">이슈 및 개선사항</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="issuesAndImprovements"
                                    value={formData.issuesAndImprovements}
                                    onChange={handleInputChange}
                                    placeholder="• 발생한 문제점과 향후 개선 방안"
                                    className="postmortem-textarea textarea-large"
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
                                    placeholder="• 전체적인 프로젝트 평가 및 의견"
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

export default ProjectPostmortemForm;
