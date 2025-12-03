// src/components/NoticeModal.tsx
import React, { useState } from 'react';
import '../styles/NoticeModal.css';

interface NoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type TabType = 'notice' | 'notification';

const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose }) => {
    const [activeTab, setActiveTab] = useState<TabType>('notice');

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notice-header">
                    <div className="notice-tabs">
                        <button
                            className={`notice-tab ${activeTab === 'notice' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notice')}
                        >
                            공지사항
                        </button>
                        <button
                            className={`notice-tab ${activeTab === 'notification' ? 'active' : ''}`}
                            onClick={() => setActiveTab('notification')}
                        >
                            알림
                        </button>
                    </div>
                    <button className="notice-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="notice-body">
                    {activeTab === 'notice' ? (
                        <>
                            <div className="notice-item">
                                <h3>🎉 시스템 업데이트 안내</h3>
                                <p className="notice-date">2025-01-15</p>
                                <p className="notice-content">
                                    회의록 자동 문서화 기능이 추가되었습니다.<br />
                                    음성 파일을 업로드하여 자동으로 회의록을 생성할 수 있습니다.
                                </p>
                            </div>

                            <div className="notice-item">
                                <h3>⚠️ 정기 점검 안내</h3>
                                <p className="notice-date">2025-01-10</p>
                                <p className="notice-content">
                                    매주 일요일 오전 2시~4시 정기 점검이 진행됩니다.<br />
                                    해당 시간에는 서비스 이용이 제한될 수 있습니다.
                                </p>
                            </div>

                            <div className="notice-item">
                                <h3>📋 사용 가이드</h3>
                                <p className="notice-date">2025-01-01</p>
                                <p className="notice-content">
                                    프로젝트 관리 시스템 사용 가이드가 업데이트되었습니다.<br />
                                    상단 메뉴의 '도움말'을 참고해주세요.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="notice-item notification">
                                <h3>🔔 새로운 회의록이 등록되었습니다</h3>
                                <p className="notice-date">2025-01-15 14:30</p>
                                <p className="notice-content">
                                    "프로젝트 킥오프 미팅" 회의록이 등록되었습니다.
                                </p>
                            </div>

                            <div className="notice-item notification">
                                <h3>📝 결재 요청</h3>
                                <p className="notice-date">2025-01-14 10:00</p>
                                <p className="notice-content">
                                    홍길동님이 결재를 요청했습니다.
                                </p>
                            </div>

                            <div className="notice-item notification read">
                                <h3>✅ 결재 완료</h3>
                                <p className="notice-date">2025-01-13 16:45</p>
                                <p className="notice-content">
                                    요청하신 결재가 승인되었습니다.
                                </p>
                            </div>
                        </>
                    )}
                </div>
                <div className="notice-footer">
                    <label className="notice-checkbox-label">
                        <input
                            type="checkbox"
                            onChange={(e) => {
                                if (e.target.checked) {
                                    // 오늘 하루 보지 않기
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
            </div>
        </div>
    );
};

export default NoticeModal;