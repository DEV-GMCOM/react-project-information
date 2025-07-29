// 1. 타입 가드 함수 생성 (utils 폴더에 추가)
// src/utils/errorUtils.ts
export const isError = (error: unknown): error is Error => {
    return error instanceof Error;
};

export const getErrorMessage = (error: unknown): string => {
    if (isError(error)) {
        return error.message;
    }
    if (typeof error === 'string') {
        return error;
    }
    return '알 수 없는 오류가 발생했습니다.';
};

// 2. API 에러 처리용 헬퍼
export const handleApiError = (error: unknown): string => {
    if (isError(error)) {
        // Axios 에러 처리
        if ('response' in error && error.response) {
            const response = error.response as any;
            return response.data?.detail || response.data?.message || error.message;
        }
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    return '네트워크 오류가 발생했습니다.';
};

