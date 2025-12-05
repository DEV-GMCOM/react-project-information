import React, { useState, useEffect } from 'react';
import { projectService } from '../../api/services/projectService';
import { ProjectNotificationLog } from '../../api/types';
import '../../styles/SalesSchedule.css';

const NotificationHistory: React.FC = () => {
    const [logs, setLogs] = useState<ProjectNotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState<number | ''>(new Date().getFullYear());
    const [month, setMonth] = useState<number | ''>('');
    const [statusFilter, setStatusFilter] = useState<string>(''); // '' means all, 'SUCCESS', 'FAILED'
    const [years, setYears] = useState<number[]>([]);

    // Pagination state
    const [skip, setSkip] = useState(0);
    const [limit] = useState(20);
    const [hasMore, setHasMore] = useState(true);

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const data = await projectService.getProjectCalendarYears();
                setYears(data);
                // Default year is current year
                const currentYear = new Date().getFullYear();
                if (data.length > 0 && !data.includes(currentYear)) {
                    setYear(data[0]);
                }
            } catch (err) {
                console.error("Failed to fetch years:", err);
            }
        };
        fetchYears();
    }, []);

    const fetchLogs = async (isLoadMore = false) => {
        setLoading(true);
        try {
            const currentSkip = isLoadMore ? skip : 0;
            const data = await projectService.getProjectNotificationLogs({ 
                year: year === '' ? undefined : year, 
                month: month === '' ? undefined : month,
                status: statusFilter || undefined,
                skip: currentSkip,
                limit: limit
            });
            
            if (isLoadMore) {
                setLogs(prev => [...prev, ...data]);
                setSkip(prev => prev + limit);
            } else {
                setLogs(data);
                setSkip(limit);
            }
            
            if (data.length < limit) {
                setHasMore(false);
            } else {
                setHasMore(true);
            }

        } catch (err) {
            console.error("Failed to fetch logs:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Reset pagination when filters change
        setSkip(0);
        setHasMore(true);
        fetchLogs(false);
    }, [year, month, statusFilter]);

    const handleLoadMore = () => {
        fetchLogs(true);
    };

    return (
        <div>
            <div className="schedule-filters" style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <select value={year} onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}>
                    <option value="">전체 연도</option>
                    {years.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
                <select value={month} onChange={e => setMonth(e.target.value === '' ? '' : Number(e.target.value))}>
                    <option value="">전체 월</option>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                        <option key={m} value={m}>{m}월</option>
                    ))}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="">모든 상태</option>
                    <option value="SUCCESS">성공</option>
                    <option value="FAILED">실패</option>
                </select>
                <button onClick={() => fetchLogs(false)} className="btn-icon" style={{ fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer' }} title="새로고침">
                    🔄
                </button>
            </div>

            {loading && logs.length === 0 ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            ) : logs.length === 0 ? (
                <div className="no-results">발송된 알림 이력이 없습니다.</div>
            ) : (
                <>
                    <table className="sales-schedule-table" style={{ tableLayout: 'fixed' }}>
                        <thead>
                            <tr>
                                <th style={{ width: '12%', textAlign: 'center' }}>발송 일시</th>
                                <th style={{ width: '15%' }}>알림 그룹명</th>
                                <th style={{ width: '20%' }}>이벤트명</th>
                                <th style={{ width: '20%' }}>수신자</th>
                                <th style={{ width: '8%', textAlign: 'center' }}>회차</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>상태</th>
                                <th style={{ width: '15%' }}>비고</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr key={log.log_id}>
                                    <td style={{ textAlign: 'center', color: '#555', fontSize: '0.9em' }}>
                                        {new Date(log.sent_at).toLocaleString()}
                                    </td>
                                    <td style={{ fontWeight: 'bold' }}>
                                        {log.bundle_nickname || '-'}
                                    </td>
                                    <td style={{ fontSize: '0.95em', color: '#333' }}>
                                        {log.event_names || '-'}
                                    </td>
                                    <td style={{ fontSize: '0.9em', color: '#666' }} title={log.recipients}>
                                        {log.recipients ? (
                                            log.recipients.length > 30 
                                                ? log.recipients.substring(0, 30) + '...' 
                                                : log.recipients
                                        ) : '-'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {log.sequence_number ? `${log.sequence_number}회차` : '-'}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {log.status === 'SUCCESS' ? (
                                            <span className="badge" style={{ backgroundColor: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9' }}>성공</span>
                                        ) : (
                                            <span className="badge" style={{ backgroundColor: '#ffebee', color: '#b71c1c', border: '1px solid #ffcdd2' }}>실패</span>
                                        )}
                                    </td>
                                    <td style={{ fontSize: '0.8em', color: '#d32f2f' }}>
                                        {log.error_message || ''}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {hasMore && (
                        <div style={{ textAlign: 'center', marginTop: '20px' }}>
                            <button onClick={handleLoadMore} className="btn-secondary" disabled={loading}>
                                {loading ? '로딩 중...' : '더 보기'}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default NotificationHistory;
