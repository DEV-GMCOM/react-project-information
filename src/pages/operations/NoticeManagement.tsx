import React, { useEffect, useMemo, useState } from 'react';
import { noticeService } from '../../api/services/noticeService';
import { Notice, NoticePayload, NoticeType, ContentType } from '../../types/notice';
import { useAuth } from '../../contexts/AuthContext';
import styles from '../../styles/NoticeManagement.module.css';
import NoticeModal from '../../components/NoticeModal'; // NoticeModal 임포트

type NoticeTypeFilter = NoticeType | 'all';

const emptyForm: NoticePayload = {
    title: '',
    content: '',
    contentType: 'text', // 기본값 text
    noticeType: 'system',
    notifyStartAt: null,
    notifyEndAt: null,
    isActive: false 
};

const NoticeManagement: React.FC = () => {
    const { user } = useAuth();
    const [notices, setNotices] = useState<Notice[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<NoticeTypeFilter>('all');
    const [showActiveOnly, setShowActiveOnly] = useState(false); // 초기값을 false로 변경하여 모든 공지 표시
    const [form, setForm] = useState<NoticePayload>(emptyForm);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [previewNotice, setPreviewNotice] = useState<Notice | null>(null);
    
    // HTML 미리보기 상태
    const [showHtmlPreview, setShowHtmlPreview] = useState(false);

    // 페이징 상태
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const limit = 10; // 페이지당 10개

    useEffect(() => {
        fetchNotices(1); // 필터 변경 시 1페이지부터 조회
    }, [selectedType, showActiveOnly]); // showInactive -> showActiveOnly

    useEffect(() => {
        fetchNotices(page); // 페이지 변경 시 해당 페이지 조회
    }, [page]);

    const fetchNotices = async (currentPage: number) => {
        setLoading(true);
        setError(null);
        try {
            const data = await noticeService.getNotices({
                noticeType: selectedType === 'all' ? undefined : selectedType,
                isActive: showActiveOnly ? true : undefined, // 로직 반전: showActiveOnly가 true면 isActive:true, 아니면 undefined
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
        setShowHtmlPreview(false);
    };

    const handleEdit = (notice: Notice) => {
        setEditingId(notice.id);
        setForm({
            title: notice.title,
            content: notice.content,
            contentType: notice.contentType || 'text',
            noticeType: notice.noticeType,
            notifyStartAt: notice.notifyStartAt ? toLocalInputValue(notice.notifyStartAt) : null,
            notifyEndAt: notice.notifyEndAt ? toLocalInputValue(notice.notifyEndAt) : null,
            isActive: notice.isActive
        });
        setShowHtmlPreview(false);
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

    const statusBadge = (notice: Notice) => {
        const now = new Date();
        const start = notice.notifyStartAt ? new Date(notice.notifyStartAt) : null;
        const end = notice.notifyEndAt ? new Date(notice.notifyEndAt) : null;

        let emoji = '';
        let statusText = '';
        let badgeClass = '';

        if (!notice.isActive) {
            emoji = '🔴';
            statusText = '비활성';
            badgeClass = styles.statusInactive;
        } else if (!start || (start && now < start)) { // 시작일이 없거나 현재보다 미래인 경우
            emoji = '🔵';
            statusText = '공지 대기';
            badgeClass = styles.statusActive; // 노출 예정도 활성 대기이므로 active와 유사한 색상
        } else if (end && now > end) { // 활성이고 시작일이 지났지만, 종료일이 현재보다 과거인 경우
            emoji = '⚫';
            statusText = '공지 만료';
            badgeClass = styles.statusExpired;
        } else { // 활성이고 시작일이 지났고, 종료일이 없거나 현재보다 미래인 경우
            emoji = '🟢';
            statusText = '활성';
            badgeClass = styles.statusActive;
        }

        return (
            <span className={`${styles.statusBadge} ${badgeClass}`}>
                {emoji} {statusText}
            </span>
        );
    };

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
                            
                            {/* Content Type Selector & Preview Toggle */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="contentType"
                                            value="text"
                                            checked={form.contentType === 'text'}
                                            onChange={() => {
                                                setForm(prev => ({ ...prev, contentType: 'text' }));
                                                setShowHtmlPreview(false);
                                            }}
                                        />
                                        Text
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            name="contentType"
                                            value="html"
                                            checked={form.contentType === 'html'}
                                            onChange={() => setForm(prev => ({ ...prev, contentType: 'html' }))}
                                        />
                                        HTML
                                    </label>
                                </div>
                                {form.contentType === 'html' && (
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontSize: '12px', color: '#2563eb' }}>
                                        <input
                                            type="checkbox"
                                            checked={showHtmlPreview}
                                            onChange={(e) => setShowHtmlPreview(e.target.checked)}
                                        />
                                        미리보기
                                    </label>
                                )}
                            </div>

                            {/* Content Area */}
                            {form.contentType === 'html' && showHtmlPreview ? (
                                <div 
                                    className={styles.invisibleTextarea} 
                                    style={{ whiteSpace: 'normal', overflowY: 'auto', border: '1px solid #e5e7eb', padding: '8px' }}
                                    dangerouslySetInnerHTML={{ __html: form.content }}
                                />
                            ) : (
                                <textarea
                                    className={styles.invisibleTextarea}
                                    value={form.content}
                                    onChange={(e) => setForm(prev => ({ ...prev, content: e.target.value }))}
                                    required
                                    placeholder={form.contentType === 'html' ? "HTML 태그를 입력하세요." : "공지 내용을 입력하세요. 실제 모달과 유사한 환경에서 작성할 수 있습니다."}
                                />
                            )}
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
                        <label className={styles.noticeFormLabel}>공지 시작</label>
                        <input
                            type="datetime-local"
                            className={styles.noticeInput}
                            value={form.notifyStartAt || ''}
                            onChange={(e) => setForm(prev => ({ ...prev, notifyStartAt: e.target.value || null }))}
                        />
                    </div>

                    <div className={styles.noticeFormGroup}>
                        <label className={styles.noticeFormLabel}>공지 종료</label>
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

            {/* List Section */}
            <div className={styles.noticeListCard}>
                {loading && (
                    <div className={styles.loadingOverlay}>
                        <div className={styles.spinner}></div>
                    </div>
                )}
                <div className={styles.noticeListHeader}>
                    <h2 className={styles.noticeListTitle}>📋 공지 목록</h2>
                    <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => fetchNotices(page)}
                        style={{ padding: '8px 16px', fontSize: '13px', flex: 'none' }}
                    >
                        ↻ 목록 새로고침
                    </button>
                </div>
                <div className={styles.noticeTableContainer}>
                    <table className={styles.noticeTable}>
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>제목</th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        유형
                                        <select
                                            className={styles.thSelect}
                                            value={selectedType}
                                            onChange={(e) => {
                                                setSelectedType(e.target.value as NoticeTypeFilter);
                                                setPage(1);
                                            }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <option value="all">전체</option>
                                            <option value="system">시스템</option>
                                            <option value="maintenance">점검</option>
                                            <option value="alert">알림</option>
                                            <option value="emergency">긴급</option>
                                            <option value="guide">가이드</option>
                                        </select>
                                    </div>
                                </th>
                                <th>공지 기간</th>
                                <th>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        상태
                                        <label className={styles.thCheckboxWrapper} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={showActiveOnly}
                                                onChange={(e) => {
                                                    setShowActiveOnly(e.target.checked);
                                                    setPage(1);
                                                }}
                                            />
                                            <span style={{ fontSize: '12px', fontWeight: 'normal' }}>활성만</span>
                                        </label>
                                    </div>
                                </th>
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
                                    <tr 
                                        key={notice.id} 
                                        className={editingId === notice.id ? styles.selectedRow : ''}
                                    >
                                        <td style={{ fontWeight: 600 }}>{notice.title}</td>
                                        <td>{typeLabel(notice.noticeType)}</td>
                                        <td>
                                            <div style={{ fontSize: '13px' }}>
                                                {formatDate(notice.notifyStartAt)} ~ <br />
                                                {formatDate(notice.notifyEndAt)}
                                            </div>
                                        </td>
                                        <td>
                                            {statusBadge(notice)}
                                        </td>
                                        <td>
                                            <div className={styles.actionButtons}>
                                                <button
                                                    type="button"
                                                    className={`${styles.btnSm} ${styles.btnPreview}`}
                                                    onClick={() => setPreviewNotice(notice)}
                                                    title="미리보기"
                                                >
                                                    👁️
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${styles.btnSm} ${styles.btnEdit}`}
                                                    onClick={() => handleEdit(notice)}
                                                    title="수정"
                                                >
                                                    ✏️
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`${styles.btnSm} ${styles.btnDelete}`}
                                                    onClick={() => handleDelete(notice.id)}
                                                    title="삭제"
                                                >
                                                    🗑️
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

            {/* Preview Modal (Using Shared Component) */}
            {previewNotice && (
                <NoticeModal
                    isOpen={!!previewNotice}
                    onClose={() => setPreviewNotice(null)}
                    previewNotice={previewNotice}
                />
            )}
        </div>
    );
};


export default NoticeManagement;
