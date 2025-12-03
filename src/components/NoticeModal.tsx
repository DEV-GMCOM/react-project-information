// src/components/NoticeModal.tsx
import React, { useState, useEffect } from 'react';
import '../styles/NoticeModal.css';
import { markAllNoticesAsRead, hasUnreadNotices } from '../utils/noticeCookie'; // 쿠키 유틸 임포트
import { Notice, NoticeType } from '../types/notice'; // Notice 타입 임포트
import { noticeService } from '../api/services/noticeService'; // API 서비스 임포트

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
    const [activeTab, setActiveTab] = useState<'notice' | 'notification'>('notice');
    const [hasUnreadNotice, setHasUnreadNotice] = useState(false);
    const [activeNotices, setActiveNotices] = useState<Notice[]>([]); // 활성 공지 목록

    // 모달이 열릴 때 읽음 상태 체크 및 공지 목록 조회
    useEffect(() => {
        if (isOpen && !previewNotice) { // 미리보기가 아닐 때만 동작
            setHasUnreadNotice(hasUnreadNotices());
            fetchActiveNotices();
        }
    }, [isOpen, previewNotice]);

    const fetchActiveNotices = async () => {
        try {
            // 활성 상태인 공지만 조회 (페이지네이션 없이 전체 조회하거나 충분히 큰 limit 설정)
            // NoticeListResponse에서 items 추출
            const data = await noticeService.getNotices({ 
                isActive: true, 
                limit: 50 // 충분히 큰 수로 설정하여 상단에 노출
            });

            const now = new Date();
            const validNotices = data.items.filter(notice => {
                // 시작일이 없으면 제외 (노출 대기 상태로 간주)
                if (!notice.notifyStartAt) return false;
                
                const start = new Date(notice.notifyStartAt);
                const end = notice.notifyEndAt ? new Date(notice.notifyEndAt) : null;
                const now = new Date(); // 현재 시각을 매 필터링마다 새로 가져오도록

                // 시작일은 지났어야 함
                if (now < start) return false;

                // 종료일이 없는 경우 (무기한)
                if (!end) return true;

                // 종료일이 있는 경우
                return now <= end;
            });

            setActiveNotices(validNotices);
        } catch (error) {
            console.error("Failed to fetch active notices:", error);
        }
    };

    // 공지사항 탭이 활성화되면 읽음 처리
    useEffect(() => {
        if (isOpen && activeTab === 'notice' && !previewNotice) {
            markAllNoticesAsRead();
            // UI 갱신은 약간의 지연을 두거나, 다음 열릴 때 반영 (여기서는 즉시 반영 안 해도 됨, 버튼의 점은 Layout에서 관리)
            // 하지만 모달 내부 탭의 점은 사라지게 하고 싶다면:
            setHasUnreadNotice(false);
        }
    }, [isOpen, activeTab, previewNotice]);

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

    // 임시 알림 데이터 (더미)
    const notifications = [
        {
            id: 1,
            type: 'stt',
            title: 'STT 변환 완료',
            message: "'주간 회의_231201.mp3' 파일의 변환이 완료되었습니다.",
            time: '방금 전',
            isUnread: true
        },
        {
            id: 2,
            type: 'system',
            title: '시스템 점검 예정',
            message: '금일 18시부터 정기 점검이 진행됩니다.',
            time: '3시간 전',
            isUnread: false
        }
    ];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notice-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
                    <h2>🔔 알림 센터</h2>
                    <button className="notice-close-btn" onClick={onClose}>×</button>
                </div>

                {/* 탭 네비게이션 */}
                <div className="notice-tabs">
                    <button
                        className={`notice-tab-btn ${activeTab === 'notice' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notice')}
                    >
                        📢 공지사항
                        {hasUnreadNotice && <span style={{ marginLeft: '6px', color: '#ef4444', fontSize: '12px' }}>●</span>}
                    </button>
                    <button
                        className={`notice-tab-btn ${activeTab === 'notification' ? 'active' : ''}`}
                        onClick={() => setActiveTab('notification')}
                    >
                        💬 내 알림
                        {notifications.some(n => n.isUnread) && <span style={{ marginLeft: '6px', color: '#ef4444', fontSize: '12px' }}>●</span>}
                    </button>
                </div>

                <div className="notice-body">
                    {activeTab === 'notice' ? (
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
                            {notifications.length > 0 ? (
                                notifications.map(noti => (
                                    <div key={noti.id} className={`notification-item ${noti.isUnread ? 'unread' : ''}`}>
                                        <div className="notification-icon">
                                            {noti.type === 'stt' ? '🎙️' : '📢'}
                                        </div>
                                        <div className="notification-content-wrapper">
                                            <h4 className="notification-title">{noti.title}</h4>
                                            <p className="notification-message">{noti.message}</p>
                                            <span className="notification-time">{noti.time}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                                    새로운 알림이 없습니다.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer: 탭에 따라 다르게 표시 */}
                {activeTab === 'notice' && (
                    <div className="notice-footer">
                        <label className="notice-checkbox-label">
                            <input
                                type="checkbox"
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        const today = new Date().toDateString();
                                        localStorage.setItem('notice_hidden_until', today);
                                    }
                                }}
                            />
                            <span>오늘 하루 보지 않기</span>
                        </label>
                        <button className="btn-primary" onClick={onClose}>
                            확인
                        </button>
                    </div>
                )}
                {activeTab === 'notification' && (
                    <div className="notice-footer" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn-primary" onClick={onClose}>
                            닫기
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoticeModal;
