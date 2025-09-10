// src/contexts/AuthContext.tsx (기존 소스에 role 정보 추가)
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/utils/apiClient';

// 기존 User 인터페이스에 role 정보 추가
interface Role {
    role_id: number;
    role_name: string;
    role_code: string;
    can_view_finance: boolean;
    can_edit_finance: boolean;
}

interface User {
    emp_id: number;
    emp_name: string;
    email: string;
    division?: string;
    team?: string;
    position?: string;
    // 새로 추가되는 권한 관련 필드들
    role_id?: number;
    role?: Role;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (login_id: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 세션 체크 (기존 로직 유지)
    const checkSession = async () => {
        try {
            const response = await apiClient.get('/auth/me', {
                withCredentials: true
            });
            setUser(response.data);
        } catch {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    // 로그인 (기존 로직 유지하되 응답 데이터 확장)
    const login = async (login_id: string, password: string) => {
        try {
            const response = await apiClient.post('/auth/login', {
                login_id,
                password
            }, {
                withCredentials: true
            });
            setUser(response.data);
            if (response.data.session_id) {
                localStorage.setItem('session_id', response.data.session_id);
            }
        } catch (error: any) {
            // [핵심 수정] 에러의 상태 코드를 확인하여 분기 처리합니다.
            if (error.response && error.response.status === 412) {
                // 412 에러일 경우, Login 컴포넌트가 식별할 수 있는 특별한 에러 메시지를 던집니다.
                throw new Error('INITIAL_PASSWORD_SETUP_REQUIRED');
            }
            // 그 외의 모든 에러는 기존과 동일하게 처리합니다.
            throw new Error(error.response?.data?.detail || '로그인 실패');
        }
    };

    // 로그아웃 (기존 로직 그대로 유지)
    const logout = async () => {
        try {
            await apiClient.post('/auth/logout', {}, {
                withCredentials: true
            });
        } finally {
            setUser(null);
            localStorage.removeItem('session_id');
        }
    };

    // 초기 세션 체크 (기존 로직 그대로 유지)
    useEffect(() => {
        checkSession();
    }, []);

    // 주기적 세션 체크 (기존 로직 그대로 유지)
    useEffect(() => {
        const interval = setInterval(() => {
            if (user) {
                checkSession();
            }
        }, 5 * 60 * 1000);

        return () => clearInterval(interval);
    }, [user]);

    return (
        <AuthContext.Provider
            value={{
                user,
                isAuthenticated: !!user,
                isLoading,
                login,
                logout,
                checkSession
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};