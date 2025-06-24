import React, { useState, useEffect } from 'react';
import { apiService, DashboardStats } from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

interface LoadingState {
    stats: boolean;
    projects: boolean;
    employees: boolean;
}

interface ErrorState {
    stats: string | null;
    projects: string | null;
    employees: string | null;
}

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [projectsData, setProjectsData] = useState<any[]>([]);
    const [employeesData, setEmployeesData] = useState<any[]>([]);

    // 각 섹션별 로딩/에러 상태 관리
    const [loading, setLoading] = useState<LoadingState>({
        stats: true,
        projects: true,
        employees: true
    });

    const [errors, setErrors] = useState<ErrorState>({
        stats: null,
        projects: null,
        employees: null
    });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        // 개별적으로 데이터 로드 (하나 실패해도 다른 것들은 표시)
        loadStatsData();
        loadProjectsData();
        loadEmployeesData();
    };

    const loadStatsData = async () => {
        try {
            setLoading(prev => ({ ...prev, stats: true }));
            setErrors(prev => ({ ...prev, stats: null }));

            const statsData = await apiService.getDashboardStats();
            setStats(statsData);
        } catch (err: any) {
            console.error('Stats loading error:', err);
            setErrors(prev => ({
                ...prev,
                stats: '통계 데이터를 불러올 수 없습니다.'
            }));
        } finally {
            setLoading(prev => ({ ...prev, stats: false }));
        }
    };

    const loadProjectsData = async () => {
        try {
            setLoading(prev => ({ ...prev, projects: true }));
            setErrors(prev => ({ ...prev, projects: null }));

            const projectsChartData = await apiService.getProjectsByStatus();
            setProjectsData(projectsChartData.data || []);
        } catch (err: any) {
            console.error('Projects data loading error:', err);
            setErrors(prev => ({
                ...prev,
                projects: '프로젝트 차트를 불러올 수 없습니다.'
            }));
        } finally {
            setLoading(prev => ({ ...prev, projects: false }));
        }
    };

    const loadEmployeesData = async () => {
        try {
            setLoading(prev => ({ ...prev, employees: true }));
            setErrors(prev => ({ ...prev, employees: null }));

            const employeesChartData = await apiService.getEmployeesByDepartment();
            setEmployeesData(employeesChartData.data || []);
        } catch (err: any) {
            console.error('Employees data loading error:', err);
            setErrors(prev => ({
                ...prev,
                employees: '직원 차트를 불러올 수 없습니다.'
            }));
        } finally {
            setLoading(prev => ({ ...prev, employees: false }));
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    // 로딩 스피너 컴포넌트
    const LoadingSpinner = () => (
        <div className="loading-spinner-small">
            <div className="spinner"></div>
            <span>로딩 중...</span>
        </div>
    );

    // 에러 메시지 컴포넌트
    const ErrorMessage: React.FC<{
        message: string;
        onRetry: () => void;
        compact?: boolean
    }> = ({ message, onRetry, compact = false }) => (
        <div className={`error-section ${compact ? 'compact' : ''}`}>
            <div className="error-icon">⚠️</div>
            <div className="error-content">
                <p>{message}</p>
                <button onClick={onRetry} className="retry-button-small">
                    다시 시도
                </button>
            </div>
        </div>
    );

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>대시보드</h1>
                <p>전체 현황을 한눈에 확인하세요</p>

                {/* 전체 새로고침 버튼 */}
                <button
                    onClick={loadDashboardData}
                    className="refresh-all-button"
                    disabled={loading.stats || loading.projects || loading.employees}
                >
                    🔄 전체 새로고침
                </button>
            </div>

            {/* 통계 카드 - 에러가 있어도 기본 구조는 유지 */}
            <div className="stats-grid">
                {loading.stats ? (
                    <div className="stat-card loading-card">
                        <LoadingSpinner />
                    </div>
                ) : errors.stats ? (
                    <div className="stat-card error-card">
                        <ErrorMessage
                            message={errors.stats}
                            onRetry={loadStatsData}
                            compact={true}
                        />
                    </div>
                ) : (
                    <>
                        <div className="stat-card">
                            <div className="stat-icon">🏢</div>
                            <div className="stat-content">
                                <h3>총 업체 수</h3>
                                <div className="stat-number">{stats?.total_stats.companies || 0}</div>
                                <div className="stat-sub">이번 달 신규: {stats?.monthly_stats.new_companies || 0}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <h3>총 직원 수</h3>
                                <div className="stat-number">{stats?.total_stats.employees || 0}</div>
                                <div className="stat-sub">활성: {stats?.active_stats.employees || 0}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">📋</div>
                            <div className="stat-content">
                                <h3>총 프로젝트</h3>
                                <div className="stat-number">{stats?.total_stats.projects || 0}</div>
                                <div className="stat-sub">진행중: {stats?.active_stats.projects || 0}</div>
                            </div>
                        </div>

                        <div className="stat-card">
                            <div className="stat-icon">📊</div>
                            <div className="stat-content">
                                <h3>이번 달 신규</h3>
                                <div className="stat-number">
                                    {(stats?.monthly_stats.new_companies || 0) + (stats?.monthly_stats.new_employees || 0)}
                                </div>
                                <div className="stat-sub">업체 + 직원</div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* 차트 영역 - 각각 독립적으로 에러 처리 */}
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>프로젝트 상태별 현황</h3>
                    {loading.projects ? (
                        <LoadingSpinner />
                    ) : errors.projects ? (
                        <ErrorMessage
                            message={errors.projects}
                            onRetry={loadProjectsData}
                        />
                    ) : projectsData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={projectsData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ status, count }) => `${status}: ${count}`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="count"
                                    nameKey="status"
                                >
                                    {projectsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data-message">
                            <p>표시할 프로젝트 데이터가 없습니다.</p>
                        </div>
                    )}
                </div>

                <div className="chart-container">
                    <h3>부서별 직원 현황</h3>
                    {loading.employees ? (
                        <LoadingSpinner />
                    ) : errors.employees ? (
                        <ErrorMessage
                            message={errors.employees}
                            onRetry={loadEmployeesData}
                        />
                    ) : employeesData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={employeesData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="department" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="count" fill="#8884d8" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="no-data-message">
                            <p>표시할 직원 데이터가 없습니다.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 빠른 액션 - 항상 표시 (네트워크 문제와 무관하게 사용 가능) */}
            <div className="quick-actions">
                <h3>빠른 액션</h3>
                <div className="action-grid">
                    <a href="/information/company/new" className="action-button">
                        <div className="action-icon">🏢</div>
                        <div className="action-text">새 업체 등록</div>
                    </a>
                    <a href="/information/hr/new" className="action-button">
                        <div className="action-icon">👤</div>
                        <div className="action-text">새 직원 등록</div>
                    </a>
                    <a href="/information/project/new" className="action-button">
                        <div className="action-icon">📋</div>
                        <div className="action-text">새 프로젝트 생성</div>
                    </a>
                    <a href="/information/company" className="action-button">
                        <div className="action-icon">📊</div>
                        <div className="action-text">전체 현황 보기</div>
                    </a>
                </div>
            </div>

            {/* 연결 상태 표시 */}
            <div className="connection-status">
                {Object.values(errors).some(error => error !== null) && (
                    <div className="connection-warning">
                        <span className="status-icon">⚠️</span>
                        <span>일부 데이터를 불러올 수 없습니다. 네트워크 연결을 확인하세요.</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;