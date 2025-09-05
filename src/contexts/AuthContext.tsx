import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../api/utils/apiClient';

interface User {
    emp_id: number;
    emp_name: string;
    email: string;
    division?: string;
    team?: string;
    position?: string;
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

    // 세션 체크
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

    // 로그인
    const login = async (login_id: string, password: string) => {
        try {
            const response = await apiClient.post('/auth/login', {
                login_id,
                password
            }, {
                withCredentials: true
            });

            setUser(response.data);

            // 세션 ID를 localStorage에도 저장 (선택적)
            if (response.data.session_id) {
                localStorage.setItem('session_id', response.data.session_id);
            }
        } catch (error: any) {
            throw new Error(error.response?.data?.detail || '로그인 실패');
        }
    };

    // 로그아웃
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

    // 초기 세션 체크
    useEffect(() => {
        checkSession();
    }, []);

    // 주기적 세션 체크 (5분마다)
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