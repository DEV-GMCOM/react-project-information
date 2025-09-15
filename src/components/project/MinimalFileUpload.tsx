// src/components/project/MinimalFileUpload.tsx
import React, { useState, useRef } from 'react';
import { fileUploadService } from '../../api/services/fileUploadService';

interface MinimalFileUploadProps {
    projectId: number;
    onUploadComplete?: () => void;
}

export const MinimalFileUpload: React.FC<MinimalFileUploadProps> = ({
                                                                        projectId,
                                                                        onUploadComplete
                                                                    }) => {
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);

        try {
            const uploadPromises = Array.from(files).map(file =>
                fileUploadService.uploadFile(projectId, file, 'rfp')
            );

            await Promise.all(uploadPromises);
            alert(`${files.length}개 파일이 업로드되었습니다.`);
            onUploadComplete?.();

            // 파일 입력 초기화
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (error: any) {
            alert(error.message || '파일 업로드 중 오류가 발생했습니다.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".txt,.text,.md,.pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.png,.jpg,.jpeg,.xls,.xlsx,.zip,.rar,.7z"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />
            <button
                type="button"
                className="rfp-attach-btn"
                onClick={handleFileSelect}
                disabled={uploading || !projectId}
            >
                {uploading ? '업로드 중...' : 'RFP 첨부'}
            </button>
        </>
    );
};

export default MinimalFileUpload;