// src/components/company/CompanyForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { companyService } from '@/api/services/companyService';
import { companyService } from '../../api';  // ✅ 수정
// import type { EmployeeCreate } from '../../api/types';  // ✅ 추가

import '../../styles/CompanyForm.css';

interface FormData {
    company_name: string;
    business_number: string;
    industry: string;
    ceo_name: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    contact_person: string;
    contact_department: string;
    contact_position: string;
    contact_phone: string;
    contact_email: string;
    established_date: string;
    capital: string;
    employee_count: string;
    annual_revenue: string;
    business_registration_date: string;
    tax_office: string;
    business_type: string;
    business_category: string;
    memo: string;
}

const CompanyForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        company_name: '',
        business_number: '',
        industry: '',
        ceo_name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        contact_person: '',
        contact_department: '',
        contact_position: '',
        contact_phone: '',
        contact_email: '',
        established_date: '',
        capital: '',
        employee_count: '',
        annual_revenue: '',
        business_registration_date: '',
        tax_office: '',
        business_type: '',
        business_category: '',
        memo: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({});

    // 업종 및 사업 분류 옵션들
    const industryOptions = [
        '제조업', '건설업', '도매및소매업', '정보통신업', '금융및보험업',
        '부동산업', '전문과학기술서비스업', '교육서비스업', '보건및사회복지사업',
        '예술스포츠여가서비스업', '숙박및음식점업', '운수및창고업', '공공행정',
        '농업임업어업', '광업', '전기가스증기', '수도하수폐기물', '기타서비스업'
    ];

    const businessTypes = [
        '법인사업자', '개인사업자', '외국계법인', '비영리법인', '협동조합',
        '사회적기업', '벤처기업', '중소기업', '대기업', '공기업'
    ];

    useEffect(() => {
        if (isEdit && id) {
            loadCompany();
        }
    }, [isEdit, id]);

    const loadCompany = async (): Promise<void> => {
        try {
            setLoading(true);
            setError('');

            const company = await companyService.getCompany(Number(id));
            setFormData({
                company_name: company.company_name,
                business_number: company.business_number || '',
                industry: company.industry || '',
                ceo_name: company.ceo_name || '',
                address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                website: company.website || '',
                contact_person: company.contact_person || '',
                contact_department: company.contact_department || '',
                contact_position: company.contact_position || '',
                contact_phone: company.contact_phone || '',
                contact_email: company.contact_email || '',
                established_date: company.established_date || '',
                capital: company.capital?.toString() || '',
                employee_count: company.employee_count?.toString() || '',
                annual_revenue: company.annual_revenue?.toString() || '',
                business_registration_date: company.business_registration_date || '',
                tax_office: company.tax_office || '',
                business_type: company.business_type || '',
                business_category: company.business_category || '',
                memo: company.memo || ''
            });
        } catch (err: any) {
            setError('업체 정보를 불러오는데 실패했습니다: ' + (err.response?.data?.detail || err.message));
            console.error('Company loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<FormData> = {};

        // 필수 필드 검증
        if (!formData.company_name.trim()) {
            errors.company_name = '업체명은 필수 입력 항목입니다.';
        }

        // 사업자번호 형식 검증 (선택사항이지만 입력된 경우)
        if (formData.business_number &&
            !/^\d{10}$/.test(formData.business_number)) {
            errors.business_number = '사업자번호는 123-45-67890 형식으로 입력하세요.';
        }

        // 이메일 형식 검증
        const emailFields = ['email', 'contact_email'];
        emailFields.forEach(field => {
            const value = formData[field as keyof FormData];
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors[field as keyof FormData] = '올바른 이메일 형식을 입력하세요.';
            }
        });

        // 전화번호 형식 검증
        const phoneFields = ['phone', 'contact_phone'];
        phoneFields.forEach(field => {
            const value = formData[field as keyof FormData];
            if (value && !/^(\d{2,3}-\d{3,4}-\d{4})|(\d{10,11})$/.test(value.replace(/\s/g, ''))) {
                errors[field as keyof FormData] = '전화번호는 02-1234-5678 또는 010-1234-5678 형식으로 입력하세요.';
            }
        });

        // 웹사이트 URL 형식 검증
        if (formData.website && !/^https?:\/\/.+\..+/.test(formData.website)) {
            errors.website = '웹사이트는 http:// 또는 https://로 시작하는 URL을 입력하세요.';
        }

        // 숫자 필드 검증
        const numberFields = ['capital', 'employee_count', 'annual_revenue'];
        numberFields.forEach(field => {
            const value = formData[field as keyof FormData];
            if (value && (isNaN(Number(value)) || Number(value) < 0)) {
                errors[field as keyof FormData] = '올바른 숫자를 입력하세요.';
            }
        });

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            // 빈 문자열을 undefined로 변환하여 깔끔한 데이터 생성
            const submitData: any = {
                company_name: formData.company_name.trim(),
                business_number: formData.business_number?.trim() || undefined,
                industry: formData.industry?.trim() || undefined,
                ceo_name: formData.ceo_name?.trim() || undefined,
                address: formData.address?.trim() || undefined,
                phone: formData.phone?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                website: formData.website?.trim() || undefined,
                contact_person: formData.contact_person?.trim() || undefined,
                contact_department: formData.contact_department?.trim() || undefined,
                contact_position: formData.contact_position?.trim() || undefined,
                contact_phone: formData.contact_phone?.trim() || undefined,
                contact_email: formData.contact_email?.trim() || undefined,
                established_date: formData.established_date || undefined,
                capital: formData.capital ? Number(formData.capital) : undefined,
                employee_count: formData.employee_count ? Number(formData.employee_count) : undefined,
                annual_revenue: formData.annual_revenue ? Number(formData.annual_revenue) : undefined,
                business_registration_date: formData.business_registration_date || undefined,
                tax_office: formData.tax_office?.trim() || undefined,
                business_type: formData.business_type?.trim() || undefined,
                business_category: formData.business_category?.trim() || undefined,
                memo: formData.memo?.trim() || undefined
            };

            if (isEdit && id) {
                await companyService.updateCompany(Number(id), submitData);
                alert('업체 정보가 성공적으로 수정되었습니다.');
            } else {
                await companyService.createCompany(submitData);
                alert('새 업체가 성공적으로 등록되었습니다.');
            }

            navigate('/company');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || '업체 정보 저장에 실패했습니다.';
            setError(errorMessage);
            console.error('Company save error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 입력 중 해당 필드의 에러 메시지 제거
        if (validationErrors[name as keyof FormData]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let value = e.target.value.replace(/[^0-9]/g, '');

        if (value.length >= 3) {
            value = value.slice(0, 3) + '-' + value.slice(3);
        }
        if (value.length >= 6) {
            value = value.slice(0, 6) + '-' + value.slice(6, 11);
        }

        setFormData(prev => ({
            ...prev,
            business_number: value
        }));

        if (validationErrors.business_number) {
            setValidationErrors(prev => ({
                ...prev,
                business_number: undefined
            }));
        }
    };

    const handlePhoneChange = (fieldName: 'phone' | 'contact_phone') => (e: React.ChangeEvent<HTMLInputElement>): void => {
        let value = e.target.value.replace(/[^0-9]/g, '');

        // 전화번호 자동 포맷팅
        if (value.startsWith('02')) {
            if (value.length >= 2) value = value.slice(0, 2) + '-' + value.slice(2);
            if (value.length >= 7) value = value.slice(0, 6) + '-' + value.slice(6, 10);
        } else if (value.startsWith('010') || value.startsWith('011') || value.startsWith('016') ||
            value.startsWith('017') || value.startsWith('018') || value.startsWith('019')) {
            if (value.length >= 3) value = value.slice(0, 3) + '-' + value.slice(3);
            if (value.length >= 8) value = value.slice(0, 8) + '-' + value.slice(8, 12);
        } else {
            if (value.length >= 3) value = value.slice(0, 3) + '-' + value.slice(3);
            if (value.length >= 7) {
                if (value.length <= 10) {
                    value = value.slice(0, 7) + '-' + value.slice(7);
                } else {
                    value = value.slice(0, 8) + '-' + value.slice(8, 12);
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        if (validationErrors[fieldName]) {
            setValidationErrors(prev => ({
                ...prev,
                [fieldName]: undefined
            }));
        }
    };

    const handleNumberChange = (fieldName: 'capital' | 'employee_count' | 'annual_revenue') => (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData(prev => ({
            ...prev,
            [fieldName]: value
        }));

        if (validationErrors[fieldName]) {
            setValidationErrors(prev => ({
                ...prev,
                [fieldName]: undefined
            }));
        }
    };

    const formatNumber = (value: string): string => {
        if (!value) return '';
        return Number(value).toLocaleString('ko-KR');
    };

    const handleReset = (): void => {
        if (window.confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
            if (isEdit && id) {
                loadCompany();
            } else {
                setFormData({
                    company_name: '',
                    business_number: '',
                    industry: '',
                    ceo_name: '',
                    address: '',
                    phone: '',
                    email: '',
                    website: '',
                    contact_person: '',
                    contact_department: '',
                    contact_position: '',
                    contact_phone: '',
                    contact_email: '',
                    established_date: '',
                    capital: '',
                    employee_count: '',
                    annual_revenue: '',
                    business_registration_date: '',
                    tax_office: '',
                    business_type: '',
                    business_category: '',
                    memo: ''
                });
            }
            setValidationErrors({});
            setError('');
        }
    };

    // 로딩 중인 경우 (수정 모드에서만)
    if (loading && isEdit) {
        return (
            <div className="company-form">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>업체 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="company-form">
            <div className="page-header">
                <h1>{isEdit ? '업체 정보 수정' : '새 업체 등록'}</h1>
                <div className="breadcrumb">
                    <span onClick={() => navigate('/company')} className="breadcrumb-link">
                        업체 관리
                    </span>
                    <span className="breadcrumb-separator"> &gt; </span>
                    <span className="breadcrumb-current">
                        {isEdit ? '정보 수정' : '새 업체 등록'}
                    </span>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <div className="error-content">
                        <strong>오류:</strong> {error}
                    </div>
                </div>
            )}

            <form onSubmit={handleSubmit} className="form" noValidate>
                {/* 기본 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">기본 정보</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="company_name" className="required">
                                업체명 *
                            </label>
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="(주)제일기획"
                                maxLength={255}
                                className={validationErrors.company_name ? 'error' : ''}
                            />
                            {validationErrors.company_name && (
                                <div className="field-error">{validationErrors.company_name}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="business_number">사업자등록번호</label>
                            <input
                                type="text"
                                id="business_number"
                                name="business_number"
                                value={formData.business_number}
                                onChange={handleBusinessNumberChange}
                                disabled={loading}
                                placeholder="123-45-67890"
                                maxLength={12}
                                className={validationErrors.business_number ? 'error' : ''}
                            />
                            {validationErrors.business_number && (
                                <div className="field-error">{validationErrors.business_number}</div>
                            )}
                            <small className="field-help">
                                하이픈(-)이 자동으로 추가됩니다
                            </small>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="industry">업종/분야</label>
                            <select
                                id="industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">업종을 선택하세요</option>
                                {industryOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="business_type">사업자구분</label>
                            <select
                                id="business_type"
                                name="business_type"
                                value={formData.business_type}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">사업자 구분을 선택하세요</option>
                                {businessTypes.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="ceo_name">대표자명</label>
                            <input
                                type="text"
                                id="ceo_name"
                                name="ceo_name"
                                value={formData.ceo_name}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="홍길동"
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="established_date">설립일</label>
                            <input
                                type="date"
                                id="established_date"
                                name="established_date"
                                value={formData.established_date}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    </div>
                </div>

                {/* 연락처 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">연락처 정보</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone">대표전화</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handlePhoneChange('phone')}
                                disabled={loading}
                                placeholder="02-1234-5678"
                                maxLength={13}
                                className={validationErrors.phone ? 'error' : ''}
                            />
                            {validationErrors.phone && (
                                <div className="field-error">{validationErrors.phone}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">대표이메일</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="contact@company.com"
                                maxLength={255}
                                className={validationErrors.email ? 'error' : ''}
                            />
                            {validationErrors.email && (
                                <div className="field-error">{validationErrors.email}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="website">홈페이지</label>
                        <input
                            type="url"
                            id="website"
                            name="website"
                            value={formData.website}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="https://www.company.com"
                            maxLength={255}
                            className={validationErrors.website ? 'error' : ''}
                        />
                        {validationErrors.website && (
                            <div className="field-error">{validationErrors.website}</div>
                        )}
                    </div>
                </div>

                {/* 담당자 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">담당자 정보</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="contact_person">담당자명</label>
                            <input
                                type="text"
                                id="contact_person"
                                name="contact_person"
                                value={formData.contact_person}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="홍길동"
                                maxLength={100}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact_department">소속/부서</label>
                            <input
                                type="text"
                                id="contact_department"
                                name="contact_department"
                                value={formData.contact_department}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="영업팀"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="contact_position">직책</label>
                            <input
                                type="text"
                                id="contact_position"
                                name="contact_position"
                                value={formData.contact_position}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="팀장"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="contact_phone">담당자 연락처</label>
                            <input
                                type="tel"
                                id="contact_phone"
                                name="contact_phone"
                                value={formData.contact_phone}
                                onChange={handlePhoneChange('contact_phone')}
                                disabled={loading}
                                placeholder="010-1234-5678"
                                maxLength={13}
                                className={validationErrors.contact_phone ? 'error' : ''}
                            />
                            {validationErrors.contact_phone && (
                                <div className="field-error">{validationErrors.contact_phone}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="contact_email">담당자 이메일</label>
                            <input
                                type="email"
                                id="contact_email"
                                name="contact_email"
                                value={formData.contact_email}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="manager@company.com"
                                maxLength={255}
                                className={validationErrors.contact_email ? 'error' : ''}
                            />
                            {validationErrors.contact_email && (
                                <div className="field-error">{validationErrors.contact_email}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 회사 규모 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">회사 규모 정보</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="capital">자본금 (원)</label>
                            <input
                                type="text"
                                id="capital"
                                name="capital"
                                value={formatNumber(formData.capital)}
                                onChange={handleNumberChange('capital')}
                                disabled={loading}
                                placeholder="0"
                                className={validationErrors.capital ? 'error' : ''}
                            />
                            {validationErrors.capital && (
                                <div className="field-error">{validationErrors.capital}</div>
                            )}
                            {formData.capital && (
                                <small className="field-help">
                                    {formatNumber(formData.capital)}원
                                </small>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="employee_count">직원 수 (명)</label>
                            <input
                                type="text"
                                id="employee_count"
                                name="employee_count"
                                value={formatNumber(formData.employee_count)}
                                onChange={handleNumberChange('employee_count')}
                                disabled={loading}
                                placeholder="0"
                                className={validationErrors.employee_count ? 'error' : ''}
                            />
                            {validationErrors.employee_count && (
                                <div className="field-error">{validationErrors.employee_count}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="annual_revenue">연매출 (원)</label>
                            <input
                                type="text"
                                id="annual_revenue"
                                name="annual_revenue"
                                value={formatNumber(formData.annual_revenue)}
                                onChange={handleNumberChange('annual_revenue')}
                                disabled={loading}
                                placeholder="0"
                                className={validationErrors.annual_revenue ? 'error' : ''}
                            />
                            {validationErrors.annual_revenue && (
                                <div className="field-error">{validationErrors.annual_revenue}</div>
                            )}
                            {formData.annual_revenue && (
                                <small className="field-help">
                                    {formatNumber(formData.annual_revenue)}원
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* 주소 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">주소 정보</h3>

                    <div className="form-group full-width">
                        <label htmlFor="address">회사 주소</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="상세 주소를 입력하세요&#10;예: 서울특별시 강남구 테헤란로 123, 456빌딩 7층"
                            rows={4}
                            disabled={loading}
                            maxLength={500}
                        />
                        <small className="field-help">
                            {formData.address.length}/500 글자
                        </small>
                    </div>
                </div>

                {/* 기타 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">기타 정보</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="business_registration_date">사업자등록일</label>
                            <input
                                type="date"
                                id="business_registration_date"
                                name="business_registration_date"
                                value={formData.business_registration_date}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="tax_office">관할세무서</label>
                            <input
                                type="text"
                                id="tax_office"
                                name="tax_office"
                                value={formData.tax_office}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="강남세무서"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="business_category">업태/종목</label>
                        <input
                            type="text"
                            id="business_category"
                            name="business_category"
                            value={formData.business_category}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="도매업, 소매업, 제조업 등"
                            maxLength={200}
                        />
                        <small className="field-help">
                            사업자등록증의 업태/종목을 입력하세요
                        </small>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="memo">메모</label>
                        <textarea
                            id="memo"
                            name="memo"
                            value={formData.memo}
                            onChange={handleChange}
                            placeholder="업체에 대한 추가 정보나 특이사항을 입력하세요"
                            rows={4}
                            disabled={loading}
                            maxLength={1000}
                        />
                        <small className="field-help">
                            {formData.memo.length}/1000 글자
                        </small>
                    </div>
                </div>

                {/* 업체 정보 요약 */}
                {(formData.company_name || formData.business_number || formData.ceo_name) && (
                    <div className="form-section">
                        <h3 className="section-title">업체 정보 요약</h3>
                        <div className="company-summary">
                            <div className="summary-grid">
                                {formData.company_name && (
                                    <div className="summary-item">
                                        <span className="label">업체명:</span>
                                        <span className="value">{formData.company_name}</span>
                                    </div>
                                )}
                                {formData.business_number && (
                                    <div className="summary-item">
                                        <span className="label">사업자번호:</span>
                                        <span className="value">{formData.business_number}</span>
                                    </div>
                                )}
                                {formData.ceo_name && (
                                    <div className="summary-item">
                                        <span className="label">대표자:</span>
                                        <span className="value">{formData.ceo_name}</span>
                                    </div>
                                )}
                                {formData.industry && (
                                    <div className="summary-item">
                                        <span className="label">업종:</span>
                                        <span className="value">{formData.industry}</span>
                                    </div>
                                )}
                                {formData.employee_count && (
                                    <div className="summary-item">
                                        <span className="label">직원 수:</span>
                                        <span className="value">{formatNumber(formData.employee_count)}명</span>
                                    </div>
                                )}
                                {formData.capital && (
                                    <div className="summary-item">
                                        <span className="label">자본금:</span>
                                        <span className="value">{formatNumber(formData.capital)}원</span>
                                    </div>
                                )}
                                {formData.annual_revenue && (
                                    <div className="summary-item">
                                        <span className="label">연매출:</span>
                                        <span className="value">{formatNumber(formData.annual_revenue)}원</span>
                                    </div>
                                )}
                                {formData.established_date && (
                                    <div className="summary-item">
                                        <span className="label">설립일:</span>
                                        <span className="value">{new Date(formData.established_date).toLocaleDateString('ko-KR')}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 폼 액션 버튼 */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/company')}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        취소
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="btn btn-outline"
                        disabled={loading}
                    >
                        초기화
                    </button>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading || !formData.company_name.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                {isEdit ? '수정 중...' : '등록 중...'}
                            </>
                        ) : (
                            isEdit ? '수정 완료' : '업체 등록'
                        )}
                    </button>
                </div>
            </form>

            {/* 개발 정보 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && (
                <details className="dev-info">
                    <summary>개발 정보</summary>
                    <pre>{JSON.stringify({
                        formData: {
                            ...formData,
                            capital: formData.capital ? Number(formData.capital) : null,
                            employee_count: formData.employee_count ? Number(formData.employee_count) : null,
                            annual_revenue: formData.annual_revenue ? Number(formData.annual_revenue) : null
                        },
                        validationErrors,
                        isEdit,
                        loading
                    }, null, 2)}</pre>
                </details>
            )}
        </div>
    );
};

export default CompanyForm;