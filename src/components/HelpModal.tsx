// src/components/HelpModal.tsx
import React from 'react';
import '../styles/HelpModal.css';

interface HelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    pageName: string;
    content: React.ReactNode;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose, pageName, content }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="help-modal" onClick={(e) => e.stopPropagation()}>
                <div className="help-header">
                    <h2>❓ {pageName} 도움말</h2>
                    <button className="help-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="help-body">
                    {content}
                </div>
                <div className="help-footer">
                    <button className="btn-primary" onClick={onClose}>
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HelpModal;