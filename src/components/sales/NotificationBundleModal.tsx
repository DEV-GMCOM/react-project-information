import React, { useState, useEffect, useMemo } from 'react';
import { ko } from 'date-fns/locale';
import { projectService } from '../../api/services/projectService';
import { ProjectCalendarEntry, EmployeeSimple, ProjectCalendarBundleCreateRequest, Employee } from '../../api/types';
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
}

const NotificationBundleModal: React.FC<NotificationBundleModalProps> = ({
    isOpen,
    onRequestClose,
    selectedEntries,
    onSuccess
}) => {
    const [nickname, setNickname] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [alarmStartAt, setAlarmStartAt] = useState<Date | null>(null);
    const [alarmIntervalDays, setAlarmIntervalDays] = useState<number | ''>('');
    const [alarmRepeatCount, setAlarmRepeatCount] = useState<number | ''>('');
    const [selectedChannels, setSelectedChannels] = useState<Set<'email' | 'jandi'>>(new Set(['email']));
    const [recipients, setRecipients] = useState<EmployeeSimple[]>([]);
    const [isEmployeeSearchOpen, setIsEmployeeSearchOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

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
        if (isOpen && selectedEntries.length > 0) {
            // Reset form
            const firstEntry = selectedEntries[0];
            if (selectedEntries.length === 1) {
                setNickname(`${firstEntry.event_name} 알림`);
            } else {
                setNickname(`${firstEntry.event_name} 외 ${selectedEntries.length - 1}건 알림`);
            }

            setPriority('medium');
            if (firstEntry.ot_date) {
                setAlarmStartAt(new Date(firstEntry.ot_date));
            } else {
                setAlarmStartAt(null);
            }
            setAlarmIntervalDays('');
            setAlarmRepeatCount('');
            setSelectedChannels(new Set(['email']));
            setRecipients([]);
        }
    }, [isOpen, selectedEntries]);

    const highlightDates = useMemo(() => {
        if (!alarmStartAt) return [];

        const dates: Date[] = [];
        const start = alarmStartAt;
        // If no count or interval specified, just highlight the start date (already handled by 'selected')
        // If specified, calculate sequence
        const count = alarmRepeatCount === '' ? 1 : Number(alarmRepeatCount);
        const interval = alarmIntervalDays === '' ? 0 : Number(alarmIntervalDays);

        for (let i = 0; i < count; i++) {
            const nextDate = new Date(start);
            nextDate.setDate(start.getDate() + (i * interval));
            dates.push(nextDate);
        }
        return dates;
    }, [alarmStartAt, alarmIntervalDays, alarmRepeatCount]);

    const handleChannelToggle = (channel: 'email' | 'jandi') => {
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
        if (selectedEntries.length === 0) return;
        if (selectedChannels.size === 0) {
            alert('적어도 하나의 알림 채널을 선택해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const requestData: ProjectCalendarBundleCreateRequest = {
                project_calendar_event_ids: selectedEntries.map(e => e.event_id),
                bundle_nickname: nickname,
                priority,
                alarm_start_at: alarmStartAt ? alarmStartAt.toISOString() : undefined,
                alarm_interval_days: alarmIntervalDays === '' ? undefined : Number(alarmIntervalDays),
                alarm_repeat_count: alarmRepeatCount === '' ? undefined : Number(alarmRepeatCount),
                channels: Array.from(selectedChannels),
                recipient_emp_ids: recipients.map(r => r.emp_id)
            };

            await projectService.createProjectCalendarBundle(requestData);
            alert('알림 설정이 저장되었습니다.');
            onSuccess();
            onRequestClose();
        } catch (error) {
            console.error('Failed to create bundle:', error);
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
                    <h2>알림 설정 등록</h2>
                    <button onClick={onRequestClose} className="modal-close-button">&times;</button>
                </div>
                <div className="modal-body">
                    {selectedEntries.length > 0 && (
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
                                <option value="low">낮음</option>
                                <option value="medium">중간</option>
                                <option value="high">매우중요</option>
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
                                    <label>알림 간격 (일)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={alarmIntervalDays}
                                        onChange={e => setAlarmIntervalDays(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="예: 7"
                                    />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label>반복 횟수</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={alarmRepeatCount}
                                        onChange={e => setAlarmRepeatCount(e.target.value === '' ? '' : Number(e.target.value))}
                                        placeholder="예: 5"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>알림 채널</label>
                            <div className="checkbox-group">
                                <div 
                                    className={`checkbox-card ${selectedChannels.has('email') ? 'checked' : ''}`}
                                    onClick={() => handleChannelToggle('email')}
                                >
                                    <span>Email</span>
                                </div>
                                <div 
                                    className={`checkbox-card ${selectedChannels.has('jandi') ? 'checked' : ''}`}
                                    onClick={() => handleChannelToggle('jandi')}
                                >
                                    <span>JANDI</span>
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
