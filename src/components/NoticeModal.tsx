// src/components/NoticeModal.tsx
import React from 'react';
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
        // "(선택 사항) 알림 설정은 '내 정보'에서 언제든지 변경할 수 있습니다."
    ];

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
                                            alt={`잔디 연동 가이드 ${index + 1} 설명: ${imageDescriptions[index]}`}
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
