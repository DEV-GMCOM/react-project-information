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
    isActive: false // 초기값을 미체크 상태로 변경
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

    // 페이징 상태
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10; // 페이지당 10개

    useEffect(() => {
        fetchNotices(1); // 필터 변경 시 1페이지부터 조회
    }, [selectedType, showInactive]);

    useEffect(() => {
        fetchNotices(page); // 페이지 변경 시 해당 페이지 조회
    }, [page]);

    const fetchNotices = async (currentPage: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await noticeService.getNotices({
                noticeType: selectedType === 'all' ? undefined : selectedType,
                isActive: showInactive ? undefined : true,
                page: currentPage,
                limit: limit
            });
            setNotices(data.items);
            setTotalPages(data.totalPages);
        } catch (err) {
            console.error('공지 조회 실패', err);
            setError('공지 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
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
                // 등록 후 첫 페이지로 이동하여 목록 갱신
                setPage(1);
                fetchNotices(1);
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
        
        // 삭제 작업 시작 시 로딩 표시
        setLoading(true);
        setError(null);
        try {
            await noticeService.deleteNotice(id);
            // 삭제 후 현재 페이지 다시 로드 (await로 완료 대기)
            await fetchNotices(page);
            if (editingId === id) {
                resetForm();
            }
        } catch (err) {
            console.error('공지 삭제 실패', err);
            setError('공지 삭제에 실패했습니다.');
            // 에러 발생 시 로딩 해제 (성공 시에는 fetchNotices 내부의 finally에서 해제됨)
            setLoading(false);
        }
    };

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

    const getNoticeEmoji = (type: NoticeType) => {
        switch (type) {
            case 'system': return '⚙️';
            case 'maintenance': return '🛠️';
            case 'alert': return '🔔';
            case 'emergency': return '🚨';
            case 'guide': return '📘';
            default: return '📢';
        }
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

            {/* Editor Section (Split Layout) */}
            <form onSubmit={handleSubmit} className={styles.editorLayout}>
                {/* Left: Simulated Modal (Visual Editor) */}
                <div className={styles.simulatedModal}>
                    <div className={styles.simulatedHeader}>
                        <h2 className={styles.simulatedHeaderTitle}>📢 공지사항</h2>
                        <button type="button" className={styles.previewCloseBtn} style={{ cursor: 'default' }}>×</button>
                    </div>
                    <div className={styles.simulatedBody}>
                        <div className={styles.simulatedNoticeItem}>
                            <div className={styles.simulatedTitleRow}>
                                <span className={styles.simulatedEmoji}>{getNoticeEmoji(form.noticeType)}</span>
                                <input
                                    type="text"
                                    className={styles.invisibleInput}
                                    value={form.title}
                                    onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                                    required
                                    placeholder="공지 제목을 입력하세요"
                                />
                            </div>
                            <div className={styles.simulatedMeta}>
                                <span>{typeLabel(form.noticeType)}</span>
                                <span>·</span>
                                <span>
                                    {form.notifyStartAt ? formatDate(form.notifyStartAt) : '시작일 미정'} ~{' '}
                                    {form.notifyEndAt ? formatDate(form.notifyEndAt) : '종료일 미정'}
                                </span>
                            </div>
                            <textarea
                                className={styles.invisibleTextarea}
                                value={form.content}
                                onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                                required
                                placeholder="공지 내용을 입력하세요. 실제 모달과 유사한 환경에서 작성할 수 있습니다."
                            />
                        </div>
                    </div>
                </div>

                {/* Right: Control Panel */}
                <div className={styles.controlPanel}>
                    <h3 className={styles.controlSectionTitle}>
                        {editingId ? '✏️ 설정 수정' : '📝 새 공지 설정'}
                    </h3>
                    
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

                    <div className={styles.noticeCheckboxWrapper}>
                        <label className={styles.noticeCheckboxLabel}>
                            <input
                                type="checkbox"
                                checked={form.isActive}
                                onChange={(e) => {
                                    const newIsActive = e.target.checked;
                                    setForm(prev => {
                                        const newState = { ...prev, isActive: newIsActive };
                                        if (newIsActive && !prev.notifyStartAt) {
                                            // 즉시 활성화 시 노출 시작일에 현재 시각 자동 입력
                                            const now = new Date();
                                            const pad = (n: number) => n.toString().padStart(2, '0');
                                            newState.notifyStartAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
                                        }
                                        return newState;
                                    });
                                }}
                                style={{ marginRight: '8px' }}
                            />
                            즉시 활성화 (사용자에게 노출)
                        </label>
                    </div>

                    {error && <div className={styles.formErrorMessage}>{error}</div>}

                    <div className={styles.noticeFormActions}>
                        {editingId && (
                            <button type="button" className={`${styles.btn} ${styles.btnSecondary}`} onClick={resetForm}>
                                취소
                            </button>
                        )}
                        <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`} disabled={saving}>
                            {saving ? '저장 중...' : editingId ? '수정 완료' : '공지 등록'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Filter Section */}
            <div className={styles.noticeFilterBar}>
                <div className={styles.noticeFormGroup}>
                    <label className={styles.noticeFormLabel}>유형 필터</label>
                    <select
                        className={styles.noticeSelect}
                        value={selectedType}
                        onChange={(e) => {
                            setSelectedType(e.target.value as NoticeTypeFilter);
                            setPage(1); // 필터 변경 시 1페이지로
                        }}
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
                        onChange={(e) => {
                            setShowInactive(e.target.checked);
                            setPage(1); // 필터 변경 시 1페이지로
                        }}
                    />
                    <label htmlFor="showInactive" className={styles.noticeCheckboxLabel}>비활성 공지 포함</label>
                </div>
                <button
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={() => fetchNotices(page)}
                    style={{ marginLeft: 'auto' }}
                >
                    ↻ 목록 새로고침
                </button>
            </div>

            {/* List Section */}
            <div className={styles.noticeListCard}>
                {loading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                    </div>
                )}
                <div className={styles.noticeListHeader}>
                    <h2 className={styles.noticeListTitle}>📋 공지 목록</h2>
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
                            {!loading && notices.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className={styles.emptyState}>
                                        등록된 공지가 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                notices.map(notice => (
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
                {/* Pagination Control */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px', gap: '10px' }}>
                        <button 
                            onClick={() => handlePageChange(page - 1)} 
                            disabled={page === 1}
                            className={styles.btnSecondary}
                            style={{ padding: '6px 12px' }}
                        >
                            &lt; 이전
                        </button>
                        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 500 }}>
                            {page} / {totalPages}
                        </span>
                        <button 
                            onClick={() => handlePageChange(page + 1)} 
                            disabled={page === totalPages}
                            className={styles.btnSecondary}
                            style={{ padding: '6px 12px' }}
                        >
                            다음 &gt;
                        </button>
                    </div>
                )}
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
