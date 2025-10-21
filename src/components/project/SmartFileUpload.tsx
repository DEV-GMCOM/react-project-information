// src/components/project/SmartFileUpload.tsx

import React, { useState, useRef, useCallback } from 'react';
import { fileUploadService, UploadedFileInfo } from '../../api/services/fileUploadService';

interface SmartFileUploadProps {
    projectId: number;
    attachmentTypeId?: number;
    allowManualMode?: boolean; // 사용자가 수동으로 방식 선택 가능 여부
    onUploadComplete?: (file: UploadedFileInfo) => void;
    onError?: (error: string) => void;
}

type UploadMode = 'auto' | 'normal' | 'resumable';

interface UploadingFile {
    id: string;
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    uploadMode?: 'normal' | 'resumable';
}

export const SmartFileUpload: React.FC<SmartFileUploadProps> = ({
                                                                    projectId,
                                                                    attachmentTypeId = 1,
                                                                    allowManualMode = false,
                                                                    onUploadComplete,
                                                                    onError
                                                                }) => {
    const [uploadMode, setUploadMode] = useState<UploadMode>('auto');
    const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const uploadSingleFile = useCallback(async (file: File) => {
        const fileKey = `${file.name}_${file.size}_${Date.now()}`;

        // 업로드 모드 결정
        let actualMode: 'normal' | 'resumable';
        if (uploadMode === 'auto') {
            actualMode = file.size > LARGE_FILE_THRESHOLD ? 'resumable' : 'normal';
        } else {
            actualMode = uploadMode as 'normal' | 'resumable';
        }

        setUploadingFiles(prev => new Map(prev).set(fileKey, {
            id: fileKey,
            file,
            progress: 0,
            status: 'pending',
            uploadMode: actualMode
        }));

        try {
            let uploadedFile: UploadedFileInfo;

            if (actualMode === 'resumable') {
                // 이어올리기 업로드
                uploadedFile = await fileUploadService.uploadFileWithResume(
                    projectId,
                    file,
                    attachmentTypeId,
                    (progress) => {
                        setUploadingFiles(prev => {
                            const newMap = new Map(prev);
                            const fileInfo = newMap.get(fileKey);
                            if (fileInfo) {
                                newMap.set(fileKey, {
                                    ...fileInfo,
                                    progress,
                                    status: 'uploading'
                                });
                            }
                            return newMap;
                        });
                    }
                );
            } else {
                // 일반 업로드
                setUploadingFiles(prev => {
                    const newMap = new Map(prev);
                    const fileInfo = newMap.get(fileKey);
                    if (fileInfo) {
                        newMap.set(fileKey, {
                            ...fileInfo,
                            status: 'uploading',
                            progress: 50 // 일반 업로드는 정확한 진행률 표시 어려움
                        });
                    }
                    return newMap;
                });

                uploadedFile = await fileUploadService.uploadFile(
                    projectId,
                    file,
                    attachmentTypeId
                );
            }

            // 완료 처리
            setUploadingFiles(prev => {
                const newMap = new Map(prev);
                const fileInfo = newMap.get(fileKey);
                if (fileInfo) {
                    newMap.set(fileKey, {
                        ...fileInfo,
                        progress: 100,
                        status: 'completed'
                    });
                }
                return newMap;
            });

            onUploadComplete?.(uploadedFile);

            // 3초 후 목록에서 제거
            setTimeout(() => {
                setUploadingFiles(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(fileKey);
                    return newMap;
                });
            }, 3000);

        } catch (error: any) {
            setUploadingFiles(prev => {
                const newMap = new Map(prev);
                const fileInfo = newMap.get(fileKey);
                if (fileInfo) {
                    newMap.set(fileKey, {
                        ...fileInfo,
                        status: 'error',
                        error: error.message || '업로드 실패'
                    });
                }
                return newMap;
            });

            onError?.(error.message || '업로드 실패');
        }
    }, [projectId, attachmentTypeId, uploadMode, onUploadComplete, onError, LARGE_FILE_THRESHOLD]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            await uploadSingleFile(file);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const getFileSizeInfo = (file: File): string => {
        const size = file.size;
        if (size < 1024) return `${size} B`;
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
        if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`;
        return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    const getUploadModeText = (mode?: 'normal' | 'resumable'): string => {
        if (!mode) return '';
        return mode === 'resumable' ? '(이어올리기)' : '(일반)';
    };

    return (
        <div className="smart-file-upload">
            {/* 업로드 모드 선택 (옵션) */}
            {allowManualMode && (
                <div className="upload-mode-selector">
                    <label>업로드 방식:</label>
                    <select
                        value={uploadMode}
                        onChange={(e) => setUploadMode(e.target.value as UploadMode)}
                        className="mode-select"
                    >
                        <option value="auto">자동 선택 (50MB 기준)</option>
                        <option value="normal">일반 업로드</option>
                        <option value="resumable">이어올리기 업로드</option>
                    </select>
                </div>
            )}

            {/* 파일 선택 버튼 */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
                accept=".txt,.text,.md,.pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.png,.jpg,.jpeg,.xls,.xlsx,.zip,.rar,.7z"
            />

            <button onClick={handleFileSelect} className="upload-select-btn">
                파일 선택
            </button>

            {/* 업로드 중인 파일 목록 */}
            {uploadingFiles.size > 0 && (
                <div className="uploading-files-list">
                    <h4>업로드 진행 중</h4>
                    {Array.from(uploadingFiles.values()).map((fileInfo) => (
                        <div key={fileInfo.id} className={`upload-item status-${fileInfo.status}`}>
                            <div className="file-info">
                                <span className="file-name">{fileInfo.file.name}</span>
                                <span className="file-size">{getFileSizeInfo(fileInfo.file)}</span>
                                <span className="upload-mode">{getUploadModeText(fileInfo.uploadMode)}</span>
                            </div>

                            {fileInfo.status === 'uploading' && (
                                <div className="progress-container">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${fileInfo.progress}%` }}
                                        />
                                    </div>
                                    <span className="progress-text">{Math.round(fileInfo.progress)}%</span>
                                </div>
                            )}

                            {fileInfo.status === 'completed' && (
                                <div className="status-completed">✓ 완료</div>
                            )}

                            {fileInfo.status === 'error' && (
                                <div className="status-error">
                                    ✗ 실패: {fileInfo.error}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SmartFileUpload;