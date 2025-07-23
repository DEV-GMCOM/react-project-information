import React, { useState } from 'react';
import '../../styles/CompanyProfile.css';

interface CompanyProfile {
    // 클라이언트 기업 정보
    businessType: string;
    representative: string;
    businessCategory: string;

    // 담당자 상세 정보
    department: string;
    contactPerson: string;
    position: string;
    phone: string;
    email: string;

    // 담당 업무
    responsibilityType: string;
    responsibilities: string;

    // 부가 정보
    companyInfo: string;
    businessInfo: string;

    // 히스토리
    pastExperience: string;

    // 프로젝트 경험
    projectExperience: string;

    // 비고
    notes: string;

    // 컨택 리포트
    contactDate: string;
    contactContent: string;
}

const CompanyProfileForm: React.FC = () => {
    const [formData, setFormData] = useState<CompanyProfile>({
        businessType: '',
        representative: '',
        businessCategory: '',
        department: '',
        contactPerson: '',
        position: '',
        phone: '',
        email: '',
        responsibilityType: '',
        responsibilities: '',
        companyInfo: '',
        businessInfo: '',
        pastExperience: '',
        projectExperience: '',
        notes: '',
        contactDate: '',
        contactContent: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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
                    <div className="profile-writer">
                        <label className="writer-label">
                            작성자
                        </label>
                        <input
                            type="text"
                            placeholder="○부○ ○팀 담당 ○○○"
                            className="writer-input"
                        />
                    </div>
                </div>

                {/* 클라이언트 기업 정보 테이블 */}
                <div className="profile-section">
                    <h3 className="section-header">
                        ■ 클라이언트 기업 정보
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header table-header-category">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">법주처</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleInputChange}
                                    placeholder="제약기업"
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
                                    placeholder="○○○"
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
                                    placeholder="삼성제약 광고대행사"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    {/* 담당자 상세 정보 테이블 */}
                    <h3 className="section-header section-header-margin">
                        ■ 담당자 상세 정보
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header table-header-category">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">소속/부서</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="department"
                                    value={formData.department}
                                    onChange={handleInputChange}
                                    placeholder="BX 1팀"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">직책/이름</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
                                    placeholder="담당 홍길동"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">연락처</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="010-0000-0000"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">이메일</td>
                            <td className="table-cell-input">
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="123@cheil.com"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    {/* 담당 업무 섹션 */}
                    <h3 className="section-header section-header-margin">
                        ■ 담당 업무
                    </h3>

                    <table className="profile-table">
                        <tbody>
                        <tr>
                            <td className="table-header table-header-category">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">업무 스타일</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="responsibilityType"
                                    value={formData.responsibilityType}
                                    onChange={handleInputChange}
                                    placeholder="보수적, 지출적"
                                    className="profile-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">부가 정보</td>
                            <td className="table-cell-input">
                                <div className="additional-info">
                                    <div className="info-label">
                                        개별 특화정보
                                    </div>
                                    <textarea
                                        name="companyInfo"
                                        value={formData.companyInfo}
                                        onChange={handleInputChange}
                                        placeholder="성향, 취미, 개인적 성향"
                                        className="info-textarea"
                                    />
                                </div>
                                <div>
                                    <div className="info-label">
                                        부서 및 조직정보
                                    </div>
                                    <textarea
                                        name="businessInfo"
                                        value={formData.businessInfo}
                                        onChange={handleInputChange}
                                        placeholder="○○○전략부서, 기존 6대영업 기존"
                                        className="info-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 히스토리 섹션 */}
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
                            <td className="table-cell table-cell-label table-cell-top">우리와 관계성</td>
                            <td className="table-cell-input">
                  <textarea
                      name="pastExperience"
                      value={formData.pastExperience}
                      onChange={handleInputChange}
                      placeholder="• 지원원 담당자/부서는 누구인지, 언제부터 알았는지, 천번 담당 업무에 촛점 등"
                      className="profile-textarea textarea-large"
                  />
                            </td>
                        </tr>
                        </tbody>
                    </table>

                    {/* 프로젝트 경험 섹션 */}
                    <table className="profile-table section-table">
                        <tbody>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">프로젝트 경험</td>
                            <td className="table-cell-input">
                                <div className="project-badges">
                    <span className="project-badge badge-profile">
                      P/J Profile
                    </span>
                                    <span className="project-badge badge-creation">
                      P/J 작성
                    </span>
                                </div>
                                <div className="help-text help-text-gray">
                                    • 프로젝트 유형정 시, 프로젝트달력/가길룸 흐름사성
                                </div>
                                <div className="help-text help-text-gray">
                                    ▶ &lt;P/J Profile 및 작성산 이용을히이션 심신 활일 가능
                                </div>
                                <textarea
                                    name="projectExperience"
                                    value={formData.projectExperience}
                                    onChange={handleInputChange}
                                    className="profile-textarea textarea-medium"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">비고</td>
                            <td className="table-cell-input">
                  <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="profile-textarea textarea-medium"
                  />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 컨택 리포트 섹션 */}
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
                        <tr>
                            <td className="table-cell table-cell-label table-cell-top">
                                <input
                                    type="date"
                                    name="contactDate"
                                    value={formData.contactDate}
                                    onChange={handleInputChange}
                                    className="profile-date-input"
                                />
                                <div className="date-display">
                                    2025.07.23
                                </div>
                            </td>
                            <td className="table-cell-input">
                                <div className="help-text help-text-gray">
                                    • 제목 및 안건 : 원대성훈치 EV 신차 발표회 프로모션의 컨
                                </div>
                                <div className="help-text help-text-gray">
                                    • 회의 및 내용 :
                                </div>
                                <textarea
                                    name="contactContent"
                                    value={formData.contactContent}
                                    onChange={handleInputChange}
                                    placeholder="회의 내용을 입력하세요"
                                    className="profile-textarea textarea-xlarge"
                                />
                                <div className="help-text-note">
                                    * 다음 단계 2049 작성하다 더 복음
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