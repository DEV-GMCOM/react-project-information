// src/pages/project/ProjectForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
// import { apiService, Project, Company, Employee } from '@/api/services/api';
import { apiService, Project, Company, Employee } from '../../api';  // ✅ 수정
// import type { EmployeeCreate } from '../../api/types';  // ✅ 추가
import '../../styles/ProjectForm.css';

interface FormData {
    project_code: string;
    project_name: string;
    description: string;
    start_date: string;
    end_date: string;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
    budget: string;
    company_id: string;
    manager_id: string;
    project_type: string; // ✅ 추가
}

const ProjectForm: React.FC = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = Boolean(id);

    const [formData, setFormData] = useState<FormData>({
        project_code: '',
        project_name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'planning',
        budget: '',
        company_id: '',
        manager_id: '',
        project_type: '' // ✅ 추가
    });

    // 프로젝트 유형 옵션들 추가
    const projectTypeOptions = [
        '웹사이트 개발', '모바일 앱 개발', '시스템 구축', 'ERP 구축',
        '브랜딩/마케팅', '컨설팅', '유지보수', '연구개발',
        '인프라 구축', '데이터 분석', '교육/훈련', '기타'
    ];

    const [companies, setCompanies] = useState<Company[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadFormData();
        if (isEdit && id) {
            loadProject();
        }
    }, [isEdit, id]);

    const loadFormData = async (): Promise<void> => {
        try {
            const [companiesData, employeesData] = await Promise.all([
                apiService.getCompanies({ limit: 1000 }),
                apiService.getEmployees({ limit: 1000, status: 'active' })
            ]);
            setCompanies(companiesData);
            setEmployees(employeesData);
        } catch (err) {
            console.error('Form data loading error:', err);
        }
    };

    const loadProject = async (): Promise<void> => {
        if (!id) return;

        try {
            setLoading(true);
            const project = await apiService.getProject(Number(id));
            setFormData({
                project_code: project.project_code,
                project_name: project.project_name,
                description: project.description || '',
                start_date: project.start_date || '',
                end_date: project.end_date || '',
                status: project.status,
                budget: project.budget?.toString() || '',
                company_id: project.company_id?.toString() || '',
                manager_id: project.manager_id?.toString() || '',
                project_type: project.project_type || '' // ✅ 추가
            });
        } catch (err: any) {
            setError('프로젝트 정보를 불러오는데 실패했습니다.');
            console.error('Project loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        if (!formData.project_code.trim()) {
            setError('프로젝트 코드는 필수 입력 항목입니다.');
            return false;
        }

        if (!formData.project_name.trim()) {
            setError('프로젝트명은 필수 입력 항목입니다.');
            return false;
        }

        if (formData.start_date && formData.end_date && formData.start_date > formData.end_date) {
            setError('종료일은 시작일보다 늦어야 합니다.');
            return false;
        }

        if (formData.budget && isNaN(Number(formData.budget))) {
            setError('예산은 숫자만 입력 가능합니다.');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setLoading(true);
            setError('');

            const submitData = {
                project_code: formData.project_code.trim(),
                project_name: formData.project_name.trim(),
                description: formData.description.trim() || '', // ✅ undefined 대신 빈 문자열로 변경
                start_date: formData.start_date || undefined,
                end_date: formData.end_date || undefined,
                status: formData.status,
                budget: formData.budget ? Number(formData.budget) : undefined,
                company_id: formData.company_id ? Number(formData.company_id) : undefined,
                manager_id: formData.manager_id ? Number(formData.manager_id) : undefined,
                project_type: formData.project_type || undefined // ✅ 이미 추가되어 있다면 그대로 유지
            };

            if (isEdit && id) {
                await apiService.updateProject(Number(id), submitData);
                alert('프로젝트 정보가 수정되었습니다.');
            } else {
                await apiService.createProject(submitData);
                alert('새 프로젝트가 생성되었습니다.');
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
    };

    const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { value } = e.target;
        // 숫자만 허용
        const numericValue = value.replace(/[^0-9]/g, '');
        setFormData(prev => ({
            ...prev,
            budget: numericValue
        }));
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

    const calculateDailyBudget = (): number => {
        const days = calculateProjectDays();
        const budget = Number(formData.budget);
        if (days > 0 && budget > 0) {
            return Math.round(budget / days);
        }
        return 0;
    };

    if (loading && isEdit) {
        return (
            <div className="project-form">
                <div className="loading">프로젝트 정보를 불러오는 중...</div>
            </div>
        );
    }

    // 폼에 프로젝트 유형 선택 필드 추가
    return (
        <div className="project-form">
            <div className="page-header">
                <h1>{isEdit ? '프로젝트 정보 수정' : '새 프로젝트 생성'}</h1>
            </div>

            {error && (
                <div className="error-message">
                    <strong>오류:</strong> {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="form">
                {/* 기본 정보 */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="project_code">프로젝트 코드 *</label>
                        <input
                            type="text"
                            id="project_code"
                            name="project_code"
                            value={formData.project_code}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="PRJ001"
                            maxLength={50}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="project_name">프로젝트명 *</label>
                        <input
                            type="text"
                            id="project_name"
                            name="project_name"
                            value={formData.project_name}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            placeholder="프로젝트명을 입력하세요"
                            maxLength={255}
                        />
                    </div>
                </div>

                {/* 프로젝트 유형 추가 */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="project_type">프로젝트 유형</label>
                        <select
                            id="project_type"
                            name="project_type"
                            value={formData.project_type}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="">프로젝트 유형을 선택하세요</option>
                            {projectTypeOptions.map(type => (
                                <option key={type} value={type}>
                                    {type}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="status">프로젝트 상태</label>
                        <select
                            id="status"
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="planning">계획</option>
                            <option value="active">진행중</option>
                            <option value="completed">완료</option>
                            <option value="cancelled">취소</option>
                        </select>
                    </div>
                </div>

                {/* 설명 */}
                <div className="form-group full-width">
                    <label htmlFor="description">프로젝트 설명</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="프로젝트에 대한 상세 설명을 입력하세요"
                        rows={4}
                        disabled={loading}
                        maxLength={1000}
                    />
                </div>

                {/* 날짜 */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="start_date">시작일</label>
                        <input
                            type="date"
                            id="start_date"
                            name="start_date"
                            value={formData.start_date}
                            onChange={handleChange}
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="end_date">종료일</label>
                        <input
                            type="date"
                            id="end_date"
                            name="end_date"
                            value={formData.end_date}
                            onChange={handleChange}
                            disabled={loading}
                            min={formData.start_date || undefined}
                        />
                    </div>
                </div>

                {/* 상태 및 예산 */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="budget">예산 (원)</label>
                        <input
                            type="text"
                            id="budget"
                            name="budget"
                            value={formatCurrency(formData.budget)}
                            onChange={handleBudgetChange}
                            disabled={loading}
                            placeholder="0"
                        />
                        {formData.budget && (
                            <small className="field-help">
                                {Number(formData.budget).toLocaleString('ko-KR')}원
                            </small>
                        )}
                    </div>
                </div>

                {/* 연관 정보 */}
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="company_id">관련 업체</label>
                        <select
                            id="company_id"
                            name="company_id"
                            value={formData.company_id}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="">업체를 선택하세요</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.company_name}
                                    {company.industry && ` (${company.industry})`}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="manager_id">프로젝트 매니저</label>
                        <select
                            id="manager_id"
                            name="manager_id"
                            value={formData.manager_id}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="">매니저를 선택하세요</option>
                            {employees.map(employee => (
                                <option key={employee.id} value={employee.id}>
                                    {employee.name}
                                    {employee.department && ` (${employee.department})`}
                                    {employee.position && ` - ${employee.position}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 프로젝트 계산 정보 */}
                {formData.start_date && formData.end_date && (
                    <div className="form-group full-width">
                        <div className="project-summary">
                            <h4>프로젝트 요약</h4>
                            <div className="summary-grid">
                                <div className="summary-item">
                                    <span className="label">프로젝트 기간:</span>
                                    <span className="value">{calculateProjectDays()}일</span>
                                </div>
                                {formData.budget && (
                                    <div className="summary-item">
                                        <span className="label">일일 예산:</span>
                                        <span className="value">{calculateDailyBudget().toLocaleString('ko-KR')}원</span>
                                    </div>
                                )}
                                <div className="summary-item">
                                    <span className="label">시작일:</span>
                                    <span className="value">{new Date(formData.start_date).toLocaleDateString('ko-KR')}</span>
                                </div>
                                <div className="summary-item">
                                    <span className="label">종료일:</span>
                                    <span className="value">{new Date(formData.end_date).toLocaleDateString('ko-KR')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 버튼 */}
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
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? '저장 중...' : (isEdit ? '수정 완료' : '프로젝트 생성')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProjectForm;