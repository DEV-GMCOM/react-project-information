// src/api/services/fileSearchService.ts
/**
 * Gemini File Search API 서비스
 * - FileSearchStore 생성/관리 (Gemini 관리형)
 * - GCS 버킷 파일 → FileSearchStore 등록
 * - PDF 파일 업로드
 * - RAG 기반 검색
 */
import { apiClient } from '../utils/apiClient';

// ============ FileSearchStore 타입 정의 ============

export interface FileSearchStore {
    name: string;
    display_name: string;
    status?: string;
}

export interface FileSearchFile {
    name: string;
    display_name: string;
    store_name?: string;
    size_bytes?: number;
    status?: string;
}

export interface SearchRequest {
    query: string;
    store_names: string[];
    system_instruction?: string;
}

export interface SearchResponse {
    query: string;
    answer: string;
    sources: { title: string; uri?: string }[];
    store_names: string[];
    model: string;
}

// ============ GCS → FileSearchStore 등록 타입 ============

export interface GCSBucketFile {
    name: string;
    size: number;
    content_type: string;
    created: string | null;
    updated: string | null;
}

export interface GCSBucketFilesResponse {
    bucket: string;
    prefix: string;
    file_count: number;
    files: GCSBucketFile[];
}

export interface GCSToStoreRequest {
    file_name: string;
    store_name?: string;
}

export interface GCSToStoreResponse {
    file_name: string;
    store_name: string;
    status: string;
}

// ============ API 서비스 ============

export const fileSearchService = {
    // ============ Store 관리 ============

    /**
     * FileSearchStore 목록 조회
     */
    async listStores(): Promise<FileSearchStore[]> {
        const response = await apiClient.get('/file-search/stores');
        return response.data;
    },

    /**
     * FileSearchStore 생성
     */
    async createStore(displayName: string): Promise<FileSearchStore> {
        const response = await apiClient.post('/file-search/stores', {
            display_name: displayName
        });
        return response.data;
    },

    /**
     * FileSearchStore 상세 조회
     */
    async getStore(storeName: string): Promise<FileSearchStore> {
        const response = await apiClient.get(`/file-search/stores/${storeName}`);
        return response.data;
    },

    /**
     * FileSearchStore 삭제
     */
    async deleteStore(storeName: string): Promise<void> {
        await apiClient.delete(`/file-search/stores/${storeName}`);
    },

    // ============ 파일 관리 ============

    /**
     * Store 내 파일 목록 조회
     */
    async listFiles(storeName: string): Promise<FileSearchFile[]> {
        const response = await apiClient.get(`/file-search/stores/${storeName}/files`);
        return response.data;
    },

    /**
     * 파일 업로드
     */
    async uploadFile(
        storeName: string,
        file: File,
        displayName?: string
    ): Promise<FileSearchFile> {
        const formData = new FormData();
        formData.append('file', file);
        if (displayName) {
            formData.append('display_name', displayName);
        }

        const response = await apiClient.post(
            `/file-search/stores/${storeName}/files`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            }
        );
        return response.data;
    },

    /**
     * 파일 삭제
     */
    async deleteFile(storeName: string, fileName: string): Promise<void> {
        await apiClient.delete(`/file-search/stores/${storeName}/files/${fileName}`);
    },

    // ============ RAG 검색 ============

    /**
     * RAG 검색 실행
     */
    async search(request: SearchRequest): Promise<SearchResponse> {
        const response = await apiClient.post('/file-search/search', request);
        return response.data;
    },

    // ============ GCS → FileSearchStore 등록 ============

    /**
     * GCS 버킷 파일 목록 직접 조회
     */
    async listGCSBucketFiles(): Promise<GCSBucketFilesResponse> {
        const response = await apiClient.get('/file-search/gcs/bucket-files');
        return response.data;
    },

    /**
     * GCS 파일을 FileSearchStore에 등록
     */
    async registerGCSToStore(request: GCSToStoreRequest): Promise<GCSToStoreResponse> {
        const response = await apiClient.post('/file-search/gcs/register-to-store', request);
        return response.data;
    }
};
