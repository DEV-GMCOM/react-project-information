// src/components/company/CompanyRegistForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { companyService } from '../../api';
import '../../styles/CompanyRegistForm.css';

interface FormData {
    company_name: string;          // 업체명
    industry: string;              // 소속/부서 (업종)
    representative: string;        // 담당자
    contact_info: string;         // 컨택처 (전화+이메일 통합)
    basic_info: string;           // 담당자 기본정보 (부서, 직급, 특이사항)
    history: string;              // 히스토리 (지업경과의 관계성, P/J 진행우무 등)
    contact_report: string;       // 컨택 리포트 (미팅안건, 미팅날짜, 주요내용 등)
    memo: string;                 // 발주처 기본정보 (메모)
}

const CompanyRegistForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        company_name: '',
        industry: '',
        representative: '',
        contact_info: '',
        basic_info: '',
        history: '',
        contact_report: '',
        memo: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({});

    // 업종 옵션들 (실제 한국 업종 기준)
    const industryOptions = [
        'CX 1팀', 'CX 2팀', 'CX 3팀', 'CX 4팀', 'CX 5팀',
        '제조업', '건설업', '도매및소매업', '정보통신업',
        '금융및보험업', '부동산업', '전문과학기술서비스업',
        '교육서비스업', '보건및사회복지사업', '숙박및음식점업',
        '운수및창고업', '예술스포츠여가서비스업', '기타서비스업'
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
                company_name: company.company_name || '',
                industry: company.industry || '',
                representative: company.contact_person || company.ceo_name || '',
                contact_info: [company.phone, company.email].filter(Boolean).join(' / '),
                basic_info: [
                    company.contact_department,
                    company.contact_position,
                    company.business_type
                ].filter(Boolean).join(' / '),
                history: company.memo || '',
                contact_report: '',
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

        if (!formData.representative.trim()) {
            errors.representative = '담당자는 필수 입력 항목입니다.';
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

            // 컨택처에서 전화번호와 이메일 분리
            const contactParts = formData.contact_info.split('/').map(part => part.trim());
            const phone = contactParts.find(part => /[\d-]/.test(part)) || '';
            const email = contactParts.find(part => /@/.test(part)) || '';

            // 기본정보에서 부서와 직책 분리
            const basicParts = formData.basic_info.split('/').map(part => part.trim());
            const department = basicParts[0] || '';
            const position = basicParts[1] || '';

            const submitData = {
                company_name: formData.company_name.trim(),
                industry: formData.industry || undefined,
                contact_person: formData.representative.trim(),
                phone: phone || undefined,
                email: email || undefined,
                contact_department: department || undefined,
                contact_position: position || undefined,
                memo: [
                    formData.basic_info && `담당자 정보: ${formData.basic_info}`,
                    formData.history && `히스토리: ${formData.history}`,
                    formData.contact_report && `컨택 리포트: ${formData.contact_report}`,
                    formData.memo && `메모: ${formData.memo}`
                ].filter(Boolean).join('\n\n')
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

    const handleReset = (): void => {
        if (window.confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
            if (isEdit && id) {
                loadCompany();
            } else {
                setFormData({
                    company_name: '',
                    industry: '',
                    representative: '',
                    contact_info: '',
                    basic_info: '',
                    history: '',
                    contact_report: '',
                    memo: ''
                });
            }
            setValidationErrors({});
            setError('');
        }
    };

    // 로딩 중인 경우
    if (loading && isEdit) {
        return (
            <div className="company-regist-form">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>업체 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="company-regist-form">
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

            <form onSubmit={handleSubmit} className="regist-form" noValidate>
                <div className="form-table">
                    <div className="form-row">
                        <div className="form-label required">
                            <label htmlFor="company_name">발주처</label>
                        </div>
                        <div className="form-content">
                            <input
                                type="text"
                                id="company_name"
                                name="company_name"
                                value={formData.company_name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="제일기획"
                                maxLength={255}
                                className={validationErrors.company_name ? 'error' : ''}
                            />
                            {validationErrors.company_name && (
                                <div className="field-error">{validationErrors.company_name}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="industry">소속 / 부서</label>
                        </div>
                        <div className="form-content">
                            <select
                                id="industry"
                                name="industry"
                                value={formData.industry}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">부서를 선택하세요</option>
                                {industryOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label required">
                            <label htmlFor="representative">담당자</label>
                        </div>
                        <div className="form-content">
                            <input
                                type="text"
                                id="representative"
                                name="representative"
                                value={formData.representative}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="홍길동 팀장"
                                maxLength={100}
                                className={validationErrors.representative ? 'error' : ''}
                            />
                            {validationErrors.representative && (
                                <div className="field-error">{validationErrors.representative}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="contact_info">컨택처</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="contact_info"
                                name="contact_info"
                                value={formData.contact_info}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="• 010-0000-0000&#10;• 123@cheil.com&#10;• 담당업무&#10;• 조직관계(상하)&#10;• 생일 & 특이사항"
                                rows={4}
                                maxLength={500}
                            />
                            <div className="field-help">
                                전화번호, 이메일, 담당업무, 조직관계, 생일 등을 입력하세요
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="basic_info">담당자 기본정보</label>
                        </div>
                        <div className="form-content">
                            <input
                                type="text"
                                id="basic_info"
                                name="basic_info"
                                value={formData.basic_info}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="부서명 / 직급 / 특이사항"
                                maxLength={200}
                            />
                            <div className="field-help">
                                부서, 직급, 특이사항을 '/' 로 구분하여 입력하세요
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="history">히스토리</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="history"
                                name="history"
                                value={formData.history}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="• P/J 진행우무&#10;▶ 진행경험 있을 시 <P/J 착수서> 문서와 연결&#10;-OT자료, 지엽컨 담당자, PT수주 및 실행여부 등"
                                rows={4}
                                maxLength={1000}
                            />
                            <div className="field-help">
                                지업경과의 관계성, 프로젝트 진행 이력, OT자료, 지엽컨 담당자, PT수주 실행여부 등
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="contact_report">컨택 리포트<br/>(회의록)</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="contact_report"
                                name="contact_report"
                                value={formData.contact_report}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="• 미팅안건(제목)&#10;• 미팅날짜 (YY/MM/DD)&#10;• 주요 내용 (P/J, 이슈사항 등)&#10;&#10;*다수 미팅에 따른 모든 히스토리 기재, 지속적 업데이트&#10;*날짜별, 안건별 Sorting 기능"
                                rows={6}
                                maxLength={2000}
                            />
                            <div className="field-help">
                                미팅안건, 날짜, 주요내용을 시간순으로 기록하세요. 지속적으로 업데이트됩니다.
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="memo">발주처 기본정보</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="memo"
                                name="memo"
                                value={formData.memo}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="• 대표자&#10;• 회사 컨택처 : 대표Tel., 메일, 홈페이지 등"
                                rows={3}
                                maxLength={1000}
                            />
                            <div className="field-help">
                                대표자명, 회사 연락처, 대표전화, 메일, 홈페이지 등 기본 정보
                            </div>
                        </div>
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
                        disabled={loading || !formData.company_name.trim() || !formData.representative.trim()}
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

export default CompanyRegistForm;