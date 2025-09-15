// src/components/project/MinimalFileList.tsx
import React, { useState, useEffect } from 'react';
import { fileUploadService, FileAttachmentInfo } from '../../api/services/fileUploadService';

interface MinimalFileListProps {
    projectId: number;
    refreshTrigger?: number;
}

export const MinimalFileList: React.FC<MinimalFileListProps> = ({
                                                                    projectId,
                                                                    refreshTrigger
                                                                }) => {
    const [files, setFiles] = useState<FileAttachmentInfo[]>([]);
    const [loading, setLoading] = useState(false);

    const loadFiles = async () => {
        if (!projectId) return;

        setLoading(true);
        try {
            const fileList = await fileUploadService.getRfpFiles(projectId);
            setFiles(fileList);
        } catch (error) {
            console.error('파일 목록 로드 실패:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFiles();
    }, [projectId, refreshTrigger]);

    const handleDownload = async (file: FileAttachmentInfo) => {
        try {
            await fileUploadService.downloadFile(projectId, file.id, file.original_file_name);
        } catch (error: any) {
            alert(error.message || '다운로드에 실패했습니다.');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    if (!projectId) return null;
    if (loading) return <div className="file-loading">파일 목록 로딩 중...</div>;
    if (files.length === 0) return null;

    return (
        <div className="minimal-file-list">
            <div className="file-list-header">
                <span>첨부파일 ({files.length}개)</span>
            </div>
            <div className="file-items">
                {files.map(file => (
                    <div key={file.id} className="file-item-minimal">
                        <button
                            type="button"
                            className="file-download-link"
                            onClick={() => handleDownload(file)}
                            title="클릭하여 다운로드"
                        >
                            📄 {file.original_file_name}
                        </button>
                        <span className="file-size-minimal">
                            ({formatFileSize(file.file_size)})
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MinimalFileList;