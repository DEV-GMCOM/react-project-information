// src/components/NoticeModal.tsx
import React, { useState, useEffect, useCallback } from 'react';
import '../styles/NoticeModal.css';
import { saveSeenNoticeIds } from '../utils/noticeCookie'; // 쿠키 유틸 임포트
import { Notice, NoticeType } from '../types/notice'; // Notice 타입 임포트
import { noticeService } from '../api/services/noticeService'; // API 서비스 임포트
import { notificationService, NotificationResponse } from '../api/services/notificationService';
import { useAuth } from '../contexts/AuthContext';

// 이미지 Assets Import (Vite가 경로 자동 처리)
import guide01 from '../assets/guide/jandi_webhook/guide_01.png';
import guide02 from '../assets/guide/jandi_webhook/guide_02.png';
import guide03 from '../assets/guide/jandi_webhook/guide_03.png';
import guide04 from '../assets/guide/jandi_webhook/guide_04.png';
import guide05 from '../assets/guide/jandi_webhook/guide_05.png';
import guide06 from '../assets/guide/jandi_webhook/guide_06.png';

interface NoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
    previewNotice?: Notice | null; // 미리보기용 단일 공지 데이터 (Optional)
}

const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose, previewNotice }) => {
    const { refreshNotifications, hasUnreadNotification } = useAuth(); // 전역 알림 상태 가져오기
    const [activeTab, setActiveTab] = useState<'notice' | 'notification'>('notice');
    const [activeNotices, setActiveNotices] = useState<Notice[]>([]); // 활성 공지 목록
    const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가

    // 알림 관련 상태
    const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
    const [hasUnreadPersonalNoti, setHasUnreadPersonalNoti] = useState(false);

    // 모달이 열릴 때 읽음 상태 체크 및 공지 목록 조회
    useEffect(() => {
        if (isOpen && !previewNotice) { // 미리보기가 아닐 때만 동작
            if (activeTab === 'notice') {
                fetchActiveNotices();
            } else {
                fetchNotifications();
            }
        }
    }, [isOpen, activeTab, previewNotice]);

    const fetchActiveNotices = async () => {
        setIsLoading(true);
        try {
            // 활성 상태인 공지만 조회 (페이지네이션 없이 전체 조회하거나 충분히 큰 limit 설정)
            const data = await noticeService.getNotices({ 
                isActive: true, 
                limit: 50 
            });

            const now = new Date();
            const validNotices = data.items.filter(notice => {
                if (!notice.notifyStartAt) return false;
                const start = new Date(notice.notifyStartAt);
                const end = notice.notifyEndAt ? new Date(notice.notifyEndAt) : null;
                const now = new Date(); 

                if (now < start) return false;
                if (!end) return true;
                return now <= end;
            });

            setActiveNotices(validNotices);

            // 공지사항 탭이 활성화되어 있으면 바로 읽음 처리 (쿠키 저장)
            if (activeTab === 'notice') {
                const ids = validNotices.map(n => n.id);
                if (ids.length > 0) {
                    saveSeenNoticeIds(ids);
                    // 쿠키 업데이트 후 메인 버튼 상태 갱신을 위해 리프레시 요청
                    refreshNotifications(); 
                }
            }

        } catch (error) {
            console.error("Failed to fetch active notices:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const data = await notificationService.getNotifications(false, 20);
            setNotifications(data);
            
            // 안읽은 알림 존재 여부 체크
            const unread = data.some(n => !n.isRead);
            setHasUnreadPersonalNoti(unread);
            
            // 알림 탭을 보고 있다면? -> 여기서 자동 읽음 처리는 기획에 따라 다름.
            // 기획: "내 알림 탭의 경우 항목마다 사용자가 읽었는지 체크... 읽지 않은 항목이 있을경우 빨간색 점"
            // 사용자가 클릭하거나 명시적인 액션이 있을 때 읽음 처리하는 것이 일반적이지만, 
            // 일단 리스트만 가져옵니다.
            
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        } finally {
            setIsLoading(false);
        }
    };
    
    // 알림 항목 클릭 시 읽음 처리
    const handleNotificationClick = async (noti: NotificationResponse) => {
        if (!noti.isRead) {
            try {
                await notificationService.markAsRead(noti.id);
                
                // 목록 전체 갱신 대신 로컬 상태만 업데이트 (Optimistic UI)
                setNotifications(prev => prev.map(n => 
                    n.id === noti.id ? { ...n, isRead: true } : n
                ));
                
                // 글로벌 상태 갱신 (메인 버튼 점 제거용) - 비동기로 처리
                refreshNotifications();
            } catch (e) {
                console.error(e);
            }
        }
    };

    // 모달 닫힐 때 글로벌 상태 갱신
    const handleClose = () => {
        refreshNotifications();
        onClose();
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

    if (!isOpen) return null;

    // 미리보기 모드일 경우 렌더링
    if (previewNotice) {
        return (
            <div className="modal-overlay" onClick={onClose}>
                <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="notice-header">
                        <h2>📢 공지 미리보기</h2>
                        <button className="notice-close-btn" onClick={onClose}>×</button>
                    </div>
                    <div className="notice-body">
                        <div className="notice-item">
                            <h3>{getNoticeEmoji(previewNotice.noticeType)} {previewNotice.title}</h3>
                            <p className="notice-date">
                                {previewNotice.notifyStartAt ? new Date(previewNotice.notifyStartAt).toLocaleDateString() : '날짜 미정'}
                            </p>
                            <div className="notice-content">
                                {previewNotice.contentType === 'html' ? (
                                    <div dangerouslySetInnerHTML={{ __html: previewNotice.content }} />
                                ) : (
                                    previewNotice.content
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="notice-footer" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn-primary" onClick={onClose}>닫기</button>
                    </div>
                </div>
            </div>
        );
    }

    // 기존 로직 (전체 공지 목록 및 알림 탭)
    // 가이드 이미지 목록 (Import된 객체 사용)
    const guideImages = [guide01, guide02, guide03, guide04, guide05, guide06];

    // 이미지별 설명
    const imageDescriptions = [
        "좌측 채팅에서 '나와의 대화'를 선택하고, 우상단의 '커넥트' 버튼을 클릭합니다.",
        "'연동 항목 추가하기' 버튼을 클릭합니다.",
        <>
            <strong style={{ color: '#ef4444' }}>'Webhook 수신 (Incoming Webhook)'</strong> 의 '연동하기' 버튼을 클릭합니다.<br />
            <strong style={{ color: '#ef4444' }}>'Webhook 수신'</strong> 입니다!!! 혼동하지 마세요~
        </>,
        "토픽/JANDI 선택 : 'JANDI' 로 설정하시고, '연동 추가하기' 버튼을 클릭합니다.",
        "Webhook URL 복사 버튼을 클릭하여 URL을 복사합니다.",
        <>
            복사한 Webhook URL을 설정 창에 붙여넣고 '등록하기' 버튼을 클릭합니다.<br />
            설정 완료 후 개인 알림 메시지를 수신할 수 있습니다.
        </>,
    ];

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notice-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                    <h2>🔔 알림 센터</h2>
                    <button className="notice-close-btn" onClick={handleClose}>×</button>
                </div>

                {/* 탭 네비게이션 */}
                <div className="notice-tabs">
                    <button
                        className={`notice-tab-btn ${activeTab === 'notice' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notice')}
                    >
                        📢 공지사항
                        {/* 공지사항 탭의 레드닷은 여기서 관리하지 않음 (이미 보고 있으면 사라짐) */}
                    </button>
                    <button
                        className={`notice-tab-btn ${activeTab === 'notification' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notification')}
                    >
                        💬 내 알림
                        {(hasUnreadNotification || hasUnreadPersonalNoti) && <span style={{ marginLeft: '6px', color: '#ef4444', fontSize: '12px' }}>●</span>}
                    </button>
                </div>

                <div className="notice-body">
                    {isLoading ? (
                        <div className="notice-loading-container">
                            <div className="notice-spinner"></div>
                            <span className="notice-loading-text">데이터를 불러오는 중입니다...</span>
                        </div>
                    ) : (
                        activeTab === 'notice' ? (
                            // --- 공지사항 탭 내용 ---
                            <>
                                {/* 실제 활성 공지 렌더링 (최상단 배치) */}
                                {activeNotices.map(notice => (
                                    <div className="notice-item" key={notice.id}>
                                        <h3>{getNoticeEmoji(notice.noticeType)} {notice.title}</h3>
                                        <p className="notice-date">
                                            {notice.notifyStartAt ? new Date(notice.notifyStartAt).toLocaleDateString() : ''}
                                        </p>
                                        <div className="notice-content">
                                            {notice.contentType === 'html' ? (
                                                <div dangerouslySetInnerHTML={{ __html: notice.content }} />
                                            ) : (
                                                notice.content
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* 하드코딩된 예시 공지 (유지 - 순서상 뒤로 밀림) */}
                                {/* '시스템 업데이트 안내'와 '정기 점검 안내'는 삭제됨 */}

                                <div className="notice-item">
                                    <h3>📋 사용 가이드</h3>
                                    <p className="notice-date">2025-12-03</p>
                                    <p className="notice-content">
                                        프로젝트 관리 시스템 사용 가이드가 업데이트되었습니다.<br />
                                        상단 메뉴의 '도움말'을 참고해주세요.
                                    </p>

                                    {/* 잔디 가이드 (들여쓰기 섹션) */}
                                    <div className="notice-indented-section" style={{ marginTop: '16px' }}>
                                        <h4 style={{ fontSize: '16px', marginBottom: '8px', color: '#555' }}>👉 잔디(Jandi) 연동 가이드</h4>
                                        <p className="notice-content">
                                            알림을 받기 위한 잔디 웹훅(Webhook) 연동 방법입니다.<br />
                                            아래 이미지를 따라 설정을 진행해주세요.
                                        </p>
                                        <div className="notice-guide-images">
                                            {guideImages.map((imgSrc, index) => (
                                                <React.Fragment key={index}>
                                                    <img
                                                        src={imgSrc}
                                                        alt={`잔디 연동 가이드 ${index + 1}`}
                                                        className="guide-image"
                                                        style={{ marginBottom: '10px' }}
                                                    />
                                                    {imageDescriptions[index] && (
                                                        <p className="image-description" style={{ marginTop: '-5px', marginBottom: '20px', fontSize: '14px', color: '#666', lineHeight: '1.4' }}>
                                                            {index + 1}. {imageDescriptions[index]}
                                                        </p>
                                                    )}
                                                </React.Fragment>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </>
                                            ) : (
                                                // --- 알림 탭 내용 ---
                                                <div className="notification-list">
                                                    <div style={{ padding: '0 4px 12px 4px', color: '#888', fontSize: '12px', textAlign: 'right' }}>
                                                        * 최근 30일 간의 알림만 표시됩니다.
                                                    </div>
                                                    {notifications.length > 0 ? (
                                                        notifications.map(noti => (                                                                            <div 
                                                                                key={noti.id} 
                                                                                className={`notification-item ${!noti.isRead ? 'unread' : ''}`}
                                                                            >
                                                                                <div className="notification-icon">
                                                                                    {noti.notice_type === 'stt' ? '🎙️' : '📢'}
                                                                                </div>
                                                                                <div className="notification-content-wrapper">
                                                                                    <h4 className="notification-title">{noti.title}</h4>
                                                                                    <p className="notification-message">{noti.content}</p>
                                                                                    <span className="notification-time">{new Date(noti.createDt).toLocaleString()}</span>
                                                                                </div>
                                                                                
                                                                                {/* 읽음 상태/처리 버튼 */}
                                                                                <div style={{ marginLeft: '12px', display: 'flex', alignItems: 'center', minWidth: '70px', justifyContent: 'flex-end' }}>
                                                                                    {!noti.isRead ? (
                                                                                        <button 
                                                                                            onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                handleNotificationClick(noti);
                                                                                            }}
                                                                                            style={{
                                                                                                fontSize: '11px',
                                                                                                padding: '4px 8px',
                                                                                                border: '1px solid #1890ff',
                                                                                                borderRadius: '4px',
                                                                                                background: '#fff',
                                                                                                color: '#1890ff',
                                                                                                cursor: 'pointer',
                                                                                                whiteSpace: 'nowrap'
                                                                                            }}
                                                                                        >
                                                                                            읽음 처리
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span style={{ fontSize: '11px', color: '#aaa', whiteSpace: 'nowrap' }}>읽음</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>                                    ))
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                        새로운 알림이 없습니다.
                                    </div>
                                )}
                            </div>
                        )
                    )}
                </div>

                {/* Footer: 탭에 따라 다르게 표시 */}
                {activeTab === 'notice' && (
                    <div className="notice-footer" style={{ justifyContent: 'flex-end', borderTop: 'none', paddingTop: '10px' }}>
                        <label className="notice-checkbox-label">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        const today = new Date().toDateString();
                                        localStorage.setItem('notice_hidden_until', today);
                                    } else {
                                        localStorage.removeItem('notice_hidden_until');
                                    }
                                }}
                            />
                            <span>오늘 하루 보지 않기</span>
                        </label>
                    </div>
                )}
                {/* 알림 탭은 하단 버튼 불필요하여 Footer 제거 */}
            </div>
        </div>
    );
};

export default NoticeModal;