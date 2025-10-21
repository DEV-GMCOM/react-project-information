// 이어올리기 전용 업로드 컴포넌트
import React, { useState, useRef, useCallback } from 'react';
import { fileUploadService } from '../../api/services/fileUploadService';

interface ResumableFileUploadProps {
    projectId: number;
    attachmentTypeId?: number;
    onUploadComplete?: (fileId: number) => void;
    onError?: (error: string) => void;
}

interface UploadingFile {
    file: File;
    sessionId?: string;
    progress: number;
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
}

export const ResumableFileUpload: React.FC<ResumableFileUploadProps> = ({
                                                                            projectId,
                                                                            attachmentTypeId = 1,
                                                                            onUploadComplete,
                                                                            onError
                                                                        }) => {
    const [uploadingFiles, setUploadingFiles] = useState<Map<string, UploadingFile>>(new Map());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const uploadFileWithResume = useCallback(async (file: File) => {
        const fileKey = `${file.name}_${file.size}`;

        setUploadingFiles(prev => new Map(prev).set(fileKey, {
            file,
            progress: 0,
            status: 'pending'
        }));

        try {
            await fileUploadService.uploadFileWithResume(
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

            onUploadComplete?.(0); // TODO: file_id 전달

        } catch (error: any) {
            setUploadingFiles(prev => {
                const newMap = new Map(prev);
                const fileInfo = newMap.get(fileKey);
                if (fileInfo) {
                    newMap.set(fileKey, {
                        ...fileInfo,
                        status: 'error',
                        error: error.message
                    });
                }
                return newMap;
            });

            onError?.(error.message || '업로드 실패');
        }
    }, [projectId, attachmentTypeId, onUploadComplete, onError]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        for (const file of Array.from(files)) {
            await uploadFileWithResume(file);
        }

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="resumable-file-upload">
            <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />

            <button onClick={handleFileSelect} className="upload-btn">
                파일 선택
            </button>

            {uploadingFiles.size > 0 && (
                <div className="upload-progress-list">
                    {Array.from(uploadingFiles.entries()).map(([key, fileInfo]) => (
                        <div key={key} className="upload-progress-item">
                            <div className="file-name">{fileInfo.file.name}</div>
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${fileInfo.progress}%` }}
                                />
                            </div>
                            <div className="progress-text">
                                {fileInfo.status === 'completed' ? '완료' :
                                    fileInfo.status === 'error' ? `실패: ${fileInfo.error}` :
                                        `${Math.round(fileInfo.progress)}%`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};