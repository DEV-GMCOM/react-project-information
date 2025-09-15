// src/components/project/FileUploadComponent.tsx
import React, { useState, useRef, useCallback } from 'react';
import {
    fileUploadService,
    FileAttachmentInfo,
    UploadedFileInfo,
    MultipleUploadResponse
} from '../../api/services/fileUploadService';

interface FileUploadComponentProps {
    projectId: number;
    onFilesUploaded?: (files: UploadedFileInfo[]) => void;
    onError?: (error: string) => void;
    className?: string;
    multiple?: boolean;
    attachmentType?: string;
}

interface LocalFileInfo {
    id: string;
    file: File;
    name: string;
    size: number;
    type: string;
    uploading?: boolean;
    uploaded?: boolean;
    error?: string;
    serverFileId?: number;
}

export const FileUploadComponent: React.FC<FileUploadComponentProps> = ({
                                                                            projectId,
                                                                            onFilesUploaded,
                                                                            onError,
                                                                            className = '',
                                                                            multiple = true,
                                                                            attachmentType = 'rfp'
                                                                        }) => {
    const [localFiles, setLocalFiles] = useState<LocalFileInfo[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 파일 유효성 검사
    const validateFile = useCallback((file: File): string | null => {
        if (!fileUploadService.validateFileExtension(file.name)) {
            return `지원하지 않는 파일 형식입니다: ${file.name}`;
        }

        if (!fileUploadService.validateFileSize(file.size)) {
            return `파일 크기가 너무 큽니다 (최대 100MB): ${file.name}`;
        }

        return null;
    }, []);

    // 로컬 파일 추가
    const addLocalFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const validFiles: LocalFileInfo[] = [];
        const errors: string[] = [];

        fileArray.forEach(file => {
            const error = validateFile(file);
            if (error) {
                errors.push(error);
            } else {
                const localFile: LocalFileInfo = {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type || 'application/octet-stream',
                    uploading: false,
                    uploaded: false
                };
                validFiles.push(localFile);
            }
        });

        if (errors.length > 0) {
            onError?.(errors.join('\n'));
        }

        if (validFiles.length > 0) {
            setLocalFiles(prev => [...prev, ...validFiles]);
        }
    }, [validateFile, onError]);

    // 파일 선택 핸들러
    const handleFileSelect = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            addLocalFiles(files);
        }
        // input 초기화
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [addLocalFiles]);

    // 드래그 앤 드롭 핸들러
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            addLocalFiles(files);
        }
    }, [addLocalFiles]);

    // 개별 파일 제거
    const removeLocalFile = useCallback((fileId: string) => {
        setLocalFiles(prev => prev.filter(f => f.id !== fileId));
    }, []);

    // 파일 업로드 실행
    const uploadFiles = useCallback(async () => {
        const filesToUpload = localFiles.filter(f => !f.uploaded && !f.uploading);
        if (filesToUpload.length === 0) return;

        setIsUploading(true);

        try {
            // 업로딩 상태 설정
            setLocalFiles(prev => prev.map(f =>
                filesToUpload.some(tu => tu.id === f.id)
                    ? { ...f, uploading: true, error: undefined }
                    : f
            ));

            if (multiple && filesToUpload.length > 1) {
                // 다중 파일 업로드
                const response: MultipleUploadResponse = await fileUploadService.uploadRfpFiles(
                    projectId,
                    filesToUpload.map(f => f.file)
                );

                // 성공한 파일들 처리
                const uploadedFiles = response.uploaded_files || [];
                setLocalFiles(prev => prev.map(f => {
                    const uploadedFile = uploadedFiles.find(uf => uf.original_file_name === f.name);
                    if (uploadedFile) {
                        return {
                            ...f,
                            uploading: false,
                            uploaded: true,
                            serverFileId: uploadedFile.id
                        };
                    }
                    return f;
                }));

                // 실패한 파일들 처리
                if (response.errors && response.errors.length > 0) {
                    setLocalFiles(prev => prev.map(f => {
                        const error = response.errors?.find(e => e.file_name === f.name);
                        if (error) {
                            return {
                                ...f,
                                uploading: false,
                                uploaded: false,
                                error: error.error
                            };
                        }
                        return f;
                    }));
                }

                onFilesUploaded?.(uploadedFiles);

            } else {
                // 개별 파일 업로드
                for (const localFile of filesToUpload) {
                    try {
                        const uploadedFile = await fileUploadService.uploadFile(
                            projectId,
                            localFile.file,
                            attachmentType
                        );

                        setLocalFiles(prev => prev.map(f =>
                            f.id === localFile.id
                                ? {
                                    ...f,
                                    uploading: false,
                                    uploaded: true,
                                    serverFileId: uploadedFile.id
                                }
                                : f
                        ));

                        onFilesUploaded?.([ uploadedFile ]);

                    } catch (error: any) {
                        setLocalFiles(prev => prev.map(f =>
                            f.id === localFile.id
                                ? {
                                    ...f,
                                    uploading: false,
                                    uploaded: false,
                                    error: error.message || '업로드 실패'
                                }
                                : f
                        ));
                    }
                }
            }

        } catch (error: any) {
            onError?.(error.message || '파일 업로드 중 오류가 발생했습니다.');

            // 모든 파일을 실패 상태로 설정
            setLocalFiles(prev => prev.map(f =>
                filesToUpload.some(tu => tu.id === f.id)
                    ? { ...f, uploading: false, uploaded: false, error: '업로드 실패' }
                    : f
            ));
        } finally {
            setIsUploading(false);
        }
    }, [localFiles, projectId, multiple, attachmentType, onFilesUploaded, onError]);

    return (
        <div className={`file-upload-component ${className}`}>
            {/* 파일 선택 입력 */}
            <input
                ref={fileInputRef}
                type="file"
                multiple={multiple}
                accept=".txt,.text,.md,.pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.png,.jpg,.jpeg,.xls,.xlsx,.zip,.rar,.7z"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
            />

            {/* 드래그 앤 드롭 영역 */}
            <div
                className={`file-drop-zone ${isDragOver ? 'drag-over' : ''} ${localFiles.length > 0 ? 'has-files' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleFileSelect}
            >
                {localFiles.length === 0 ? (
                    <div className="drop-zone-message">
                        <div className="drop-zone-icon">📎</div>
                        <div className="drop-zone-text">
                            <p>파일을 드래그하여 놓거나 클릭하여 선택하세요</p>
                            <p className="drop-zone-hint">
                                지원 형식: PDF, DOC, PPT, HWP, 이미지, 압축파일 등
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="file-list">
                        {localFiles.map(file => (
                            <div key={file.id} className="file-item">
                                <div className="file-info">
                                    <div className="file-name">{file.name}</div>
                                    <div className="file-details">
                                        <span className="file-size">
                                            {fileUploadService.formatFileSize(file.size)}
                                        </span>
                                        <span className="file-status">
                                            {file.uploading && '업로드 중...'}
                                            {file.uploaded && '✅ 완료'}
                                            {file.error && `❌ ${file.error}`}
                                            {!file.uploading && !file.uploaded && !file.error && '대기 중'}
                                        </span>
                                    </div>
                                </div>
                                {!file.uploaded && (
                                    <button
                                        type="button"
                                        className="file-remove-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeLocalFile(file.id);
                                        }}
                                        disabled={file.uploading}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        ))}

                        {/* 추가 파일 선택 영역 */}
                        <div className="drop-zone-add-more">
                            + 더 많은 파일 추가
                        </div>
                    </div>
                )}
            </div>

            {/* 업로드 버튼 */}
            {localFiles.some(f => !f.uploaded && !f.uploading) && (
                <div className="upload-actions">
                    <button
                        type="button"
                        className="upload-btn"
                        onClick={uploadFiles}
                        disabled={isUploading}
                    >
                        {isUploading ? '업로드 중...' : `${localFiles.filter(f => !f.uploaded).length}개 파일 업로드`}
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUploadComponent;