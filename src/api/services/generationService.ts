// src/api/services/generationService.ts

import apiClient from '../utils/apiClient';

// 1. 백엔드와 동일한 타입 정의
export type STTEngine = "whisper" | "clova" | "google" | "aws" | "azure" | "vosk";
export type LLMEngine = "claude" | "chatgpt" | "gemini" | "perplexity" | "grok";
export type DocType = "summary" | "concept" | "draft";

// 2. LLM 요청 (Request) 타입
export interface LLMRequestPayload {
    source_text: string;
    engine: LLMEngine;
    doc_types: DocType[]; // string[] 배열
}

// 3. STT 응답 (Response) 타입
export interface STTResponse {
    engine: STTEngine;
    text: string;
    processing_time_ms: number;
}

// 4. LLM 응답 (Response) 타입
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


// 5. API 서비스 객체
export const generationService = {
    /**
     * STT 변환 요청 (FormData 사용)
     */
    async generateSTT(engine: STTEngine, file: File): Promise<STTResponse> {
        const formData = new FormData();
        formData.append('engine', engine);
        formData.append('file', file);

        // FormData 전송 시 Content-Type 헤더는 axios가 자동으로 설정
        const response = await apiClient.post<STTResponse>('/generation/stt', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * LLM 생성 요청 (JSON 사용)
     */
    async generateLLM(payload: LLMRequestPayload): Promise<LLMResponse> {
        const response = await apiClient.post<LLMResponse>('/generation/llm', payload);
        return response.data;
    }
};