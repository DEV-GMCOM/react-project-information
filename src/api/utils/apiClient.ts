// src/api/utils/apiClient.ts - Vite 정석 버전
import axios from 'axios';

// Vite 환경변수 접근 (import.meta.env 사용)
const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'ERP Information Module';

// 개발 환경 여부 확인
const isDevelopment = import.meta.env.DEV;

// 환경변수에서 API 기본 URL을 직접 가져와 상수로 사용합니다.
// const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/information';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5분 타임아웃
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        ...(APP_TITLE && { 'X-App-Name': APP_TITLE }),
    },
    withCredentials: true,  // 쿠키 자동 포함
    validateStatus: (status) => {
        return status >= 200 && status < 300;
    }
});

// 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        if (isDevelopment) {
            console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`, {
                baseURL: config.baseURL,
                params: config.params,
                data: config.data
            });
        }
        config.metadata = { startTime: Date.now() };
        const sessionId = localStorage.getItem('session_id');
        if (sessionId) {
            config.headers['X-Session-Id'] = sessionId;
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
        const duration = Date.now() - (response.config.metadata?.startTime || 0);
        if (response.config.responseType === 'blob') {
            if (isDevelopment) {
                console.log(`✅ API 응답 (Blob): ${response.status} ${response.config.url}`, {
                    duration: `${duration}ms`,
                    contentType: response.headers['content-type'],
                    contentLength: response.headers['content-length'],
                    contentDisposition: response.headers['content-disposition']
                });
            }
            return response;
        }
        if (isDevelopment) {
            console.log(`✅ API 응답: ${response.status} ${response.config.url}`, {
                duration: `${duration}ms`,
                data: response.data
            });
        }
        if (response.headers['x-total-count']) {
            response.data._meta = {
                totalCount: parseInt(response.headers['x-total-count']),
                duration
            };
        }
        return response;
    },
    (error) => {
        const enhancedError = {
            ...error,
            timestamp: new Date().toISOString(),
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            baseURL: error.config?.baseURL,
        };

        if (isDevelopment && error.config?.responseType !== 'blob') {
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
        } else if (!isDevelopment) {
            console.error('API 오류:', error.response?.status, error.config?.url);
        }

        if (error.response?.status === 401) {
            if (!window.location.pathname.includes('/login')) {
                localStorage.removeItem('session_id');
                // =================================================================
                // ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 이 부분을 수정 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
                //
                // 이 라인은 React Router를 무시하고 페이지를 강제로 새로고침하여
                // 'basename' 관련 경고를 유발합니다.
                // 따라서 이 코드를 삭제하거나 주석 처리하여 apiClient가 페이지 이동에
                // 관여하지 않도록 합니다.
                // window.location.href = '/information/login';
                //
                // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ 이 부분을 수정 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲
                // =================================================================
            }
            enhancedError.userMessage = '인증이 만료되었습니다. 다시 로그인해주세요.';
        } else if (error.response?.status === 403) {
            enhancedError.userMessage = '접근 권한이 없습니다.';
        } else if (error.response?.status === 404) {
            enhancedError.userMessage = '요청한 데이터를 찾을 수 없습니다.';
        } else if (error.response?.status >= 500) {
            enhancedError.userMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.code === 'NETWORK_ERROR' || error.code === 'ERR_NETWORK') {
            enhancedError.userMessage = '네트워크 연결을 확인해주세요.';
        } else if (error.code === 'TIMEOUT') {
            enhancedError.userMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
        }
        return Promise.reject(enhancedError);
    }
);

// 공통 API 유틸리티 함수들 (기존과 동일)
export const apiUtils = {
    async healthCheck(): Promise<boolean> {
        try {
            const response = await apiClient.get('/health');
            return response.status === 200;
        } catch {
            return false;
        }
    },
    getConfig() {
        return {
            baseURL: API_BASE_URL,
            appTitle: APP_TITLE,
            mode: import.meta.env.MODE,
            isDevelopment,
            isProduction: import.meta.env.PROD,
            timeout: apiClient.defaults.timeout
        };
    },
    async getApiVersion(): Promise<string | null> {
        try {
            const response = await apiClient.get('/version');
            return response.data.version || null;
        } catch {
            return null;
        }
    }
};

// TypeScript 모듈 선언 확장 (기존과 동일)
declare module 'axios' {
    export interface AxiosRequestConfig {
        metadata?: {
            startTime: number;
        };
    }
}

export default apiClient;
