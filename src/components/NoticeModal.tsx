// src/components/NoticeModal.tsx
import React, { useState } from 'react';
import '../styles/NoticeModal.css';

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
}

const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<'notice' | 'notification'>('notice');

    if (!isOpen) return null;

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
                            <div className="notice-item">
                                <h3>🎉 시스템 업데이트 안내</h3>
                                <p className="notice-date">2025-12-03</p>
                                <p className="notice-content">
                                    회의록 자동 문서화 기능이 추가되었습니다.<br />
                                    음성 파일을 업로드하여 자동으로 회의록을 생성할 수 있습니다.
                                </p>
                            </div>

                            <div className="notice-item">
                                <h3>⚠️ 정기 점검 안내</h3>
                                <p className="notice-date">2025-12-03</p>
                                <p className="notice-content">
                                    매주 금요일 18시~22시 정기 점검이 진행됩니다.<br />
                                    해당 시간에는 서비스 이용이 제한될 수 있습니다.
                                </p>
                            </div>

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