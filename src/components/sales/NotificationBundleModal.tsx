import React, { useState, useEffect, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { projectService } from '../../api/services/projectService';
import { ProjectCalendarEntry, EmployeeSimple, ProjectCalendarBundleCreateRequest, Employee } from '../../api/types';
import EmployeeSearchModal from '../meeting/EmployeeSearchModal';
import '../../styles/modal.css';
import '../../styles/NotificationBundleModal.css';

interface NotificationBundleModalProps {
    isOpen: boolean;
    onRequestClose: () => void;
    selectedEntry: ProjectCalendarEntry | null;
    onSuccess: () => void;
}

const NotificationBundleModal: React.FC<NotificationBundleModalProps> = ({
    isOpen,
    onRequestClose,
    selectedEntry,
    onSuccess
}) => {
    const [nickname, setNickname] = useState('');
    const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
    const [alarmStartAt, setAlarmStartAt] = useState('');
    const [alarmIntervalDays, setAlarmIntervalDays] = useState<number | ''>('');
    const [alarmRepeatCount, setAlarmRepeatCount] = useState<number | ''>('');
    const [selectedChannels, setSelectedChannels] = useState<Set<'email' | 'jandi'>>(new Set(['email']));
    const [recipients, setRecipients] = useState<EmployeeSimple[]>([]);
    const [isEmployeeSearchOpen, setIsEmployeeSearchOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && selectedEntry) {
            // Reset form
            setNickname(`${selectedEntry.event_name} 알림`);
            setPriority('medium');
            if (selectedEntry.ot_date) {
                setAlarmStartAt(selectedEntry.ot_date);
            } else {
                setAlarmStartAt('');
            }
            setAlarmIntervalDays('');
            setAlarmRepeatCount('');
            setSelectedChannels(new Set(['email']));
            setRecipients([]);
        }
    }, [isOpen, selectedEntry]);

    const highlightDates = useMemo(() => {
        if (!alarmStartAt) return [];

        const dates: Date[] = [];
        const start = new Date(alarmStartAt);
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
        if (!selectedEntry) return;
        if (selectedChannels.size === 0) {
            alert('적어도 하나의 알림 채널을 선택해주세요.');
            return;
        }

        setSubmitting(true);
        try {
            const requestData: ProjectCalendarBundleCreateRequest = {
                project_calendar_event_ids: [selectedEntry.event_id],
                bundle_nickname: nickname,
                priority,
                alarm_start_at: alarmStartAt ? new Date(alarmStartAt).toISOString() : undefined,
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
                    {selectedEntry && (
                        <div className="selected-projects-summary">
                            <strong>선택된 프로젝트:</strong> {selectedEntry.event_name}
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
                            <DatePicker
                                selected={alarmStartAt ? new Date(alarmStartAt) : null}
                                onChange={(date: Date | null) => {
                                    if (date) {
                                        // Format to YYYY-MM-DD for state consistency
                                        const year = date.getFullYear();
                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                        const day = String(date.getDate()).padStart(2, '0');
                                        setAlarmStartAt(`${year}-${month}-${day}`);
                                    } else {
                                        setAlarmStartAt('');
                                    }
                                }}
                                inline
                                dateFormat="yyyy-MM-dd"
                                highlightDates={highlightDates}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', paddingTop: '10px', flex: 1 }}>
                                <label style={{ marginBottom: '8px', fontWeight: '500', fontSize: '14px', color: '#495057' }}>알림 시작일</label>
                                <div style={{ fontSize: '18px', fontWeight: '500', color: '#212529', marginBottom: '20px' }}>
                                    {alarmStartAt || <span style={{ color: '#adb5bd', fontSize: '14px' }}>날짜 미선택</span>}
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
                                    + 직원 추가
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
