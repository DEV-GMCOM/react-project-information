import React, { useState, useEffect, useMemo } from 'react';
import { ko } from 'date-fns/locale';
import { projectService } from '../../api/services/projectService';
import { ProjectCalendarEntry, EmployeeSimple, ProjectCalendarBundleCreateRequest, Employee, ProjectCalendarBundle } from '../../api/types';
import EmployeeSearchModal from '../meeting/EmployeeSearchModal';
import DatePicker from 'react-datepicker';
import Holidays from 'date-holidays';
import 'react-datepicker/dist/react-datepicker.css';
import '../../styles/modal.css';
import '../../styles/NotificationBundleModal.css';


interface NotificationBundleModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    selectedEntries: ProjectCalendarEntry[];
    onSuccess: () => void;
    existingBundleId?: number;
    existingBundleGroup?: ProjectCalendarBundle[];
}

const NotificationBundleModal: React.FC<NotificationBundleModalProps> = ({
    isOpen,
    onRequestClose,
    selectedEntries,
    onSuccess,
    existingBundleId,
    existingBundleGroup
}) => {
    const [nickname, setNickname] = useState('');
    const [priority, setPriority] = useState<'HIGH' | 'MID' | 'LOW'>('MID');
    const [alarmStartAt, setAlarmStartAt] = useState<Date | null>(null);

    // [수정] 반복 설정 상태 변경
    const [alarmInterval, setAlarmInterval] = useState<number | ''>('');
    const [alarmIntervalUnit, setAlarmIntervalUnit] = useState<'YEAR' | 'MONTH' | 'DAY'>('DAY');

    const [alarmRepeatCount, setAlarmRepeatCount] = useState<number | ''>('');
    const [selectedChannels, setSelectedChannels] = useState<Set<'EMAIL' | 'SMS' | 'JANDI'>>(new Set(['EMAIL']));
    const [recipients, setRecipients] = useState<EmployeeSimple[]>([]);
    const [isEmployeeSearchOpen, setIsEmployeeSearchOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Track previous selected entries to prevent unnecessary resets
    const prevEntriesSignatureRef = React.useRef<string>('');

    // 한국 공휴일 체크
    const holidays = useMemo(() => new Holidays('KR'), []);

    const isHoliday = (date: Date): boolean => {
        return holidays.isHoliday(date) !== false;
    };

    const getDayClassName = (date: Date): string => {
        if (isHoliday(date)) {
            return 'holiday';
        }
        return '';
    };

    useEffect(() => {
        if (isOpen) {
            if (existingBundleId && existingBundleGroup && existingBundleGroup.length > 0) {
                // Edit Mode
                const bundle = existingBundleGroup[0];
                setNickname(bundle.bundle_nickname || '');
                setPriority(bundle.priority as any);
                setAlarmStartAt(bundle.alarm_start_at ? new Date(bundle.alarm_start_at) : null);

                // [수정] 기존 데이터 매핑
                setAlarmInterval(bundle.alarm_interval || '');
                setAlarmIntervalUnit(bundle.alarm_interval_unit || 'DAY');

                setAlarmRepeatCount(bundle.alarm_repeat_count || '');

                const channels = new Set<'EMAIL' | 'SMS' | 'JANDI'>();
                bundle.channels.forEach(c => channels.add(c.channel));
                setSelectedChannels(channels);

                const recips: EmployeeSimple[] = bundle.recipients.map(r => ({
                    emp_id: r.emp_id,
                    name: r.employee_name || ''
                }));
                setRecipients(recips);
            } else if (selectedEntries.length > 0) {
                // Create Mode
                const currentSignature = selectedEntries.map(e => e.event_id).sort().join(',');

                if (prevEntriesSignatureRef.current !== currentSignature) {
                    prevEntriesSignatureRef.current = currentSignature;

                    const firstEntry = selectedEntries[0];
                    if (selectedEntries.length === 1) {
                        setNickname(`${firstEntry.event_name} 알림`);
                    } else {
                        setNickname(`${firstEntry.event_name} 외 ${selectedEntries.length - 1}건 알림`);
                    }

                    setPriority('MID');
                    let initialAlarmStartAt: Date;
                    if (firstEntry.ot_date) {
                        initialAlarmStartAt = new Date(firstEntry.ot_date);
                    } else {
                        initialAlarmStartAt = new Date();
                    }
                    initialAlarmStartAt.setHours(8, 0, 0, 0);
                    setAlarmStartAt(initialAlarmStartAt);

                    // [수정] 초기값 설정
                    setAlarmInterval(1);
                    setAlarmIntervalUnit('DAY');

                    setAlarmRepeatCount('');
                    setSelectedChannels(new Set(['EMAIL']));
                    setRecipients([]);
                }
            }
        } else if (!isOpen) {
            prevEntriesSignatureRef.current = '';
        }
    }, [isOpen, selectedEntries, existingBundleId, existingBundleGroup]);

    const highlightDates = useMemo(() => {
        if (!alarmStartAt) return [];

        const dates: Date[] = [];
        const start = alarmStartAt;
        // If alarmRepeatCount is empty (infinite), set a high default for display purposes
        const count = alarmRepeatCount === '' ? 100 : Number(alarmRepeatCount); 
        const interval = alarmInterval === '' ? 0 : Number(alarmInterval);

        // [수정] 단위별 날짜 계산
        for (let i = 0; i < count; i++) {
            const nextDate = new Date(start);

            if (alarmIntervalUnit === 'DAY') {
                nextDate.setDate(start.getDate() + (i * interval));
            } else if (alarmIntervalUnit === 'MONTH') {
                nextDate.setMonth(start.getMonth() + (i * interval));
            } else if (alarmIntervalUnit === 'YEAR') {
                nextDate.setFullYear(start.getFullYear() + (i * interval));
            }

            dates.push(nextDate);
        }
        return dates;
    }, [alarmStartAt, alarmInterval, alarmIntervalUnit, alarmRepeatCount]);

    const handleChannelToggle = (channel: 'EMAIL' | 'SMS' | 'JANDI') => {
        const next = new Set(selectedChannels);
        if (next.has(channel)) {
            next.delete(channel);
        } else {
            next.add(channel);
        }
        setSelectedChannels(next);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const targetEventIds = existingBundleId && existingBundleGroup
            ? existingBundleGroup.map(b => b.project_calendar_event_id)
            : selectedEntries.map(e => e.event_id);

        if (targetEventIds.length === 0) return;

        const missingFields = [];
        if (!alarmStartAt) missingFields.push('알림 시작일시');
        if (selectedChannels.size === 0) missingFields.push('알림 채널');
        if (recipients.length === 0) missingFields.push('수신자');

        if (missingFields.length > 0) {
            alert(`다음 항목을 선택해주세요:\n- ${missingFields.join('\n- ')}`);
            return;
        }

        setSubmitting(true);
        try {
            const requestData: ProjectCalendarBundleCreateRequest = {
                project_calendar_event_ids: targetEventIds,
                bundle_nickname: nickname,
                priority,
                alarm_start_at: alarmStartAt ? alarmStartAt.toISOString() : undefined,

                // [수정] 변경된 필드 사용
                alarm_interval: alarmInterval === '' ? undefined : Number(alarmInterval),
                alarm_interval_unit: alarmIntervalUnit,

                alarm_repeat_count: alarmRepeatCount === '' ? undefined : Number(alarmRepeatCount),
                channels: Array.from(selectedChannels),
                recipient_emp_ids: recipients.map(r => r.emp_id)
            };

            if (existingBundleId) {
                await projectService.updateProjectCalendarBundle(existingBundleId, requestData);
                alert('알림 설정이 수정되었습니다.');
            } else {
                await projectService.createProjectCalendarBundle(requestData);
                alert('알림 설정이 저장되었습니다.');
            }

            onSuccess();
            onRequestClose();
        } catch (error) {
            console.error('Failed to save bundle:', error);
            alert('알림 설정 저장에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay notification-bundle-modal">
            <div className="modal-content" style={{ width: '600px', maxWidth: '95%' }}>
                <div className="modal-header">
                    <h2>{existingBundleId ? '알림 설정 수정' : '알림 설정 등록'}</h2>
                    <button onClick={onRequestClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    {!existingBundleId && selectedEntries.length > 0 && (
                        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #e9ecef' }}>
                            <div style={{ marginBottom: '10px', color: '#495057', fontWeight: 'bold' }}>
                                선택된 프로젝트 ({selectedEntries.length}건)
                            </div>
                            <div className="project-list-scrollable" style={{ maxHeight: '200px', overflowY: 'scroll', border: '1px solid #dee2e6', borderRadius: '4px', backgroundColor: '#fff' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px', tableLayout: 'fixed' }}>
                                    <thead style={{ backgroundColor: '#e9ecef', position: 'sticky', top: 0, zIndex: 1 }}>
                                        <tr>
                                            <th style={{ width: '55%', padding: '8px 12px', textAlign: 'left', color: '#495057', fontWeight: '600', borderBottom: '1px solid #dee2e6' }}>프로젝트명</th>
                                            <th style={{ width: '30%', padding: '8px 12px', textAlign: 'left', color: '#495057', fontWeight: '600', borderBottom: '1px solid #dee2e6' }}>광고주</th>
                                            <th style={{ width: '15%', padding: '8px 12px', textAlign: 'left', color: '#495057', fontWeight: '600', borderBottom: '1px solid #dee2e6' }}>OT 일자</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedEntries.map(entry => (
                                            <tr key={entry.event_id} style={{ borderBottom: '1px solid #f1f3f5' }}>
                                                <td style={{ padding: '8px 12px', color: '#212529', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.event_name}</td>
                                                <td style={{ padding: '8px 12px', color: '#495057', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.advertiser || '-'}</td>
                                                <td style={{ padding: '8px 12px', color: '#868e96', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{entry.ot_date || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>알림 그룹명</label>
                            <input
                                type="text"
                                className="form-input"
                                value={nickname}
                                onChange={e => setNickname(e.target.value)}
                                placeholder="알림 그룹명을 입력하세요"
                            />
                        </div>

                        <div className="form-group">
                            <label>중요도</label>
                            <select
                                className="form-select"
                                value={priority}
                                onChange={e => setPriority(e.target.value as any)}
                            >
                                <option value="LOW">낮음</option>
                                <option value="MID">중간</option>
                                <option value="HIGH">매우중요</option>
                            </select>
                        </div>

                        <div className="form-group" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', gap: '30px', alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                            <div>
                                <DatePicker
                                    selected={alarmStartAt}
                                    onChange={(date: Date | null) => setAlarmStartAt(date)}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    dateFormat="yyyy-MM-dd HH:mm"
                                    timeCaption="시간"
                                    locale={ko}
                                    inline
                                    dayClassName={getDayClassName}
                                    highlightDates={highlightDates}
                                />
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '10px', flex: 1 }}>
                                <label style={{ marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#495057' }}>알림 시작일시</label>
                                <div style={{ fontSize: '18px', fontWeight: '500', color: '#212529', marginBottom: '20px' }}>
                                    {alarmStartAt ? alarmStartAt.toLocaleString('ko-KR', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        hour12: false
                                    }) : <span style={{ color: '#adb5bd', fontSize: '14px' }}>날짜/시간 미선택</span>}
                                </div>

                                <div className="form-group">
                                    <label>알림 주기</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <input
                                            type="number"
                                            className="form-input"
                                            style={{ width: '60px' }}
                                            value={alarmInterval}
                                            onChange={e => {
                                                const value = e.target.value;
                                                if (value === '') {
                                                    setAlarmInterval('');
                                                } else {
                                                    const numValue = Number(value);
                                                    if (isNaN(numValue) || numValue < 1) {
                                                        setAlarmInterval(1);
                                                    } else {
                                                        setAlarmInterval(numValue);
                                                    }
                                                }
                                            }}
                                            placeholder="1"
                                            min="1"
                                        />
                                        <div className="radio-group" style={{ display: 'flex', flexDirection: 'row', gap: '10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '2rem', marginLeft: '20px', marginRight: '20px' }}>
                                                <input
                                                    type="radio"
                                                    name="intervalUnit"
                                                    value="YEAR"
                                                    checked={alarmIntervalUnit === 'YEAR'}
                                                    onChange={() => setAlarmIntervalUnit('YEAR')}
                                                />
                                                년
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '2rem', marginRight: '20px' }}>
                                                <input
                                                    type="radio"
                                                    name="intervalUnit"
                                                    value="MONTH"
                                                    checked={alarmIntervalUnit === 'MONTH'}
                                                    onChange={() => setAlarmIntervalUnit('MONTH')}
                                                />
                                                월
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', width: '2rem' }}>
                                                <input
                                                    type="radio"
                                                    name="intervalUnit"
                                                    value="DAY"
                                                    checked={alarmIntervalUnit === 'DAY'}
                                                    onChange={() => setAlarmIntervalUnit('DAY')}
                                                />
                                                일
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>반복 횟수 (비워두면 무한 반복)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={alarmRepeatCount}
                                        onChange={e => {
                                            const value = e.target.value;
                                            if (value === '') {
                                                setAlarmRepeatCount('');
                                            } else {
                                                const numValue = Number(value);
                                                // 0이나 음수 입력 시 그냥 빈값(무한) 처리하거나 1로?
                                                // 사용자가 0 입력 시 무한으로 인지하게 둠.
                                                setAlarmRepeatCount(numValue);
                                            }
                                        }}
                                        placeholder="예: 5"
                                        min="1"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>알림 채널</label>
                            <div className="checkbox-group">
                                <div
                                    className={`checkbox-card ${selectedChannels.has('EMAIL') ? 'checked' : ''}`}
                                    onClick={() => handleChannelToggle('EMAIL')}
                                >
                                    <span>Email</span>
                                </div>
                                <div
                                    className={`checkbox-card ${selectedChannels.has('JANDI') ? 'checked' : ''}`}
                                    onClick={() => handleChannelToggle('JANDI')}
                                >
                                    <span>JANDI</span>
                                </div>
                                <div
                                    className="checkbox-card disabled"
                                    style={{ opacity: 0.5, cursor: 'not-allowed', backgroundColor: '#f8f9fa' }}
                                    title="SMS 알림은 준비 중입니다."
                                >
                                    <span>SMS (준비중)</span>
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>수신자</label>
                            <div className="recipient-section">
                                <div className="recipient-list">
                                    {recipients.length > 0 ? (
                                        <div className="tags-container">
                                            {recipients.map(emp => (
                                                <span key={emp.emp_id} className="tag">
                                                    {emp.name}
                                                    <button type="button" onClick={() => setRecipients(prev => prev.filter(r => r.emp_id !== emp.emp_id))}>&times;</button>
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="placeholder-text">선택된 수신자가 없습니다.</span>
                                    )}
                                </div>
                                <button type="button" className="btn-add-recipient" onClick={() => setIsEmployeeSearchOpen(true)}>
                                    + 수신인 추가
                                </button>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn-secondary" onClick={onRequestClose}>취소</button>
                            <button type="submit" className="btn-primary" disabled={submitting}>
                                {submitting ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {isEmployeeSearchOpen && (
                <EmployeeSearchModal
                    onClose={() => setIsEmployeeSearchOpen(false)}
                    onSelect={(selectedEmployees: Employee[]) => {
                        // Convert Employee[] to EmployeeSimple[] and merge
                        const newRecipients: EmployeeSimple[] = selectedEmployees.map(e => ({
                            emp_id: e.emp_id,
                            name: e.name
                        }));

                        setRecipients(prev => {
                            const currentIds = new Set(prev.map(r => r.emp_id));
                            const toAdd = newRecipients.filter(r => !currentIds.has(r.emp_id));
                            return [...prev, ...toAdd];
                        });
                        setIsEmployeeSearchOpen(false);
                    }}
                    initialSelected={recipients}
                />
            )}
        </div>
    );
};

export default NotificationBundleModal;