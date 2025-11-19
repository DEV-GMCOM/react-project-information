// src/components/hr/EmployeeForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../../api';  // ✅ 수정
import type { EmployeeCreate, Department } from '../../api/types';  // ✅ 추가
import '../../styles/EmployeeForm.css';

const EmployeeForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<Partial<EmployeeCreate>>({
        employee_id: '',
        name: '',
        department_id: undefined,
        position: '',
        email: '',
        phone: '',
        hire_date: '',
        birth_date: '',
        address: '',
        status: 'active'
    });
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [validationErrors, setValidationErrors] = useState<Partial<EmployeeCreate>>({});

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (isEdit && id) {
            loadEmployee();
        }
    }, [isEdit, id, departments]);

    const loadInitialData = async () => {
        try {
            const depts = await apiService.getAllDepartments();
            setDepartments(depts);
        } catch (err) {
            console.error("Failed to load departments", err);
        }
    };

    const loadEmployee = async (): Promise<void> => {
        try {
            setLoading(true);
            setError('');

            const employee = await apiService.getEmployee(Number(id));  // ✅ 수정
            setFormData({
                employee_id: employee.employee_id,
                name: employee.name,
                department_id: employee.department?.id,
                position: employee.position || '',
                email: employee.email || '',
                phone: employee.phone || '',
                hire_date: employee.hire_date || '',
                birth_date: employee.birth_date || '',
                address: employee.address || '',
                status: employee.status
            });
        } catch (err: any) {
            setError('직원 정보를 불러오는데 실패했습니다: ' + (err.response?.data?.detail || err.message));
            console.error('Employee loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<EmployeeCreate> = {};

        // 필수 필드 검증
        if (!formData.employee_id?.trim()) {
            errors.employee_id = '사원번호는 필수 입력 항목입니다.';
        }

        if (!formData.name?.trim()) {
            errors.name = '이름은 필수 입력 항목입니다.';
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

        // 날짜 검증
        if (formData.hire_date && formData.birth_date) {
            const hireDate = new Date(formData.hire_date);
            const birthDate = new Date(formData.birth_date);
            const age = hireDate.getFullYear() - birthDate.getFullYear();

            if (age < 15) {
                errors.birth_date = '입사일 기준 만 15세 이상이어야 합니다.';
            }
        }

        // 미래 날짜 검증
        if (formData.hire_date) {
            const today = new Date();
            const hireDate = new Date(formData.hire_date);
            today.setHours(0, 0, 0, 0);
            hireDate.setHours(0, 0, 0, 0);

            if (hireDate > today) {
                errors.hire_date = '입사일은 오늘 날짜 이전이어야 합니다.';
            }
        }

        if (formData.birth_date) {
            const today = new Date();
            const birthDate = new Date(formData.birth_date);

            if (birthDate > today) {
                errors.birth_date = '생년월일은 오늘 날짜 이전이어야 합니다.';
            }
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
            const submitData: EmployeeCreate = {
                employee_id: formData.employee_id!.trim(),
                name: formData.name!.trim(),
                department_id: formData.department_id,
                position: formData.position?.trim() || undefined,
                email: formData.email?.trim() || undefined,
                phone: formData.phone?.trim() || undefined,
                hire_date: formData.hire_date || undefined,
                birth_date: formData.birth_date || undefined,
                address: formData.address?.trim() || undefined,
                status: formData.status!
            };

            if (isEdit && id) {
                // 수정 요청
                await apiService.updateEmployee(Number(id), submitData);
                alert('직원 정보가 성공적으로 수정되었습니다.');
            } else {
                // 신규 등록 요청
                await apiService.createEmployee(submitData);
                alert('새 직원이 성공적으로 등록되었습니다.');
            }

            // 성공 시 목록 페이지로 이동
            navigate('/hr');
        } catch (err: any) {
            const errorMessage = err.response?.data?.detail || err.message || '직원 정보 저장에 실패했습니다.';
            setError(errorMessage);
            console.error('Employee save error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>): void => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'department_id' ? (value ? Number(value) : undefined) : value
        }));

        // 입력 중 해당 필드의 에러 메시지 제거
        if (validationErrors[name as keyof EmployeeCreate]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        let value = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출

        // 자동으로 하이픈 추가
        if (value.startsWith('02')) {
            // 서울 지역번호 (02-XXXX-XXXX)
            if (value.length >= 2) {
                value = value.slice(0, 2) + '-' + value.slice(2);
            }
            if (value.length >= 7) {
                value = value.slice(0, 6) + '-' + value.slice(6, 10);
            }
        } else if (value.startsWith('010') || value.startsWith('011') || value.startsWith('016') || value.startsWith('017') || value.startsWith('018') || value.startsWith('019')) {
            // 휴대폰 번호 (010-XXXX-XXXX)
            if (value.length >= 3) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            }
            if (value.length >= 8) {
                value = value.slice(0, 8) + '-' + value.slice(8, 12);
            }
        } else {
            // 기타 지역번호 (0XX-XXX-XXXX 또는 0XX-XXXX-XXXX)
            if (value.length >= 3) {
                value = value.slice(0, 3) + '-' + value.slice(3);
            }
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
            phone: value
        }));

        // 에러 메시지 제거
        if (validationErrors.phone) {
            setValidationErrors(prev => ({
                ...prev,
                phone: undefined
            }));
        }
    };

    const handleReset = (): void => {
        if (window.confirm('입력한 내용을 모두 초기화하시겠습니까?')) {
            if (isEdit && id) {
                loadEmployee(); // 수정 모드에서는 원래 데이터로 복원
            } else {
                setFormData({
                    employee_id: '',
                    name: '',
                    department_id: undefined,
                    position: '',
                    email: '',
                    phone: '',
                    hire_date: '',
                    birth_date: '',
                    address: '',
                    status: 'active'
                });
            }
            setValidationErrors({});
            setError('');
        }
    };

    const calculateAge = (): number | null => {
        if (!formData.birth_date) return null;
        const today = new Date();
        const birthDate = new Date(formData.birth_date);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    };

    const calculateWorkingYears = (): number | null => {
        if (!formData.hire_date) return null;
        const today = new Date();
        const hireDate = new Date(formData.hire_date);
        let years = today.getFullYear() - hireDate.getFullYear();
        const monthDiff = today.getMonth() - hireDate.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hireDate.getDate())) {
            years--;
        }

        return years;
    };

    // 로딩 중인 경우 (수정 모드에서만)
    if (loading && isEdit) {
        return (
            <div className="employee-form">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>직원 정보를 불러오는 중...</p>
                </div>
            </div>
        );
    }

    const age = calculateAge();
    const workingYears = calculateWorkingYears();
    const currentDepartmentName = departments.find(d => d.id === formData.department_id)?.name;

    return (
        <div className="employee-form">
            <div className="page-header">
                <h1>{isEdit ? '직원 정보 수정' : '새 직원 등록'}</h1>
                <div className="breadcrumb">
                    <span onClick={() => navigate('/hr')} className="breadcrumb-link">
                        직원 관리
                    </span>
                    <span className="breadcrumb-separator"> &gt; </span>
                    <span className="breadcrumb-current">
                        {isEdit ? '정보 수정' : '새 직원 등록'}
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
                            <label htmlFor="employee_id" className="required">
                                사원번호 *
                            </label>
                            <input
                                type="text"
                                id="employee_id"
                                name="employee_id"
                                value={formData.employee_id || ''}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="EMP001"
                                maxLength={50}
                                className={validationErrors.employee_id ? 'error' : ''}
                            />
                            {validationErrors.employee_id && (
                                <div className="field-error">{validationErrors.employee_id}</div>
                            )}
                            <small className="field-help">
                                고유한 사원번호를 입력하세요
                            </small>
                        </div>

                        <div className="form-group">
                            <label htmlFor="name" className="required">
                                이름 *
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name || ''}
                                onChange={handleChange}
                                required
                                disabled={loading}
                                placeholder="직원 이름을 입력하세요"
                                maxLength={100}
                                className={validationErrors.name ? 'error' : ''}
                            />
                            {validationErrors.name && (
                                <div className="field-error">{validationErrors.name}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="department_id">부서</label>
                            <select
                                id="department_id"
                                name="department_id"
                                value={formData.department_id || ''}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="">부서 선택</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="position">직책</label>
                            <input
                                type="text"
                                id="position"
                                name="position"
                                value={formData.position || ''}
                                onChange={handleChange}
                                disabled={loading}
                                placeholder="팀장, 대리, 과장 등"
                                maxLength={100}
                            />
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="status">재직 상태</label>
                            <select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                disabled={loading}
                            >
                                <option value="active">재직</option>
                                <option value="inactive">휴직</option>
                                <option value="terminated">퇴사</option>
                            </select>
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
                                onChange={handlePhoneChange}
                                disabled={loading}
                                placeholder="010-1234-5678"
                                maxLength={13}
                                className={validationErrors.phone ? 'error' : ''}
                            />
                            {validationErrors.phone && (
                                <div className="field-error">{validationErrors.phone}</div>
                            )}
                            <small className="field-help">
                                하이픈(-)이 자동으로 추가됩니다
                            </small>
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
                                placeholder="employee@company.com"
                                maxLength={255}
                                className={validationErrors.email ? 'error' : ''}
                            />
                            {validationErrors.email && (
                                <div className="field-error">{validationErrors.email}</div>
                            )}
                        </div>
                    </div>

                    <div className="form-group full-width">
                        <label htmlFor="address">주소</label>
                        <textarea
                            id="address"
                            name="address"
                            value={formData.address || ''}
                            onChange={handleChange}
                            placeholder="상세 주소를 입력하세요&#10;예: 서울특별시 강남구 테헤란로 123, 456아파트 101동 501호"
                            rows={3}
                            disabled={loading}
                            maxLength={500}
                        />
                        <small className="field-help">
                            {(formData.address || '').length}/500 글자
                        </small>
                    </div>
                </div>

                {/* 날짜 정보 섹션 */}
                <div className="form-section">
                    <h3 className="section-title">날짜 정보</h3>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="birth_date">생년월일</label>
                            <input
                                type="date"
                                id="birth_date"
                                name="birth_date"
                                value={formData.birth_date || ''}
                                onChange={handleChange}
                                disabled={loading}
                                max={new Date().toISOString().split('T')[0]}
                                className={validationErrors.birth_date ? 'error' : ''}
                            />
                            {validationErrors.birth_date && (
                                <div className="field-error">{validationErrors.birth_date}</div>
                            )}
                            {age !== null && (
                                <small className="field-help">
                                    만 {age}세
                                </small>
                            )}
                        </div>

                        <div className="form-group">
                            <label htmlFor="hire_date">입사일</label>
                            <input
                                type="date"
                                id="hire_date"
                                name="hire_date"
                                value={formData.hire_date || ''}
                                onChange={handleChange}
                                disabled={loading}
                                max={new Date().toISOString().split('T')[0]}
                                className={validationErrors.hire_date ? 'error' : ''}
                            />
                            {validationErrors.hire_date && (
                                <div className="field-error">{validationErrors.hire_date}</div>
                            )}
                            {workingYears !== null && (
                                <small className="field-help">
                                    근무 {workingYears}년차
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                {/* 직원 정보 요약 */}
                {(age !== null || workingYears !== null) && (
                    <div className="form-section">
                        <h3 className="section-title">직원 정보 요약</h3>
                        <div className="employee-summary">
                            <div className="summary-grid">
                                {age !== null && (
                                    <div className="summary-item">
                                        <span className="label">나이:</span>
                                        <span className="value">만 {age}세</span>
                                    </div>
                                )}
                                {workingYears !== null && (
                                    <div className="summary-item">
                                        <span className="label">근무 연차:</span>
                                        <span className="value">{workingYears}년차</span>
                                    </div>
                                )}
                                {currentDepartmentName && (
                                    <div className="summary-item">
                                        <span className="label">소속 부서:</span>
                                        <span className="value">{currentDepartmentName}</span>
                                    </div>
                                )}
                                {formData.position && (
                                    <div className="summary-item">
                                        <span className="label">직책:</span>
                                        <span className="value">{formData.position}</span>
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
                        onClick={() => navigate('/hr')}
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
                        disabled={loading || !formData.employee_id?.trim() || !formData.name?.trim()}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                {isEdit ? '수정 중...' : '등록 중...'}
                            </>
                        ) : (
                            isEdit ? '수정 완료' : '직원 등록'
                        )}
                    </button>
                </div>
            </form>

            {/* 개발 정보 (개발 환경에서만 표시) */}
            {process.env.NODE_ENV === 'development' && (
                <details className="dev-info">
                    <summary>개발 정보</summary>
                    <pre>{JSON.stringify({ formData, validationErrors, isEdit, loading, age, workingYears }, null, 2)}</pre>
                </details>
            )}
        </div>
    );
};

export default EmployeeForm;