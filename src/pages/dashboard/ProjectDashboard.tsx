// src/pages/dashboard/ProjectDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../../api/services/dashboardService';
import {
    ProjectPeriodType,
    ProjectDashboardStats,
    ProjectDashboardFilter,
    ProjectBasicInfo,
    StatusCount,
    MonthlyProject,
    ProjectHierarchy,
    OccupancyData,
    PROJECT_STATUS_LABELS,
    PROJECT_STATUS_COLORS,
    PROJECT_PERIOD_LABELS
} from '../../api/types';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts';
import './ProjectDashboard.css';

// ============ 기간 필터 컴포넌트 ============
const PeriodFilter: React.FC<{
    filter: ProjectDashboardFilter;
    onFilterChange: (filter: ProjectDashboardFilter) => void;
}> = ({ filter, onFilterChange }) => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    const quarters = [1, 2, 3, 4];

    const periodButtons: { type: ProjectPeriodType; label: string }[] = [
        { type: 'yearly', label: '년간' },
        { type: 'half_year', label: '반기' },
        { type: 'quarterly', label: '분기' },
        { type: 'monthly', label: '월간' },
        { type: 'weekly', label: '주간' },
        { type: 'recent_30_days', label: '최근 30일' },
        { type: 'custom', label: '사용자 지정' },
    ];

    return (
        <div className="period-filter-container">
            <div className="period-buttons">
                {periodButtons.map(btn => (
                    <button
                        key={btn.type}
                        className={`period-btn ${filter.period_type === btn.type ? 'active' : ''}`}
                        onClick={() => onFilterChange({ ...filter, period_type: btn.type })}
                    >
                        {btn.label}
                    </button>
                ))}
            </div>

            <div className="period-options">
                {filter.period_type !== 'recent_30_days' && filter.period_type !== 'weekly' && (
                    <select
                        className="period-select"
                        value={filter.year || currentYear}
                        onChange={(e) => onFilterChange({ ...filter, year: parseInt(e.target.value) })}
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}년</option>
                        ))}
                    </select>
                )}

                {filter.period_type === 'monthly' && (
                    <select
                        className="period-select"
                        value={filter.month || new Date().getMonth() + 1}
                        onChange={(e) => onFilterChange({ ...filter, month: parseInt(e.target.value) })}
                    >
                        {months.map(m => (
                            <option key={m} value={m}>{m}월</option>
                        ))}
                    </select>
                )}

                {filter.period_type === 'quarterly' && (
                    <select
                        className="period-select"
                        value={filter.quarter || Math.ceil((new Date().getMonth() + 1) / 3)}
                        onChange={(e) => onFilterChange({ ...filter, quarter: parseInt(e.target.value) })}
                    >
                        {quarters.map(q => (
                            <option key={q} value={q}>{q}분기</option>
                        ))}
                    </select>
                )}

                {filter.period_type === 'half_year' && (
                    <select
                        className="period-select"
                        value={filter.half_year || (new Date().getMonth() < 6 ? 1 : 2)}
                        onChange={(e) => onFilterChange({ ...filter, half_year: parseInt(e.target.value) })}
                    >
                        <option value={1}>상반기</option>
                        <option value={2}>하반기</option>
                    </select>
                )}

                {filter.period_type === 'custom' && (
                    <>
                        <input
                            type="date"
                            className="period-date"
                            value={filter.start_date || ''}
                            onChange={(e) => onFilterChange({ ...filter, start_date: e.target.value })}
                        />
                        <span className="date-separator">~</span>
                        <input
                            type="date"
                            className="period-date"
                            value={filter.end_date || ''}
                            onChange={(e) => onFilterChange({ ...filter, end_date: e.target.value })}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

// ============ 통계 카드 컴포넌트 ============
const StatCard: React.FC<{
    title: string;
    value: string | number;
    subValue?: string;
    percentage?: number;
    icon: string;
    color?: string;
}> = ({ title, value, subValue, percentage, icon, color = '#3B82F6' }) => (
    <div className="stat-card" style={{ borderTopColor: color }}>
        <div className="stat-header">
            <span className="stat-icon" style={{ backgroundColor: `${color}15`, color }}>{icon}</span>
            <h4>{title}</h4>
        </div>
        <div className="stat-body">
            <div className="stat-value">{value}</div>
            {percentage !== undefined && (
                <div className="stat-percentage">
                    <div className="percentage-bar">
                        <div
                            className="percentage-fill"
                            style={{ width: `${Math.min(percentage, 100)}%`, backgroundColor: color }}
                        />
                    </div>
                    <span className="percentage-text">{percentage.toFixed(1)}%</span>
                </div>
            )}
            {subValue && <div className="stat-sub">{subValue}</div>}
        </div>
    </div>
);

// ============ 상태별 도넛 차트 ============
const StatusDonutChart: React.FC<{ data: StatusCount[]; total: number }> = ({ data, total }) => {
    const chartData = data.map(item => ({
        name: item.status_label,
        value: item.count,
        percentage: item.percentage,
        fill: PROJECT_STATUS_COLORS[item.status as keyof typeof PROJECT_STATUS_COLORS] || '#6B7280'
    }));

    return (
        <div className="chart-card">
            <h3 className="chart-title">상태별 분포</h3>
            <div className="donut-chart-wrapper">
                <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={2}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip
                            formatter={(value: number, name: string) => [`${value}건 (${((value/total)*100).toFixed(1)}%)`, name]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                    <span className="donut-total">{total}</span>
                    <span className="donut-label">전체</span>
                </div>
            </div>
            <div className="chart-legend">
                {chartData.slice(0, 8).map((item, idx) => (
                    <div key={idx} className="legend-item">
                        <span className="legend-dot" style={{ backgroundColor: item.fill }} />
                        <span className="legend-name">{item.name}</span>
                        <span className="legend-value">{item.value}건 ({item.percentage.toFixed(1)}%)</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============ 월별 프로젝트 바 차트 ============
const MonthlyBarChart: React.FC<{ data: MonthlyProject[] }> = ({ data }) => {
    const chartData = data.map(item => ({
        month: item.month_label,
        count: item.project_count
    }));

    return (
        <div className="chart-card">
            <h3 className="chart-title">월별 프로젝트 현황</h3>
            <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={(value: number) => [`${value}건`, '프로젝트']}
                    />
                    <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// ============ 금액 바 차트 (프로젝트별 예산/투찰금액) ============
const AmountBarChart: React.FC<{ projects: ProjectBasicInfo[] }> = ({ projects }) => {
    // 금액 문자열을 숫자로 변환하는 함수
    const parseAmount = (amount: string | undefined): number => {
        if (!amount) return 0;
        // 숫자만 추출
        const num = parseFloat(amount.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    // 예산이 있는 프로젝트만 필터링하고 상위 10개
    const chartData = projects
        .filter(p => p.budget || p.bid_amount)
        .slice(0, 10)
        .map(p => ({
            name: p.project_name.length > 15 ? p.project_name.slice(0, 15) + '...' : p.project_name,
            fullName: p.project_name,
            budget: parseAmount(p.budget),
            bidAmount: parseAmount(p.bid_amount),
            budgetStr: p.budget || '0',
            bidAmountStr: p.bid_amount || '0'
        }));

    if (chartData.length === 0) {
        return (
            <div className="chart-card">
                <h3 className="chart-title">프로젝트별 금액 현황</h3>
                <div className="empty-chart">
                    <p>금액 데이터가 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="chart-card amount-chart">
            <h3 className="chart-title">프로젝트별 금액 현황 (Top 10)</h3>
            <ResponsiveContainer width="100%" height={320}>
                <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, bottom: 10, left: 100 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                    <XAxis type="number" axisLine={false} tickLine={false} fontSize={11} />
                    <YAxis
                        type="category"
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        fontSize={11}
                        width={95}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        formatter={(value: number, name: string, props: any) => {
                            const label = name === 'budget' ? '예산' : '투찰금액';
                            const strValue = name === 'budget' ? props.payload.budgetStr : props.payload.bidAmountStr;
                            return [strValue, label];
                        }}
                        labelFormatter={(label, payload) => payload?.[0]?.payload?.fullName || label}
                    />
                    <Legend
                        formatter={(value) => value === 'budget' ? '예산' : '투찰금액'}
                        iconType="square"
                    />
                    <Bar dataKey="budget" fill="#F59E0B" radius={[0, 4, 4, 0]} maxBarSize={20} name="budget" />
                    <Bar dataKey="bidAmount" fill="#8B5CF6" radius={[0, 4, 4, 0]} maxBarSize={20} name="bidAmount" />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

// ============ 점유율 바 컴포넌트 ============
const OccupancyBars: React.FC<{
    title: string;
    data: { category: string; label: string; value: number; percentage: number }[];
    color: string;
}> = ({ title, data, color }) => (
    <div className="occupancy-card">
        <h4 className="occupancy-title">{title}</h4>
        <div className="occupancy-list">
            {data.slice(0, 5).map((item, idx) => (
                <div key={idx} className="occupancy-item">
                    <div className="occupancy-info">
                        <span className="occupancy-rank">{idx + 1}</span>
                        <span className="occupancy-name">{item.label}</span>
                        <span className="occupancy-value">{item.value}건</span>
                    </div>
                    <div className="occupancy-bar-container">
                        <div
                            className="occupancy-bar-fill"
                            style={{ width: `${item.percentage}%`, backgroundColor: color }}
                        />
                        <span className="occupancy-percent">{item.percentage.toFixed(1)}%</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ============ 행사 통계 차트 컴포넌트 ============
const EventStatsCharts: React.FC<{ projects: ProjectBasicInfo[] }> = ({ projects }) => {
    // 행사장소별 통계
    const locationStats = React.useMemo(() => {
        const counts: Record<string, number> = {};
        projects.forEach(p => {
            const loc = p.event_location || '미지정';
            counts[loc] = (counts[loc] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [projects]);

    // 행사성격별 통계
    const natureStats = React.useMemo(() => {
        const counts: Record<string, number> = {};
        projects.forEach(p => {
            const nature = p.event_nature || '미지정';
            counts[nature] = (counts[nature] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [projects]);

    // 참석대상별 통계
    const attendeesStats = React.useMemo(() => {
        const counts: Record<string, number> = {};
        projects.forEach(p => {
            const att = p.attendees || '미지정';
            counts[att] = (counts[att] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 8);
    }, [projects]);

    // 월별 행사일 통계
    const eventDateStats = React.useMemo(() => {
        const monthCounts: Record<number, number> = {};
        for (let i = 1; i <= 12; i++) monthCounts[i] = 0;

        projects.forEach(p => {
            if (p.event_date) {
                const month = new Date(p.event_date).getMonth() + 1;
                monthCounts[month] = (monthCounts[month] || 0) + 1;
            }
        });
        return Array.from({ length: 12 }, (_, i) => ({
            month: `${i + 1}월`,
            count: monthCounts[i + 1] || 0
        }));
    }, [projects]);

    // 일정 현황 (OT/제출/PT)
    const scheduleStats = React.useMemo(() => {
        let otCount = 0, submissionCount = 0, ptCount = 0;
        projects.forEach(p => {
            if (p.ot_schedule) otCount++;
            if (p.submission_schedule) submissionCount++;
            if (p.pt_schedule) ptCount++;
        });
        return [
            { name: 'OT 일정', count: otCount, fill: '#3B82F6' },
            { name: '제출 일정', count: submissionCount, fill: '#10B981' },
            { name: 'PT 일정', count: ptCount, fill: '#F59E0B' }
        ];
    }, [projects]);

    const COLORS = ['#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6'];

    return (
        <div className="event-stats-section">
            <h3 className="section-title">행사 통계</h3>
            <div className="event-stats-grid">
                {/* 월별 행사일 */}
                <div className="chart-card">
                    <h4 className="chart-title">월별 행사일 분포</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={eventDateStats} margin={{ top: 10, right: 10, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="month" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis fontSize={11} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(value: number) => [`${value}건`, '행사']} />
                            <Bar dataKey="count" fill="#6366F1" radius={[4, 4, 0, 0]} maxBarSize={30} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 일정 현황 */}
                <div className="chart-card">
                    <h4 className="chart-title">일정 등록 현황</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={scheduleStats} layout="vertical" margin={{ top: 10, right: 30, bottom: 5, left: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                            <XAxis type="number" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                            <Tooltip formatter={(value: number) => [`${value}건`, '등록']} />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={25}>
                                {scheduleStats.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 행사장소별 */}
                <div className="chart-card">
                    <h4 className="chart-title">행사장소별 분포 (Top 8)</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={locationStats}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                dataKey="count"
                                nameKey="name"
                                label={({ name, percent }) => `${name.slice(0, 6)}${name.length > 6 ? '..' : ''} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                fontSize={10}
                            >
                                {locationStats.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number, name: string) => [`${value}건`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* 행사성격별 */}
                <div className="chart-card">
                    <h4 className="chart-title">행사성격별 분포</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={natureStats} layout="vertical" margin={{ top: 10, right: 20, bottom: 5, left: 80 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                            <XAxis type="number" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis
                                type="category"
                                dataKey="name"
                                fontSize={11}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => value.length > 10 ? value.slice(0, 10) + '..' : value}
                            />
                            <Tooltip formatter={(value: number) => [`${value}건`, '프로젝트']} />
                            <Bar dataKey="count" fill="#10B981" radius={[0, 4, 4, 0]} maxBarSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* 참석대상별 */}
                <div className="chart-card">
                    <h4 className="chart-title">참석대상별 분포</h4>
                    <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                            <Pie
                                data={attendeesStats}
                                cx="50%"
                                cy="50%"
                                outerRadius={70}
                                dataKey="count"
                                nameKey="name"
                                label={({ name, percent }) => `${name.slice(0, 6)}${name.length > 6 ? '..' : ''} ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                fontSize={10}
                            >
                                {attendeesStats.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value: number, name: string) => [`${value}건`, name]} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

// ============ 프로젝트 트리 뷰 ============
const ProjectTreeView: React.FC<{ hierarchy: ProjectHierarchy | null }> = ({ hierarchy }) => {
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    if (!hierarchy) return null;

    const toggleNode = (id: string) => {
        const newExpanded = new Set(expandedNodes);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedNodes(newExpanded);
    };

    const renderNode = (node: any, depth: number = 0) => (
        <div key={node.id} className="tree-node" style={{ paddingLeft: `${depth * 24}px` }}>
            <div
                className={`tree-item ${node.type}`}
                onClick={() => node.children && toggleNode(node.id)}
            >
                {node.children && (
                    <span className="tree-toggle">
                        {expandedNodes.has(node.id) ? '▼' : '▶'}
                    </span>
                )}
                <span className="tree-label">{node.label}</span>
                {node.count !== undefined && (
                    <span className="tree-count">{node.count}건</span>
                )}
            </div>
            {node.children && expandedNodes.has(node.id) && (
                <div className="tree-children">
                    {node.children.map((child: any) => renderNode(child, depth + 1))}
                </div>
            )}
        </div>
    );

    return (
        <div className="tree-view-container">
            <div className="tree-header">
                <h3>{hierarchy.year}년 프로젝트</h3>
                <span className="tree-total">{hierarchy.total_count}건</span>
            </div>
            <div className="tree-content">
                {hierarchy.tree.map(node => renderNode(node))}
            </div>
        </div>
    );
};

// ============ 프로젝트 상세 카드 ============
const ProjectDetailCard: React.FC<{
    project: ProjectBasicInfo;
    onStatusChange: (projectId: number, newStatus: string) => void;
}> = ({ project, onStatusChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [newStatus, setNewStatus] = useState(project.status);

    const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
        value, label
    }));

    const handleStatusSave = () => {
        onStatusChange(project.project_id, newStatus);
        setIsEditing(false);
    };

    return (
        <div className="project-detail-card">
            <div className="detail-header">
                <h4 className="detail-title">{project.project_name}</h4>
                <div className="detail-status-area">
                    {isEditing ? (
                        <div className="status-edit-group">
                            <select
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                                className="status-select"
                            >
                                {statusOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                            <button className="btn-save" onClick={handleStatusSave}>저장</button>
                            <button className="btn-cancel" onClick={() => setIsEditing(false)}>취소</button>
                        </div>
                    ) : (
                        <div className="status-display-group">
                            <span
                                className="status-badge"
                                style={{
                                    backgroundColor: `${PROJECT_STATUS_COLORS[project.status as keyof typeof PROJECT_STATUS_COLORS] || '#6B7280'}20`,
                                    color: PROJECT_STATUS_COLORS[project.status as keyof typeof PROJECT_STATUS_COLORS] || '#6B7280'
                                }}
                            >
                                {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] || project.status}
                            </span>
                            <button className="btn-edit-status" onClick={() => setIsEditing(true)}>상태변경</button>
                        </div>
                    )}
                </div>
            </div>

            <div className="detail-body">
                {/* 기본 정보 섹션 */}
                <div className="detail-section">
                    <h5 className="section-subtitle">기본 정보</h5>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">유입경로</span>
                            <span className="detail-value">{project.inflow_path || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">발주처</span>
                            <span className="detail-value">{project.client || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">담당자</span>
                            <span className="detail-value">{project.manager || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">등록일</span>
                            <span className="detail-value">{project.created_at?.slice(0, 10) || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 행사 정보 섹션 */}
                <div className="detail-section">
                    <h5 className="section-subtitle">행사 정보</h5>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">행사일</span>
                            <span className="detail-value">{project.event_date || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">행사장소</span>
                            <span className="detail-value">{project.event_location || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">참석대상</span>
                            <span className="detail-value">{project.attendees || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">행사성격</span>
                            <span className="detail-value">{project.event_nature || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 일정 정보 섹션 */}
                <div className="detail-section">
                    <h5 className="section-subtitle">일정 정보</h5>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">OT 일정</span>
                            <span className="detail-value">{project.ot_schedule || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">제출 일정</span>
                            <span className="detail-value">{project.submission_schedule || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">PT 일정</span>
                            <span className="detail-value">{project.pt_schedule || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 금액 정보 섹션 */}
                <div className="detail-section">
                    <h5 className="section-subtitle">금액 정보</h5>
                    <div className="detail-grid">
                        <div className="detail-item">
                            <span className="detail-label">예산</span>
                            <span className="detail-value amount">{project.budget || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">제출/투찰 금액</span>
                            <span className="detail-value amount">{project.bid_amount || '-'}</span>
                        </div>
                    </div>
                </div>

                {/* 경쟁 정보 섹션 */}
                <div className="detail-section">
                    <h5 className="section-subtitle">경쟁 정보</h5>
                    <div className="detail-grid full-width">
                        <div className="detail-item">
                            <span className="detail-label">예상 경쟁사</span>
                            <span className="detail-value">{project.expected_competitors || '-'}</span>
                        </div>
                        <div className="detail-item">
                            <span className="detail-label">배점표</span>
                            <span className="detail-value">{project.score_table || '-'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ============ 프로젝트 목록 테이블 ============
const ProjectTable: React.FC<{
    projects: ProjectBasicInfo[];
    onStatusChange: (projectId: number, newStatus: string) => void;
    onSelectProject: (project: ProjectBasicInfo) => void;
}> = ({ projects, onStatusChange, onSelectProject }) => {
    const [editingId, setEditingId] = useState<number | null>(null);

    const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
        value, label
    }));

    if (projects.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>해당 기간에 프로젝트가 없습니다.</p>
            </div>
        );
    }

    return (
        <div className="table-container">
            <table className="data-table">
                <thead>
                    <tr>
                        <th>프로젝트명</th>
                        <th>유입경로</th>
                        <th>발주처</th>
                        <th>담당자</th>
                        <th>행사일</th>
                        <th>OT일정</th>
                        <th>제출일정</th>
                        <th>PT일정</th>
                        <th>예산</th>
                        <th>투찰금액</th>
                        <th>상태</th>
                        <th>작업</th>
                    </tr>
                </thead>
                <tbody>
                    {projects.map(project => (
                        <tr key={project.project_id} onClick={() => onSelectProject(project)}>
                            <td className="cell-name">{project.project_name}</td>
                            <td>{project.inflow_path || '-'}</td>
                            <td>{project.client || '-'}</td>
                            <td>{project.manager || '-'}</td>
                            <td>{project.event_date || '-'}</td>
                            <td>{project.ot_schedule || '-'}</td>
                            <td>{project.submission_schedule || '-'}</td>
                            <td>{project.pt_schedule || '-'}</td>
                            <td className="cell-amount">{project.budget || '-'}</td>
                            <td className="cell-amount">{project.bid_amount || '-'}</td>
                            <td onClick={(e) => e.stopPropagation()}>
                                {editingId === project.project_id ? (
                                    <select
                                        className="status-select-inline"
                                        value={project.status}
                                        onChange={(e) => {
                                            onStatusChange(project.project_id, e.target.value);
                                            setEditingId(null);
                                        }}
                                        onBlur={() => setEditingId(null)}
                                        autoFocus
                                    >
                                        {statusOptions.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                ) : (
                                    <span
                                        className="status-badge clickable"
                                        style={{
                                            backgroundColor: `${PROJECT_STATUS_COLORS[project.status as keyof typeof PROJECT_STATUS_COLORS] || '#6B7280'}20`,
                                            color: PROJECT_STATUS_COLORS[project.status as keyof typeof PROJECT_STATUS_COLORS] || '#6B7280'
                                        }}
                                        onClick={() => setEditingId(project.project_id)}
                                    >
                                        {PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] || project.status}
                                    </span>
                                )}
                            </td>
                            <td onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="btn-action"
                                    onClick={() => setEditingId(project.project_id)}
                                >
                                    상태변경
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// ============ 월별 진행중인 프로젝트 목록 ============
const MonthlyProjectList: React.FC<{
    monthlyProjects: MonthlyProject[];
    onSelectProject: (project: ProjectBasicInfo) => void;
}> = ({ monthlyProjects, onSelectProject }) => {
    const [expandedMonth, setExpandedMonth] = useState<number | null>(null);

    return (
        <div className="monthly-project-list">
            <h3 className="section-title">월별 진행중인 프로젝트</h3>
            <div className="monthly-accordion">
                {monthlyProjects.map(mp => (
                    <div key={mp.month} className="monthly-item">
                        <div
                            className={`monthly-header ${expandedMonth === mp.month ? 'expanded' : ''}`}
                            onClick={() => setExpandedMonth(expandedMonth === mp.month ? null : mp.month)}
                        >
                            <span className="monthly-label">{mp.month_label}</span>
                            <span className="monthly-count">{mp.project_count}건</span>
                            <span className="monthly-toggle">{expandedMonth === mp.month ? '▼' : '▶'}</span>
                        </div>
                        {expandedMonth === mp.month && (
                            <div className="monthly-content">
                                {mp.projects.length > 0 ? (
                                    <ul className="project-mini-list">
                                        {mp.projects.map(p => (
                                            <li
                                                key={p.project_id}
                                                className="project-mini-item"
                                                onClick={() => onSelectProject(p)}
                                            >
                                                <span className="mini-name">{p.project_name}</span>
                                                <span className="mini-client">{p.client || '-'}</span>
                                                <span
                                                    className="mini-status"
                                                    style={{
                                                        color: PROJECT_STATUS_COLORS[p.status as keyof typeof PROJECT_STATUS_COLORS] || '#6B7280'
                                                    }}
                                                >
                                                    {PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS] || p.status}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="no-projects">이 달에 프로젝트가 없습니다.</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ============ 메인 대시보드 컴포넌트 ============
const ProjectDashboard: React.FC = () => {
    const [stats, setStats] = useState<ProjectDashboardStats | null>(null);
    const [hierarchy, setHierarchy] = useState<ProjectHierarchy | null>(null);
    const [occupancy, setOccupancy] = useState<OccupancyData | null>(null);
    const [projects, setProjects] = useState<ProjectBasicInfo[]>([]);
    const [selectedProject, setSelectedProject] = useState<ProjectBasicInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'list' | 'tree' | 'monthly'>('overview');

    const [filter, setFilter] = useState<ProjectDashboardFilter>({
        period_type: 'monthly',
        year: new Date().getFullYear(),
        month: new Date().getMonth() + 1
    });

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const [statsData, hierarchyData, occupancyData, projectListData] = await Promise.all([
                dashboardService.getProjectDashboardStats(filter as any),
                dashboardService.getProjectHierarchy(filter.year),
                dashboardService.getOccupancyRate(filter.period_type, filter.year, filter.month),
                dashboardService.getProjectList(filter as any, 0, 100)
            ]);

            setStats(statsData as any);
            setHierarchy(hierarchyData);
            setOccupancy(occupancyData);
            setProjects(projectListData.items);
        } catch (err: any) {
            console.error('Dashboard data loading error:', err);
            setError('대시보드 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusChange = async (projectId: number, newStatus: string) => {
        try {
            await dashboardService.updateProjectStatus({
                project_id: projectId,
                new_status: newStatus
            });
            loadData();
        } catch (err) {
            console.error('Status update error:', err);
            alert('상태 변경에 실패했습니다.');
        }
    };

    const handleSelectProject = (project: ProjectBasicInfo) => {
        setSelectedProject(project);
    };

    if (loading) {
        return (
            <div className="dashboard-loading">
                <div className="loading-spinner" />
                <p>대시보드 로딩 중...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="dashboard-error">
                <div className="error-icon">!</div>
                <p>{error}</p>
                <button className="btn-retry" onClick={loadData}>다시 시도</button>
            </div>
        );
    }

    const totalProjects = stats?.total_projects || 0;
    const activePercentage = stats?.active_percentage || (totalProjects > 0 ? ((stats?.active_projects || 0) / totalProjects) * 100 : 0);
    const wonPercentage = stats?.won_percentage || (totalProjects > 0 ? ((stats?.won_projects || 0) / totalProjects) * 100 : 0);
    const lostPercentage = stats?.lost_percentage || (totalProjects > 0 ? ((stats?.lost_projects || 0) / totalProjects) * 100 : 0);

    return (
        <div className="project-dashboard">
            {/* 헤더 */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>프로젝트 대시보드</h1>
                    <span className="period-badge">{stats?.period_stats?.period_label || PROJECT_PERIOD_LABELS[filter.period_type]}</span>
                </div>
                <button className="btn-refresh" onClick={loadData}>
                    <span>↻</span> 새로고침
                </button>
            </div>

            {/* 기간 필터 */}
            <PeriodFilter filter={filter} onFilterChange={setFilter} />

            {/* 탭 네비게이션 */}
            <div className="tab-navigation">
                <button
                    className={`tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    개요
                </button>
                <button
                    className={`tab-item ${activeTab === 'list' ? 'active' : ''}`}
                    onClick={() => setActiveTab('list')}
                >
                    프로젝트 목록
                </button>
                <button
                    className={`tab-item ${activeTab === 'monthly' ? 'active' : ''}`}
                    onClick={() => setActiveTab('monthly')}
                >
                    월별 현황
                </button>
                <button
                    className={`tab-item ${activeTab === 'tree' ? 'active' : ''}`}
                    onClick={() => setActiveTab('tree')}
                >
                    트리 뷰
                </button>
            </div>

            {/* 프로젝트 상세 모달/패널 */}
            {selectedProject && (
                <div className="detail-modal-overlay" onClick={() => setSelectedProject(null)}>
                    <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedProject(null)}>×</button>
                        <ProjectDetailCard
                            project={selectedProject}
                            onStatusChange={(id, status) => {
                                handleStatusChange(id, status);
                                setSelectedProject(null);
                            }}
                        />
                    </div>
                </div>
            )}

            {/* 개요 탭 */}
            {activeTab === 'overview' && stats && (
                <div className="tab-content">
                    {/* 통계 카드 - 프로젝트 현황 */}
                    <div className="stats-section">
                        <h3 className="section-title">프로젝트 현황</h3>
                        <div className="stats-grid">
                            <StatCard
                                title="전체 프로젝트"
                                value={`${stats.total_projects}건`}
                                percentage={100}
                                icon="📊"
                                color="#6366F1"
                            />
                            <StatCard
                                title="진행 중"
                                value={`${stats.active_projects}건`}
                                percentage={activePercentage}
                                icon="🚀"
                                color="#22C55E"
                            />
                            <StatCard
                                title="수주"
                                value={`${stats.won_projects}건`}
                                percentage={wonPercentage}
                                subValue={`수주율 ${stats.win_rate?.toFixed(1) || 0}%`}
                                icon="🎯"
                                color="#3B82F6"
                            />
                            <StatCard
                                title="실주"
                                value={`${stats.lost_projects}건`}
                                percentage={lostPercentage}
                                icon="📉"
                                color="#EF4444"
                            />
                        </div>
                    </div>

                    {/* 금액 통계 */}
                    <div className="stats-section">
                        <h3 className="section-title">금액 현황</h3>
                        <div className="stats-grid">
                            <StatCard
                                title="총 예산"
                                value={stats.total_budget || '0원'}
                                icon="💰"
                                color="#F59E0B"
                            />
                            {stats.amount_stats && (
                                <>
                                    <StatCard
                                        title="총 계약금액"
                                        value={stats.amount_stats.total_contract_amount || '0원'}
                                        icon="💵"
                                        color="#10B981"
                                    />
                                    <StatCard
                                        title="총 투찰금액"
                                        value={stats.amount_stats.total_bid_amount || '0원'}
                                        icon="📝"
                                        color="#8B5CF6"
                                    />
                                    <StatCard
                                        title="평균 계약금액"
                                        value={stats.amount_stats.avg_contract_amount || '0원'}
                                        icon="📈"
                                        color="#EC4899"
                                    />
                                </>
                            )}
                        </div>
                    </div>

                    {/* 프로젝트별 금액 그래프 */}
                    <AmountBarChart projects={projects} />

                    {/* 행사 통계 차트 */}
                    <EventStatsCharts projects={projects} />

                    {/* 기간별 요약 */}
                    {stats.period_stats && (
                        <div className="period-summary-card-light">
                            <div className="summary-item">
                                <span className="summary-label">선택 기간</span>
                                <span className="summary-value">{stats.period_stats.period_label}</span>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-item">
                                <span className="summary-label">프로젝트 수</span>
                                <span className="summary-value">{stats.period_stats.total_projects}건</span>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-item">
                                <span className="summary-label">기간 내 예산</span>
                                <span className="summary-value">{stats.period_stats.total_budget || '0원'}</span>
                            </div>
                            <div className="summary-divider" />
                            <div className="summary-item">
                                <span className="summary-label">기간 내 투찰</span>
                                <span className="summary-value">{stats.period_stats.total_bid_amount || '0원'}</span>
                            </div>
                        </div>
                    )}

                    {/* 차트 영역 */}
                    <div className="charts-row">
                        <StatusDonutChart data={stats.status_distribution || []} total={stats.total_projects} />
                        <MonthlyBarChart data={stats.monthly_projects || []} />
                    </div>

                    {/* 점유율 분석 */}
                    {occupancy && (
                        <div className="occupancy-section">
                            <h3 className="section-title">점유율 분석 (전체 대비 %)</h3>
                            <div className="occupancy-grid">
                                <OccupancyBars
                                    title="상태별 점유율"
                                    data={occupancy.by_status}
                                    color="#6366F1"
                                />
                                <OccupancyBars
                                    title="발주처별 점유율 (Top 5)"
                                    data={occupancy.by_client}
                                    color="#10B981"
                                />
                                <OccupancyBars
                                    title="유입경로별 점유율"
                                    data={occupancy.by_inflow_path}
                                    color="#8B5CF6"
                                />
                                <OccupancyBars
                                    title="담당자별 점유율 (Top 5)"
                                    data={occupancy.by_manager || []}
                                    color="#F59E0B"
                                />
                            </div>
                        </div>
                    )}

                    {/* 수주율 분석 */}
                    <div className="win-rate-section">
                        <h3 className="section-title">수주율 분석</h3>
                        <div className="win-rate-grid">
                            <div className="win-rate-card total">
                                <span className="win-rate-icon">📊</span>
                                <div className="win-rate-label">총 프로젝트</div>
                                <div className="win-rate-value">{stats.total_projects}</div>
                                <div className="win-rate-sub">전체 등록 건수</div>
                            </div>
                            <div className="win-rate-card won">
                                <span className="win-rate-icon">🎯</span>
                                <div className="win-rate-label">수주</div>
                                <div className="win-rate-value">{stats.won_projects}</div>
                                <div className="win-rate-sub">{wonPercentage.toFixed(1)}% 점유</div>
                            </div>
                            <div className="win-rate-card lost">
                                <span className="win-rate-icon">📉</span>
                                <div className="win-rate-label">실주</div>
                                <div className="win-rate-value">{stats.lost_projects}</div>
                                <div className="win-rate-sub">{lostPercentage.toFixed(1)}% 점유</div>
                            </div>
                            <div className="win-rate-card rate">
                                <span className="win-rate-icon">🏆</span>
                                <div className="win-rate-label">수주율</div>
                                <div className="win-rate-value">{stats.win_rate?.toFixed(1) || 0}%</div>
                                <div className="win-rate-sub">수주 / (수주+실주)</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 프로젝트 목록 탭 */}
            {activeTab === 'list' && (
                <div className="tab-content">
                    <div className="list-section">
                        <div className="list-header">
                            <h3>프로젝트 목록 ({projects.length}건)</h3>
                            <div className="list-filters">
                                <input
                                    type="text"
                                    placeholder="프로젝트명 검색..."
                                    className="search-input"
                                    value={filter.search || ''}
                                    onChange={(e) => setFilter({ ...filter, search: e.target.value })}
                                />
                                <select
                                    className="filter-select"
                                    value={filter.status || ''}
                                    onChange={(e) => setFilter({ ...filter, status: e.target.value || undefined })}
                                >
                                    <option value="">전체 상태</option>
                                    {Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <ProjectTable
                            projects={projects}
                            onStatusChange={handleStatusChange}
                            onSelectProject={handleSelectProject}
                        />
                    </div>
                </div>
            )}

            {/* 월별 현황 탭 */}
            {activeTab === 'monthly' && stats && (
                <div className="tab-content">
                    <MonthlyProjectList
                        monthlyProjects={stats.monthly_projects || []}
                        onSelectProject={handleSelectProject}
                    />
                </div>
            )}

            {/* 트리 뷰 탭 */}
            {activeTab === 'tree' && (
                <div className="tab-content">
                    <ProjectTreeView hierarchy={hierarchy} />
                </div>
            )}
        </div>
    );
};

export default ProjectDashboard;
