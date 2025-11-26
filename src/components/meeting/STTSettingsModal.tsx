// src/components/meeting/STTSettingsModal.tsx
import React from 'react';
import '../../styles/modal.css';

interface STTSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    sttEngine: string;
    setSttEngine: (value: string) => void;
    sttModelSize: 'tiny' | 'base' | 'small' | 'medium' | 'large';
    setSttModelSize: (value: 'tiny' | 'base' | 'small' | 'medium' | 'large') => void;
    sttLanguage: 'ko' | 'en' | 'auto';
    setSttLanguage: (value: 'ko' | 'en' | 'auto') => void;
}

const STTSettingsModal: React.FC<STTSettingsModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               onSave,
                                                               sttEngine,
                                                               setSttEngine,
                                                               sttModelSize,
                                                               setSttModelSize,
                                                               sttLanguage,
                                                               setSttLanguage
                                                           }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h3>STT 변환 설정</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>
                    {/* STT 엔진 선택 */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>STT 엔진</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="radio"
                                    name="modal-stt-engine"
                                    value="whisper"
                                    checked={sttEngine === 'whisper'}
                                    onChange={(e) => setSttEngine(e.target.value)}
                                />
                                <span>Whisper (권장)</span>
                            </label>
                            {/* 비활성화된 엔진들 */}
                            {['vosk', 'google', 'clova', 'aws', 'azure'].map((engine) => (
                                <label key={engine} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'not-allowed', opacity: 0.5 }}>
                                    <input
                                        disabled
                                        type="radio"
                                        name="modal-stt-engine"
                                        value={engine}
                                        checked={sttEngine === engine}
                                        onChange={(e) => setSttEngine(e.target.value)}
                                    />
                                    <span>{engine.charAt(0).toUpperCase() + engine.slice(1)} Speech/STT (준비중)</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 변환 품질 (모델 크기) */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>변환 품질</h4>
                        <select
                            value={sttModelSize}
                            onChange={(e) => setSttModelSize(e.target.value as any)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="tiny">Tiny (매우 빠름, 낮은 정확도)</option>
                            <option value="base">Base (빠름, 보통 정확도)</option>
                            <option value="small">Small (보통, 좋은 정확도)</option>
                            <option value="medium">Medium (느림, 높은 정확도) - 권장</option>
                            <option value="large">Large (매우 느림, 최고 정확도)</option>
                        </select>
                    </div>

                    {/* 언어 선택 */}
                    <div style={{ marginBottom: '24px' }}>
                        <h4 style={{ marginBottom: '12px', fontSize: '15px' }}>언어</h4>
                        <select
                            value={sttLanguage}
                            onChange={(e) => setSttLanguage(e.target.value as any)}
                            style={{
                                width: '100%',
                                padding: '8px 12px',
                                fontSize: '14px',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="ko">한국어</option>
                            <option value="en">영어</option>
                            <option value="auto">자동 감지</option>
                        </select>
                    </div>

                    {/* 버튼 */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={onClose}
                            style={{
                                padding: '8px 16px',
                                fontSize: '14px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            취소
                        </button>
                        <button
                            onClick={onSave}
                            style={{
                                padding: '8px 16px',
                                fontSize: '14px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            저장
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default STTSettingsModal;