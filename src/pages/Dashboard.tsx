import React, { useState, useEffect } from 'react';
import { apiService, DashboardStats } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import '../styles/Dashboard.css';

const Dashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [projectsData, setProjectsData] = useState<any[]>([]);
    const [employeesData, setEmployeesData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, projectsChartData, employeesChartData] = await Promise.all([
                apiService.getDashboardStats(),
                apiService.getProjectsByStatus(),
                apiService.getEmployeesByDepartment()
            ]);

            setStats(statsData);
            setProjectsData(projectsChartData.data);
            setEmployeesData(employeesChartData.data);
        } catch (err: any) {
            setError('대시보드 데이터를 불러오는데 실패했습니다.');
            console.error('Dashboard data loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) {
        return (
            <div className="dashboard loading">
                <div className="loading-spinner">로딩 중...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard error">
                <div className="error-message">{error}</div>
                <button onClick={loadDashboardData} className="retry-button">
                    다시 시도
                </button>
            </div>
        );
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <h1>대시보드</h1>
                <p>전체 현황을 한눈에 확인하세요</p>
            </div>

            {/* 통계 카드 */}
            <div className="stats-grid">
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
            </div>

            {/* 차트 영역 */}
            <div className="charts-grid">
                <div className="chart-container">
                    <h3>프로젝트 상태별 현황</h3>
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
                </div>

                <div className="chart-container">
                    <h3>부서별 직원 현황</h3>
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
                </div>
            </div>

            {/* 빠른 액션 */}
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
        </div>
    );
};

export default Dashboard;