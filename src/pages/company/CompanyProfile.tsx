import React, { useState } from 'react';
import '../../styles/CompanyProfile.css';

interface CompanyProfile {
    // 클라이언트 기업 정보
    businessType: string;
    representative: string;
    businessCategory: string;
    clientName: string;
    representativeName: string;
    businessNumber: string;
    contactInfo: string;

    // 담당자 상세 정보
    department: string;
    contactPerson: string;
    phone: string;
    email: string;
    responsibility: string;
    workStyle: string;
    personalInfo: string;
    organizationInfo: string;

    // 히스토리
    relationship: string;
    projectExperience: string;
    notes: string;

    // 컨택 리포트 (기존 데이터)
    existingReports: Array<{
        date: string;
        content: string;
    }>;

    // 새 컨택 리포트 입력
    newReportDate: string;
    newReportContent: string;
}

const CompanyProfileForm: React.FC = () => {
    const [formData, setFormData] = useState<CompanyProfile>({
        businessType: '',
        representative: '',
        businessCategory: '',
        clientName: '',
        representativeName: '',
        businessNumber: '',
        contactInfo: '',
        department: '',
        contactPerson: '',
        phone: '',
        email: '',
        responsibility: '',
        workStyle: '',
        personalInfo: '',
        organizationInfo: '',
        relationship: '',
        projectExperience: '',
        notes: '',
        existingReports: [
            { date: '2025.07.23', content: '• 제목 및 안건: 현대자동차 EV 신차 발표회 프로모션의 건\n• 회의 및 내용: ...' }
        ],
        newReportDate: '',
        newReportContent: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddReport = () => {
        if (formData.newReportDate && formData.newReportContent) {
            setFormData(prev => ({
                ...prev,
                existingReports: [
                    ...prev.existingReports,
                    { date: prev.newReportDate, content: prev.newReportContent }
                ],
                newReportDate: '',
                newReportContent: ''
            }));
        }
    };

    const handleSubmit = () => {
        console.log('광고주 Profile 저장:', formData);
        // TODO: API 연동
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="company-profile-container">
            {/* 헤더 */}
            <div className="profile-header">
                <div>
                    <h1 className="profile-title">
                        별첨 1. 광고주 Profile 양식
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
                        - 광고주 Profile -
                    </h2>
                    {/*<div className="profile-writer">*/}
                    {/*    <label className="writer-label">*/}
                    {/*        작성자*/}
                    {/*    </label>*/}
                    {/*    <input*/}
                    {/*        type="text"*/}
                    {/*        placeholder="○부○ ○팀 담당 ○○○"*/}
                    {/*        className="writer-input"*/}
                    {/*    />*/}
                    {/*</div>*/}
                    <div className="profile-writer">
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
                                    placeholder="마케팅팀"
                                    className="writer-field-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 클라이언트 기업 정보 (4x4 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 클라이언트 기업 정보
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                            {/*<td className="table-header table-header-empty"></td>*/}
                            {/*<td className="table-header table-header-empty"></td>*/}
                        </tr>                        <tr>
                            <td className="table-cell table-cell-label">발주처</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleInputChange}
                                    placeholder="제일기획"
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">원청자</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="clientName"
                                    value={formData.clientName}
                                    onChange={handleInputChange}
                                    placeholder="삼성전자"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">대표</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="representative"
                                    value={formData.representative}
                                    onChange={handleInputChange}
                                    placeholder="제일기획 대표 이름"
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">사업자번호</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="businessNumber"
                                    value={formData.businessNumber}
                                    onChange={handleInputChange}
                                    placeholder="000-00-00000"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">기본개요</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="businessCategory"
                                    value={formData.businessCategory}
                                    onChange={handleInputChange}
                                    placeholder="삼성계열 광고대행사"
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">연락처</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="contactInfo"
                                    value={formData.contactInfo}
                                    onChange={handleInputChange}
                                    placeholder="대표전화/이메일/홈페이지"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 담당자 상세 정보 (7x5 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 담당자 상세 정보
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header" colSpan={2}>내용</td>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                            {/*<td className="table-header table-header-empty" colSpan={2}></td>*/}
                            {/*<td className="table-header table-header-empty"></td>*/}
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">소속/부서</td>
                            <td className="table-cell-input" colSpan={2}>
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    placeholder="BX 1팀"
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">직책/이름</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
                                    placeholder="팀장 홍길동"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">연락처</td>
                            <td className="table-cell-input" colSpan={2}>
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="010-0000-0000"
                                    className="profile-input"
                                />
                            </td>
                            <td className="table-cell table-cell-label">이메일</td>
                            <td className="table-cell-input">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="abcd@efgh.com"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-rowspan" rowSpan={4}>부가정보</td>
                            <td className="table-cell table-cell-label">담당 업무</td>
                            <td className="table-cell-input" colSpan={3}>
                                <input
                                    type="text"
                                    name="responsibility"
                                    value={formData.responsibility}
                                    onChange={handleInputChange}
                                    placeholder="담당 업무 내용"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">업무 스타일</td>
                            <td className="table-cell-input" colSpan={3}>
                                <input
                                    type="text"
                                    name="workStyle"
                                    value={formData.workStyle}
                                    onChange={handleInputChange}
                                    placeholder="보수적, 자율적"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">개별 특화정보</td>
                            <td className="table-cell-input" colSpan={3}>
                  <textarea
                      name="personalInfo"
                      value={formData.personalInfo}
                      onChange={handleInputChange}
                      placeholder="생일, 취미, 개인적 성향"
                      className="profile-textarea textarea-small"
                  />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">부서 및 조직정보</td>
                            <td className="table-cell-input" colSpan={3}>
                  <textarea
                      name="organizationInfo"
                      value={formData.organizationInfo}
                      onChange={handleInputChange}
                      placeholder="XXX전담부서, 기존 BE 본부와 업무분할"
                      className="profile-textarea textarea-small"
                  />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 히스토리 (4x2 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 히스토리
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header table-header-category">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">관계성</td>
                            <td className="table-cell-input">
                  <textarea
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      placeholder="• 지엠컴 담당자/부서는 누구이며, 언제부터 관계가 형성되었고, 친분 및 영업관계에 대한 친밀도 등등의 정보"
                      className="profile-textarea textarea-medium"
                  />
                            </td>
                        </tr>
                        {/*<tr>*/}
                        {/*    <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>*/}
                        {/*    <td className="table-cell-input">*/}
                        {/*        <div className="project-experience-container">*/}
                        {/*            <div className="project-buttons">*/}
                        {/*                <button*/}
                        {/*                    type="button"*/}
                        {/*                    className="project-btn"*/}
                        {/*                    onClick={() => /!* 추후 모달 팝업 구현 *!/}*/}
                        {/*                >*/}
                        {/*                    Prj Profile*/}
                        {/*                </button>*/}
                        {/*                <button*/}
                        {/*                    type="button"*/}
                        {/*                    className="project-btn"*/}
                        {/*                    onClick={() => /!* 추후 모달 팝업 구현 *!/}*/}
                        {/*                >*/}
                        {/*                    Proj Kickoff*/}
                        {/*                </button>*/}
                        {/*            </div>*/}
                        {/*            <textarea*/}
                        {/*                name="projectExperience"*/}
                        {/*                value={formData.projectExperience}*/}
                        {/*                onChange={handleInputChange}*/}
                        {/*                placeholder="• 프로젝트 유경험 시, 프로젝트명/기간/특이사항 입력"*/}
                        {/*                className="profile-textarea textarea-medium"*/}
                        {/*            />*/}
                        {/*        </div>*/}
                        {/*    </td>*/}
                        {/*</tr>*/}

                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">프로젝트 경험성</td>
                            <td className="table-cell-input">
                                <div className="project-experience-container">
      <textarea
          name="projectExperience"
          value={formData.projectExperience}
          onChange={handleInputChange}
          placeholder="• 프로젝트 유경험 시, 프로젝트명/기간/특이사항 입력"
          className="profile-textarea textarea-medium"
      />
                                    <div className="project-buttons-overlay">
                                        <button
                                            type="button"
                                            className="project-btn"
                                            onClick={() => {/* 추후 모달 팝업 구현 */}}
                                        >
                                            Prj Profile
                                        </button>
                                        <button
                                            type="button"
                                            className="project-btn"
                                            onClick={() => {/* 추후 모달 팝업 구현 */}}
                                        >
                                            Proj Kickoff
                                        </button>
                                    </div>
                                </div>
                            </td>
                        </tr>

                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">비고</td>
                            <td className="table-cell-input">
                  <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="기타 특이사항"
                      className="profile-textarea textarea-medium"
                  />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 컨택 리포트 (동적 3x2+ 테이블) */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 컨택 리포트 (미팅 회의록)
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header table-header-category">날짜</td>
                            <td className="table-header">주요 내용</td>
                        </tr>
                        {/* 기존 리포트들 */}
                        {formData.existingReports.map((report, index) => (
                            <tr key={index}>
                                <td className="table-cell table-cell-label table-cell-top contact-date-cell">
                                    <div className="contact-date">{report.date}</div>
                                </td>
                                <td className="table-cell-input">
                                    <div className="contact-content">
                                        {report.content.split('\n').map((line, lineIndex) => (
                                            <div key={lineIndex}>{line}</div>
                                        ))}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {/* 새 리포트 입력 행 (항상 존재) */}
                        <tr className="new-report-row">
                            <td className="table-cell-input">
                                <input
                                    type="date"
                                    name="newReportDate"
                                    value={formData.newReportDate}
                                    onChange={handleInputChange}
                                    className="profile-date-input"
                                />
                            </td>
                            <td className="table-cell-input">
                                <div className="new-report-container">
                    <textarea
                        name="newReportContent"
                        value={formData.newReportContent}
                        onChange={handleInputChange}
                        placeholder="• 제목 및 안건: 현대자동차 EV 신차 발표회 프로모션의 건"
                        className="profile-textarea textarea-large"
                    />
                                    <button
                                        type="button"
                                        onClick={handleAddReport}
                                        className="add-report-btn"
                                        disabled={!formData.newReportDate || !formData.newReportContent}
                                    >
                                        ➕ 추가
                                    </button>
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 액션 버튼 */}
                <div className="form-actions">
                    <button
                        onClick={handlePrint}
                        className="action-button btn-print"
                    >
                        📄 인쇄
                    </button>
                    <button
                        className="action-button btn-cancel"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="action-button btn-save"
                    >
                        💾 저장
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CompanyProfileForm;