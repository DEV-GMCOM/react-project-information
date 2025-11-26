// src/components/meeting/LLMSettingsModal.tsx
import React from 'react';
import '../../styles/modal.css';

interface LLMSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onGenerate: () => void;
    llmEngine: string;
    setLlmEngine: (value: string) => void;
    isGenerating: boolean;
}

const LLMSettingsModal: React.FC<LLMSettingsModalProps> = ({
                                                               isOpen,
                                                               onClose,
                                                               onGenerate,
                                                               llmEngine,
                                                               setLlmEngine,
                                                               isGenerating
                                                           }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
                <div className="modal-header">
                    <h3>LLM 회의록 생성 설정</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body" style={{ padding: '24px' }}>

                    {/* --- 기존 JSX 붙여넣기 --- */}
                    <div style={{display: 'flex', width: '100%', gap: '20px'}}>
                        <div className="generation-options" style={{flex: 1, flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>
                            <h4>1. LLM 선택</h4>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="gemini" checked={llmEngine === 'gemini'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                Gemini
                            </label>
                            <label className="meeting-minutes-label">
                                <input className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="chatgpt" checked={llmEngine === 'chatgpt'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                ChatGPT
                            </label>
                            <label className="meeting-minutes-label" style={{opacity: 0.3}}>
                                <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="claude" checked={llmEngine === 'claude'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                Claude
                            </label>
                            <label className="meeting-minutes-label" style={{opacity: 0.3}}>
                                <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="grok" checked={llmEngine === 'grok'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                Grok
                            </label>
                            <label className="meeting-minutes-label" style={{opacity: 0.3}}>
                                <input disabled className="meeting-minutes-radio radio-large" type="radio" name="llm-engine" value="perplexity" checked={llmEngine === 'perplexity'} onChange={(e) => setLlmEngine(e.target.value)} style={{ transform: 'scale(1.5)'}}/>
                                Perplexity
                            </label>
                        </div>
                        {/*<div className="generation-options" style={{flex: 1, flexDirection: 'column', alignItems: 'flex-start', border: '1px solid #eee', padding: '15px', borderRadius: '8px'}}>
                                        <h4>2. 생성할 문서 타입</h4>
                                        <label className="meeting-minutes-label" title="요약 정리는 항상 생성됩니다." style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="summary" checked={true} disabled={true} style={{ transform: 'scale(1.5)'}}/>
                                            내용(안건) 정리 (필수)
                                        </label>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="concept" checked={llmDocTypes.concept} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                            컨셉 문서
                                        </label>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="draft" checked={llmDocTypes.draft} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                            Draft 기획서
                                        </label>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="todolist" checked={llmDocTypes.todolist} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                            To Do 리스트
                                        </label>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="role" checked={llmDocTypes.role} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                            Role & Responsibility
                                        </label>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="glossary" checked={llmDocTypes.glossary} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                            용어/약어
                                        </label>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="biz_overview" checked={llmDocTypes.biz_overview} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                            배경지식/트랜드
                                        </label>
                                        <label className="meeting-minutes-label">
                                            <input className="meeting-minutes-checkbox checkbox-large" type="checkbox" name="concept_ideas" checked={llmDocTypes.concept_ideas} onChange={handleLlmDocTypeChange} style={{ transform: 'scale(1.5)'}}/>
                                            컨셉 아이디어
                                        </label>
                                    </div>*/}
                    </div>
                    {/* --- 기존 JSX 끝 --- */}

                </div>
                <div className="modal-footer" style={{ padding: '15px', textAlign: 'right', gap: '8px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        className="btn-secondary"
                        onClick={onClose}
                    >
                        취소
                    </button>
                    <button
                        className="btn-primary"
                        onClick={onGenerate}
                        disabled={isGenerating}
                    >
                        {isGenerating ? '생성 중...' : '계속진행'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LLMSettingsModal;