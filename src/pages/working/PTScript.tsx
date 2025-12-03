import React, { useEffect, useMemo, useState } from 'react';
import { useHelp } from '../../contexts/HelpContext';
import '../../styles/PTScript.css';
import { ptScriptService, PTScriptTimelineItem } from '../../api/services/ptScriptService';

type TimelineItem = PTScriptTimelineItem;

const PTScript: React.FC = () => {
    const { setHelpContent } = useHelp();
    const [processData, setProcessData] = useState<string>(''); // 수주 프로세스/프로젝트 데이터
    const [rfpText, setRfpText] = useState<string>(''); // RFP/제안서 텍스트
    const [materialsNote, setMaterialsNote] = useState<string>(''); // 추가 자료 메모
    const [droppedFiles, setDroppedFiles] = useState<File[]>([]);
    const [clientAnalysis, setClientAnalysis] = useState<string>(''); // 4-1
    const [gmcomStrengths, setGmcomStrengths] = useState<string>(''); // 4-2
    const [durationMinutes, setDurationMinutes] = useState<number>(15);
    const [timeline, setTimeline] = useState<TimelineItem[]>([
        { time: '00:00-00:45', title: '오프닝', keyMessage: '오늘 제안의 목적과 팀 소개', emphasis: '감사의 인사 + 자신감', delivery: '톤: 밝고 명확 / 속도: 보통 / 첫 문장 후 1초 정지' }
    ]);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);
    const [serverTimeline, setServerTimeline] = useState<TimelineItem[] | null>(null);
    const [serverScript, setServerScript] = useState<string>('');
    const [errorMsg, setErrorMsg] = useState<string>('');

    useEffect(() => {
        setHelpContent({
            pageName: 'PT 스크립트',
            content: (
                <>
                    <p>입력 데이터(수주 프로세스/RFP/업로드 파일)를 바탕으로 발주처 분석(4-1), GMCOM 강점 매핑(4-2), 시간대별 스크립트(4-3)를 만듭니다.</p>
                    <p>스크립트에는 강조 포인트, 톤앤무드, 속도·호흡과 같은 스피치 테크닉을 명시하고, LLM 호출용 System/User 프롬프트를 함께 제공합니다.</p>
                </>
            )
        });
    }, [setHelpContent]);

    const systemPrompt = useMemo(() => (
        `You are GMCOM’s PT script curator. Generate a time-sliced presentation script for a live presenter.
Must include: (1) 발주처/제출처가 원하는 바와 얻고자 하는 효용 분석; (2) GMCOM 강점과 1의 니즈를 매핑해 강조 포인트와 짧은 부연 설명; (3) 자료(RFP, 제안서, PPT 등) 기반의 발표 스크립트.
Script requirements: break into timed segments with section title, key message, emphasis cues, tone/mood guidance, speech speed (fast/medium/slow), pauses/breaths, and where to stress words. Assume Korean delivery unless specified.
Keep instructions and output concise but actionable for a presenter on stage. If inputs are thin, state assumptions explicitly before the script.`
    ), []);

    const userPrompt = useMemo(() => {
        const materialList = droppedFiles.length > 0
            ? droppedFiles.map(file => `- ${file.name}`).join('\n')
            : (materialsNote ? materialsNote : '자료가 부족합니다. 가정하여 작성하세요.');

        return [
            '# Context',
            `- Project/Process data: ${processData || 'N/A'}`,
            `- RFP/Docs summary: ${rfpText || 'N/A'}`,
            `- Uploaded materials list: ${materialList}`,
            `- Desired total duration (minutes): ${durationMinutes}`,
            '',
            '# 분석',
            `- Client intent & desired outcomes: ${clientAnalysis || '추정 필요'}`,
            `- GMCOM strengths mapped to their needs: ${gmcomStrengths || '추정 필요'}`,
            '',
            '# Output format',
            '- Provide a numbered timeline. Each item: [T=mm:ss] Section title — Key message — Emphasis/Tone — Speech speed & pause cues — Exact phrasing (2–4 sentences).',
            '- Finish with a short “리허설 체크리스트” (voice, pace, gestures, slide sync).'
        ].join('\n');
    }, [clientAnalysis, droppedFiles, durationMinutes, gmcomStrengths, materialsNote, processData, rfpText]);

    const addTimelineRow = () => {
        setTimeline(prev => ([
            ...prev,
            { time: '', title: '', keyMessage: '', emphasis: '', delivery: '' }
        ]));
    };

    const updateTimelineRow = (index: number, field: keyof TimelineItem, value: string) => {
        setTimeline(prev => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
    };

    const removeTimelineRow = (index: number) => {
        setTimeline(prev => prev.filter((_, i) => i !== index));
    };

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const files = Array.from(event.dataTransfer.files || []);
        setDroppedFiles(prev => [...prev, ...files]);
    };

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('클립보드에 복사했습니다.');
        } catch (err) {
            console.error(err);
            alert('복사에 실패했습니다. 수동으로 복사해주세요.');
        }
    };

    const stitchedScript = useMemo(() => (
        timeline
            .map((item, idx) => `${idx + 1}. [${item.time || 'TBD'}] ${item.title || '섹션'} — ${item.keyMessage || '메시지'}\n   강조/톤: ${item.emphasis || '-'}\n   전달: ${item.delivery || '-'}`)
            .join('\n\n')
    ), [timeline]);

    const handleGenerate = async () => {
        setIsGenerating(true);
        setErrorMsg('');
        try {
            const response = await ptScriptService.generateScript({
                processData,
                rfpText,
                materialsNote,
                clientAnalysis,
                gmcomStrengths,
                durationMinutes,
                timelineSeed: timeline,
                language: 'ko'
            });
            setServerTimeline(response.timeline);
            setServerScript(response.fullScript);
        } catch (err) {
            console.error(err);
            setErrorMsg('생성에 실패했습니다. 나중에 다시 시도해주세요.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="ptscript-page">
            <div className="ptscript-header">
                <div>
                    <h1>PT 발표 스크립트</h1>
                    <p>발주처 분석(4-1) → GMCOM 강점 매핑(4-2) → 시간대별 스크립트(4-3)와 LLM 프롬프트를 한 번에 준비하세요.</p>
                </div>
                <div className="inline-controls">
                    <label>
                        총 발표 시간 (분)
                        <input
                            type="number"
                            min={5}
                            max={60}
                            value={durationMinutes}
                            onChange={e => setDurationMinutes(Number(e.target.value))}
                        />
                    </label>
                    <button className="ghost-btn" onClick={addTimelineRow}>타임라인 추가</button>
                </div>
            </div>

            <div className="ptscript-grid">
                <section className="card">
                    <header>
                        <h3>입력 소스</h3>
                        <p>수주 프로세스, RFP/제안서, PT용 PPT/기획서 파일을 모아주세요.</p>
                    </header>
                    <label className="field">
                        <span>수주 프로세스 / 프로젝트 데이터</span>
                        <textarea value={processData} onChange={e => setProcessData(e.target.value)} placeholder="예: 프로젝트 개요, 스테이크홀더, 일정, 주요 이슈…" />
                    </label>
                    <label className="field">
                        <span>RFP/문서 핵심 요약</span>
                        <textarea value={rfpText} onChange={e => setRfpText(e.target.value)} placeholder="필수 요구사항, 평가 기준, 예산/일정, 제한사항 등을 요약" />
                    </label>
                    <div
                        className="drop-zone"
                        onDrop={handleDrop}
                        onDragOver={e => e.preventDefault()}
                    >
                        <div className="drop-zone-icon">📁</div>
                        <p>파일을 드래그하거나 여기에 놓으세요 (PPT, PDF, DOC 등)</p>
                        <textarea
                            className="compact-input"
                            value={materialsNote}
                            onChange={e => setMaterialsNote(e.target.value)}
                            placeholder="추가 메모 또는 자료 링크를 적어주세요."
                        />
                        {droppedFiles.length > 0 && (
                            <ul className="file-list">
                                {droppedFiles.map((file, idx) => (
                                    <li key={idx}>{file.name}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </section>

                <section className="card">
                    <header>
                        <h3>분석 메모</h3>
                        <p>4-1 발주처 분석과 4-2 GMCOM 강점을 매핑하세요.</p>
                    </header>
                    <label className="field">
                        <span>4-1 발주처/제출처 분석</span>
                        <textarea
                            value={clientAnalysis}
                            onChange={e => setClientAnalysis(e.target.value)}
                            placeholder="그들이 원하는 바, 얻고자 하는 효용, 평가 포인트, 리스크 등"
                        />
                    </label>
                    <label className="field">
                        <span>4-2 GMCOM 강점 및 강조 포인트</span>
                        <textarea
                            value={gmcomStrengths}
                            onChange={e => setGmcomStrengths(e.target.value)}
                            placeholder="GMCOM의 역량을 4-1 니즈와 매핑해 강조 메시지를 적어주세요."
                        />
                    </label>
                </section>
            </div>

            <section className="card">
                <header>
                    <h3>시간대별 스크립트 빌더 (4-3)</h3>
                    <p>발표자의 강조, 톤앤무드, 속도·호흡까지 적어주세요.</p>
                </header>
                <div className="timeline-table">
                    <div className="timeline-head">
                        <span>시간</span>
                        <span>섹션</span>
                        <span>핵심 메시지</span>
                        <span>강조/톤</span>
                        <span>속도·호흡/표현</span>
                        <span />
                    </div>
                    {timeline.map((item, index) => (
                        <div className="timeline-row" key={index}>
                            <input
                                value={item.time}
                                onChange={e => updateTimelineRow(index, 'time', e.target.value)}
                                placeholder="00:00-01:00"
                            />
                            <input
                                value={item.title}
                                onChange={e => updateTimelineRow(index, 'title', e.target.value)}
                                placeholder="섹션명"
                            />
                            <input
                                value={item.keyMessage}
                                onChange={e => updateTimelineRow(index, 'keyMessage', e.target.value)}
                                placeholder="핵심 메시지"
                            />
                            <input
                                value={item.emphasis}
                                onChange={e => updateTimelineRow(index, 'emphasis', e.target.value)}
                                placeholder="강조/톤"
                            />
                            <input
                                value={item.delivery}
                                onChange={e => updateTimelineRow(index, 'delivery', e.target.value)}
                                placeholder="속도·호흡/표현"
                            />
                            <button className="ghost-btn small" onClick={() => removeTimelineRow(index)}>삭제</button>
                        </div>
                    ))}
                </div>
                <pre className="script-preview">{stitchedScript}</pre>
            </section>

            <section className="card prompts">
                <header>
                    <h3>LLM 프롬프트 (System / User)</h3>
                    <p>4-1~4-3 조건을 만족하는 호출 템플릿입니다. 필요 시 복사 후 사용하세요.</p>
                </header>
                <div className="prompt-columns">
                    <div className="prompt-box">
                        <div className="prompt-header">
                            <strong>System Prompt</strong>
                            <button className="ghost-btn small" onClick={() => handleCopy(systemPrompt)}>복사</button>
                        </div>
                        <pre>{systemPrompt}</pre>
                    </div>
                    <div className="prompt-box">
                        <div className="prompt-header">
                            <strong>User Prompt</strong>
                            <button className="ghost-btn small" onClick={() => handleCopy(userPrompt)}>복사</button>
                        </div>
                        <pre>{userPrompt}</pre>
                    </div>
                </div>
            </section>

            <section className="card actions">
                <div className="action-buttons">
                    <button onClick={handleGenerate} disabled={isGenerating}>
                        {isGenerating ? '생성 중…' : 'LLM으로 스크립트 생성 (목업)'}
                    </button>
                    <button className="secondary" onClick={() => handleCopy(stitchedScript)}>스크립트 복사</button>
                    <button className="ghost-btn" onClick={() => alert('API 연동 후 JSON 저장 예정 (FastAPI 연동 시 교체)')}>JSON 저장 (TODO)</button>
                </div>
                {errorMsg && <p className="hint" style={{ color: '#b91c1c' }}>{errorMsg}</p>}
                <p className="hint">※ FastAPI 백엔드 연동 시 ptScriptService.generateScript에서 mock을 제거하고 /generation/pt-script 엔드포인트를 호출하도록 전환하세요.</p>
            </section>

            {serverTimeline && (
                <section className="card">
                    <header>
                        <h3>목업 생성 결과</h3>
                        <p>실제 백엔드 응답이 연결되면 이 영역에 결과가 표시됩니다.</p>
                    </header>
                    <div className="timeline-table">
                        <div className="timeline-head">
                            <span>시간</span>
                            <span>섹션</span>
                            <span>핵심 메시지</span>
                            <span>강조/톤</span>
                            <span>속도·호흡/표현</span>
                            <span />
                        </div>
                        {serverTimeline.map((item, idx) => (
                            <div className="timeline-row" key={idx}>
                                <span>{item.time}</span>
                                <span>{item.title}</span>
                                <span>{item.keyMessage}</span>
                                <span>{item.emphasis}</span>
                                <span>{item.delivery}</span>
                                <span />
                            </div>
                        ))}
                    </div>
                    <pre className="script-preview">{serverScript}</pre>
                </section>
            )}
        </div>
    );
};

export default PTScript;
