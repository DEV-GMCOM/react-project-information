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
    project_id: number | null;
    meeting_id: number | null;
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
    uploaded_chunks?: number;
    total_chunks?: number;
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



// ✅ 이어올리기 관련 인터페이스 추가
export interface ResumableUploadInit {
    file_id: number;
    upload_session_id: string;
    total_chunks: number;
    chunk_size: number;
}

export interface ChunkUploadResponse {
    upload_session_id: string;
    chunk_index: number;
    uploaded_chunks: number;
    total_chunks: number;
    is_complete: boolean;
    file_id?: number;
}

export interface UploadStatus {
    file_id: number;
    uploaded_chunks: number;
    total_chunks: number;
    status: string;
    progress: number;
    upload_started_at: string;
}



export class FileUploadService {


    private readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
    private readonly LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB - 이 크기 이상이면 이어올리기 사용


    /**
     * 파일 크기에 따라 자동으로 업로드 방식 선택
     */
    async uploadFileAuto(
        projectId: number,
        file: File,
        // attachmentType: string = 'rfp',
        attachmentTypeId: number = 1,
        onProgress?: (progress: number) => void
    ): Promise<UploadedFileInfo> {
        // 파일 크기 체크
        if (file.size > this.LARGE_FILE_THRESHOLD) {
            console.log(`큰 파일(${this.formatFileSize(file.size)}) - 이어올리기 방식 사용`);
            // return this.uploadFileWithResume(projectId, file, attachmentType, onProgress);
            return this.uploadFileWithResume(projectId, file, attachmentTypeId, onProgress);
        } else {
            console.log(`작은 파일(${this.formatFileSize(file.size)}) - 일반 업로드 방식 사용`);
            return this.uploadFile(projectId, file, attachmentTypeId);
        }
    }

    // ✅ 이어올리기 세션 초기화
    async initResumableUpload(
        projectId: number,
        file: File,
        // attachmentType: string = 'rfp'
        attachmentTypeId: number = 1
    ): Promise<ResumableUploadInit> {
        const formData = new FormData();
        formData.append('file_name', file.name);
        formData.append('file_size', file.size.toString());
        // formData.append('attachment_type_id', this.getAttachmentTypeId(attachmentType).toString());
        formData.append('attachment_type_id', attachmentTypeId.toString());

        const response = await apiClient.post(
            `/projects/${projectId}/files/resumable/init`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    }

    // ✅ 청크 업로드
    async uploadChunk(
        uploadSessionId: string,
        chunkIndex: number,
        chunkData: Blob
    ): Promise<ChunkUploadResponse> {
        const formData = new FormData();
        formData.append('upload_session_id', uploadSessionId);
        formData.append('chunk_index', chunkIndex.toString());
        formData.append('chunk', chunkData, `chunk_${chunkIndex}`);

        const response = await apiClient.post(
            `/files/resumable/chunk`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    }


    // ✅ 업로드 상태 조회
    async getUploadStatus(uploadSessionId: string): Promise<UploadStatus> {
        const response = await apiClient.get(`/files/resumable/${uploadSessionId}/status`);
        return response.data;
    }

    // ✅ 업로드 취소
    async cancelResumableUpload(uploadSessionId: string): Promise<void> {
        await apiClient.delete(`/files/resumable/${uploadSessionId}`);
    }


    /**
     * 파일을 청크로 분할하여 업로드
     */
    async uploadFileWithResume(
        projectId: number,
        file: File,
        // attachmentType: string = 'rfp',
        attachmentTypeId: number = 1,
        onProgress?: (progress: number) => void
    ): Promise<UploadedFileInfo> {
        // 세션 초기화
        const initResult = await this.initResumableUpload(projectId, file, attachmentTypeId);
        const { upload_session_id, total_chunks, chunk_size } = initResult;

        try {
            // 청크별 업로드
            for (let chunkIndex = 0; chunkIndex < total_chunks; chunkIndex++) {
                const start = chunkIndex * chunk_size;
                const end = Math.min(start + chunk_size, file.size);
                const chunkData = file.slice(start, end);

                const result = await this.uploadChunk(upload_session_id, chunkIndex, chunkData);

                // 진행률 콜백
                if (onProgress) {
                    onProgress((result.uploaded_chunks / result.total_chunks) * 100);
                }

                // 완료 시 파일 정보 반환
                if (result.is_complete && result.file_id) {
                    const fileInfo = await this.getFileInfo(projectId, result.file_id);
                    return {
                        id: fileInfo.id,
                        file_name: fileInfo.file_name,
                        original_file_name: fileInfo.original_file_name,
                        file_size: fileInfo.file_size,
                        file_type: fileInfo.file_type,
                        uploaded_at: fileInfo.uploaded_at,
                        download_url: `/api/projects/${projectId}/files/${fileInfo.id}/download`
                    };
                }
            }

            throw new Error('업로드가 완료되지 않았습니다');
        } catch (error) {
            // 에러 발생 시 업로드 취소
            try {
                await this.cancelResumableUpload(upload_session_id);
            } catch (cancelError) {
                console.error('업로드 취소 실패:', cancelError);
            }
            throw error;
        }
    }

    private getAttachmentTypeId(attachmentType: string): number {
        const typeMap: Record<string, number> = {
            'rfp': 1,
            'meeting_minutes': 2,
            'proposal': 3,
            'contract': 4,
            'submission': 5,
            'design': 6,
            'development': 7,
            'other': 99
        };
        return typeMap[attachmentType] || 99;
    }



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
        projectId: number | null,  // ✅ nullable로 변경
        file: File,
        attachmentTypeId: number = 1,
        meetingId?: number  // ✅ 추가
    ): Promise<UploadedFileInfo> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('attachment_type_id', attachmentTypeId.toString());

        if (meetingId) {
            formData.append('meeting_id', meetingId.toString());
        }

        // ✅ URL 결정 (회의록 vs 프로젝트)
        const url = meetingId
            ? `/meetings/${meetingId}/files/upload`
            : `/projects/${projectId}/files/upload`;

        const response = await apiClient.post(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

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
            console.log(`원본 파일명: ${fileName}`);

            // 모든 브라우저에서 fetch 사용 (통일성)
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

            // 개선된 파일명 추출
            let downloadFileName = fileName; // 기본값은 원본 파일명
            const contentDisposition = response.headers.get('content-disposition');

            if (contentDisposition) {
                console.log(`Content-Disposition: ${contentDisposition}`);

                // 1순위: filename*=UTF-8''인코딩된파일명 (RFC 6266)
                const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;,\s]+)/i);
                if (utf8Match && utf8Match[1]) {
                    try {
                        downloadFileName = decodeURIComponent(utf8Match[1]);
                        console.log(`UTF-8 디코딩 성공: ${downloadFileName}`);
                    } catch (e) {
                        console.warn('UTF-8 디코딩 실패:', e);
                    }
                }

                // 2순위: filename="파일명" (fallback)
                if (!utf8Match || downloadFileName === fileName) {
                    const quotedMatch = contentDisposition.match(/filename="([^"]+)"/i);
                    if (quotedMatch && quotedMatch[1]) {
                        downloadFileName = quotedMatch[1];
                        console.log(`quoted filename: ${downloadFileName}`);
                    }
                }

                // 3순위: filename=파일명 (따옴표 없음)
                if (downloadFileName === fileName) {
                    const unquotedMatch = contentDisposition.match(/filename=([^;,\s]+)/i);
                    if (unquotedMatch && unquotedMatch[1]) {
                        downloadFileName = unquotedMatch[1];
                        console.log(`unquoted filename: ${downloadFileName}`);
                    }
                }
            }

            console.log(`최종 파일명: ${downloadFileName}`);

            // 파일 다운로드
            const arrayBuffer = await response.arrayBuffer();
            const blob = new Blob([arrayBuffer]);
            this.triggerDownload(blob, downloadFileName);

            console.log(`파일 다운로드 완료: ${downloadFileName}`);

        } catch (error: any) {
            console.error('파일 다운로드 실패:', error);
            throw new Error(`파일 다운로드 중 오류가 발생했습니다: ${error.message}`);
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
        const maxSize = 500 * 1024 * 1024; // 500MB
        return size <= maxSize;
    }

    // ===== 회의록 전용 업로드 메서드 추가 =====

    /**
     * 회의록 파일 업로드 (소형 파일)
     */
    async uploadFileForMeeting(
        meetingId: number,
        projectId: number | null,
        file: File,
        attachmentTypeId: number = 2
    ): Promise<UploadedFileInfo> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('meeting_id', meetingId.toString());
        formData.append('attachment_type_id', attachmentTypeId.toString());

        if (projectId !== null) {
            formData.append('project_id', projectId.toString());
        }

        const response = await apiClient.post(
            `/files/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    }

    /**
     * 회의록 파일 업로드 (자동 방식 선택)
     */
    async uploadFileForMeetingAuto(
        meetingId: number,
        projectId: number | null,
        file: File,
        attachmentTypeId: number = 2,
        onProgress?: (progress: number) => void
    ): Promise<UploadedFileInfo> {
        if (file.size > this.LARGE_FILE_THRESHOLD) {
            console.log(`큰 파일(${this.formatFileSize(file.size)}) - 이어올리기 방식 사용`);
            return this.uploadFileForMeetingWithResume(
                meetingId,
                projectId,
                file,
                attachmentTypeId,
                onProgress
            );
        } else {
            console.log(`작은 파일(${this.formatFileSize(file.size)}) - 일반 업로드 방식 사용`);
            return this.uploadFileForMeeting(
                meetingId,
                projectId,
                file,
                attachmentTypeId
            );
        }
    }

    /**
     * 회의록 파일 이어올리기 업로드 (대용량)
     */
    private async uploadFileForMeetingWithResume(
        meetingId: number,
        projectId: number | null,
        file: File,
        attachmentTypeId: number,
        onProgress?: (progress: number) => void
    ): Promise<UploadedFileInfo> {
        const initResult = await this.initResumableUploadForMeeting(
            meetingId,
            projectId,
            file,
            attachmentTypeId
        );
        const { upload_session_id, total_chunks, chunk_size } = initResult;

        try {
            for (let chunkIndex = 0; chunkIndex < total_chunks; chunkIndex++) {
                const start = chunkIndex * chunk_size;
                const end = Math.min(start + chunk_size, file.size);
                const chunkData = file.slice(start, end);

                const result = await this.uploadChunk(upload_session_id, chunkIndex, chunkData);

                if (onProgress) {
                    onProgress((result.uploaded_chunks / result.total_chunks) * 100);
                }

                if (result.is_complete && result.file_id) {
                    return await this.getFileInfoGeneric(result.file_id);
                }
            }

            throw new Error('업로드가 완료되지 않았습니다');
        } catch (error) {
            try {
                await this.cancelResumableUpload(upload_session_id);
            } catch (cancelError) {
                console.error('업로드 취소 실패:', cancelError);
            }
            throw error;
        }
    }

    /**
     * 회의록 이어올리기 세션 초기화
     */
    private async initResumableUploadForMeeting(
        meetingId: number,
        projectId: number | null,
        file: File,
        attachmentTypeId: number
    ): Promise<ResumableUploadInit> {
        const formData = new FormData();
        formData.append('file_name', file.name);
        formData.append('file_size', file.size.toString());
        formData.append('meeting_id', meetingId.toString());
        formData.append('attachment_type_id', attachmentTypeId.toString());

        if (projectId !== null) {
            formData.append('project_id', projectId.toString());
        }

        const response = await apiClient.post(
            `/files/resumable/init`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    }

    /**
     * 범용 파일 정보 조회
     */
    private async getFileInfoGeneric(fileId: number): Promise<UploadedFileInfo> {
        const response = await apiClient.get(`/files/${fileId}`);
        const fileInfo = response.data;

        return {
            id: fileInfo.id,
            file_name: fileInfo.file_name,
            original_file_name: fileInfo.original_file_name,
            file_size: fileInfo.file_size,
            file_type: fileInfo.file_type,
            uploaded_at: fileInfo.uploaded_at,
            download_url: `/api/files/${fileInfo.id}/download`
        };
    }

    /**
     * 회의록 파일 목록 조회
     */
    async getMeetingFiles(meetingId: number): Promise<FileAttachmentInfo[]> {
        const response = await apiClient.get(`/meetings/${meetingId}/files`);
        return response.data;
    }

    /**
     * 범용 파일 다운로드
     */
    async downloadFileGeneric(fileId: number, fileName: string): Promise<void> {
        const response = await apiClient.get(
            `/files/${fileId}/download`,
            {
                responseType: 'blob',
            }
        );

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }

    /**
     * 범용 파일 삭제
     */
    async deleteFileGeneric(fileId: number): Promise<void> {
        await apiClient.delete(`/files/${fileId}`);
    }
}

export const fileUploadService = new FileUploadService();