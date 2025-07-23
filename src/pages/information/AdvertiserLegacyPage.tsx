// pages/information/AdvertiserPage.tsx
import React, { useState } from 'react';
import '../../styles/FormPage.css';

interface AdvertiserInfo {
    id?: string;
    companyName: string;
    businessType: string;
    industry: string;
    website: string;
    establishedYear: string;
    employeeCount: string;
    annualRevenue: string;
    contactPerson: string;
    contactTitle: string;
    contactPhone: string;
    contactEmail: string;
    address: string;
    businessScope: string;
    previousProjects: string;
    budget: string;
    preferredPartnership: 'direct' | 'agency' | 'both';
    notes: string;
    registeredBy: string;
    department: string;
    businessRegistrationNumber: string;
    ceoName: string;
    foundingDate: string;
    mainProducts: string;
    targetMarket: string;
    marketingBudget: string;
    pastCollaborations: string;
    preferredEventType: string;
    decisionMaker: string;
    contractPreference: string;
}

const AdvertiserPage: React.FC = () => {
    const [formData, setFormData] = useState<AdvertiserInfo>({
        companyName: '',
        businessType: '',
        industry: '',
        website: '',
        establishedYear: '',
        employeeCount: '',
        annualRevenue: '',
        contactPerson: '',
        contactTitle: '',
        contactPhone: '',
        contactEmail: '',
        address: '',
        businessScope: '',
        previousProjects: '',
        budget: '',
        preferredPartnership: 'direct',
        notes: '',
        registeredBy: '',
        department: '',
        businessRegistrationNumber: '',
        ceoName: '',
        foundingDate: '',
        mainProducts: '',
        targetMarket: '',
        marketingBudget: '',
        pastCollaborations: '',
        preferredEventType: '',
        decisionMaker: '',
        contractPreference: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('정보 저장:', formData);
        // TODO: API 연동 후 실제 저장 로직 구현
    };

    return (
        <div className="bidding-page-wrapper">
            <div className="form-page">
                <div className="page-header">
                    <h1>🏢 광고주(담당자) 정보 수집</h1>
                    <p>새로운 광고주(담당자) 정보를 등록하고 관리합니다.</p>
                </div>

                <div className="registrant-info">
                    <div className="registrant-input-group">
                        <label htmlFor="registeredBy" className="required">등록자 이름</label>
                        <input
                            type="text"
                            id="registeredBy"
                            name="registeredBy"
                            value={formData.registeredBy}
                            onChange={handleInputChange}
                            required
                            placeholder="이름 입력"
                            className="registrant-input"
                        />
                    </div>
                    <div className="registrant-input-group">
                        <label htmlFor="department" className="required">부서</label>
                        <select
                            id="department"
                            name="department"
                            value={formData.department}
                            onChange={handleInputChange}
                            required
                            className="registrant-select"
                        >
                            <option value="" disabled>부서 선택</option>
                            <option value="A팀">A팀</option>
                            <option value="B팀">B팀</option>
                            <option value="C팀">C팀</option>
                            <option value="경영지원">경영지원</option>
                        </select>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="form-container">
                    <div className="form-section">
                        <h2>기업 기본 정보</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="companyName" className="required">회사명</label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    value={formData.companyName}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="회사명을 입력하세요"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="businessRegistrationNumber">사업자등록번호</label>
                                <input
                                    type="text"
                                    id="businessRegistrationNumber"
                                    name="businessRegistrationNumber"
                                    value={formData.businessRegistrationNumber}
                                    onChange={handleInputChange}
                                    placeholder="000-00-00000"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="ceoName">대표자명</label>
                                <input
                                    type="text"
                                    id="ceoName"
                                    name="ceoName"
                                    value={formData.ceoName}
                                    onChange={handleInputChange}
                                    placeholder="대표자 이름"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="businessType">사업자 구분</label>
                                <select
                                    id="businessType"
                                    name="businessType"
                                    value={formData.businessType}
                                    onChange={handleInputChange}
                                >
                                    <option value="">선택하세요</option>
                                    <option value="법인사업자">법인사업자</option>
                                    <option value="개인사업자">개인사업자</option>
                                    <option value="외국법인">외국법인</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="industry">업종</label>
                                <input
                                    type="text"
                                    id="industry"
                                    name="industry"
                                    value={formData.industry}
                                    onChange={handleInputChange}
                                    placeholder="예: IT서비스, 제조업, 유통업"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="foundingDate">설립일</label>
                                <input
                                    type="date"
                                    id="foundingDate"
                                    name="foundingDate"
                                    value={formData.foundingDate}
                                    onChange={handleInputChange}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="employeeCount">직원 수</label>
                                <input
                                    type="text"
                                    id="employeeCount"
                                    name="employeeCount"
                                    value={formData.employeeCount}
                                    onChange={handleInputChange}
                                    placeholder="예: 50명, 100-500명"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="annualRevenue">연매출</label>
                                <input
                                    type="text"
                                    id="annualRevenue"
                                    name="annualRevenue"
                                    value={formData.annualRevenue}
                                    onChange={handleInputChange}
                                    placeholder="예: 100억원"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="website">웹사이트</label>
                                <input
                                    type="url"
                                    id="website"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    placeholder="https://www.company.com"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="address">주소</label>
                            <input
                                type="text"
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="회사 주소를 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>광고주(담당자) 연락처 정보</h2>
                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="contactPerson" className="required">담당자명</label>
                                <input
                                    type="text"
                                    id="contactPerson"
                                    name="contactPerson"
                                    value={formData.contactPerson}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="담당자 이름"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactTitle">담당자 직책</label>
                                <input
                                    type="text"
                                    id="contactTitle"
                                    name="contactTitle"
                                    value={formData.contactTitle}
                                    onChange={handleInputChange}
                                    placeholder="예: 마케팅 팀장"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactPhone" className="required">연락처</label>
                                <input
                                    type="tel"
                                    id="contactPhone"
                                    name="contactPhone"
                                    value={formData.contactPhone}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="010-0000-0000"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="contactEmail" className="required">이메일</label>
                                <input
                                    type="email"
                                    id="contactEmail"
                                    name="contactEmail"
                                    value={formData.contactEmail}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="contact@company.com"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="decisionMaker">의사결정권자</label>
                                <input
                                    type="text"
                                    id="decisionMaker"
                                    name="decisionMaker"
                                    value={formData.decisionMaker}
                                    onChange={handleInputChange}
                                    placeholder="최종 의사결정권자 정보"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>사업 정보</h2>
                        <div className="form-group">
                            <label htmlFor="businessScope">사업 범위</label>
                            <textarea
                                id="businessScope"
                                name="businessScope"
                                value={formData.businessScope}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="주요 사업 영역과 서비스를 설명하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="mainProducts">주요 제품/서비스</label>
                            <textarea
                                id="mainProducts"
                                name="mainProducts"
                                value={formData.mainProducts}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="주요 제품이나 서비스를 상세히 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="targetMarket">타겟 시장</label>
                            <textarea
                                id="targetMarket"
                                name="targetMarket"
                                value={formData.targetMarket}
                                onChange={handleInputChange}
                                rows={3}
                                placeholder="주요 고객층과 타겟 시장을 설명하세요"
                            />
                        </div>

                        <div className="form-grid">
                            <div className="form-group">
                                <label htmlFor="marketingBudget">마케팅 예산 [단위:억]</label>
                                <input
                                    type="text"
                                    id="marketingBudget"
                                    name="marketingBudget"
                                    value={formData.marketingBudget}
                                    onChange={handleInputChange}
                                    placeholder="예: 5.00"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="preferredEventType">선호 행사 유형</label>
                                <input
                                    type="text"
                                    id="preferredEventType"
                                    name="preferredEventType"
                                    value={formData.preferredEventType}
                                    onChange={handleInputChange}
                                    placeholder="예: 전시회, 컨퍼런스, 프로모션"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="preferredPartnership">선호하는 협력 방식</label>
                                <select
                                    id="preferredPartnership"
                                    name="preferredPartnership"
                                    value={formData.preferredPartnership}
                                    onChange={handleInputChange}
                                >
                                    <option value="direct">직접 계약</option>
                                    <option value="agency">에이전시 통해</option>
                                    <option value="both">상관없음</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="contractPreference">계약 선호사항</label>
                                <input
                                    type="text"
                                    id="contractPreference"
                                    name="contractPreference"
                                    value={formData.contractPreference}
                                    onChange={handleInputChange}
                                    placeholder="계약 관련 특별 요구사항"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="form-section">
                        <h2>과거 이력</h2>
                        <div className="form-group">
                            <label htmlFor="pastCollaborations">과거 협업 이력</label>
                            <textarea
                                id="pastCollaborations"
                                name="pastCollaborations"
                                value={formData.pastCollaborations}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="과거 진행했던 주요 프로젝트들과 협업 업체들을 설명하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="previousProjects">주요 실행 프로젝트</label>
                            <textarea
                                id="previousProjects"
                                name="previousProjects"
                                value={formData.previousProjects}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="최근 실행한 마케팅/이벤트 프로젝트들을 기록하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="notes">추가 메모</label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                rows={4}
                                placeholder="추가 정보나 특이사항을 입력하세요"
                            />
                        </div>
                    </div>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary">
                            취소
                        </button>
                        <button type="submit" className="btn-primary">
                            저장
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdvertiserPage;