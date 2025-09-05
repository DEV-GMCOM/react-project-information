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
}

export const authService = new AuthService();