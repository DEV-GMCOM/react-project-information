import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { apiService, Employee } from '../../services/api';
import '../../styles/EmployeeList.css';

const EmployeeList: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        loadEmployees();
    }, [searchTerm, selectedDepartment, selectedStatus]);

    const loadEmployees = async () => {
        try {
            setLoading(true);
            const data = await apiService.getEmployees({
                search: searchTerm || undefined,
                department: selectedDepartment || undefined,
                status: selectedStatus || undefined,
                limit: 100
            });
            setEmployees(data);
        } catch (err: any) {
            setError('직원 목록을 불러오는데 실패했습니다.');
            console.error('Employees loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const departments = [...new Set(employees.map(e => e.department).filter(Boolean))];

    const getStatusBadge = (status: string) => {
        const statusColors = {
            active: 'status-active',
            inactive: 'status-inactive',
            terminated: 'status-terminated'
        };
        const statusLabels = {
            active: '활성',
            inactive: '비활성',
            terminated: '퇴사'
        };
        return (
            <span className={`status-badge ${statusColors[status as keyof typeof statusColors]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
        );
    };

    return (
        <div className="employee-list">
            <div className="page-header">
                <h1>직원 관리</h1>
                <Link to="/hr/new" className="btn btn-primary">
                    새 직원 등록
                </Link>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="이름 또는 사원번호 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={selectedDepartment}
                        onChange={(e) => setSelectedDepartment(e.target.value)}
                        className="department-select"
                    >
                        <option value="">모든 부서</option>
                        {departments.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-group">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="status-select"
                    >
                        <option value="">모든 상태</option>
                        <option value="active">활성</option>
                        <option value="inactive">비활성</option>
                        <option value="terminated">퇴사</option>
                    </select>
                </div>
            </div>

            {loading && <div className="loading">로딩 중...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <div className="employee-grid">
                    {employees.length === 0 ? (
                        <div className="no-data">등록된 직원이 없습니다.</div>
                    ) : (
                        employees.map(employee => (
                            <div key={employee.id} className="employee-card">
                                <div className="employee-header">
                                    <div className="employee-name">
                                        <h3>{employee.name}</h3>
                                        <span className="employee-id">#{employee.employee_id}</span>
                                    </div>
                                    <div className="employee-status">
                                        {getStatusBadge(employee.status)}
                                    </div>
                                </div>
                                <div className="employee-details">
                                    {employee.department && (
                                        <p><strong>부서:</strong> {employee.department}</p>
                                    )}
                                    {employee.position && (
                                        <p><strong>직책:</strong> {employee.position}</p>
                                    )}
                                    {employee.email && (
                                        <p><strong>이메일:</strong> {employee.email}</p>
                                    )}
                                    {employee.phone && (
                                        <p><strong>전화:</strong> {employee.phone}</p>
                                    )}
                                    {employee.hire_date && (
                                        <p><strong>입사일:</strong> {new Date(employee.hire_date).toLocaleDateString()}</p>
                                    )}
                                </div>
                                <div className="employee-actions">
                                    <Link
                                        to={`/hr/${employee.id}/edit`}
                                        className="btn btn-sm btn-secondary"
                                    >
                                        수정
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default EmployeeList;