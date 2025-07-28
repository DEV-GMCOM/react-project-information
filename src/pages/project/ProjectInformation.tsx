import React, { useState } from 'react';
import '../../styles/ProjectInformation.css';

interface ProjectInformation {
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

    // 프로젝트 상세 정보
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    comparison: string;

    // 추가 정보 수집 (동적 배열)
    additionalInfo: Array<{
        date: string;
        content: string;
    }>;
}

const ProjectInformationForm: React.FC = () => {
    const [formData, setFormData] = useState<ProjectInformation>({
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
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        additionalInfo: [
            {
                date: '2025.07.23',
                content: '• 제목 및 안건 : 현대자동차 EV 신차 발표회 프로모션의 건\n• 협의 및 내용 : '
            },
            { date: '', content: '' }
        ]
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAdditionalInfoChange = (index: number, field: 'date' | 'content', value: string) => {
        const updatedInfo = [...formData.additionalInfo];
        updatedInfo[index][field] = value;

        // 마지막 행이 채워지면 새로운 빈 행 추가
        if (index === updatedInfo.length - 1 && updatedInfo[index].date && updatedInfo[index].content) {
            updatedInfo.push({ date: '', content: '' });
        }

        setFormData(prev => ({
            ...prev,
            additionalInfo: updatedInfo
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
        console.log('프로젝트 정보 저장:', formData);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="project-info-container">
            {/* 헤더 */}
            <div className="project-header">
                <div>
                    <h1 className="project-title">
                        프로젝트 정보 수집 양식
                    </h1>
                </div>
                <div className="project-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 프로젝트 정보 섹션 */}
            <div className="project-main">
                <div className="project-title-section">
                    <h2 className="project-subtitle">
                        - 정보 수집 -
                    </h2>
                    <div className="project-writer">
                        <div className="writer-form">
                            <div className="writer-field">
                                <label className="writer-field-label">등록자 이름:</label>
                                <input
                                    type="text"
                                    name="writerName"
                                    placeholder="홍길동"
                                    className="writer-field-input"
                                />
                            </div>
                            <div className="writer-field">
                                <label className="writer-field-label">부서:</label>
                                <input
                                    type="text"
                                    name="writerDepartment"
                                    placeholder="영업팀"
                                    className="writer-field-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로젝트 기본 정보 (8x4 테이블) */}
                <div className="project-section">
                    <h3 className="section-header">
                        ■ 프로젝트 기본 정보
                    </h3>

                    <table className="project-table">
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
                                    className="project-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">유입경로</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="inflowPath"
                                    value={formData.inflowPath}
                                    onChange={handleInputChange}
                                    className="project-input"
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
                                    className="project-input"
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
                                        className="project-input input-with-inner-btn"
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
                                    className="project-date-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사장소</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventLocation"
                                    value={formData.eventLocation}
                                    onChange={handleInputChange}
                                    className="project-input"
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
                                    className="project-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">행사성격</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="eventNature"
                                    value={formData.eventNature}
                                    onChange={handleInputChange}
                                    className="project-input"
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
                                    className="project-date-input"
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
                                    className="project-date-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">예상매출 ( 단위 : 억원 )</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="expectedRevenue"
                                    value={formData.expectedRevenue}
                                    onChange={handleInputChange}
                                    placeholder="XX.X [ 수익 X.X ]"
                                    className="project-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">예상 경쟁사</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="expectedCompetitors"
                                    value={formData.expectedCompetitors}
                                    onChange={handleInputChange}
                                    className="project-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 프로젝트 상세 정보 (5x2 테이블) */}
                <div className="project-section">
                    <h3 className="section-header">
                        ■ 프로젝트 상세 정보
                    </h3>

                    <table className="project-table">
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
                                    className="project-textarea textarea-medium"
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
                                    className="project-textarea textarea-large bullet-textarea"
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
                                    className="project-textarea textarea-large bullet-textarea"
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
                                    className="project-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 정보수집 추가 사항 (3x2 테이블 - 동적) */}
                <div className="project-section">
                    <h3 className="section-header">
                        ■ 정보수집 추가 사항
                    </h3>

                    <table className="project-table">
                        <tbody>
                        <tr>
                            <td className="table-header contact-date-header">날짜</td>
                            <td className="table-header">주요 내용</td>
                        </tr>
                        {formData.additionalInfo.map((info, index) => (
                            <tr key={index} className={index === formData.additionalInfo.length - 1 && !info.date && !info.content ? 'new-info-row' : ''}>
                                <td className="table-cell contact-date-cell">
                                    {index === 0 && info.date === '2025.07.23' ? (
                                        <div className="contact-date">{info.date}</div>
                                    ) : (
                                        <input
                                            type="date"
                                            value={info.date ? info.date.replace(/\./g, '-') : ''}
                                            onChange={(e) => {
                                                const selectedDate = e.target.value;
                                                const formattedDate = selectedDate ? selectedDate.replace(/-/g, '.') : '';
                                                handleAdditionalInfoChange(index, 'date', formattedDate);
                                            }}
                                            className="project-date-input"
                                        />
                                    )}
                                </td>
                                <td className="table-cell-input">
                                    <div className="info-content-container">
                                        <textarea
                                            value={info.content}
                                            onChange={(e) => handleAdditionalInfoChange(index, 'content', e.target.value)}
                                            className="project-textarea textarea-large bullet-textarea"
                                            style={{ whiteSpace: 'pre-line' }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
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

export default ProjectInformationForm;