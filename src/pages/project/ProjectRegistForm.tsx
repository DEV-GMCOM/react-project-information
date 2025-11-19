import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectService, companyService, employeeService } from '../../api';
import type { Company, Employee } from '../../api/types';
import '../../styles/ProjectRegistForm.css';

interface FormData {
    project_name: string;        // 프로젝트명
    client_company: string;      // 클라이언트 회사
    project_type: string;        // 프로젝트 유형
    project_manager: string;     // 프로젝트 매니저
    start_date: string;          // 시작일
    end_date: string;           // 종료일
    budget: string;             // 예산
    project_scope: string;      // 프로젝트 범위/내용
    key_deliverables: string;   // 주요 산출물
    stakeholders: string;       // 이해관계자
    risk_factors: string;       // 위험요소
    success_criteria: string;   // 성공기준
    memo: string;              // 특이사항/메모
}

const ProjectRegistForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        project_name: '',
        client_company: '',
        project_type: '',
        project_manager: '',
        start_date: '',
        end_date: '',
        budget: '',
        project_scope: '',
        key_deliverables: '',
        stakeholders: '',
        risk_factors: '',
        success_criteria: '',
        memo: ''
    });

    const [companies, setCompanies] = useState<Company[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<Partial<FormData>>({});

    // 프로젝트 유형 옵션들
    const projectTypeOptions = [
        '웹사이트 개발', '모바일 앱 개발', '시스템 구축', 'ERP 구축',
        '브랜딩/마케팅', '컨설팅', '유지보수', '연구개발',
        '인프라 구축', '데이터 분석', '교육/훈련', '기타'
    ];

    useEffect(() => {
        loadFormData();
        if (isEdit && id) {
            loadProject();
        }
    }, [isEdit, id]);

    const loadFormData = async (): Promise<void> => {
        try {
            const [companiesData, employeesData] = await Promise.all([
                companyService.getCompanies({ limit: 1000 }),
                employeeService.getEmployees({ limit: 1000, status: 'active' })
            ]);
            setCompanies(companiesData);
            setEmployees(employeesData);
        } catch (err: any) {
            console.error('Form data loading error:', err);
        }
    };

    const loadProject = async (): Promise<void> => {
        try {
            setLoading(true);
            setError('');

            const project = await projectService.getProject(Number(id));
            setFormData({
                project_name: project.project_name || '',
                client_company: project.company_name || '',
                project_type: project.project_type || '',
                project_manager: project.manager_name || '',
                start_date: project.start_date || '',
                end_date: project.end_date || '',
                budget: project.budget?.toString() || '',
                project_scope: project.description || '',
                key_deliverables: '',
                stakeholders: '',
                risk_factors: '',
                success_criteria: '',
                memo: project.memo || ''
            });
        } catch (err: any) {
            setError('프로젝트 정보를 불러오는데 실패했습니다: ' + (err.response?.data?.detail || err.message));
            console.error('Project loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<FormData> = {};

        // 필수 필드 검증
        if (!formData.project_name.trim()) {
            errors.project_name = '프로젝트명은 필수 입력 항목입니다.';
        }

        if (!formData.client_company.trim()) {
            errors.client_company = '클라이언트 회사는 필수 입력 항목입니다.';
        }

        if (!formData.project_manager.trim()) {
            errors.project_manager = '프로젝트 매니저는 필수 입력 항목입니다.';
        }

        // 날짜 검증
        if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
            errors.end_date = '종료일은 시작일보다 늦어야 합니다.';
        }

        // 예산 검증
        if (formData.budget && (isNaN(Number(formData.budget)) || Number(formData.budget) < 0)) {
            errors.budget = '올바른 예산 금액을 입력하세요.';
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

            // 클라이언트 회사 ID 찾기
            const selectedCompany = companies.find(c => c.company_name === formData.client_company);

            // 프로젝트 매니저 ID 찾기
            const selectedManager = employees.find(e => e.name === formData.project_manager);

            const submitData = {
                project_code: `PRJ${Date.now()}`, // 임시 프로젝트 코드
                project_name: formData.project_name.trim(),
                description: [
                    formData.project_scope && `프로젝트 범위: ${formData.project_scope}`,
                    formData.key_deliverables && `주요 산출물: ${formData.key_deliverables}`,
                    formData.stakeholders && `이해관계자: ${formData.stakeholders}`,
                    formData.risk_factors && `위험요소: ${formData.risk_factors}`,
                    formData.success_criteria && `성공기준: ${formData.success_criteria}`,
                    formData.memo && `메모: ${formData.memo}`
                ].filter(Boolean).join('\n\n'),
                start_date: formData.start_date || undefined,
                end_date: formData.end_date || undefined,
                status: 'planning' as const,
                budget: formData.budget ? Number(formData.budget) : undefined,
                company_id: selectedCompany?.id || undefined,
                manager_id: selectedManager?.id || undefined,
                project_type: formData.project_type || undefined
            };

            if (isEdit && id) {
                await projectService.updateProject(Number(id), submitData);
                alert('프로젝트 정보가 성공적으로 수정되었습니다.');
            } else {
                await projectService.createProject(submitData);
                alert('새 프로젝트가 성공적으로 등록되었습니다.');
            }

            navigate('/project');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || '프로젝트 정보 저장에 실패했습니다.';
            setError(errorMessage);
            console.error('Project save error:', err);
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

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value.replace(/[^0-9]/g, '');
        setFormData(prev => ({
            ...prev,
            budget: value
        }));

        if (validationErrors.budget) {
            setValidationErrors(prev => ({
                ...prev,
                budget: undefined
            }));
        }
    };

    const formatCurrency = (value: string): string => {
        if (!value) return '';
        return Number(value).toLocaleString('ko-KR');
    };

    const calculateProjectDays = (): number => {
        if (!formData.start_date || !formData.end_date) return 0;
        const start = new Date(formData.start_date);
        const end = new Date(formData.end_date);
        const diffTime = end.getTime() - start.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    };

    const handleReset = (): void => {
        if (window.confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
            if (isEdit && id) {
                loadProject();
            } else {
                setFormData({
                    project_name: '',
                    client_company: '',
                    project_type: '',
                    project_manager: '',
                    start_date: '',
                    end_date: '',
                    budget: '',
                    project_scope: '',
                    key_deliverables: '',
                    stakeholders: '',
                    risk_factors: '',
                    success_criteria: '',
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
            <div className="project-regist-form">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>프로젝트 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="project-regist-form">
            <div className="page-header">
                <h1>{isEdit ? '프로젝트 정보 수정' : '새 프로젝트 등록'}</h1>
                <div className="breadcrumb">
                    <span onClick={() => navigate('/project')} className="breadcrumb-link">
                        프로젝트 관리
                    </span>
                    <span className="breadcrumb-separator"> &gt; </span>
                    <span className="breadcrumb-current">
                        {isEdit ? '정보 수정' : '새 프로젝트 등록'}
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
                            <label htmlFor="project_name">프로젝트명</label>
                        </div>
                        <div className="form-content">
                            <input
                                type="text"
                                id="project_name"
                                name="project_name"
                                value={formData.project_name}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="ERP 시스템 구축 프로젝트"
                                maxLength={255}
                                className={validationErrors.project_name ? 'error' : ''}
                            />
                            {validationErrors.project_name && (
                                <div className="field-error">{validationErrors.project_name}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label required">
                            <label htmlFor="client_company">클라이언트 회사</label>
                        </div>
                        <div className="form-content">
                            <select
                                id="client_company"
                                name="client_company"
                                value={formData.client_company}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className={validationErrors.client_company ? 'error' : ''}
                            >
                                <option value="">클라이언트를 선택하세요</option>
                                {companies.map(company => (
                                    <option key={company.id} value={company.company_name}>
                                        {company.company_name}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.client_company && (
                                <div className="field-error">{validationErrors.client_company}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="project_type">프로젝트 유형</label>
                        </div>
                        <div className="form-content">
                            <select
                                id="project_type"
                                name="project_type"
                                value={formData.project_type}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">프로젝트 유형을 선택하세요</option>
                                {projectTypeOptions.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label required">
                            <label htmlFor="project_manager">프로젝트 매니저</label>
                        </div>
                        <div className="form-content">
                            <select
                                id="project_manager"
                                name="project_manager"
                                value={formData.project_manager}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                className={validationErrors.project_manager ? 'error' : ''}
                            >
                                <option value="">매니저를 선택하세요</option>
                                {employees.map(employee => (
                                    <option key={employee.id} value={employee.name}>
                                        {employee.name}
                                        {employee.department && ` (${employee.department.name})`}
                                        {employee.position && ` - ${employee.position}`}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.project_manager && (
                                <div className="field-error">{validationErrors.project_manager}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="start_date">시작일</label>
                        </div>
                        <div className="form-content date-range">
                            <input
                                type="date"
                                id="start_date"
                                name="start_date"
                                value={formData.start_date}
                                onChange={handleChange}
                                disabled={loading}
                            />
                            <span className="date-separator">~</span>
                            <input
                                type="date"
                                id="end_date"
                                name="end_date"
                                value={formData.end_date}
                                onChange={handleChange}
                                disabled={loading}
                                min={formData.start_date || undefined}
                                className={validationErrors.end_date ? 'error' : ''}
                            />
                            {validationErrors.end_date && (
                                <div className="field-error">{validationErrors.end_date}</div>
                            )}
                            {formData.start_date && formData.end_date && (
                                <div className="field-help">
                                    프로젝트 기간: {calculateProjectDays()}일
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="budget">예산 (원)</label>
                        </div>
                        <div className="form-content">
                            <input
                                type="text"
                                id="budget"
                                name="budget"
                                value={formatCurrency(formData.budget)}
                                onChange={handleBudgetChange}
                                disabled={loading}
                                placeholder="0"
                                className={validationErrors.budget ? 'error' : ''}
                            />
                            {validationErrors.budget && (
                                <div className="field-error">{validationErrors.budget}</div>
                            )}
                            {formData.budget && (
                                <div className="field-help">
                                    {formatCurrency(formData.budget)}원
                                    {formData.start_date && formData.end_date && calculateProjectDays() > 0 && (
                                        <span> (일당 예산: {Math.round(Number(formData.budget) / calculateProjectDays()).toLocaleString('ko-KR')}원)</span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="project_scope">프로젝트 범위/내용</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="project_scope"
                                name="project_scope"
                                value={formData.project_scope}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="프로젝트의 상세 범위와 내용을 기술하세요&#10;• 주요 기능&#10;• 포함/제외 사항&#10;• 기술 요구사항"
                                rows={4}
                                maxLength={1000}
                            />
                            <div className="field-help">
                                프로젝트의 구체적인 범위, 주요 기능, 포함/제외 사항을 기술하세요
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="key_deliverables">주요 산출물</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="key_deliverables"
                                name="key_deliverables"
                                value={formData.key_deliverables}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="프로젝트에서 제공할 주요 산출물을 나열하세요&#10;• 시스템/소프트웨어&#10;• 문서화&#10;• 교육/훈련&#10;• 운영 가이드"
                                rows={4}
                                maxLength={1000}
                            />
                            <div className="field-help">
                                시스템, 문서, 교육 등 프로젝트 완료 시 제공되는 결과물
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="stakeholders">이해관계자</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="stakeholders"
                                name="stakeholders"
                                value={formData.stakeholders}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="프로젝트 관련 이해관계자를 기술하세요&#10;• 프로젝트 스폰서&#10;• 최종 사용자&#10;• 개발팀&#10;• 외부 협력업체"
                                rows={3}
                                maxLength={500}
                            />
                            <div className="field-help">
                                프로젝트에 영향을 주거나 받는 모든 관계자
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="risk_factors">위험요소</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="risk_factors"
                                name="risk_factors"
                                value={formData.risk_factors}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="프로젝트 진행 시 예상되는 위험요소를 기술하세요&#10;• 기술적 위험&#10;• 일정 지연 위험&#10;• 자원 부족&#10;• 외부 의존성"
                                rows={3}
                                maxLength={500}
                            />
                            <div className="field-help">
                                프로젝트 성공을 저해할 수 있는 잠재적 위험들
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="success_criteria">성공기준</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="success_criteria"
                                name="success_criteria"
                                value={formData.success_criteria}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="프로젝트 성공을 판단하는 기준을 설정하세요&#10;• 기능적 요구사항 달성&#10;• 품질 기준 만족&#10;• 일정 준수&#10;• 예산 범위 내 완료"
                                rows={3}
                                maxLength={500}
                            />
                            <div className="field-help">
                                프로젝트 완료 시 성공 여부를 판단할 수 있는 명확한 기준
                            </div>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-label">
                            <label htmlFor="memo">특이사항/메모</label>
                        </div>
                        <div className="form-content multi-line">
                            <textarea
                                id="memo"
                                name="memo"
                                value={formData.memo}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="기타 특이사항이나 추가 정보를 입력하세요"
                                rows={3}
                                maxLength={1000}
                            />
                            <div className="field-help">
                                기타 특이사항, 참고사항, 추가 정보 등
                            </div>
                        </div>
                    </div>
                </div>

                {/* 프로젝트 요약 정보 */}
                {(formData.project_name || formData.client_company) && (
                    <div className="project-summary">
                        <h3>프로젝트 요약</h3>
                        <div className="summary-grid">
                            {formData.project_name && (
                                <div className="summary-item">
                                    <span className="label">프로젝트명:</span>
                                    <span className="value">{formData.project_name}</span>
                                </div>
                            )}
                            {formData.client_company && (
                                <div className="summary-item">
                                    <span className="label">클라이언트:</span>
                                    <span className="value">{formData.client_company}</span>
                                </div>
                            )}
                            {formData.project_type && (
                                <div className="summary-item">
                                    <span className="label">유형:</span>
                                    <span className="value">{formData.project_type}</span>
                                </div>
                            )}
                            {formData.project_manager && (
                                <div className="summary-item">
                                    <span className="label">매니저:</span>
                                    <span className="value">{formData.project_manager}</span>
                                </div>
                            )}
                            {formData.start_date && formData.end_date && (
                                <div className="summary-item">
                                    <span className="label">기간:</span>
                                    <span className="value">
                                        {new Date(formData.start_date).toLocaleDateString('ko-KR')} ~
                                        {new Date(formData.end_date).toLocaleDateString('ko-KR')}
                                        ({calculateProjectDays()}일)
                                    </span>
                                </div>
                            )}
                            {formData.budget && (
                                <div className="summary-item">
                                    <span className="label">예산:</span>
                                    <span className="value">{formatCurrency(formData.budget)}원</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 폼 액션 버튼 */}
                <div className="form-actions">
                    <button
                        type="button"
                        onClick={() => navigate('/project')}
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
                        disabled={loading || !formData.project_name.trim() || !formData.client_company.trim() || !formData.project_manager.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                {isEdit ? '수정 중...' : '등록 중...'}
                            </>
                        ) : (
                            isEdit ? '수정 완료' : '프로젝트 등록'
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
                            budget: formData.budget ? Number(formData.budget) : null
                        },
                        validationErrors,
                        isEdit,
                        loading,
                        projectDays: calculateProjectDays()
                    }, null, 2)}</pre>
                </details>
            )}
        </div>
    );
};

export default ProjectRegistForm;