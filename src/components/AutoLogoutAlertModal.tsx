// src/components/AutoLogoutAlertModal.tsx
import React, { useEffect } from 'react';
import { ENV, formatIdleTime } from '../config/env';
import '../styles/AutoLogoutAlertModal.css';

interface AutoLogoutAlertModalProps {
    onClose: () => void;
}

const AutoLogoutAlertModal: React.FC<AutoLogoutAlertModalProps> = ({ onClose }) => {
    const reason = localStorage.getItem('auto_logout_reason');

    useEffect(() => {
        return () => {
            localStorage.removeItem('auto_logout_reason');
        };
    }, []);

    const getMessage = () => {
        const idleTimeText = formatIdleTime(ENV.IDLE_TIMEOUT);

        switch (reason) {
            case 'inactivity':
                return {
                    title: '자동 로그아웃',
                    message: `${idleTimeText} 동안 활동이 없어 자동으로 로그아웃되었습니다.\n보안을 위한 조치이니 양해 부탁드립니다.`
                };
            case 'session_expired':
                return {
                    title: '세션 만료',
                    message: '세션이 만료되어 자동으로 로그아웃되었습니다.\n다시 로그인해주세요.'
                };
            default:
                return {
                    title: '로그아웃',
                    message: '로그아웃되었습니다.'
                };
        }
    };

    const { title, message } = getMessage();

    return (
        <div className="auto-logout-overlay">
            <div className="auto-logout-modal">
                <div className="auto-logout-icon">⏰</div>
                <h2 className="auto-logout-title">{title}</h2>
                <p className="auto-logout-message">{message}</p>
                <button className="auto-logout-button" onClick={onClose}>
                    확인
                </button>
            </div>
        </div>
    );
};

export default AutoLogoutAlertModal;