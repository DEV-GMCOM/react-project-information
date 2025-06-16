// src/components/company/CompanyForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService, Company, CompanyCreate } from '../../services/api';
import '../../styles/CompanyForm.css';

const CompanyForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<CompanyCreate>({
        company_name: '',
        business_number: '',
        industry: '',
        address: '',
        phone: '',
        email: '',
        website: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<Partial<CompanyCreate>>({});

    useEffect(() => {
        if (isEdit && id) {
            loadCompany();
        }
    }, [isEdit, id]);

    const loadCompany = async (): Promise<void> => {
        try {
            setLoading(true);
            setError('');

            const company = await apiService.getCompany(Number(id));
            setFormData({
                company_name: company.company_name,
                business_number: company.business_number || '',
                industry: company.industry || '',
                address: company.address || '',
                phone: company.phone || '',
                email: company.email || '',
                website: company.website || ''
            });
        } catch (err: any) {
            setError('업체 정보를 불러오는데 실패했습니다: ' + (err.response?.data?.detail || err.message));
            console.error('Company loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<CompanyCreate> = {};

        // 필수 필드 검증
        if (!formData.company_name.trim()) {
            errors.company_name = '업체명은 필수 입력 항목입니다.';
        }

        // 사업자번호 형식 검증 (선택사항이지만 입력된 경우)
        if (formData.business_number &&
            !/^\d{3}-\d{2}-\d{5}$/.test(formData.business_number)) {
            errors.business_number = '사업자번호는 123-45-67890 형식으로 입력하세요.';
        }

        // 이메일 형식 검증 (선택사항이지만 입력된 경우)
        if (formData.email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = '올바른 이메일 형식을 입력하세요.';
        }

        // 전화번호 형식 검증 (선택사항이지만 입력된 경우)
        if (formData.phone &&
            !/^(\d{2,3}-\d{3,4}-\d{4})|(\d{10,11})$/.test(formData.phone.replace(/\s/g, ''))) {
            errors.phone = '전화번호는 02-1234-5678 또는 010-1234-5678 형식으로 입력하세요.';
        }

        // 웹사이트 URL 형식 검증 (선택사항이지만 입력된 경우)
        if (formData.website &&
            !/^https?:\/\/.+\..+/.test(formData.website)) {
            errors.website = '웹사이트는 http:// 또는 https://로 시작하는 URL을 입력하세요.';
        }

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
            const submitData: CompanyCreate = {
                company_name: formData.company_name.trim(),
                business_number: formData.business_number?.trim() || undefined,
                industry: formData.industry?.trim() || undefined,
                address: formData.address?.trim() || undefined,
                phone: formData.phone?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                website: formData.website?.trim() || undefined
            };

            if (isEdit && id) {
                // 수정 요청
                await apiService.updateCompany(Number(id), submitData);
                alert('업체 정보가 성공적으로 수정되었습니다.');
            } else {
                // 신규 등록 요청
                await apiService.createCompany(submitData);
                alert('새 업체가 성공적으로 등록되었습니다.');
            }

            // 성공 시 목록 페이지로 이동
            navigate('/company');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || '업체 정보 저장에 실패했습니다.';
            setError(errorMessage);
            console.error('Company save error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // 입력 중 해당 필드의 에러 메시지 제거
        if (validationErrors[name as keyof CompanyCreate]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출

        // 자동으로 하이픈 추가 (123-45-67890 형식)
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

        // 에러 메시지 제거
        if (validationErrors.business_number) {
            setValidationErrors(prev => ({
                ...prev,
                business_number: undefined
            }));
        }
    };

    const handleReset = (): void => {
        if (window.confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
            if (isEdit && id) {
                loadCompany(); // 수정 모드에서는 원래 데이터로 복원
            } else {
                setFormData({
                    company_name: '',
                    business_number: '',
                    industry: '',
                    address: '',
                    phone: '',
                    email: '',
                    website: ''
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
                                placeholder="업체명을 입력하세요"
                                maxLength={255}
                                className={validationErrors.company_name ? 'error' : ''}
                            />
                            {validationErrors.company_name && (
                                <div className="field-error">{validationErrors.company_name}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="business_number">사업자번호</label>
                            <input
                                type="text"
                                id="business_number"
                                name="business_number"
                                value={formData.business_number || ''}
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
                            <label htmlFor="industry">업종</label>
                            <input
                                type="text"
                                id="industry"
                                name="industry"
                                value={formData.industry || ''}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="예: IT, 제조업, 서비스업, 건설업"
                                maxLength={100}
                            />
                            <small className="field-help">
                                주요 사업 분야를 입력하세요
                            </small>
                        </div>
                    </div>
                </div>

                {/* 연락처 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">연락처 정보</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="phone">전화번호</label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone || ''}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="02-1234-5678 또는 010-1234-5678"
                                maxLength={20}
                                className={validationErrors.phone ? 'error' : ''}
                            />
                            {validationErrors.phone && (
                                <div className="field-error">{validationErrors.phone}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">이메일</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email || ''}
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

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="website">웹사이트</label>
                            <input
                                type="url"
                                id="website"
                                name="website"
                                value={formData.website || ''}
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
                </div>

                {/* 주소 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">주소 정보</h3>

                    <div className="form-group full-width">
                        <label htmlFor="address">주소</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleChange}
                            placeholder="상세 주소를 입력하세요&#10;예: 서울특별시 강남구 테헤란로 123, 456빌딩 7층"
                            rows={4}
                            disabled={loading}
                            maxLength={500}
                        />
                        <small className="field-help">
                            {(formData.address || '').length}/500 글자
                        </small>
                    </div>
                </div>

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
                    <pre>{JSON.stringify({ formData, validationErrors, isEdit, loading }, null, 2)}</pre>
                </details>
            )}
        </div>
    );
};

export default CompanyForm;