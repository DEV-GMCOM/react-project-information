import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { handleApiError } from '../../api/utils/errorUtils';

import '../../styles/ProjectList.css';
import { apiService, Project } from '../../api';  // ✅ 수정
import type { EmployeeCreate } from '../../api/types';  // ✅ 추가

const ProjectList: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    useEffect(() => {
        loadProjects();
    }, [searchTerm, selectedStatus]);

    const loadProjects = async () => {
        try {
            setLoading(true);
            const data = await apiService.getProjects({
                search: searchTerm || undefined,
                status: selectedStatus || undefined,
                limit: 100
            });
            // 백엔드가 실제로는 Project[] 배열을 반환하므로 직접 사용
            setProjects(data as unknown as Project[]);
        } catch (err: any) {
            const errorMessage = handleApiError(error);
            setError(`프로젝트 목록을 불러오는데 실패했습니다: ${errorMessage}`);
            console.error('Projects loading error:', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const statusColors = {
            planning: 'status-planning',
            active: 'status-active',
            completed: 'status-completed',
            cancelled: 'status-cancelled'
        };
        const statusLabels = {
            planning: '계획',
            active: '진행중',
            completed: '완료',
            cancelled: '취소'
        };
        return (
            <span className={`status-badge ${statusColors[status as keyof typeof statusColors]}`}>
        {statusLabels[status as keyof typeof statusLabels]}
      </span>
        );
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '-';
        return new Intl.NumberFormat('ko-KR', {
            style: 'currency',
            currency: 'KRW'
        }).format(amount);
    };

    return (
        <div className="project-list">
            <div className="page-header">
                <h1>프로젝트 관리</h1>
                <Link to="/project/new" className="btn btn-primary">
                    새 프로젝트 생성
                </Link>
                <br/>
                <Link to="/project/regist" className="btn btn-primary">
                    GMCOM 프로젝트 정보 등록
                </Link>
            </div>

            <div className="filters">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="프로젝트명 또는 코드 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="filter-group">
                    <select
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="status-select"
                    >
                        <option value="">모든 상태</option>
                        <option value="planning">계획</option>
                        <option value="active">진행중</option>
                        <option value="completed">완료</option>
                        <option value="cancelled">취소</option>
                    </select>
                </div>
            </div>

            {loading && <div className="loading">로딩 중...</div>}
            {error && <div className="error">{error}</div>}

            {!loading && !error && (
                <div className="project-grid">
                    {projects.length === 0 ? (
                        <div className="no-data">등록된 프로젝트가 없습니다.</div>
                    ) : (
                        projects.map(project => (
                            <div key={project.id} className="project-card">
                                <div className="project-header">
                                    <div className="project-title">
                                        <h3>{project.project_name}</h3>
                                        <span className="project-code">#{project.project_code}</span>
                                    </div>
                                    <div className="project-status">
                                        {getStatusBadge(project.status)}
                                    </div>
                                </div>
                                <div className="project-details">
                                    {project.description && (
                                        <p className="project-description">{project.description}</p>
                                    )}
                                    {project.company_name && (
                                        <p><strong>업체:</strong> {project.company_name}</p>
                                    )}
                                    {project.manager_name && (
                                        <p><strong>매니저:</strong> {project.manager_name}</p>
                                    )}
                                    {project.budget && (
                                        <p><strong>예산:</strong> {formatCurrency(project.budget)}</p>
                                    )}
                                    <div className="project-dates">
                                        {project.start_date && (
                                            <span><strong>시작:</strong> {new Date(project.start_date).toLocaleDateString()}</span>
                                        )}
                                        {project.end_date && (
                                            <span><strong>종료:</strong> {new Date(project.end_date).toLocaleDateString()}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="project-actions">
                                    <Link
                                        to={`/project/${project.id}/edit`}
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

export default ProjectList;