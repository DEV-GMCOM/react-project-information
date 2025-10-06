// src/config/env.ts

export const ENV = {
    // 세션 관리
    HEARTBEAT_INTERVAL: Number(import.meta.env.VITE_HEARTBEAT_INTERVAL) || 300000, // 기본 5분
    IDLE_TIMEOUT: Number(import.meta.env.VITE_IDLE_TIMEOUT) || 900000, // 기본 15분
    IDLE_WARNING_COUNTDOWN: Number(import.meta.env.VITE_IDLE_WARNING_COUNTDOWN) || 30000, // 기본 30초

    // API
    API_URL: import.meta.env.VITE_API_URL || '/api',
    APP_TITLE: import.meta.env.VITE_APP_TITLE || 'ERP Information Module',

    // 환경
    MODE: import.meta.env.MODE,
    IS_DEV: import.meta.env.DEV,
    IS_PROD: import.meta.env.PROD,
} as const;

// 개발 환경에서 설정값 출력
if (ENV.IS_DEV) {
    console.log('🔧 환경 설정:', {
        heartbeatInterval: `${ENV.HEARTBEAT_INTERVAL / 1000}초`,
        idleTimeout: `${ENV.IDLE_TIMEOUT / 60000}분`,
        idleWarning: `${ENV.IDLE_WARNING_COUNTDOWN / 1000}초`,
    });
}

console.log('ENV 설정:', {
    IDLE_TIMEOUT: ENV.IDLE_TIMEOUT,
    HEARTBEAT_INTERVAL: ENV.HEARTBEAT_INTERVAL,
});

// ✅ 헬퍼 함수 추가
export const formatIdleTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
        return seconds > 0 ? `${minutes}분 ${seconds}초` : `${minutes}분`;
    }
    return `${seconds}초`;
};