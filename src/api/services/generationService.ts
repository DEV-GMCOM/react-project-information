// src/api/services/generationService.ts

import apiClient from '../utils/apiClient';

// 타입 정의
export type STTEngine = "whisper" | "clova" | "google" | "aws" | "azure" | "vosk";
export type LLMEngine = "claude" | "chatgpt" | "gemini" | "perplexity" | "grok";
export type DocType = "summary" | "concept" | "draft";

// ✅ STT 관련 인터페이스들 (기존 유지)
export interface STTCreateResponse {
    task_id: string;
    file_id: number;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'aborted';
    message: string;
}

export interface STTProgressMessage {
    task_id: string;
    progress: number;
    message: string;
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'aborted';
    result_text?: string;
    error?: string;
    metadata?: {
        conversion_duration?: number;
        [key: string]: any;
    };
}

export interface STTResultResponse {
    stt_original_id: number;
    file_attachment_id: number;
    original_text: string;
    text_size: number;
    stt_engine_type: string;
    conversion_duration?: string;
    created_at: string;
}

export interface STTStatusResponse extends STTProgressMessage {
    metadata: Record<string, any>;
}

// ✅ LLM 관련 인터페이스 (수정)
export interface LLMRequestPayload {
    source_text: string;
    engine: LLMEngine;
    doc_types: DocType[];
    meeting_id: number;  // ✅ 필수로 추가
    stt_original_id?: number;  // ✅ 선택 추가
}

export interface LLMResult {
    doc_type: DocType;
    title: string;
    content: string;
    llm_document_id?: number;  // ✅ 추가 (DB 저장 후 반환)
}

export interface LLMResponse {
    engine: LLMEngine;
    results: LLMResult[];
    processing_time_ms: number;
}

// ✅ 공유 요청 인터페이스 (신규)
export interface ShareMeetingRequest {
    meeting_id: number;
    share_methods: string[];
}

export interface ShareMeetingResponse {
    message: string;
    meeting_id: number;
    share_methods: string[];
    shared_count: number;
}

// API 서비스
export const generationService = {
    /**
     * STT 작업 생성 (기존 유지)
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
        if (options?.meeting_id !== null && options?.meeting_id !== undefined) {
            formData.append('meeting_id', options.meeting_id.toString());
        }

        console.log('📤 STT 요청 전송:');
        console.log('  - engine:', engine);
        console.log('  - file:', file.name, file.size, 'bytes');
        console.log('  - model_size:', options?.model_size);
        console.log('  - language:', options?.language);
        console.log('  - meeting_id:', options?.meeting_id);

        try {
            const response = await apiClient.post<STTCreateResponse>(
                '/generation/stt/create',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('❌ STT 작업 생성 실패:', error);
            console.error('응답 데이터:', error.response?.data);
            console.error('응답 상태:', error.response?.status);

            if (error.response?.status === 422) {
                console.error('❌ 422 Validation Error Details:', JSON.stringify(error.response.data, null, 2));
            }

            throw error;
        }
    },

    /**
     * 기존 파일로 STT 작업 생성 (신규)
     */
    async createSTTTaskFromExistingFile(
        engine: STTEngine,
        fileId: number,
        options?: {
            model_size?: 'tiny' | 'base' | 'small' | 'medium' | 'large';
            language?: string;
        }
    ): Promise<STTCreateResponse> {
        const formData = new FormData();
        formData.append('engine', engine);
        formData.append('file_id', fileId.toString());

        if (options?.model_size) {
            formData.append('model_size', options.model_size);
        }
        if (options?.language) {
            formData.append('language', options.language);
        }

        try {
            const response = await apiClient.post<STTCreateResponse>(
                '/generation/stt/create/from-file',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            return response.data;
        } catch (error: any) {
            console.error('❌ 기존 파일 STT 작업 생성 실패:', error);
            throw error;
        }
    },

    /**
     * STT 결과 조회
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
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.hostname;
        const port = import.meta.env.DEV ? '8001' : window.location.port;

        const sessionId = localStorage.getItem('session_id'); // ✅ 세션 ID 가져오기

        // [추가] 세션 ID가 없으면 에러 발생
        if (!sessionId) {
            const error = new Error('세션 ID가 없어 WebSocket 연결을 시도할 수 없습니다. 다시 로그인해주세요.');
            console.error('❌ WebSocket 연결 실패:', error.message);
            onError?.(error);
            // WebSocket 객체를 반환해야 하므로 임시로 빈 객체 반환
            return { close: () => {}, send: () => {} } as unknown as WebSocket; // 더미 객체 반환
        }

        const wsUrl = `${protocol}//${host}:${port}/api/ws/stt/${taskId}?session_id=${sessionId}`; // ✅ URL에 추가

        console.log('🔌 WebSocket 연결 시도:', wsUrl);

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('✅ WebSocket 연결됨:', taskId);
        };

        ws.onmessage = (event) => {
            const data: STTProgressMessage = JSON.parse(event.data);
            console.log('📊 진행률 수신:', data);
            onProgress(data);

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
     * STT 작업 중단
     */
    async abortSTTTask(taskId: string): Promise<void> {
        await apiClient.post(`/generation/stt/abort/${taskId}`);
    },

    /**
     * STT 작업 상태 조회
     */
    async getSTTStatus(taskId: string): Promise<STTStatusResponse> {
        const response = await apiClient.get<STTStatusResponse>(
            `/generation/stt/status/${taskId}`
        );
        return response.data;
    },

    /**
     * LLM 생성 요청 (수정됨 - meeting_id 필수)
     */
    async generateLLM(payload: LLMRequestPayload): Promise<LLMResponse> {
        const response = await apiClient.post<LLMResponse>('/generation/llm', payload);
        return response.data;
    },

    /**
     * 회의록 공유 요청 (신규 추가)
     */
    async shareMeeting(request: ShareMeetingRequest): Promise<ShareMeetingResponse> {
        const response = await apiClient.post<ShareMeetingResponse>(
            '/generation/meeting/share',
            request
        );
        return response.data;
    }
};