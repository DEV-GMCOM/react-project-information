import React, { useState, useEffect } from 'react';
import { curatorSchedulingService, Curator, ScheduleSlot, OptimizationResponse } from '../../api/services/curatorSchedulingService';
import '../../styles/CuratorScheduling.css';

interface LocalScheduleSlot {
    day: string;
    time: string;
    curatorId: number | null;
    curatorName: string | null;
}

type AlgorithmType = 'random' | 'roundRobin' | 'leastAssigned';

const CuratorScheduling: React.FC = () => {
    const [curators, setCurators] = useState<Curator[]>([]);
    const [schedules, setSchedules] = useState<LocalScheduleSlot[]>([]);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmType>('random');
    const [selectedSlot, setSelectedSlot] = useState<{ day: string; time: string } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [roundRobinIndex, setRoundRobinIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showCuratorModal, setShowCuratorModal] = useState(false);
    const [newCuratorName, setNewCuratorName] = useState('');
    const [editingCurator, setEditingCurator] = useState<Curator | null>(null);
    const [maxHoursPerDay, setMaxHoursPerDay] = useState(8);
    const [optimizationStats, setOptimizationStats] = useState<{ [name: string]: number } | null>(null);

    const days = ['월', '화', '수', '목', '금', '토', '일'];
    const timeSlots = [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
        '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
        '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // 큐레이터 로드 (없으면 초기화)
            let curatorList = await curatorSchedulingService.getCurators();
            if (curatorList.length === 0) {
                curatorList = await curatorSchedulingService.initCurators();
            }
            setCurators(curatorList);

            // 스케줄 로드
            const scheduleList = await curatorSchedulingService.getSchedules();

            // 로컬 상태 초기화
            const initialSchedules: LocalScheduleSlot[] = [];
            days.forEach(day => {
                timeSlots.forEach(time => {
                    const existing = scheduleList.find(s => s.day === day && s.time === time);
                    initialSchedules.push({
                        day,
                        time,
                        curatorId: existing?.curator_id || null,
                        curatorName: existing?.curator_name || null
                    });
                });
            });
            setSchedules(initialSchedules);
        } catch (err) {
            console.error('데이터 로딩 오류:', err);
            alert('데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const getScheduleForSlot = (day: string, time: string): LocalScheduleSlot | undefined => {
        return schedules.find(s => s.day === day && s.time === time);
    };

    const getCuratorAssignmentCount = (curatorId: number): number => {
        return schedules.filter(s => s.curatorId === curatorId).length;
    };

    const selectCuratorByAlgorithm = (): Curator | null => {
        if (curators.length === 0) return null;

        switch (selectedAlgorithm) {
            case 'random': {
                const randomIndex = Math.floor(Math.random() * curators.length);
                return curators[randomIndex];
            }
            case 'roundRobin': {
                const curator = curators[roundRobinIndex % curators.length];
                setRoundRobinIndex(prev => prev + 1);
                return curator;
            }
            case 'leastAssigned': {
                const curatorWithCounts = curators.map(c => ({
                    ...c,
                    currentCount: getCuratorAssignmentCount(c.id)
                }));
                curatorWithCounts.sort((a, b) => a.currentCount - b.currentCount);
                return curatorWithCounts[0];
            }
            default:
                return curators[0];
        }
    };

    const assignCurator = async (day: string, time: string, curator: Curator) => {
        try {
            setSaving(true);
            await curatorSchedulingService.createSchedule({
                day,
                time,
                curator_id: curator.id
            });

            setSchedules(prev => prev.map(s =>
                s.day === day && s.time === time
                    ? { ...s, curatorId: curator.id, curatorName: curator.name }
                    : s
            ));
        } catch (err) {
            console.error('배치 저장 오류:', err);
            alert('배치 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const removeCurator = async (day: string, time: string) => {
        try {
            setSaving(true);
            await curatorSchedulingService.deleteSchedule(day, time);

            setSchedules(prev => prev.map(s =>
                s.day === day && s.time === time
                    ? { ...s, curatorId: null, curatorName: null }
                    : s
            ));
        } catch (err) {
            console.error('삭제 오류:', err);
            alert('삭제에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleCellClick = (day: string, time: string) => {
        setSelectedSlot({ day, time });
        setShowModal(true);
    };

    const handleManualAssign = (curator: Curator) => {
        if (selectedSlot) {
            assignCurator(selectedSlot.day, selectedSlot.time, curator);
            setShowModal(false);
            setSelectedSlot(null);
        }
    };

    const handleAutoAssign = () => {
        if (selectedSlot) {
            const curator = selectCuratorByAlgorithm();
            if (curator) {
                assignCurator(selectedSlot.day, selectedSlot.time, curator);
            }
            setShowModal(false);
            setSelectedSlot(null);
        }
    };

    const handleRemove = () => {
        if (selectedSlot) {
            removeCurator(selectedSlot.day, selectedSlot.time);
            setShowModal(false);
            setSelectedSlot(null);
        }
    };

    const assignAllRandom = async () => {
        try {
            setSaving(true);
            const bulkSchedules = [];

            for (const day of days) {
                for (const time of timeSlots) {
                    const randomCurator = curators[Math.floor(Math.random() * curators.length)];
                    bulkSchedules.push({
                        day,
                        time,
                        curator_id: randomCurator.id
                    });
                }
            }

            await curatorSchedulingService.bulkCreateSchedules(bulkSchedules);
            await loadData();
        } catch (err) {
            console.error('일괄 배치 오류:', err);
            alert('일괄 배치에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 담당자 추가
    const handleAddCurator = async () => {
        if (!newCuratorName.trim()) {
            alert('담당자 이름을 입력하세요.');
            return;
        }

        try {
            setSaving(true);
            await curatorSchedulingService.createCurator(newCuratorName.trim());
            setNewCuratorName('');
            setShowCuratorModal(false);
            await loadData();
        } catch (err) {
            console.error('담당자 추가 오류:', err);
            alert('담당자 추가에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 담당자 삭제
    const handleDeleteCurator = async (curatorId: number, curatorName: string) => {
        if (!confirm(`"${curatorName}" 담당자를 삭제하시겠습니까?\n배치된 스케줄도 함께 삭제됩니다.`)) {
            return;
        }

        try {
            setSaving(true);
            await curatorSchedulingService.deleteCurator(curatorId);
            await loadData();
        } catch (err) {
            console.error('담당자 삭제 오류:', err);
            alert('담당자 삭제에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    // 최적화 배치 (Linear Programming)
    const handleOptimize = async () => {
        try {
            setSaving(true);
            const result = await curatorSchedulingService.optimizeSchedule({
                days,
                time_slots: timeSlots,
                max_hours_per_day: maxHoursPerDay
            });

            if (result.success) {
                // 결과를 DB에 저장
                await curatorSchedulingService.bulkCreateSchedules(result.schedules);
                setOptimizationStats(result.stats);
                await loadData();
                alert(result.message);
            } else {
                alert('최적화에 실패했습니다.');
            }
        } catch (err) {
            console.error('최적화 오류:', err);
            alert('최적화에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="curator-scheduling">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <span>로딩 중...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="curator-scheduling">
            <div className="page-header">
                <h1>큐레이터 스케줄링</h1>
                <p>큐레이터 주간 일정을 관리합니다.</p>
            </div>

            <div className="control-panel">
                <div className="algorithm-selector">
                    <label>배치 알고리즘:</label>
                    <select
                        value={selectedAlgorithm}
                        onChange={(e) => setSelectedAlgorithm(e.target.value as AlgorithmType)}
                    >
                        <option value="random">랜덤 배치</option>
                        <option value="roundRobin">라운드로빈</option>
                        <option value="leastAssigned">균등 배분</option>
                    </select>
                </div>
                <div className="algorithm-selector">
                    <label>하루 최대:</label>
                    <select
                        value={maxHoursPerDay}
                        onChange={(e) => setMaxHoursPerDay(Number(e.target.value))}
                    >
                        {[4, 6, 8, 10, 12, 24].map(h => (
                            <option key={h} value={h}>{h}시간</option>
                        ))}
                    </select>
                </div>
                <button
                    className="btn-assign-all"
                    onClick={assignAllRandom}
                    disabled={saving}
                >
                    {saving ? '저장 중...' : '전체 임의 배치'}
                </button>
                <button
                    className="btn-optimize"
                    onClick={handleOptimize}
                    disabled={saving}
                >
                    {saving ? '최적화 중...' : '최적화 배치'}
                </button>
            </div>

            <div className="curator-list">
                <div className="curator-list-header">
                    <h3>담당자 목록</h3>
                    <button
                        className="btn-add-curator"
                        onClick={() => setShowCuratorModal(true)}
                    >
                        + 담당자 추가
                    </button>
                </div>
                <div className="curator-grid">
                    {curators.map(curator => (
                        <div key={curator.id} className="curator-item">
                            <span className="curator-name">{curator.name}</span>
                            <span className="curator-count">
                                ({getCuratorAssignmentCount(curator.id)}회)
                            </span>
                            <button
                                className="btn-delete-curator"
                                onClick={() => handleDeleteCurator(curator.id, curator.name)}
                                disabled={saving}
                            >
                                ×
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="schedule-content">
                <table className="timetable">
                    <thead>
                        <tr>
                            <th className="time-column">시간</th>
                            {days.map(day => (
                                <th key={day} className="day-column">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {timeSlots.map(time => (
                            <tr key={time}>
                                <td className="time-cell">{time}</td>
                                {days.map(day => {
                                    const schedule = getScheduleForSlot(day, time);
                                    return (
                                        <td
                                            key={`${day}-${time}`}
                                            className={`schedule-cell ${schedule?.curatorId ? 'has-schedule' : ''}`}
                                            onClick={() => handleCellClick(day, time)}
                                        >
                                            {schedule?.curatorName ? (
                                                <div className="schedule-item">
                                                    <div className="schedule-curator">{schedule.curatorName}</div>
                                                </div>
                                            ) : (
                                                <div className="empty-slot">+</div>
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && selectedSlot && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>{selectedSlot.day}요일 {selectedSlot.time} 담당자 배치</h3>

                        <div className="modal-section">
                            <h4>현재 배치</h4>
                            <p>
                                {getScheduleForSlot(selectedSlot.day, selectedSlot.time)?.curatorName || '없음'}
                            </p>
                            {getScheduleForSlot(selectedSlot.day, selectedSlot.time)?.curatorId && (
                                <button className="btn-remove" onClick={handleRemove} disabled={saving}>
                                    담당자 삭제
                                </button>
                            )}
                        </div>

                        <div className="modal-section">
                            <h4>알고리즘으로 배치 ({
                                selectedAlgorithm === 'random' ? '랜덤' :
                                selectedAlgorithm === 'roundRobin' ? '라운드로빈' : '균등배분'
                            })</h4>
                            <button className="btn-auto-assign" onClick={handleAutoAssign} disabled={saving}>
                                자동 배치
                            </button>
                        </div>

                        <div className="modal-section">
                            <h4>수동 선택</h4>
                            <div className="curator-select-grid">
                                {curators.map(curator => (
                                    <button
                                        key={curator.id}
                                        className="btn-curator-select"
                                        onClick={() => handleManualAssign(curator)}
                                        disabled={saving}
                                    >
                                        {curator.name} ({getCuratorAssignmentCount(curator.id)})
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button className="btn-close" onClick={() => setShowModal(false)}>
                            닫기
                        </button>
                    </div>
                </div>
            )}

            {showCuratorModal && (
                <div className="modal-overlay" onClick={() => setShowCuratorModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h3>담당자 추가</h3>

                        <div className="modal-section">
                            <label>담당자 이름</label>
                            <input
                                type="text"
                                className="curator-name-input"
                                value={newCuratorName}
                                onChange={(e) => setNewCuratorName(e.target.value)}
                                placeholder="이름을 입력하세요"
                                onKeyPress={(e) => e.key === 'Enter' && handleAddCurator()}
                            />
                        </div>

                        <div className="modal-buttons">
                            <button
                                className="btn-auto-assign"
                                onClick={handleAddCurator}
                                disabled={saving}
                            >
                                {saving ? '저장 중...' : '추가'}
                            </button>
                            <button
                                className="btn-close"
                                onClick={() => {
                                    setShowCuratorModal(false);
                                    setNewCuratorName('');
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CuratorScheduling;
