import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/utils/apiClient';
import IdleTimeoutModal from '../components/IdleTimeoutModal';
import AutoLogoutAlertModal from '../components/AutoLogoutAlertModal';
import { setLogoutCallback } from '../api/utils/apiClient';
import { ENV } from '../config/env';

// --- 인터페이스 정의 (수정) ---
interface Permission {
    permission_id: number;
    permission_code: string;
    permission_name: string;
}

interface Role {
    role_id: number;
    role_name: string;
    role_code: string;
    permissions: Permission[]; // 권한 목록 추가
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
    hasRole: (roleCode: string) => boolean; // hasRole 함수 추가
    hasPermission: (permissionCode: string) => boolean; // hasPermission 함수 추가
}

interface AuthProviderProps {
    children: React.ReactNode;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // 세션 관리 상태
    const [showIdleModal, setShowIdleModal] = useState(false);
    const [modalCountdown, setModalCountdown] = useState(ENV.IDLE_WARNING_COUNTDOWN / 1000);
    const [showAutoLogoutAlert, setShowAutoLogoutAlert] = useState(false);

    // 타이머와 마지막 활동 시간을 관리하기 위한 ref
    const lastActivityTimeRef = useRef(Date.now());
    const mainTimerRef = useRef<NodeJS.Timeout>();
    const heartbeatTimerRef = useRef<NodeJS.Timeout>();
    const showIdleModalRef = useRef(showIdleModal);

    useEffect(() => {
        showIdleModalRef.current = showIdleModal;
    }, [showIdleModal]);

    // --- 권한 확인 헬퍼 함수 구현 ---
    const hasRole = useCallback((roleCode: string): boolean => {
        return user?.role?.role_code === roleCode;
    }, [user]);

    const hasPermission = useCallback((permissionCode: string): boolean => {
        if (!user || !user.role || !user.role.permissions) {
            return false;
        }
        return user.role.permissions.some(p => p.permission_code === permissionCode);
    }, [user]);


    // --- 1. 핵심 기능 함수 정의 ---

    const logout = useCallback(async (isAutoLogout: boolean = false) => {
        if (mainTimerRef.current) clearInterval(mainTimerRef.current);
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

        try {
            if (user) {
                await apiClient.post('/auth/logout');
            }
        } catch (error) {
            console.error("로그아웃 API 호출 실패:", error);
        } finally {
            setUser(null);
            setShowIdleModal(false);
            if (isAutoLogout) {
                localStorage.setItem('auto_logout_reason', 'inactivity');
                setShowAutoLogoutAlert(true);
            }
        }
    }, [user]);

    const sendHeartbeat = useCallback(async () => {
        if (!user || showIdleModalRef.current) return;
        try {
            console.log('🫀 Heartbeat 전송', new Date().toLocaleTimeString());
            await apiClient.post('/auth/heartbeat');
        } catch (error: any) {
            console.error('❌ Heartbeat 전송 실패:', error.response?.status);
            if (error.response?.status === 401) {
                logout();
            }
        }
    }, [user, logout]);


    // --- 2. 타이머 관리 로직 ---

    const stopAllTimers = useCallback(() => {
        if (mainTimerRef.current) clearInterval(mainTimerRef.current);
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
        console.log('⏹️ 모든 타이머가 중지되었습니다.');
    }, []);

    const startAllTimers = useCallback(() => {
        stopAllTimers();

        heartbeatTimerRef.current = setInterval(sendHeartbeat, ENV.HEARTBEAT_INTERVAL);
        console.log(`❤️ Heartbeat 타이머 시작 (${ENV.HEARTBEAT_INTERVAL / 1000}초 간격)`);

        mainTimerRef.current = setInterval(() => {
            if (showIdleModalRef.current) {
                setModalCountdown(prev => {
                    if (prev <= 1) {
                        logout(true);
                        return 0;
                    }
                    return prev - 1;
                });
            }
            else {
                const idleTime = Date.now() - lastActivityTimeRef.current;
                if (idleTime >= ENV.IDLE_TIMEOUT) {
                    console.log('🔴 유휴 상태 감지. 모달을 표시합니다.');
                    setShowIdleModal(true);
                    setModalCountdown(ENV.IDLE_WARNING_COUNTDOWN / 1000);
                }
            }
        }, 1000);
        console.log('⏰ 메인 유휴상태 체크 타이머 시작 (1초 간격)');

    }, [stopAllTimers, sendHeartbeat, logout]);


    // --- 3. 이벤트 핸들러 및 라이프사이클 관리 ---

    const handleUserActivity = useCallback(() => {
        lastActivityTimeRef.current = Date.now();
    }, []);

    const handleContinueSession = useCallback(() => {
        console.log('✅ 세션을 연장합니다.');
        setShowIdleModal(false);
        handleUserActivity();
    }, [handleUserActivity]);

    useEffect(() => {
        const activityEvents: (keyof WindowEventMap)[] = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

        if (user) {
            handleUserActivity();
            startAllTimers();
            activityEvents.forEach(event => window.addEventListener(event, handleUserActivity));
        } else {
            stopAllTimers();
            activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
        }

        return () => {
            stopAllTimers();
            activityEvents.forEach(event => window.removeEventListener(event, handleUserActivity));
        };
    }, [user, startAllTimers, stopAllTimers, handleUserActivity]);


    // --- 4. 인증 API 함수 ---

    const checkSession = useCallback(async () => {
        try {
            const response = await apiClient.post('/auth/check-session');
            if (response.data.valid && response.data.user) {
                setUser(response.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = useCallback(async (loginId: string, password: string) => {
        try {
            const response = await apiClient.post('/auth/login', {
                login_id: loginId,
                password: password
            });
            // 중요: 백엔드에서 이제 role과 permissions가 포함된 user 객체를 반환해야 합니다.
            setUser(response.data);

            const today = new Date().toDateString();
            const hiddenUntil = localStorage.getItem('notice_hidden_until');

            if (hiddenUntil !== today) {
                localStorage.setItem('show_notice_on_login', 'true');
            }

            console.log('✅ 로그인 성공:', response.data);
        } catch (error: any) {
            if (error.response && error.response.status === 412) {
                throw new Error('INITIAL_PASSWORD_SETUP_REQUIRED');
            }
            throw new Error(error.response?.data?.detail || '로그인에 실패했습니다.');
        }
    }, []);

    useEffect(() => {
        setLogoutCallback(() => {
            logout();
        });
    }, [logout]);


    // --- 5. 최종 렌더링 ---
    const contextValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkSession,
        hasRole,
        hasPermission
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
            <IdleTimeoutModal
                isOpen={showIdleModal}
                remainingSeconds={modalCountdown}
                onContinue={handleContinueSession}
                onLogout={() => logout()}
            />
            {showAutoLogoutAlert && <AutoLogoutAlertModal onClose={() => setShowAutoLogoutAlert(false)} />}
        </AuthContext.Provider>
    );
};
