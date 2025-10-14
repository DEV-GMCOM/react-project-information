// src/pages/working/MeetingMinutes.tsx

import React, { useState, useRef, useEffect } from 'react'; // useState, useRef, useEffect 추가

import '../../styles/FormPage.css';
import '../../styles/MeetingMinutes.css';

const MeetingMinutes: React.FC = () => {

    // 1. 파일 입력(input) DOM에 접근하기 위한 ref
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 2. 파일 목록, 업로드 상태 등을 관리하는 state
    const [serverFiles, setServerFiles] = useState<any[]>([]); // 서버에 업로드된 파일 목록
    const [isFileUploading, setIsFileUploading] = useState<boolean>(false); // 파일 업로드 진행 상태
    const [isDragOver, setIsDragOver] = useState<boolean>(false); // 드래그-앤-드롭 UI 상태

    // 3. 현재 작업중인 프로젝트 ID (가정)
    // 이 값은 상위 컴포넌트나 URL로부터 받아와야 합니다.
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(1);

    // 4. 허용할 파일 확장자 목록
    const allowedExtensions = ['txt', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'zip', 'rar', '7z'];



    // 파일 선택창을 여는 함수
    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    // 파일이 드래그하여 드롭 영역에 들어왔을 때
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    // 파일 드래그가 드롭 영역을 벗어났을 때
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    // 파일이 드롭되었을 때 또는 파일 선택창에서 선택되었을 때
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        // 이곳에 실제 파일 업로드 API를 호출하는 로직이 들어갑니다.
        console.log("업로드할 파일:", files);
        // 예: uploadFiles(files);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFiles(e.target.files);
    };

    // 파일 다운로드 처리 함수
    const handleFileDownload = (file: any) => {
        console.log("다운로드할 파일:", file);
        // 이곳에 파일 다운로드 API 호출 로직이 들어갑니다.
    };

    // 파일 삭제 처리 함수
    const handleFileDelete = (file: any) => {
        if (window.confirm(`${file.original_file_name} 파일을 정말 삭제하시겠습니까?`)) {
            console.log("삭제할 파일:", file);
            // 이곳에 파일 삭제 API 호출 로직이 들어갑니다.
        }
    };

    // 파일 크기를 읽기 쉽게 변환하는 유틸리티 함수
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="meeting-minutes-container">
            {/* ... 헤더 부분은 동일 ... */}
            <div className="meeting-minutes-header">
                <div>
                    <h1 className="meeting-minutes-title">회의록 자동 문서화</h1>
                </div>
                <div className="meeting-minutes-logo">GMCOM</div>
            </div>

            <div className="meeting-minutes-main">
                {/* ... 다른 섹션들은 동일 ... */}
                <div className="meeting-minutes-title-section">
                    <h2 className="meeting-minutes-subtitle">회의록 음성 파일</h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>최종 작성자 :</div>
                        </div>
                    </div>
                </div>
                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 파일 리스트</h3>
                </div>

                <div className="table-action-section">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.text,.md,.pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.png,.jpg,.jpeg,.xls,.xlsx,.zip,.rar,.7z"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="rfp-attach-btn"
                        onClick={handleFileSelect}
                        disabled={!selectedProjectId || isFileUploading}
                    >
                        {isFileUploading ? '업로드 중...' : `음성 파일 첨부${serverFiles.length > 0 ? ` (${serverFiles.length})` : ''}`}
                    </button>
                </div>

                {/* 파일 업로드 영역 */}
                <div className="file-upload-section">
                    <div
                        className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileSelect}
                    >
                        {serverFiles.length === 0 ? (
                            <div className="drop-zone-message">
                                <div className="drop-zone-icon">📁</div>
                                <div className="drop-zone-text">
                                    <p>파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                                    <p className="drop-zone-hint">
                                        지원 형식: {allowedExtensions.join(', ')} (최대 100MB)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="file-list">
                                {serverFiles.map(file => (
                                    <div key={`server-${file.id}`} className="file-item uploaded-file">
                                        <div className="file-info">
                                            <div className="file-name">
                                                <button
                                                    className="file-download-link"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileDownload(file);
                                                    }}
                                                    title="클릭하여 다운로드"
                                                >
                                                    📄 {file.original_file_name}
                                                </button>
                                                {file.is_readonly && <span className="readonly-badge">🔒</span>}
                                            </div>
                                            <div className="file-details">
                                                <span className="file-size">{formatFileSize(file.file_size)}</span>
                                                <span className="file-type">{file.file_type?.toUpperCase()}</span>
                                                <span className="upload-date">
                                                    {new Date(file.uploaded_at).toLocaleString('ko-KR')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="file-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileDelete(file);
                                            }}
                                            title="파일 삭제"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}

                                <div
                                    className="drop-zone-add-more"
                                    onClick={handleFileSelect}
                                    style={{ display: isFileUploading ? 'none' : 'flex' }}
                                >
                                    <span>+ 더 많은 파일 추가</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {isFileUploading && (
                        <div className="upload-progress">
                            <div className="upload-spinner">⏳</div>
                            <span>파일을 업로드하고 있습니다...</span>
                        </div>
                    )}
                </div>


                {/* --- ▼▼▼ [제안] 생성 관련 UI를 하나의 패널로 그룹화 ▼▼▼ --- */}
                <div className="generation-panel">
                    <div className="generation-options">
                        <label className="meeting-minutes-label">
                            <input className="meeting-minutes-checkbox" type="checkbox" name="summary" defaultChecked />
                            내용(안건) 정리
                        </label>
                        <label className="meeting-minutes-label">
                            <input className="meeting-minutes-checkbox" type="checkbox" name="concept" />
                            컨셉문서
                        </label>
                        <label className="meeting-minutes-label">
                            <input className="meeting-minutes-checkbox" type="checkbox" name="draft" />
                            Draft 기획서
                        </label>
                    </div>
                    <button className="btn-primary">생성</button>
                </div>
                {/* --- ▲▲▲ 생성 패널 종료 ▲▲▲ --- */}

                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 생성된 텍스트</h3>
                </div>
                <div className="meeting-minutes-section">
                    <h3 className="section-header">■ 생성된 Draft 기획서, 컨셉문서, 주요 안건 정리</h3>
                </div>

                {/* --- ▼▼▼ 최종 저장 버튼은 명확하게 분리 ▼▼▼ --- */}
                <div className="meeting-minutes-actions">
                    <button className="btn-secondary">저장</button>
                </div>
                {/* --- ▲▲▲ 최종 저장 버튼 종료 ▲▲▲ --- */}

            </div>
        </div>
    );
};

export default MeetingMinutes;