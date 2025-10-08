// src/components/IdleTimeoutModal.tsx
import React from 'react';
import { ENV, formatIdleTime } from '../config/env';
import '../styles/modal.css';

interface IdleTimeoutModalProps {
    isOpen: boolean;
    remainingSeconds: number;
    onContinue: () => void;
    onLogout: () => void;
}

const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
                                                               isOpen,
                                                               remainingSeconds,
                                                               onContinue,
                                                               onLogout
                                                           }) => {
    if (!isOpen) return null;

    const idleTimeText = formatIdleTime(ENV.IDLE_TIMEOUT);

    // return (
    //     <div
    //         className="modal-overlay"
    //         onClick={(e) => e.stopPropagation()}
    //         onMouseMove={(e) => e.stopPropagation()}
    //     >
    //         <div
    //             className="modal-content idle-timeout-modal"
    //             onClick={(e) => e.stopPropagation()}
    //         >
    //             <h2>⏰ 세션 만료 경고</h2>
    //             <p>
    //                 {idleTimeText}간 활동이 없었습니다.<br />
    //                 <strong>{remainingSeconds}초</strong> 후 자동으로 로그아웃됩니다.
    //             </p>
    //             <div className="modal-actions">
    //                 <button className="btn-primary" onClick={onContinue}>
    //                     계속 사용하기
    //                 </button>
    //                 <button className="btn-secondary" onClick={onLogout}>
    //                     로그아웃
    //                 </button>
    //             </div>
    //         </div>
    //     </div>
    // );
    return (
        <div className="modal-overlay">
            <div className="modal-content idle-timeout-modal">
                <h2>⏰ 세션 만료 경고</h2>
                <p>
                    {idleTimeText}간 활동이 없었습니다.<br />
                    <strong>{remainingSeconds}초</strong> 후 자동으로 로그아웃됩니다.
                </p>
                <div className="modal-actions">
                    <button className="btn-primary" onClick={onContinue}>
                        계속 사용하기
                    </button>
                    <button className="btn-secondary" onClick={onLogout}>
                        로그아웃
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IdleTimeoutModal;