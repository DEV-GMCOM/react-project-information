import React, { useState, useEffect } from 'react';
import { projectService } from '../../api/services/projectService';
import { ProjectCalendarBundle } from '../../api/types';
import NotificationBundleModal from '../../components/sales/NotificationBundleModal';
import '../../styles/SalesSchedule.css';

const NotificationStatus: React.FC = () => {
    const [bundles, setBundles] = useState<ProjectCalendarBundle[]>([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState<number | ''>(new Date().getFullYear());
    const [years, setYears] = useState<number[]>([]);

    // Edit Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingBundleId, setEditingBundleId] = useState<number | undefined>(undefined);
    const [editingBundleGroup, setEditingBundleGroup] = useState<ProjectCalendarBundle[] | undefined>(undefined);

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

    useEffect(() => {
        fetchBundles();
    }, [year]);

    const groupBundles = (bundles: ProjectCalendarBundle[]) => {
        const groups: Record<number, ProjectCalendarBundle[]> = {};
        bundles.forEach(b => {
            if (!groups[b.bundle_id]) {
                groups[b.bundle_id] = [];
            }
            groups[b.bundle_id].push(b);
        });
        // Sort groups by bundle_id desc (newest first) or by alarm_start_at?
        // Let's keep original order but grouped.
        return Object.values(groups).sort((a, b) => b[0].bundle_id - a[0].bundle_id);
    };

    const groupedBundles = React.useMemo(() => groupBundles(bundles), [bundles]);

    const renderRecipients = (recipients: ProjectCalendarBundle['recipients']) => {
        if (!recipients || recipients.length === 0) return '-';
        // Show first 2 names and count
        const names = recipients.map(r => r.employee_name).filter((name): name is string => !!name);
        if (names.length === 0)
            return '-';
        if (names.length <= 2) {
            return names.join(', ');
        }
        return `${names.slice(0, 2).join(', ')} 외 ${names.length - 2}명`;
    };

    const handleEdit = (bundleId: number, group: ProjectCalendarBundle[]) => {
        setEditingBundleId(bundleId);
        setEditingBundleGroup(group);
        setIsEditModalOpen(true);
    };

    const handleDelete = async (bundleId: number) => {
        if (window.confirm('정말로 이 알림 설정을 삭제하시겠습니까?')) {
            try {
                await projectService.deleteProjectCalendarBundle(bundleId);
                alert('알림 설정이 삭제되었습니다.');
                fetchBundles();
            } catch (error) {
                console.error('Failed to delete bundle:', error);
                alert('알림 설정 삭제에 실패했습니다.');
            }
        }
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
                <table className="sales-schedule-table" style={{ tableLayout: 'fixed' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '15%' }}>알림 그룹명</th>
                            <th style={{ width: '20%', textAlign: 'center' }}>수신자</th>
                            <th style={{ width: '2.5rem', textAlign: 'center' }}>채널</th>
                            <th style={{ width: '7rem', textAlign: 'center' }}>시작일/주기</th>
                            <th style={{ width: '5rem', textAlign: 'center' }}>우선순위</th>
                            {/* <th style={{ width: '15%' }}>이벤트명</th> */}
                            <th>이벤트명</th>
                            <th style={{ width: '10%', textAlign: 'center' }}>관리</th>
                        </tr>
                    </thead>
                    <tbody>

                        {groupedBundles.map(group => {
                            const first = group[0];
                            return group.map((bundle, index) => (
                                <tr key={bundle.id}>
                                    {index === 0 && (
                                        <>
                                            <td rowSpan={group.length} style={{ verticalAlign: 'middle' }}>
                                                {first.bundle_nickname || '-'}
                                            </td>
                                            <td rowSpan={group.length} title={first.recipients.map(r => r.employee_name).join(', ')} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                {renderRecipients(first.recipients)}
                                            </td>
                                            <td rowSpan={group.length} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                {first.channels.map(c => (
                                                    <span key={c.id} className={`badge channel-${c.channel}`}>
                                                        {c.channel === 'JANDI' ? 'JANDI' : c.channel === 'SMS' ? 'SMS' : 'Email'}
                                                    </span>
                                                ))}
                                            </td>
                                            <td rowSpan={group.length} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <div>{first.alarm_start_at ? new Date(first.alarm_start_at).toLocaleDateString() : '-'}</div>
                                                <div style={{ fontSize: '0.9em', color: '#667' }}>
                                                    {first.alarm_interval_days ? `${first.alarm_interval_days}일` : '-'}
                                                    {first.alarm_repeat_count ? ` (${first.alarm_repeat_count}회)` : ''}
                                                </div>
                                            </td>

                                            <td rowSpan={group.length} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <span className={`badge priority-${first.priority}`}>
                                                    {first.priority.toUpperCase()}
                                                </span>
                                            </td>
                                        </>
                                    )}

                                    <td style={{ borderLeft: '1px solid #eee' }}>
                                        <div style={{ fontWeight: 'bold' }}>{bundle.event_name}</div>
                                        <div style={{ fontSize: '11px', color: '#666' }}>{bundle.advertiser}</div>
                                    </td>

                                    {index === 0 && (
                                        <td rowSpan={group.length} style={{ textAlign: 'center', verticalAlign: 'middle', borderLeft: '1px solid #eee' }}>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleEdit(first.bundle_id, group)}
                                                title="수정"
                                                style={{ marginRight: '5px', cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2em' }}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn-icon"
                                                onClick={() => handleDelete(first.bundle_id)}
                                                title="삭제"
                                                style={{ cursor: 'pointer', background: 'none', border: 'none', fontSize: '1.2em' }}
                                            >
                                                🗑️
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ));
                        })}
                    </tbody>
                </table>
            )}

            <NotificationBundleModal
                isOpen={isEditModalOpen}
                onRequestClose={() => {
                    setIsEditModalOpen(false);
                    setEditingBundleId(undefined);
                    setEditingBundleGroup(undefined);
                }}
                selectedEntries={[]} // Not needed for edit mode as we pass existingBundleGroup
                existingBundleId={editingBundleId}
                existingBundleGroup={editingBundleGroup}
                onSuccess={() => {
                    fetchBundles();
                    // Modal closes automatically via onRequestClose in handleEdit success path if I handled it there, 
                    // but usually onSuccess just refreshes data. 
                    // NotificationBundleModal calls onRequestClose after success.
                }}
            />

        </div>

    );

};

export default NotificationStatus;