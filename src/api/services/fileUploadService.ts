// src/api/services/fileUploadService.ts
import { apiClient } from '../utils/apiClient';

export interface UploadedFileInfo {
    id: number;
    file_name: string;
    original_file_name: string;
    file_size: number;
    file_type: string;
    uploaded_at: string;
    download_url: string;
}

export interface FileAttachmentInfo {
    id: number;
    project_id: number;
    file_name: string;
    original_file_name: string;
    file_path: string;
    file_size: number;
    file_type: string;
    mime_type: string;
    attachment_type: string;
    uploaded_by: number;
    uploaded_at: string;
    is_active: boolean;
    is_readonly: boolean;
    access_level: string;
}

export interface FileUploadError {
    file_name: string;
    error: string;
}

export interface MultipleUploadResponse {
    uploaded_files: UploadedFileInfo[];
    errors?: FileUploadError[];
    message?: string;
}

export class FileUploadService {
    // RFP 파일 다중 업로드
    async uploadRfpFiles(projectId: number, files: File[]): Promise<MultipleUploadResponse> {
        const formData = new FormData();
        files.forEach(file => {
            formData.append('files', file);
        });

        const response = await apiClient.post(
            `/projects/${projectId}/kickoff/rfp-files`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    }

    // 단일 파일 업로드
    async uploadFile(
        projectId: number,
        file: File,
        attachmentType: string = 'rfp'
    ): Promise<UploadedFileInfo> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('attachment_type', attachmentType);

        const response = await apiClient.post(
            `/projects/${projectId}/files/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    }

    // 프로젝트 첨부파일 목록 조회
    async getProjectFiles(projectId: number): Promise<FileAttachmentInfo[]> {
        const response = await apiClient.get(`/projects/${projectId}/files`);
        return response.data;
    }

    // RFP 파일 목록 조회
    async getRfpFiles(projectId: number): Promise<FileAttachmentInfo[]> {
        const response = await apiClient.get(`/projects/${projectId}/kickoff/rfp-files`);
        return response.data;
    }

    // 파일 정보 조회
    async getFileInfo(projectId: number, fileId: number): Promise<FileAttachmentInfo> {
        const response = await apiClient.get(`/projects/${projectId}/files/${fileId}`);
        return response.data;
    }

    // 파일 다운로드 URL 생성
    getDownloadUrl(projectId: number, fileId: number): string {
        return `/api/projects/${projectId}/files/${fileId}/download`;
    }

    // 파일 다운로드 처리
    async downloadFile(projectId: number, fileId: number, fileName: string): Promise<void> {
        try {
            const response = await apiClient.get(
                `/projects/${projectId}/files/${fileId}/download`,
                {
                    responseType: 'blob',
                }
            );

            // Blob을 이용한 파일 다운로드
            const blob = new Blob([response.data]);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            if (error.response?.status === 403) {
                throw new Error('파일 다운로드 권한이 없습니다.');
            } else if (error.response?.status === 404) {
                throw new Error('파일을 찾을 수 없습니다.');
            } else {
                throw new Error('파일 다운로드 중 오류가 발생했습니다.');
            }
        }
    }

    // 파일 삭제
    async deleteFile(projectId: number, fileId: number): Promise<void> {
        await apiClient.delete(`/projects/${projectId}/files/${fileId}`);
    }

    // 파일 크기 포맷팅
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Byte';
        const k = 1024;
        const sizes = ['Byte', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // 파일 확장자 검증
    validateFileExtension(fileName: string): boolean {
        const allowedExtensions = [
            '.txt', '.text', '.md', '.pdf', '.ppt', '.pptx',
            '.doc', '.docx', '.hwp', '.hwpx', '.png', '.jpg', '.jpeg',
            '.xls', '.xlsx', '.zip', '.rar', '.7z'
        ];
        const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
        return allowedExtensions.includes(extension);
    }

    // 파일 크기 검증 (100MB 제한)
    validateFileSize(size: number): boolean {
        const maxSize = 100 * 1024 * 1024; // 100MB
        return size <= maxSize;
    }
}

export const fileUploadService = new FileUploadService();