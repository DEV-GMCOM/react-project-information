// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '../api/utils/apiClient';
import { useIdleTimer } from '../hooks/useIdleTimer';
import IdleTimeoutModal from '../components/IdleTimeoutModal';
import AutoLogoutAlertModal from '../components/AutoLogoutAlertModal';
import { setLogoutCallback } from '../api/utils/apiClient';
import { ENV } from '../config/env';

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
    login_id: string;
    division?: string;
    team?: string;
    position?: string;
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

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showIdleModal, setShowIdleModal] = useState(false);
    const [showAutoLogoutAlert, setShowAutoLogoutAlert] = useState(false);

    // logout 함수
    const logout = useCallback(async () => {
        try {
            await apiClient.post('/auth/logout', {}, {
                withCredentials: true
            });
        } finally {
            setUser(null);
            localStorage.removeItem('session_id');
            setShowIdleModal(false);
            setShowAutoLogoutAlert(false);  // ✅ 추가 필요
        }
    }, []);

    // 자동 로그아웃 함수
    const handleAutoLogout = useCallback(async () => {
        await logout();
        localStorage.setItem('auto_logout_reason', 'inactivity');
        setShowAutoLogoutAlert(true);
    }, [logout]);

    // 세션 체크
    const checkSession = async () => {
        try {
            const response = await apiClient.post('/auth/check-session', {}, {
                withCredentials: true
            });

            if (response.data.valid && response.data.user) {
                setUser(response.data.user);
            } else {
                setUser(null);
                localStorage.removeItem('session_id');
            }
        } catch (error) {
            setUser(null);
            localStorage.removeItem('session_id');
        } finally {
            setIsLoading(false);
        }
    };

    // Heartbeat 전송
    const sendHeartbeat = useCallback(async () => {
        if (!user) return;

        try {
            console.log('🫀 Heartbeat 전송 시도...', new Date().toLocaleTimeString());

            await apiClient.post('/auth/heartbeat', {}, {
                withCredentials: true
            });
            console.log('✅ Heartbeat 전송 성공', new Date().toLocaleTimeString());
        } catch (error: any) {
            console.error('❌ Heartbeat 전송 실패:', error.response?.status, new Date().toLocaleTimeString());

            if (error.response?.status === 401) {
                console.warn('⚠️ 세션 만료 감지 (Heartbeat)');
                setShowIdleModal(false);  // ✅ 추가: 모달 닫기
                setUser(null);
                localStorage.removeItem('session_id');
            }
        }
    }, [user]);

    // 로그인
    const login = async (loginId: string, password: string) => {
        try {
            const response = await apiClient.post('/auth/login', {
                login_id: loginId,
                password: password
            }, {
                withCredentials: true
            });

            setUser({
                emp_id: response.data.emp_id,
                emp_name: response.data.emp_name,
                email: response.data.email,
                login_id: loginId,
                division: response.data.division,
                team: response.data.team,
                position: response.data.position,
                role_id: response.data.role_id,
                role: response.data.role
            });

            localStorage.setItem('session_id', response.data.session_id);
        } catch (error: any) {
            if (error.response && error.response.status === 412) {
                throw new Error('INITIAL_PASSWORD_SETUP_REQUIRED');
            }
            throw new Error(error.response?.data?.detail || '로그인 실패');
        }
    };

    // 계속 사용하기
    const handleContinueSession = () => {
        console.log('✅ 계속 사용하기 클릭');

        // ✅ 1. 먼저 모달 닫기 (이렇게 해야 enabled가 true로 변경됨)
        setShowIdleModal(false);

        // ✅ 2. 타이머 리셋 및 heartbeat는 약간의 딜레이 후 실행
        setTimeout(() => {
            resetTimer();
            sendHeartbeat();
        }, 50);
    };

    // Idle 타이머 - enabled는 user 기반으로만
    const { isIdle, remainingTime, resetTimer, getLastActivityTime } = useIdleTimer({
        timeout: ENV.IDLE_TIMEOUT,
        warningTime: ENV.IDLE_WARNING_COUNTDOWN,
        onIdle: () => {
            if (user) {
                console.log('🔴 Idle 감지:', new Date().toLocaleTimeString());
                setShowIdleModal(true);
            }
        },
        enabled: !!user,  // ✅ user만 체크 (showIdleModal 제거)
        stopOnIdle: true  // ✅ isIdle일 때 activity 무시
    });

    // apiClient에 logout 콜백 등록
    useEffect(() => {
        setLogoutCallback(() => {
            logout();
        });
    }, [logout]);

    // 401 에러로 인한 세션 만료 처리
    useEffect(() => {
        const handleSessionExpired = () => {
            logout();
            localStorage.setItem('auto_logout_reason', 'session_expired');
            setShowAutoLogoutAlert(true);
        };

        window.addEventListener('auth:session-expired', handleSessionExpired);

        return () => {
            window.removeEventListener('auth:session-expired', handleSessionExpired);
        };
    }, [logout]);

    // 카운트다운 종료 시 자동 로그아웃
    // 자동 로그아웃 체크에 showIdleModal 조건 추가
    useEffect(() => {
        // ✅ showIdleModal이 false면 체크하지 않음
        if (isIdle && showIdleModal && remainingTime <= 0) {
            console.log('⏰ 자동 로그아웃 실행');
            handleAutoLogout();
        }
    }, [isIdle, showIdleModal, remainingTime, handleAutoLogout]);

    // Heartbeat 주기적 전송 - 환경 변수 사용
    useEffect(() => {
        if (!user) return;

        const heartbeatInterval = setInterval(() => {
            const timeSinceActivity = Date.now() - getLastActivityTime();

            // 마지막 활동 시간이 heartbeat 간격보다 짧으면 전송
            if (timeSinceActivity < ENV.HEARTBEAT_INTERVAL) {
                sendHeartbeat();
            }
        }, ENV.HEARTBEAT_INTERVAL);

        return () => clearInterval(heartbeatInterval);
    }, [user, sendHeartbeat, getLastActivityTime]);

    // 초기 세션 체크
    useEffect(() => {
        checkSession();
    }, []);

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

            {user && (  // ✅ user 있을 때만
                <IdleTimeoutModal
                    isOpen={showIdleModal}
                    remainingSeconds={Math.ceil(remainingTime / 1000)}
                    onContinue={handleContinueSession}
                    onLogout={logout}
                />
            )}

            {showAutoLogoutAlert && (
                <AutoLogoutAlertModal
                    onClose={() => setShowAutoLogoutAlert(false)}
                />
            )}
        </AuthContext.Provider>
    );
};