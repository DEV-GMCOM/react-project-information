// src/api/services/generationService.ts

import apiClient from '../utils/apiClient';

// 타입 정의
export type STTEngine = "whisper" | "clova" | "google" | "aws" | "azure" | "vosk";
export type LLMEngine = "claude" | "chatgpt" | "gemini" | "perplexity" | "grok";
export type DocType = "summary" | "concept" | "draft";

// ✅ STT 작업 생성 응답
export interface STTCreateResponse {
    task_id: string;
    file_id: number;  // ✅ 추가: 업로드된 파일 ID
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'aborted';
    message: string;
}

// ✅ STT 진행률 메시지
export interface STTProgressMessage {
    task_id: string;
    progress: number;
    message: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'aborted';
    result_text?: string;
    error?: string;
    metadata?: {  // ✅ 추가
        conversion_duration?: number;
        [key: string]: any;
    };
}

// ✅ STT 결과 조회 응답 (신규)
export interface STTResultResponse {
    stt_original_id: number;
    file_attachment_id: number;
    original_text: string;
    text_size: number;
    stt_engine_type: string;
    conversion_duration?: string;
    created_at: string;
}

// ✅ STT 상태 조회 응답
export interface STTStatusResponse extends STTProgressMessage {
    metadata: Record<string, any>;
}

// LLM 요청/응답 (기존 유지)
export interface LLMRequestPayload {
    source_text: string;
    engine: LLMEngine;
    doc_types: DocType[];
}

export interface LLMResult {
    doc_type: DocType;
    title: string;
    content: string;
}

export interface LLMResponse {
    engine: LLMEngine;
    results: LLMResult[];
    processing_time_ms: number;
}

// API 서비스
export const generationService = {
    /**
     * STT 작업 생성 (비동기, DB 연동)
     */
    async createSTTTask(
        engine: STTEngine,
        file: File,
        options?: {
            model_size?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
            language?: string;
            meeting_id?: number;
        }
    ): Promise<STTCreateResponse> {
        const formData = new FormData();
        formData.append('engine', engine);
        formData.append('file', file);

        if (options?.model_size) {
            formData.append('model_size', options.model_size);
        }
        if (options?.language) {
            formData.append('language', options.language);
        }
        // meeting_id가 null이나 undefined일 때는 전송하지 않음
        if (options?.meeting_id !== null && options?.meeting_id !== undefined) {
            formData.append('meeting_id', options.meeting_id.toString());
        }

        // 디버깅 로그
        console.log('📤 STT 요청 전송:');
        console.log('  - engine:', engine);
        console.log('  - file:', file.name, file.size, 'bytes');
        console.log('  - model_size:', options?.model_size);
        console.log('  - language:', options?.language);
        console.log('  - meeting_id:', options?.meeting_id);
        // FormData 내용 확인
        console.log('📦 FormData 내용:');

        try {
            const response = await apiClient.post<STTCreateResponse>(
                '/generation/stt/create',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'  // ✅ 명시적 헤더
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            // 상세 에러 로그
            console.error('❌ STT 작업 생성 실패:', error);
            console.error('응답 데이터:', error.response?.data);
            console.error('응답 상태:', error.response?.status);

            // 422 에러 상세 정보 출력
            if (error.response?.status === 422) {
                console.error('❌ 422 Validation Error Details:', JSON.stringify(error.response.data, null, 2));
            }

            throw error;
        }
    },

    /**
     * STT 결과 조회 (신규)
     */
    async getSTTResult(fileId: number): Promise<STTResultResponse> {
        const response = await apiClient.get<STTResultResponse>(
            `/generation/stt/result/${fileId}`
        );
        return response.data;
    },


    /**
     * STT 진행률 WebSocket 구독
     */
    connectSTTProgress(
        taskId: string,
        onProgress: (data: STTProgressMessage) => void,
        onError?: (error: Error) => void
    ): WebSocket {
        // ✅ WebSocket URL 구성 (환경에 따라 조정)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = import.meta.env.DEV ? '8001' : window.location.port;
        const wsUrl = `${protocol}//${host}:${port}/api/ws/stt/${taskId}`;

        console.log('🔌 WebSocket 연결 시도:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('✅ WebSocket 연결됨:', taskId);
        };

        ws.onmessage = (event) => {
            const data: STTProgressMessage = JSON.parse(event.data);
            console.log('📊 진행률 수신:', data);
            onProgress(data);

            // 완료 시 자동 종료
            if (['completed', 'failed', 'aborted'].includes(data.status)) {
                console.log('🏁 작업 종료:', data.status);
                ws.close();
            }
        };

        ws.onerror = (error) => {
            console.error('❌ WebSocket 에러:', error);
            onError?.(new Error('WebSocket 연결 실패'));
        };

        ws.onclose = () => {
            console.log('🔌 WebSocket 연결 종료:', taskId);
        };

        return ws;
    },

    /**
     * STT 작업 중단 (명시적)
     */
    async abortSTTTask(taskId: string): Promise<void> {
        await apiClient.post(`/generation/stt/abort/${taskId}`);
    },

    /**
     * STT 작업 상태 조회 (Polling 용)
     */
    async getSTTStatus(taskId: string): Promise<STTStatusResponse> {
        const response = await apiClient.get<STTStatusResponse>(
            `/generation/stt/status/${taskId}`
        );
        return response.data;
    },

    /**
     * LLM 생성 요청 (기존 유지)
     */
    async generateLLM(payload: LLMRequestPayload): Promise<LLMResponse> {
        const response = await apiClient.post<LLMResponse>('/generation/llm', payload);
        return response.data;
    }
};