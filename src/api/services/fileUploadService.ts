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

    // 파일 다운로드 처리 - Firefox만 fetch 사용
    async downloadFile(projectId: number, fileId: number, fileName: string): Promise<void> {
        try {
            console.log(`파일 다운로드 시작: projectId=${projectId}, fileId=${fileId}`);

            // Firefox 감지
            const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
            console.log(`브라우저: ${isFirefox ? 'Firefox' : 'Other'}`);

            if (isFirefox) {
                // Firefox: fetch 사용
                console.log('Firefox 감지 - fetch 사용');
                return this.downloadWithFetch(projectId, fileId, fileName);
            } else {
                // Chrome, Safari 등: axios 사용
                console.log('다른 브라우저 - axios 사용');
                return this.downloadWithAxios(projectId, fileId, fileName);
            }

        } catch (error: any) {
            console.error('파일 다운로드 실패:', error);
            throw new Error('파일 다운로드 중 오류가 발생했습니다.');
        }
    }

    // Firefox 전용 fetch 방식
    private async downloadWithFetch(projectId: number, fileId: number, fileName: string): Promise<void> {
        const response = await fetch(`/api/projects/${projectId}/files/${fileId}/download`, {
            method: 'GET',
            credentials: 'include',
            headers: {
                'X-Session-Id': localStorage.getItem('session_id') || '',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // 파일명 추출
        let downloadFileName = fileName;
        const contentDisposition = response.headers.get('content-disposition');
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
                downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
            }
        }

        const blob = await response.blob();
        this.triggerDownload(blob, downloadFileName);
    }

    // Chrome/Safari용 axios 방식
    private async downloadWithAxios(projectId: number, fileId: number, fileName: string): Promise<void> {
        const response = await apiClient.get(
            `/projects/${projectId}/files/${fileId}/download`,
            {
                responseType: 'blob',
                timeout: 30000,
            }
        );

        // 파일명 처리 (RFC 6266 지원)
        let downloadFileName = fileName;
        const contentDisposition = response.headers['content-disposition'];

        if (contentDisposition) {
            const filenameStarMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
            if (filenameStarMatch && filenameStarMatch[1]) {
                try {
                    downloadFileName = decodeURIComponent(filenameStarMatch[1]);
                } catch (e) {
                    console.warn('파일명 디코딩 실패:', e);
                }
            } else {
                const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (fileNameMatch && fileNameMatch[1]) {
                    downloadFileName = fileNameMatch[1].replace(/['"]/g, '');
                }
            }
        }

        this.triggerDownload(response.data, downloadFileName);
    }

    // 공통 다운로드 실행
    private triggerDownload(blobData: any, fileName: string): void {
        const blob = new Blob([blobData]);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = fileName;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        }, 100);
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