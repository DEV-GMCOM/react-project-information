import React, { useEffect, useMemo, useState } from 'react';
import { noticeService } from '../../api/services/noticeService';
import { Notice, NoticePayload, NoticeType } from '../../types/notice';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/NoticeManagement.module.css';

type NoticeTypeFilter = NoticeType | 'all';

const emptyForm: NoticePayload = {
    title: '',
    content: '',
    noticeType: 'system',
    notifyStartAt: null,
    notifyEndAt: null,
    isActive: true
};

const NoticeManagement: React.FC = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<NoticeTypeFilter>('all');
    const [showInactive, setShowInactive] = useState(false);
    const [form, setForm] = useState<NoticePayload>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);

    useEffect(() => {
        fetchNotices();
    }, [selectedType, showInactive]);

    const fetchNotices = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await noticeService.getNotices({
                noticeType: selectedType === 'all' ? undefined : selectedType,
                isActive: showInactive ? undefined : true
            });
            setNotices(data);
        } catch (err) {
            console.error('공지 조회 실패', err);
            setError('공지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const toIso = (value?: string | null) => {
        if (!value) return null;
        const asDate = new Date(value);
        return Number.isNaN(asDate.getTime()) ? null : asDate.toISOString();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        const payload: NoticePayload = {
            ...form,
            notifyStartAt: toIso(form.notifyStartAt),
            notifyEndAt: toIso(form.notifyEndAt)
        };

        try {
            if (editingId) {
                const updated = await noticeService.updateNotice(editingId, payload);
                setNotices(prev => prev.map(item => item.id === editingId ? updated : item));
            } else {
                const created = await noticeService.createNotice(payload);
                setNotices(prev => [created, ...prev]);
            }
            resetForm();
        } catch (err) {
            console.error('공지 저장 실패', err);
            setError('공지 저장에 실패했습니다. 입력값과 권한을 확인해주세요.');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setForm(emptyForm);
        setEditingId(null);
    };

    const handleEdit = (notice: Notice) => {
        setEditingId(notice.id);
        setForm({
            title: notice.title,
            content: notice.content,
            noticeType: notice.noticeType,
            notifyStartAt: notice.notifyStartAt ? toLocalInputValue(notice.notifyStartAt) : null,
            notifyEndAt: notice.notifyEndAt ? toLocalInputValue(notice.notifyEndAt) : null,
            isActive: notice.isActive
        });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('이 공지를 삭제하시겠습니까?')) return;
        setError(null);
        try {
            await noticeService.deleteNotice(id);
            setNotices(prev => prev.filter(item => item.id !== id));
            if (editingId === id) {
                resetForm();
            }
        } catch (err) {
            console.error('공지 삭제 실패', err);
            setError('공지 삭제에 실패했습니다.');
        }
    };

    const filteredNotices = useMemo(() => {
        return notices.filter(item => {
            const matchesType = selectedType === 'all' ? true : item.noticeType === selectedType;
            const matchesActive = showInactive ? true : item.isActive;
            return matchesType && matchesActive;
        });
    }, [notices, selectedType, showInactive]);

    const statusBadge = (isActive: boolean) => (
        <span className={`${styles.statusBadge} ${isActive ? styles.statusActive : styles.statusInactive}`}>
            {isActive ? '활성' : '비활성'}
        </span>
    );

    const typeLabel = (type: NoticeType) => {
        const map: Record<NoticeType, string> = {
            system: '시스템',
            maintenance: '점검',
            alert: '알림',
            emergency: '긴급',
            guide: '가이드'
        };
        return map[type] || type;
    };

    const toLocalInputValue = (iso: string) => {
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '';
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    const formatDate = (iso?: string | null) => {
        if (!iso) return '-';
        const date = new Date(iso);
        if (Number.isNaN(date.getTime())) return '-';
        return new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    };

    return (
        <div className={styles.noticeManagementContainer}>
            {/* Header */}
            <div className={styles.noticeHeader}>
                <div className={styles.noticeHeaderTitle}>
                    <h1>공지 관리</h1>
                    <p className={styles.noticeBreadcrumb}>운영관리 &gt; 공지 관리</p>
                </div>
                {user && (
                    <div className={styles.noticeAuthorInfo}>
                        작성자: {user.emp_name || user.email}
                    </div>
                )}
            </div>

            {/* Form Section */}
            <div className={styles.noticeFormCard}>
                <h2 className={styles.noticeCardTitle}>
                    {editingId ? '✏️ 공지 수정' : '📝 공지 등록'}
                </h2>
                <form onSubmit={handleSubmit}>
                    <div className={styles.noticeFormGrid}>
                        <div className={styles.noticeFormGroup}>
                            <label className={styles.noticeFormLabel}>제목</label>
                            <input
                                type="text"
                                className={styles.noticeInput}
                                value={form.title}
                                onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                required
                                placeholder="공지 제목을 입력하세요"
                            />
                        </div>
                        <div className={styles.noticeFormGroup}>
                            <label className={styles.noticeFormLabel}>공지 유형</label>
                            <select
                                className={styles.noticeSelect}
                                value={form.noticeType}
                                onChange={(e) => setForm(prev => ({ ...prev, noticeType: e.target.value as NoticeType }))}
                            >
                                <option value="system">시스템</option>
                                <option value="maintenance">점검</option>
                                <option value="alert">알림</option>
                                <option value="emergency">긴급</option>
                                <option value="guide">가이드</option>
                            </select>
                        </div>
                        <div className={styles.noticeFormGroup}>
                            <label className={styles.noticeFormLabel}>노출 시작</label>
                            <input
                                type="datetime-local"
                                className={styles.noticeInput}
                                value={form.notifyStartAt || ''}
                                onChange={(e) => setForm(prev => ({ ...prev, notifyStartAt: e.target.value || null }))}
                            />
                        </div>
                        <div className={styles.noticeFormGroup}>
                            <label className={styles.noticeFormLabel}>노출 종료</label>
                            <input
                                type="datetime-local"
                                className={styles.noticeInput}
                                value={form.notifyEndAt || ''}
                                onChange={(e) => setForm(prev => ({ ...prev, notifyEndAt: e.target.value || null }))}
                            />
                        </div>
                        <div className={`${styles.noticeFormGroup} ${styles.fullWidth}`}>
                            <label className={styles.noticeFormLabel}>내용</label>
                            <textarea
                                className={styles.noticeTextarea}
                                value={form.content}
                                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                                required
                                rows={5}
                                placeholder="공지 내용을 입력하세요"
                            />
                        </div>
                    </div>

                    <div className={styles.noticeCheckboxWrapper}>
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={form.isActive}
                            onChange={(e) => setForm(prev => ({ ...prev, isActive: e.target.checked }))}
                        />
                        <label htmlFor="isActive" className={styles.noticeCheckboxLabel}>활성화 (체크 시 즉시 노출 가능 상태가 됩니다)</label>
                    </div>

                    <div className={styles.noticeFormActions}>
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
                            {saving ? '저장 중...' : editingId ? '수정 완료' : '공지 등록'}
                        </button>
                        {editingId && (
                            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetForm}>
                                취소
                            </button>
                        )}
                    </div>
                </form>
                {error && <div className={styles.formErrorMessage}>{error}</div>}
            </div>

            {/* Filter Section */}
            <div className={styles.noticeFilterBar}>
                <div className={styles.noticeFormGroup}>
                    <label className={styles.noticeFormLabel}>유형 필터</label>
                    <select
                        className={styles.noticeSelect}
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value as NoticeTypeFilter)}
                    >
                        <option value="all">전체 보기</option>
                        <option value="system">시스템</option>
                        <option value="maintenance">점검</option>
                        <option value="alert">알림</option>
                        <option value="emergency">긴급</option>
                        <option value="guide">가이드</option>
                    </select>
                </div>
                <div className={styles.noticeCheckboxWrapper} style={{ marginTop: '26px', marginBottom: '4px' }}>
                    <input
                        type="checkbox"
                        id="showInactive"
                        checked={showInactive}
                        onChange={(e) => setShowInactive(e.target.checked)}
                    />
                    <label htmlFor="showInactive" className={styles.noticeCheckboxLabel}>비활성 공지 포함</label>
                </div>
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={fetchNotices}
                    style={{ marginLeft: 'auto' }}
                >
                    ↻ 목록 새로고침
                </button>
            </div>

            {/* List Section */}
            <div className={styles.noticeListCard}>
                <div className={styles.noticeListHeader}>
                    <h2 className={styles.noticeListTitle}>📋 공지 목록</h2>
                    {loading && <span style={{ color: '#6b7280', fontSize: '14px' }}>데이터를 불러오는 중입니다...</span>}
                </div>
                <div className={styles.noticeTableContainer}>
                    <table className={styles.noticeTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>제목</th>
                                <th>유형</th>
                                <th>노출 기간</th>
                                <th>상태</th>
                                <th style={{ width: '200px' }}>관리</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredNotices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={styles.emptyState}>
                                        {loading ? '로딩 중...' : '등록된 공지가 없습니다.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredNotices.map(notice => (
                                    <tr key={notice.id}>
                                        <td style={{ fontWeight: 600 }}>{notice.title}</td>
                                        <td>{typeLabel(notice.noticeType)}</td>
                                        <td>
                                            <div style={{ fontSize: '13px' }}>
                                                {formatDate(notice.notifyStartAt)} ~ <br />
                                                {formatDate(notice.notifyEndAt)}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${notice.isActive ? styles.statusActive : styles.statusInactive}`}>
                                                {notice.isActive ? '활성' : '비활성'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    type="button"
                                                    className={`${styles.btnSm} ${styles.btnPreview}`}
                                                    onClick={() => setPreviewNotice(notice)}
                                                >
                                                    미리보기
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${styles.btnSm} ${styles.btnEdit}`}
                                                    onClick={() => handleEdit(notice)}
                                                >
                                                    수정
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${styles.btnSm} ${styles.btnDelete}`}
                                                    onClick={() => handleDelete(notice.id)}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Preview Modal */}
            {previewNotice && (
                <div className={styles.previewModalOverlay} onClick={() => setPreviewNotice(null)}>
                    <div className={styles.previewModalContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.previewModalHeader}>
                            <h2>📢 공지 미리보기</h2>
                            <button className={styles.previewCloseBtn} onClick={() => setPreviewNotice(null)}>×</button>
                        </div>
                        <div className={styles.previewModalBody}>
                            <h3 style={{ marginTop: 0, fontSize: '20px', color: '#111827' }}>{previewNotice.title}</h3>
                            <div className={styles.previewNoticeMeta}>
                                <span>🏷️ {typeLabel(previewNotice.noticeType)}</span>
                                <span>📅 {formatDate(previewNotice.notifyStartAt)} ~ {formatDate(previewNotice.notifyEndAt)}</span>
                                <span className={`${styles.statusBadge} ${previewNotice.isActive ? styles.statusActive : styles.statusInactive}`}>
                                    {previewNotice.isActive ? '활성' : '비활성'}
                                </span>
                            </div>
                            <div className={styles.previewNoticeContent}>
                                {previewNotice.content}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NoticeManagement;
