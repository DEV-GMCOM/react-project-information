// src/pages/working/VisionAPI.tsx
import React, { useState, useRef } from 'react';
import apiClient from '../../api/utils/apiClient';
import '../../styles/VisionAPI.css';

interface LabelAnnotation {
    time_offset: number;
    description: string;
    confidence: number;
    category?: string;
}

// 로컬 동영상 분석용 - 세그먼트 레벨 라벨
interface SegmentLabel {
    description: string;
    confidence: number;
    category?: string;
    segments: Array<{
        start_time: number;
        end_time: number;
        confidence: number;
    }>;
}

interface VideoAnalysisResult {
    status: string;
    labels: LabelAnnotation[];
    segment_labels?: SegmentLabel[];  // 로컬 동영상 분석용
    error?: string;
}

// ========== 자세 피드백 인터페이스 ==========
interface PostureFeedback {
    category: string;    // "팔", "다리", "머리", "어깨"
    feedback: string;    // "왼팔을 더 높이 올려주세요"
    severity: string;    // "info", "warning", "suggestion"
    current_value?: number;
    target_value?: number;
}

// ========== 인물 분석용 인터페이스 (세그먼트 기반) ==========
interface PersonSegment {
    start_time: number;
    end_time: number;
    person_count: number;
    description: string;
    confidence: number;
    detected_landmarks: string[];
    actions: string[];
    posture_feedback: PostureFeedback[];  // 자세 피드백 추가
}

interface FaceSegment {
    start_time: number;
    end_time: number;
    face_count: number;
    description: string;
    confidence: number;
    attributes_summary: Record<string, string>;
}

interface PersonAnalysisResult {
    status: string;
    person_segments: PersonSegment[];
    face_segments: FaceSegment[];
    action_labels: SegmentLabel[];
    total_persons_detected: number;
    total_faces_detected: number;
    error?: string;
}

const VisionAPI: React.FC = () => {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [analysisResult, setAnalysisResult] = useState<VideoAnalysisResult | null>(null);
    const [personResult, setPersonResult] = useState<PersonAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'streaming' | 'local' | 'person'>('streaming');
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setAnalysisResult(null);
            setProgress(0);
        }
    };

    // 스트리밍 동영상 분석 (실시간 청크 단위)
    const handleAnalyzeStreaming = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await apiClient.post<VideoAnalysisResult>(
                '/vision/analyze-video-streaming',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 600000, // 10분 타임아웃 (API 분석 시간)
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 50) / progressEvent.total
                            );
                            setProgress(10 + percentCompleted);
                        }
                    },
                }
            );

            setProgress(80);

            if (response.data.status === 'success') {
                setAnalysisResult(response.data);
                setProgress(100);
            } else {
                setAnalysisResult({
                    status: 'error',
                    labels: [],
                    error: response.data.error || '분석 중 오류가 발생했습니다.'
                });
            }
        } catch (error: any) {
            console.error('Streaming video analysis failed:', error);
            setAnalysisResult({
                status: 'error',
                labels: [],
                error: error.response?.data?.detail || '스트리밍 비디오 분석 중 오류가 발생했습니다.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 로컬 동영상 분석 (전체 파일 업로드 후 분석)
    const handleAnalyzeLocal = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await apiClient.post<VideoAnalysisResult>(
                '/vision/analyze-video-local',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 600000, // 10분 타임아웃 (API 분석 시간)
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 50) / progressEvent.total
                            );
                            setProgress(10 + percentCompleted);
                        }
                    },
                }
            );

            setProgress(80);

            if (response.data.status === 'success') {
                setAnalysisResult(response.data);
                setProgress(100);
            } else {
                setAnalysisResult({
                    status: 'error',
                    labels: [],
                    error: response.data.error || '분석 중 오류가 발생했습니다.'
                });
            }
        } catch (error: any) {
            console.error('Local video analysis failed:', error);
            setAnalysisResult({
                status: 'error',
                labels: [],
                error: error.response?.data?.detail || '로컬 비디오 분석 중 오류가 발생했습니다.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    // 인물 분석 (표정, 팔다리, 액션)
    const handleAnalyzePerson = async () => {
        if (!selectedFile) return;

        setIsLoading(true);
        setProgress(10);

        try {
            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await apiClient.post<PersonAnalysisResult>(
                '/vision/analyze-person',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                    timeout: 600000, // 10분 타임아웃 (API 분석 시간)
                    onUploadProgress: (progressEvent) => {
                        if (progressEvent.total) {
                            const percentCompleted = Math.round(
                                (progressEvent.loaded * 50) / progressEvent.total
                            );
                            setProgress(10 + percentCompleted);
                        }
                    },
                }
            );

            setProgress(80);

            if (response.data.status === 'success') {
                setPersonResult(response.data);
                setProgress(100);
            } else {
                setPersonResult({
                    status: 'error',
                    person_segments: [],
                    face_segments: [],
                    action_labels: [],
                    total_persons_detected: 0,
                    total_faces_detected: 0,
                    error: response.data.error || '인물 분석 중 오류가 발생했습니다.'
                });
            }
        } catch (error: any) {
            console.error('Person analysis failed:', error);
            setPersonResult({
                status: 'error',
                person_segments: [],
                face_segments: [],
                action_labels: [],
                total_persons_detected: 0,
                total_faces_detected: 0,
                error: error.response?.data?.detail || '인물 분석 중 오류가 발생했습니다.'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnalyze = () => {
        if (activeTab === 'streaming') {
            handleAnalyzeStreaming();
        } else if (activeTab === 'local') {
            handleAnalyzeLocal();
        } else {
            handleAnalyzePerson();
        }
    };

    const handleReset = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setAnalysisResult(null);
        setPersonResult(null);
        setProgress(0);
    };

    const formatTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 100);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
    };

    const handleLabelClick = (timeOffset: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime = timeOffset;
            videoRef.current.play();
        }
    };

    const getConfidenceColor = (confidence: number): string => {
        if (confidence >= 0.9) return '#52c41a';
        if (confidence >= 0.7) return '#faad14';
        return '#ff4d4f';
    };

    const isVideoFile = (file: File | null): boolean => {
        if (!file) return false;
        const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.flv'];
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        return videoExtensions.includes(ext);
    };

    // 세그먼트 시간 포맷
    const formatSegmentTime = (startTime: number, endTime: number): string => {
        return `${formatTime(startTime)} ~ ${formatTime(endTime)}`;
    };

    return (
        <div className="vision-api-container">
            <div className="vision-api-header">
                <h1>Vision API - 동영상 라벨 분석</h1>
                <p>동영상을 업로드하여 AI 기반 객체/라벨 감지를 수행합니다.</p>
            </div>

            <div className="vision-api-tabs">
                <button
                    className={`tab-btn ${activeTab === 'streaming' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('streaming'); setAnalysisResult(null); setPersonResult(null); }}
                >
                    스트리밍 동영상
                </button>
                <button
                    className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('local'); setAnalysisResult(null); setPersonResult(null); }}
                >
                    로컬 동영상
                </button>
                <button
                    className={`tab-btn ${activeTab === 'person' ? 'active' : ''}`}
                    onClick={() => { setActiveTab('person'); setAnalysisResult(null); setPersonResult(null); }}
                >
                    인물분석
                </button>
            </div>

            <div className="vision-api-content">
                <div className="upload-section">
                    <div className="upload-area">
                        {previewUrl ? (
                            <div className="preview-container">
                                {isVideoFile(selectedFile) ? (
                                    <video
                                        ref={videoRef}
                                        src={previewUrl}
                                        controls
                                        className="video-preview"
                                    />
                                ) : (
                                    <img src={previewUrl} alt="Preview" className="image-preview" />
                                )}
                                <button className="reset-btn" onClick={handleReset}>
                                    다른 파일 선택
                                </button>
                            </div>
                        ) : (
                            <label className="upload-label">
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleFileChange}
                                    hidden
                                />
                                <div className="upload-placeholder">
                                    <span className="upload-icon">
                                        {activeTab === 'streaming' ? '📡' : activeTab === 'local' ? '🎬' : '🧑'}
                                    </span>
                                    <span>클릭하여 동영상 업로드</span>
                                    <span className="upload-hint">
                                        MP4, AVI, MOV, MKV, WEBM 등
                                    </span>
                                    <span className="upload-mode-hint">
                                        {activeTab === 'streaming'
                                            ? '실시간 스트리밍 분석 (청크 단위)'
                                            : activeTab === 'local'
                                            ? '전체 파일 분석 (세그먼트 레벨)'
                                            : '인물 분석 (표정/팔다리/액션)'}
                                    </span>
                                </div>
                            </label>
                        )}
                    </div>

                    {selectedFile && (
                        <div className="file-info">
                            <span>파일명: {selectedFile.name}</span>
                            <span>크기: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                            <span>타입: {selectedFile.type || '알 수 없음'}</span>
                        </div>
                    )}

                    {isLoading && (
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="progress-text">{progress}%</span>
                        </div>
                    )}

                    <button
                        className="analyze-btn"
                        onClick={handleAnalyze}
                        disabled={!selectedFile || isLoading}
                    >
                        {isLoading ? '분석 중...' : activeTab === 'person' ? '인물 분석 시작' : `${activeTab === 'streaming' ? '스트리밍' : '로컬'} 동영상 분석`}
                    </button>
                </div>

                <div className="result-section">
                    <h2>분석 결과 {activeTab === 'streaming' ? '(프레임 레벨)' : activeTab === 'local' ? '(세그먼트 레벨)' : '(인물 분석)'}</h2>
                    <div className="result-content">
                        {isLoading ? (
                            <div className="loading-spinner">
                                <div className="spinner"></div>
                                <span>AI가 동영상을 분석하고 있습니다...</span>
                                <span className="loading-hint">
                                    {activeTab === 'streaming'
                                        ? '실시간 스트리밍 분석 중 (청크 단위)'
                                        : activeTab === 'local'
                                        ? '전체 파일 분석 중 (세그먼트 레벨)'
                                        : '인물 분석 중 (표정/팔다리/액션)'}
                                </span>
                            </div>
                        ) : activeTab === 'person' && personResult ? (
                            personResult.status === 'success' ? (
                                <div className="labels-container">
                                    {/* 인물 분석 요약 */}
                                    <div className="labels-summary" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <span className="summary-badge" style={{ background: 'linear-gradient(135deg, #722ed1 0%, #531dab 100%)' }}>
                                            인물 구간: {personResult.person_segments.length}개
                                        </span>
                                        <span className="summary-badge" style={{ background: 'linear-gradient(135deg, #eb2f96 0%, #c41d7f 100%)' }}>
                                            얼굴 구간: {personResult.face_segments.length}개
                                        </span>
                                        <span className="summary-badge" style={{ background: 'linear-gradient(135deg, #fa8c16 0%, #d46b08 100%)' }}>
                                            액션 라벨: {personResult.action_labels.length}개
                                        </span>
                                    </div>

                                    {/* 인물 감지 세그먼트 결과 */}
                                    {personResult.person_segments.length > 0 && (
                                        <div style={{ marginTop: '16px' }}>
                                            <h4 style={{ color: '#722ed1', marginBottom: '8px' }}>인물 감지 (시간 구간별)</h4>
                                            <div className="labels-list segment-list">
                                                {personResult.person_segments.map((segment, index) => (
                                                    <div
                                                        key={index}
                                                        className="segment-label-item"
                                                        onClick={() => handleLabelClick(segment.start_time)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="segment-header" style={{ background: '#f9f0ff' }}>
                                                            <span className="time-badge" style={{ background: '#f0e6ff', color: '#722ed1', marginRight: '12px' }}>
                                                                {formatSegmentTime(segment.start_time, segment.end_time)}
                                                            </span>
                                                            <span className="label-description" style={{ flex: 1 }}>
                                                                {segment.description}
                                                            </span>
                                                            <span className="confidence-text" style={{ color: '#722ed1' }}>
                                                                {(segment.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        {(segment.detected_landmarks.length > 0 || segment.actions.length > 0) && (
                                                            <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666' }}>
                                                                {segment.detected_landmarks.length > 0 && (
                                                                    <div style={{ marginBottom: '4px' }}>
                                                                        <strong>감지된 부위:</strong> {segment.detected_landmarks.slice(0, 5).join(', ')}
                                                                        {segment.detected_landmarks.length > 5 && ` 외 ${segment.detected_landmarks.length - 5}개`}
                                                                    </div>
                                                                )}
                                                                {segment.actions.length > 0 && (
                                                                    <div>
                                                                        <strong>관련 액션:</strong> {segment.actions.join(', ')}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        {/* 자세 피드백 표시 */}
                                                        {segment.posture_feedback && segment.posture_feedback.length > 0 && (
                                                            <div style={{
                                                                padding: '12px 16px',
                                                                background: '#fff7e6',
                                                                borderTop: '1px solid #ffd591',
                                                                borderRadius: '0 0 8px 8px'
                                                            }}>
                                                                <div style={{
                                                                    fontSize: '13px',
                                                                    fontWeight: 600,
                                                                    color: '#fa8c16',
                                                                    marginBottom: '8px',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '6px'
                                                                }}>
                                                                    <span>💡</span> 자세 피드백
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                                                    {segment.posture_feedback.map((fb, fbIdx) => (
                                                                        <div
                                                                            key={fbIdx}
                                                                            style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: '8px',
                                                                                padding: '6px 10px',
                                                                                background: fb.severity === 'warning' ? '#fff1f0' : '#fff',
                                                                                borderRadius: '6px',
                                                                                fontSize: '12px',
                                                                                border: fb.severity === 'warning' ? '1px solid #ffccc7' : '1px solid #ffd591'
                                                                            }}
                                                                        >
                                                                            <span style={{
                                                                                padding: '2px 8px',
                                                                                background: fb.category === '팔' ? '#e6f7ff' :
                                                                                           fb.category === '다리' ? '#f6ffed' :
                                                                                           fb.category === '머리' ? '#fff0f6' :
                                                                                           fb.category === '어깨' ? '#f9f0ff' : '#fafafa',
                                                                                color: fb.category === '팔' ? '#1890ff' :
                                                                                       fb.category === '다리' ? '#52c41a' :
                                                                                       fb.category === '머리' ? '#eb2f96' :
                                                                                       fb.category === '어깨' ? '#722ed1' : '#666',
                                                                                borderRadius: '4px',
                                                                                fontWeight: 500,
                                                                                fontSize: '11px'
                                                                            }}>
                                                                                {fb.category}
                                                                            </span>
                                                                            <span style={{ color: '#333', flex: 1 }}>{fb.feedback}</span>
                                                                            {fb.current_value !== undefined && (
                                                                                <span style={{
                                                                                    fontSize: '11px',
                                                                                    color: '#999',
                                                                                    background: '#f5f5f5',
                                                                                    padding: '2px 6px',
                                                                                    borderRadius: '4px'
                                                                                }}>
                                                                                    {fb.target_value ? `${fb.current_value}° → ${fb.target_value}°` : `${fb.current_value}%`}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 얼굴 감지 세그먼트 결과 */}
                                    {personResult.face_segments.length > 0 && (
                                        <div style={{ marginTop: '16px' }}>
                                            <h4 style={{ color: '#eb2f96', marginBottom: '8px' }}>얼굴 감지 (시간 구간별)</h4>
                                            <div className="labels-list segment-list">
                                                {personResult.face_segments.map((segment, index) => (
                                                    <div
                                                        key={index}
                                                        className="segment-label-item"
                                                        onClick={() => handleLabelClick(segment.start_time)}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <div className="segment-header" style={{ background: '#fff0f6' }}>
                                                            <span className="time-badge" style={{ background: '#ffebf3', color: '#eb2f96', marginRight: '12px' }}>
                                                                {formatSegmentTime(segment.start_time, segment.end_time)}
                                                            </span>
                                                            <span className="label-description" style={{ flex: 1 }}>
                                                                {segment.description}
                                                            </span>
                                                            <span className="confidence-text" style={{ color: '#eb2f96' }}>
                                                                {(segment.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        {(() => {
                                                            // "없음"이 아닌 속성만 필터링
                                                            const presentAttrs = Object.entries(segment.attributes_summary)
                                                                .filter(([_, val]) => val !== '없음')
                                                                .slice(0, 5);
                                                            return presentAttrs.length > 0 ? (
                                                                <div style={{ padding: '8px 16px', fontSize: '12px', color: '#666' }}>
                                                                    <strong>감지된 속성:</strong> {presentAttrs.map(([key, val]) =>
                                                                        `${key} (${val})`
                                                                    ).join(', ')}
                                                                </div>
                                                            ) : null;
                                                        })()}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 액션 라벨 결과 */}
                                    {personResult.action_labels.length > 0 && (
                                        <div style={{ marginTop: '16px' }}>
                                            <h4 style={{ color: '#fa8c16', marginBottom: '8px' }}>액션/행동 라벨</h4>
                                            <div className="labels-list segment-list">
                                                {personResult.action_labels.map((label, index) => (
                                                    <div key={index} className="segment-label-item">
                                                        <div className="segment-header">
                                                            <span className="label-description">
                                                                {label.description}
                                                            </span>
                                                            {label.category && (
                                                                <span className="label-category">
                                                                    {label.category}
                                                                </span>
                                                            )}
                                                            <span className="confidence-text" style={{ color: '#fa8c16' }}>
                                                                {(label.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="segment-times">
                                                            {label.segments.map((seg, segIdx) => (
                                                                <div
                                                                    key={segIdx}
                                                                    className="segment-time-item"
                                                                    onClick={() => handleLabelClick(seg.start_time)}
                                                                    style={{ background: '#fff7e6' }}
                                                                >
                                                                    <span className="time-badge" style={{ background: '#fff7e6', color: '#fa8c16' }}>
                                                                        {formatSegmentTime(seg.start_time, seg.end_time)}
                                                                    </span>
                                                                    <span className="segment-confidence">
                                                                        {(seg.confidence * 100).toFixed(0)}%
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* 결과가 없는 경우 */}
                                    {personResult.person_segments.length === 0 &&
                                     personResult.face_segments.length === 0 &&
                                     personResult.action_labels.length === 0 && (
                                        <div className="empty-result">
                                            <span className="empty-icon">🧑</span>
                                            <span>감지된 인물 정보가 없습니다.</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="error-result">
                                    <span className="error-icon">error</span>
                                    <span>{personResult.error}</span>
                                </div>
                            )
                        ) : analysisResult ? (
                            analysisResult.status === 'success' ? (
                                <div className="labels-container">
                                    {/* 스트리밍 결과: 프레임 레벨 라벨 */}
                                    {activeTab === 'streaming' && analysisResult.labels.length > 0 && (
                                        <>
                                            <div className="labels-summary">
                                                <span className="summary-badge">
                                                    프레임 레벨: {analysisResult.labels.length}개 라벨 감지
                                                </span>
                                            </div>
                                            <div className="labels-list">
                                                {analysisResult.labels.map((label, index) => (
                                                    <div
                                                        key={index}
                                                        className="label-item"
                                                        onClick={() => handleLabelClick(label.time_offset)}
                                                    >
                                                        <div className="label-time">
                                                            <span className="time-badge">
                                                                {formatTime(label.time_offset)}
                                                            </span>
                                                        </div>
                                                        <div className="label-info">
                                                            <span className="label-description">
                                                                {label.description}
                                                            </span>
                                                            {label.category && (
                                                                <span className="label-category">
                                                                    {label.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="label-confidence">
                                                            <div
                                                                className="confidence-bar"
                                                                style={{
                                                                    width: `${label.confidence * 100}%`,
                                                                    backgroundColor: getConfidenceColor(label.confidence)
                                                                }}
                                                            />
                                                            <span className="confidence-text">
                                                                {(label.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* 로컬 결과: 세그먼트 레벨 라벨 */}
                                    {activeTab === 'local' && analysisResult.segment_labels && analysisResult.segment_labels.length > 0 && (
                                        <>
                                            <div className="labels-summary">
                                                <span className="summary-badge segment-badge">
                                                    세그먼트 레벨: {analysisResult.segment_labels.length}개 라벨 감지
                                                </span>
                                            </div>
                                            <div className="labels-list segment-list">
                                                {analysisResult.segment_labels.map((label, index) => (
                                                    <div key={index} className="segment-label-item">
                                                        <div className="segment-header">
                                                            <span className="label-description">
                                                                {label.description}
                                                            </span>
                                                            {label.category && (
                                                                <span className="label-category">
                                                                    {label.category}
                                                                </span>
                                                            )}
                                                            <span className="confidence-text">
                                                                {(label.confidence * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="segment-times">
                                                            {label.segments.map((seg, segIdx) => (
                                                                <div
                                                                    key={segIdx}
                                                                    className="segment-time-item"
                                                                    onClick={() => handleLabelClick(seg.start_time)}
                                                                >
                                                                    <span className="time-badge segment-time-badge">
                                                                        {formatSegmentTime(seg.start_time, seg.end_time)}
                                                                    </span>
                                                                    <span className="segment-confidence">
                                                                        {(seg.confidence * 100).toFixed(0)}%
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* 결과가 없는 경우 */}
                                    {((activeTab === 'streaming' && analysisResult.labels.length === 0) ||
                                      (activeTab === 'local' && (!analysisResult.segment_labels || analysisResult.segment_labels.length === 0))) && (
                                        <div className="empty-result">
                                            <span className="empty-icon">🔍</span>
                                            <span>감지된 라벨이 없습니다.</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="error-result">
                                    <span className="error-icon">⚠️</span>
                                    <span>{analysisResult.error}</span>
                                </div>
                            )
                        ) : (
                            <div className="empty-result">
                                <span className="empty-icon">{activeTab === 'person' ? '🧑' : '🎯'}</span>
                                <span>동영상을 업로드하고 분석 버튼을 클릭하세요.</span>
                                <span className="empty-hint">
                                    {activeTab === 'streaming'
                                        ? '스트리밍 분석: 실시간 청크 단위로 라벨을 감지합니다.'
                                        : activeTab === 'local'
                                        ? '로컬 분석: 전체 파일을 분석하여 세그먼트 단위로 라벨을 감지합니다.'
                                        : '인물 분석: 동영상에서 인물의 표정, 팔다리, 액션을 감지합니다.'}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="vision-api-info">
                <h3>기능 안내</h3>
                <ul>
                    <li><strong>스트리밍 동영상 분석:</strong> 비디오를 청크(5MB) 단위로 분석하여 실시간으로 프레임 레벨 라벨을 추출합니다. 각 프레임에서 감지된 객체와 정확한 타임스탬프를 제공합니다.</li>
                    <li><strong>로컬 동영상 분석:</strong> 전체 파일을 분석하여 세그먼트 레벨 라벨을 추출합니다. 동일한 객체가 등장하는 시간 구간(세그먼트)을 그룹화하여 표시합니다.</li>
                    <li><strong>인물 분석:</strong> 동영상에서 인물을 종합 분석합니다. PERSON_DETECTION(팔다리/관절), FACE_DETECTION(얼굴/표정), LABEL_DETECTION(액션/행동)을 조합하여 분석합니다.</li>
                    <li><strong>타임스탬프/세그먼트:</strong> 스트리밍은 단일 시점, 로컬/인물분석은 시작~종료 시간 구간을 표시합니다.</li>
                    <li><strong>신뢰도:</strong> AI가 해당 객체를 감지한 확신도를 백분율로 표시합니다.</li>
                    <li><strong>클릭하여 이동:</strong> 라벨을 클릭하면 해당 시간으로 비디오가 이동합니다.</li>
                </ul>
            </div>
        </div>
    );
};

export default VisionAPI;
