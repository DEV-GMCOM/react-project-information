import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/utils/apiClient';
import IdleTimeoutModal from '../components/IdleTimeoutModal';
import AutoLogoutAlertModal from '../components/AutoLogoutAlertModal';
import { setLogoutCallback } from '../api/utils/apiClient';
import { ENV } from '../config/env';

// --- 인터페이스 정의 (기존과 동일) ---
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
    const showIdleModalRef = useRef(showIdleModal); // 클로저 문제 방지를 위한 ref

    // showIdleModal 상태가 변경될 때마다 ref도 함께 업데이트
    useEffect(() => {
        showIdleModalRef.current = showIdleModal;
    }, [showIdleModal]);


    // --- 1. 핵심 기능 함수 정의 ---

    const logout = useCallback(async (isAutoLogout: boolean = false) => {
        // 모든 타이머를 확실하게 정리
        if (mainTimerRef.current) clearInterval(mainTimerRef.current);
        if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);

        try {
            // API 호출은 사용자 정보가 있을 때만 시도
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
        // user 상태가 없거나 모달이 떠 있는(유휴상태) 경우 전송 안 함
        if (!user || showIdleModalRef.current) return;
        try {
            console.log('🫀 Heartbeat 전송', new Date().toLocaleTimeString());
            await apiClient.post('/auth/heartbeat');
        } catch (error: any) {
            console.error('❌ Heartbeat 전송 실패:', error.response?.status);
            if (error.response?.status === 401) {
                logout(); // 세션 만료 시 즉시 로그아웃
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
        stopAllTimers(); // 시작 전, 항상 기존 타이머를 정리

        // Heartbeat 타이머 (서버 세션 연장용)
        heartbeatTimerRef.current = setInterval(sendHeartbeat, ENV.HEARTBEAT_INTERVAL);
        console.log(`❤️ Heartbeat 타이머 시작 (${ENV.HEARTBEAT_INTERVAL / 1000}초 간격)`);

        // 메인 타이머 (UI 유휴 상태 체크 및 카운트다운용, 1초마다 실행)
        mainTimerRef.current = setInterval(() => {
            // 모달이 팝업된 경우 (카운트다운 로직)
            if (showIdleModalRef.current) {
                setModalCountdown(prev => {
                    if (prev <= 1) {
                        logout(true); // 카운트다운 종료 시 자동 로그아웃
                        return 0;
                    }
                    return prev - 1;
                });
            }
            // 모달이 없는 경우 (유휴 시간 체크 로직)
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
        handleUserActivity(); // 마지막 활동 시간 즉시 갱신
        // 타이머는 아래 useEffect[user] 로직에 의해 자동으로 재시작되므로 직접 호출할 필요 없음
    }, [handleUserActivity]);

    // 로그인 상태(user)가 변경될 때 모든 것을 관리하는 메인 useEffect
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


    // --- 4. 인증 API 함수 (기존 로직 복원 및 정리) ---

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
            setIsLoading(false); // ★★★ 로딩 종료 지점
        }
    }, []);

    // ★★★ 앱이 처음 시작될 때 세션을 체크하는 로직 (무한 로딩 해결) ★★★
    useEffect(() => {
        checkSession();
    }, [checkSession]);

    const login = useCallback(async (loginId: string, password: string) => {
        try {
            const response = await apiClient.post('/auth/login', {
                login_id: loginId,
                password: password
            });
            setUser(response.data); // ★★★ 서버 응답 전체를 user 객체로 설정
        } catch (error: any) {
            // 에러 처리는 기존과 동일하게 유지
            if (error.response && error.response.status === 412) {
                throw new Error('INITIAL_PASSWORD_SETUP_REQUIRED');
            }
            throw new Error(error.response?.data?.detail || '로그인에 실패했습니다.');
        }
    }, []);

    // apiClient에 전역 로그아웃 콜백 등록 (기존과 동일)
    useEffect(() => {
        setLogoutCallback(() => {
            logout();
        });
    }, [logout]);


    // --- 5. 최종 렌더링 ---
    return (
        <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, checkSession }}>
            {children}
            <IdleTimeoutModal
                isOpen={showIdleModal}
                remainingSeconds={modalCountdown}
                onContinue={handleContinueSession}
                onLogout={() => logout()} // 수동 로그아웃
            />
            {showAutoLogoutAlert && <AutoLogoutAlertModal onClose={() => setShowAutoLogoutAlert(false)} />}
        </AuthContext.Provider>
    );
};