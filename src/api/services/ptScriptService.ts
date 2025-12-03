import apiClient from '../utils/apiClient';

export interface PTScriptTimelineItem {
    time: string;
    title: string;
    keyMessage: string;
    emphasis: string;
    delivery: string;
}

export interface PTScriptRequest {
    projectId?: number;
    processData?: string;
    rfpText?: string;
    materialsNote?: string;
    uploadedFileIds?: number[];
    clientAnalysis: string;
    gmcomStrengths: string;
    durationMinutes: number;
    timelineSeed?: PTScriptTimelineItem[];
    language?: string;
}

export interface PTScriptResponse {
    timeline: PTScriptTimelineItem[];
    fullScript: string;
    prompt: {
        system: string;
        user: string;
    };
    assumptions?: string[];
}

const useMock = import.meta.env?.VITE_PTSCRIPT_MOCK === 'true'; // 기본값: 실제 API 사용, 필요 시 env로 목업 전환

const mockGenerateScript = async (payload: PTScriptRequest): Promise<PTScriptResponse> => {
    const baseTimeline = payload.timelineSeed?.length ? payload.timelineSeed : [
        {
            time: '00:00-00:45',
            title: '오프닝',
            keyMessage: '오늘 제안 목적, 팀 소개, 기대효과 예고',
            emphasis: '감사의 인사, 자신감 있는 톤',
            delivery: '속도 보통, 첫 문장 후 1초 정지'
        },
        {
            time: '00:45-02:00',
            title: '과업 이해',
            keyMessage: '발주처 니즈와 성공 기준을 재정의',
            emphasis: '클라이언트 언어로 반복',
            delivery: '속도 느리게, 문단마다 호흡'
        }
    ];

    const fullScript = baseTimeline
        .map((item, idx) => `${idx + 1}. [${item.time}] ${item.title} — ${item.keyMessage}\n   강조/톤: ${item.emphasis}\n   전달: ${item.delivery}`)
        .join('\n\n');

    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                timeline: baseTimeline,
                fullScript,
                prompt: {
                    system: 'System prompt placeholder',
                    user: 'User prompt placeholder'
                },
                assumptions: payload.clientAnalysis || payload.gmcomStrengths ? [] : ['입력 부족으로 일부 내용을 가정했습니다.']
            });
        }, 600);
    });
};

export const ptScriptService = {
    async generateScript(payload: PTScriptRequest): Promise<PTScriptResponse> {
        if (useMock) {
            return mockGenerateScript(payload);
        }

        const response = await apiClient.post<PTScriptResponse>('/generation/pt-script', payload);
        return response.data;
    }
};
