import React, { useState, useEffect } from 'react';
import { schedulerService, SchedulerJob } from '../../api/services/schedulerService';
import '../../styles/SalesSchedule.css';

const SchedulerStatus: React.FC = () => {
    const [jobs, setJobs] = useState<SchedulerJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchJobs = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await schedulerService.getJobs();
            setJobs(data);
        } catch (err) {
            console.error("Failed to fetch scheduler jobs:", err);
            setError("스케줄러 정보를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchJobs();
        // Refresh periodically? Maybe manually is enough for now.
    }, []);

    return (
        <div>
            <div className="schedule-filters" style={{ marginTop: '10px', justifyContent: 'flex-end' }}>
                <button onClick={fetchJobs} className="btn-icon" style={{ fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer' }} title="새로고침">
                    🔄
                </button>
            </div>

            {loading ? (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            ) : error ? (
                <div className="error" style={{ color: 'red', textAlign: 'center', padding: '20px' }}>{error}</div>
            ) : jobs.length === 0 ? (
                <div className="no-results">등록된 스케줄러 작업이 없습니다.</div>
            ) : (
                <table className="sales-schedule-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                    <thead>
                        <tr>
                            <th style={{ width: '15%', border: '1px solid #ddd', textAlign: 'center' }}>Job ID</th>
                            <th style={{ width: '20%', border: '1px solid #ddd' }}>작업명</th>
                            <th style={{ width: '10%', border: '1px solid #ddd', textAlign: 'center' }}>트리거</th>
                            <th style={{ width: '10%', border: '1px solid #ddd', textAlign: 'center' }}>Executor</th>
                            <th style={{ width: '15%', border: '1px solid #ddd', textAlign: 'center' }}>Args</th>
                            <th style={{ width: '15%', border: '1px solid #ddd', textAlign: 'center' }}>Kwargs</th>
                            <th style={{ width: '15%', border: '1px solid #ddd', textAlign: 'center' }}>다음 실행 예정</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.map(job => (
                            <tr key={job.id}>
                                <td style={{ fontSize: '0.9em', color: '#666', border: '1px solid #ddd', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.id}>{job.id}</td>
                                <td style={{ fontWeight: 'bold', border: '1px solid #ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    <span style={{ marginLeft: '0.5rem' }} title={job.name}>{job.name}</span>
                                </td>
                                <td style={{ border: '1px solid #ddd', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.trigger}>{job.trigger}</td>
                                <td style={{ border: '1px solid #ddd', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={job.executor}>{job.executor}</td>
                                <td style={{ fontSize: '0.8em', border: '1px solid #ddd', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(job.args)}>
                                    {JSON.stringify(job.args)}
                                </td>
                                <td style={{ fontSize: '0.8em', border: '1px solid #ddd', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={JSON.stringify(job.kwargs)}>
                                    {JSON.stringify(job.kwargs)}
                                </td>
                                <td style={{ color: '#007bff', border: '1px solid #ddd', textAlign: 'center' }}>{job.next_run_time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', fontSize: '0.9em', color: '#666' }}>
                <strong>ℹ️ 참고:</strong> 이 화면은 서버 내부의 APScheduler에 등록된 백그라운드 작업 목록을 보여줍니다. 
                'check_and_send_notifications' 작업이 주기적으로 실행되며 DB에 등록된 알림 설정(번들)을 체크하여 알림을 발송합니다.
            </div>
        </div>
    );
};

export default SchedulerStatus;