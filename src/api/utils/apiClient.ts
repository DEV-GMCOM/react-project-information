// src/api/utils/apiClient.ts - Vite 정석 버전
import axios from 'axios';

// Vite 환경변수 접근 (import.meta.env 사용)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';
const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'ERP Information Module';

// 개발 환경 여부 확인
const isDevelopment = import.meta.env.DEV;
const isProduction = import.meta.env.PROD;
const mode = import.meta.env.MODE;

console.log('🔧 API Client 설정:', {
    API_BASE_URL,
    APP_TITLE,
    mode,
    isDevelopment,
    isProduction
});

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5분 타임아웃
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(APP_TITLE && { 'X-App-Name': APP_TITLE }),
    },
    withCredentials: true,  // 쿠키 자동 포함
    // 개발 환경에서만 자세한 에러 정보 포함
    validateStatus: (status) => {
        return status >= 200 && status < 300;
    }
});

// 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        // 개발 환경에서만 상세 로깅
        if (isDevelopment) {
            console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`, {
                baseURL: config.baseURL,
                params: config.params,
                data: config.data
            });
        }

        // 요청 시간 기록 (성능 모니터링용)
        config.metadata = { startTime: Date.now() };

        // 세션 ID를 헤더에 추가 (쿠키와 함께)
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
            config.headers['X-Session-Id'] = sessionId;
        }

        // 로깅
        if (import.meta.env.DEV) {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error('❌ API 요청 오류:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
    (response) => {
        // 요청 시간 계산
        const duration = Date.now() - (response.config.metadata?.startTime || 0);

        if (isDevelopment) {
            console.log(`✅ API 응답: ${response.status} ${response.config.url}`, {
                duration: `${duration}ms`,
                data: response.data
            });
        }

        // 응답 헤더에서 유용한 정보 추출
        if (response.headers['x-total-count']) {
            response.data._meta = {
                totalCount: parseInt(response.headers['x-total-count']),
                duration
            };
        }

        return response;
    },
    (error) => {
        // 에러 정보 향상
        const enhancedError = {
            ...error,
            timestamp: new Date().toISOString(),
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            baseURL: error.config?.baseURL,
        };

        // 개발 환경에서 상세 에러 로깅
        if (isDevelopment) {
            console.error('❌ API 응답 오류:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                config: {
                    url: error.config?.url,
                    method: error.config?.method,
                    baseURL: error.config?.baseURL
                }
            });
        } else {
            // 프로덕션에서는 간단한 로깅
            console.error('API 오류:', error.response?.status, error.config?.url);
        }

        // 사용자 친화적 에러 메시지 추가
        if (error.response?.status === 401) {
            // 로그인 페이지가 아닌 경우에만 리다이렉트
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('session_id');
                window.location.href = '/login';
            }

            enhancedError.userMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.response?.status === 403) {
            enhancedError.userMessage = '접근 권한이 없습니다.';
        } else if (error.response?.status === 404) {
            enhancedError.userMessage = '요청한 데이터를 찾을 수 없습니다.';
        } else if (error.response?.status >= 500) {
            enhancedError.userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.code === 'NETWORK_ERROR') {
            enhancedError.userMessage = '네트워크 연결을 확인해주세요.';
        } else if (error.code === 'TIMEOUT') {
            enhancedError.userMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
        }

        return Promise.reject(enhancedError);
    }
);

// 공통 API 유틸리티 함수들
export const apiUtils = {
    // 헬스체크
    async healthCheck(): Promise<boolean> {
        try {
            const response = await apiClient.get('/health');
            return response.status === 200;
        } catch {
            return false;
        }
    },

    // 현재 설정 정보 반환
    getConfig() {
        return {
            baseURL: API_BASE_URL,
            appTitle: APP_TITLE,
            mode,
            isDevelopment,
            isProduction,
            timeout: apiClient.defaults.timeout
        };
    },

    // API 버전 확인
    async getApiVersion(): Promise<string | null> {
        try {
            const response = await apiClient.get('/version');
            return response.data.version || null;
        } catch {
            return null;
        }
    }
};

// TypeScript 모듈 선언 확장 (axios config에 metadata 추가)
declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata?: {
            startTime: number;
        };
    }
}

export default apiClient;