import React, { useState, useEffect } from 'react';
import { projectService } from '../../api/services/projectService';
import { ProjectCalendarBundle } from '../../api/types';
import '../../styles/SalesSchedule.css';

const NotificationStatus: React.FC = () => {
    const [bundles, setBundles] = useState<ProjectCalendarBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState<number | ''>(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);

    useEffect(() => {
        const fetchYears = async () => {
            try {
                const data = await projectService.getProjectCalendarYears();
                setYears(data);
                // Set default year logic same as CalendarStatus
                const currentYear = new Date().getFullYear();
                if (data.length > 0) {
                    if (data.includes(currentYear)) {
                        setYear(currentYear);
                    } else {
                        setYear(data[0]);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch years:", err);
            }
        };
        fetchYears();
    }, []);

    useEffect(() => {
        const fetchBundles = async () => {
            setLoading(true);
            try {
                const data = await projectService.getProjectCalendarBundles({ year: year });
                setBundles(data);
            } catch (err) {
                console.error("Failed to fetch bundles:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchBundles();
    }, [year]);

    const renderRecipients = (recipients: ProjectCalendarBundle['recipients']) => {
        if (!recipients || recipients.length === 0) return '-';
        // Show first 2 names and count
        const names = recipients.map(r => r.employee_name).filter((name): name is string => !!name);
        if (names.length === 0) return '-';
        
        if (names.length <= 2) {
            return names.join(', ');
        }
        return `${names.slice(0, 2).join(', ')} 외 ${names.length - 2}명`;
    };

    return (
        <div>
            <div className="schedule-filters" style={{ marginTop: '10px' }}>
                 <select value={year} onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}>
                    <option value="">전체 연도</option>
                    {years.map(y => <option key={y} value={y}>{y}년</option>)}
                </select>
            </div>
            
            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            ) : bundles.length === 0 ? (
                <div className="no-results">등록된 알림 설정이 없습니다.</div>
            ) : (
                <table className="sales-schedule-table">
                    <thead>
                        <tr>
                            <th style={{ width: '20%' }}>이벤트명</th>
                            <th style={{ width: '15%' }}>알림 그룹명</th>
                            <th style={{ width: '20%' }}>수신자</th>
                            <th style={{ width: '15%' }}>채널</th>
                            <th style={{ width: '10%' }}>시작일</th>
                            <th style={{ width: '10%' }}>주기</th>
                            <th style={{ width: '10%' }}>우선순위</th>
                        </tr>
                    </thead>
                    <tbody>
                        {bundles.map(bundle => (
                            <tr key={bundle.id}>
                                <td>
                                    <div style={{fontWeight: 'bold'}}>{bundle.event_name}</div>
                                    <div style={{fontSize: '11px', color: '#666'}}>{bundle.advertiser}</div>
                                </td>
                                <td>{bundle.bundle_nickname || '-'}</td>
                                <td title={bundle.recipients.map(r => r.employee_name).join(', ')}>
                                    {renderRecipients(bundle.recipients)}
                                </td>
                                <td>
                                    {bundle.channels.map(c => (
                                        <span key={c.id} className={`badge channel-${c.channel}`}>
                                            {c.channel === 'jandi' ? 'JANDI' : 'Email'}
                                        </span>
                                    ))}
                                </td>
                                <td>{bundle.alarm_start_at ? new Date(bundle.alarm_start_at).toLocaleDateString() : '-'}</td>
                                <td>
                                    {bundle.alarm_interval_days ? `${bundle.alarm_interval_days}일` : '-'}
                                    {bundle.alarm_repeat_count ? ` (${bundle.alarm_repeat_count}회)` : ''}
                                </td>
                                <td>
                                    <span className={`badge priority-${bundle.priority}`}>
                                        {bundle.priority.toUpperCase()}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default NotificationStatus;