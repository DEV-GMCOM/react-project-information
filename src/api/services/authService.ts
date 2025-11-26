import { apiClient } from '../utils/apiClient';

export interface LoginRequest {
    login_id: string;
    password: string;
}

export interface User {
    emp_id: number;
    emp_name: string;
    email: string;
    division?: string;
    team?: string;
    position?: string;
    // 👇 추가된 필드: Layout.tsx에서 사용하고 있으므로 타입에 정의해줍니다.
    login_id: string;
    user_name: string;
}

export interface LoginResponse extends User {
    session_id: string;
    expires_at: string;
}

export class AuthService {
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        const response = await apiClient.post('/auth/login', credentials);
        // 세션 ID 로컬 스토리지 저장
        if (response.data.session_id) {
            localStorage.setItem('session_id', response.data.session_id);
        }
        return response.data;
    }

    async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            localStorage.removeItem('session_id');
        }
    }

    async getMe(): Promise<User> {
        const response = await apiClient.get('/auth/me');
        return response.data;
    }

    async checkSession(): Promise<{ valid: boolean; user?: User }> {
        const response = await apiClient.post('/auth/check-session');
        return response.data;
    }

    async refreshSession(): Promise<{ expires_at: string }> {
        const response = await apiClient.post('/auth/refresh-session');
        return response.data;
    }

    async requestPasswordResetWithBirthDate(data: { login_id: string; birth_date: string }): Promise<{ message: string }> {
        const response = await apiClient.post('/auth/request-password-reset', data);
        return response.data;
    }

    // 👇 추가된 메소드: 비밀번호 변경 API를 호출하는 함수
    async changePassword(data: { current_password: string; new_password: string }): Promise<{ message: string }> {
        const response = await apiClient.put('/auth/change-password', data); // RESTful하게 PUT 메소드 사용 권장
        return response.data;
    }

    // 👇 추가된 메소드: 잔디 연결 API 호출
    async connectJandi(data: { link: string }): Promise<{ message: string }> {
        const response = await apiClient.put('/auth/me/jandi-connection', { jandi_webhook_url: data.link });
        return response.data;
    }
}

export const authService = new AuthService();
