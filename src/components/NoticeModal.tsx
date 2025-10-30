// src/components/NoticeModal.tsx
import React from 'react';
import '../styles/NoticeModal.css';

interface NoticeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const NoticeModal: React.FC<NoticeModalProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="notice-modal" onClick={(e) => e.stopPropagation()}>
                <div className="notice-header">
                    <h2>📢 공지사항</h2>
                    <button className="notice-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="notice-body">
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