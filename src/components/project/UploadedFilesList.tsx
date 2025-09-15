// src/components/project/UploadedFilesList.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { fileUploadService, FileAttachmentInfo } from '../../api/services/fileUploadService';

interface UploadedFilesListProps {
    projectId: number;
    attachmentType?: string;
    onFileDeleted?: (fileId: number) => void;
    onError?: (error: string) => void;
    className?: string;
    showDeleteButton?: boolean;
    showDownloadButton?: boolean;
}

export const UploadedFilesList: React.FC<UploadedFilesListProps> = ({
                                                                        projectId,
                                                                        attachmentType = 'rfp',
                                                                        onFileDeleted,
                                                                        onError,
                                                                        className = '',
                                                                        showDeleteButton = true,
                                                                        showDownloadButton = true
                                                                    }) => {
    const [files, setFiles] = useState<FileAttachmentInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [downloadingFiles, setDownloadingFiles] = useState<Set<number>>(new Set());

    // 파일 목록 로드
    const loadFiles = useCallback(async () => {
        setLoading(true);
        try {
            let fileList: FileAttachmentInfo[];

            if (attachmentType === 'rfp') {
                fileList = await fileUploadService.getRfpFiles(projectId);
            } else {
                const allFiles = await fileUploadService.getProjectFiles(projectId);
                fileList = allFiles.filter(f => f.attachment_type === attachmentType);
            }

            setFiles(fileList);
        } catch (error: any) {
            onError?.(error.message || '파일 목록을 불러올 수 없습니다.');
        } finally {
            setLoading(false);
        }
    }, [projectId, attachmentType, onError]);

    // 컴포넌트 마운트 시 파일 목록 로드
    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    // 파일 다운로드
    const handleDownload = useCallback(async (file: FileAttachmentInfo) => {
        setDownloadingFiles(prev => new Set(prev).add(file.id));

        try {
            await fileUploadService.downloadFile(projectId, file.id, file.original_file_name);
        } catch (error: any) {
            onError?.(error.message || '파일 다운로드에 실패했습니다.');
        } finally {
            setDownloadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(file.id);
                return newSet;
            });
        }
    }, [projectId, onError]);

    // 파일 삭제
    const handleDelete = useCallback(async (file: FileAttachmentInfo) => {
        if (!window.confirm(`'${file.original_file_name}' 파일을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await fileUploadService.deleteFile(projectId, file.id);
            setFiles(prev => prev.filter(f => f.id !== file.id));
            onFileDeleted?.(file.id);
        } catch (error: any) {
            onError?.(error.message || '파일 삭제에 실패했습니다.');
        }
    }, [projectId, onFileDeleted, onError]);

    // 날짜 포맷팅
    const formatDate = useCallback((dateString: string) => {
        return new Date(dateString).toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }, []);

    if (loading) {
        return (
            <div className={`uploaded-files-list loading ${className}`}>
                <div className="loading-message">파일 목록을 불러오는 중...</div>
            </div>
        );
    }

    if (files.length === 0) {
        return (
            <div className={`uploaded-files-list empty ${className}`}>
                <div className="empty-message">
                    <div className="empty-icon">📁</div>
                    <p>업로드된 파일이 없습니다.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`uploaded-files-list ${className}`}>
            <div className="files-header">
                <h4>첨부된 파일 ({files.length}개)</h4>
                <button
                    type="button"
                    className="refresh-btn"
                    onClick={loadFiles}
                    disabled={loading}
                >
                    🔄 새로고침
                </button>
            </div>

            <div className="files-container">
                {files.map(file => (
                    <div key={file.id} className="uploaded-file-item">
                        <div className="file-info">
                            <div className="file-header">
                                <div className="file-name-container">
                                    {showDownloadButton ? (
                                        <button
                                            type="button"
                                            className="file-name-link"
                                            onClick={() => handleDownload(file)}
                                            disabled={downloadingFiles.has(file.id)}
                                            title="클릭하여 다운로드"
                                        >
                                            {downloadingFiles.has(file.id) ? (
                                                <>⏳ {file.original_file_name}</>
                                            ) : (
                                                <>📄 {file.original_file_name}</>
                                            )}
                                        </button>
                                    ) : (
                                        <span className="file-name-text">
                                            📄 {file.original_file_name}
                                        </span>
                                    )}
                                </div>

                                {showDeleteButton && (
                                    <button
                                        type="button"
                                        className="file-delete-btn"
                                        onClick={() => handleDelete(file)}
                                        title="파일 삭제"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>

                            <div className="file-details">
                                <span className="file-size">
                                    {fileUploadService.formatFileSize(file.file_size)}
                                </span>
                                <span className="file-type">
                                    {file.file_type?.toUpperCase() || 'FILE'}
                                </span>
                                <span className="upload-date">
                                    {formatDate(file.uploaded_at)}
                                </span>
                                {file.is_readonly && (
                                    <span className="readonly-badge" title="읽기 전용 파일">
                                        🔒 읽기전용
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadedFilesList;