import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import apiClient from '../api/utils/apiClient';
import IdleTimeoutModal from '../components/IdleTimeoutModal';
import AutoLogoutAlertModal from '../components/AutoLogoutAlertModal';
import { setLogoutCallback } from '../api/utils/apiClient';
import { ENV } from '../config/env';
import { noticeService } from '../api/services/noticeService';
import { notificationService } from '../api/services/notificationService';
import { hasNewPublicNotices } from '../utils/noticeCookie';

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
    permissions: Permission[]; 
}

interface User {
    emp_id: number;
    emp_name: string;
    email: string;
    login_id: string;
    division?: string;
    team?: string;
    position?: string;
    role_id?: number; // Deprecated
    role?: Role;      // Deprecated (Primary role)
    roles?: Role[];   // NEW: Multiple roles
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (login_id: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkSession: () => Promise<void>;
    refreshUser: () => Promise<void>; // Add this line
    hasRole: (roleCode: string) => boolean;
    hasPermission: (permissionCode: string) => boolean;
    hasUnreadNotification: boolean; // ✅ 추가 (개인 알림)
    hasUnreadPublicNotice: boolean; // ✅ 추가 (공지사항)
    refreshNotifications: () => Promise<void>;
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
    
    // 알림 상태
    const [hasUnreadNotification, setHasUnreadNotification] = useState(false); // 개인 알림
    const [hasUnreadPublicNotice, setHasUnreadPublicNotice] = useState(false); // 공지사항

    // 타이머와 마지막 활동 시간을 관리하기 위한 ref
    const lastActivityTimeRef = useRef(Date.now());
    const mainTimerRef = useRef<NodeJS.Timeout>();
    const heartbeatTimerRef = useRef<NodeJS.Timeout>();
    const showIdleModalRef = useRef(showIdleModal);
    const notificationCheckCounter = useRef(0); // ✅ 알림 체크 카운터 추가
    const heartbeatCounter = useRef(0); // ✅ Heartbeat 카운터 추가

    useEffect(() => {
        showIdleModalRef.current = showIdleModal;
    }, [showIdleModal]);

    // --- 권한 확인 헬퍼 함수 (N:M 지원 수정) ---
    const hasRole = useCallback((roleCode: string): boolean => {
        if (!user || !user.roles) return false;
        // 사용자가 가진 역할 중 하나라도 일치하면 true
        return user.roles.some(r => r.role_code === roleCode);
    }, [user]);

    const hasPermission = useCallback((permissionCode: string): boolean => {
        if (!user || !user.roles) return false;
        
        // super_admin 특별 처리 로직 제거

        // 사용자가 가진 모든 역할의 권한을 순회하며 확인 (Union)
        for (const role of user.roles) {
            if (role.permissions && role.permissions.some(p => p.permission_code === permissionCode)) {
                return true;
            }
        }
        return false;
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
            localStorage.removeItem('session_id'); 
            if (isAutoLogout) {
                localStorage.setItem('auto_logout_reason', 'inactivity');
                setShowAutoLogoutAlert(true);
            }
        }
    }, [user]);

    const sendHeartbeat = useCallback(async () => {
        if (!user || showIdleModalRef.current) return;
        try {
            // console.log('🫀 Heartbeat 전송', new Date().toLocaleTimeString());
            await apiClient.post('/auth/heartbeat');
        } catch (error: any) {
            console.error('❌ Heartbeat 전송 실패:', error.response?.status);
            if (error.response?.status === 401) {
                logout();
            }
        }
    }, [user, logout]);

    // ✅ 알림 및 공지사항 체크 함수 (3분마다 실행)
    const checkNotifications = useCallback(async () => {
        if (!user) return;

        // 1. 개인 알림 체크
        try {
            const unreadCount = await notificationService.getUnreadCount();
            setHasUnreadNotification(unreadCount > 0);
        } catch (e) {
            console.error("Failed to check notifications:", e);
        }

        // 2. 공지사항 체크
        try {
             const data = await noticeService.getNotices({ isActive: true, limit: 100 });
             // 필터링 로직 (NoticeModal과 동일하게 적용)
             const now = new Date();
             const validNotices = data.items.filter(notice => {
                 if (!notice.notifyStartAt) return false;
                 const start = new Date(notice.notifyStartAt);
                 const end = notice.notifyEndAt ? new Date(notice.notifyEndAt) : null;
                 if (now < start) return false;
                 if (!end) return true;
                 return now <= end;
             });

             const serverIds = validNotices.map(n => n.id);
             // 쿠키와 비교
             const hasNew = hasNewPublicNotices(serverIds);
             setHasUnreadPublicNotice(hasNew);

        } catch (e) {
            console.error("Failed to check public notices:", e);
        }
    }, [user]);


    // --- 2. 타이머 관리 로직 ---

    const stopAllTimers = useCallback(() => {
        if (mainTimerRef.current) clearInterval(mainTimerRef.current);
        // if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current); // 통합으로 인해 불필요
        console.log('⏹️ 모든 타이머가 중지되었습니다.');
    }, []);

    const startAllTimers = useCallback(() => {
        stopAllTimers();

        // 기존 별도 타이머 제거
        // heartbeatTimerRef.current = setInterval(sendHeartbeat, ENV.HEARTBEAT_INTERVAL);
        
        // 초기 실행 (로그인 직후 등)
        checkNotifications();

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

                // ✅ 1. Heartbeat 체크 (설정된 간격마다)
                heartbeatCounter.current += 1;
                const heartbeatIntervalSec = ENV.HEARTBEAT_INTERVAL / 1000;
                if (heartbeatCounter.current >= heartbeatIntervalSec) {
                    heartbeatCounter.current = 0;
                    sendHeartbeat();
                }

                // ✅ 2. 알림 폴링 (180초 = 3분)
                notificationCheckCounter.current += 1;
                if (notificationCheckCounter.current >= 180) {
                    notificationCheckCounter.current = 0;
                    checkNotifications();
                }
            }
        }, 1000);
        console.log('⏰ 메인 통합 타이머 시작 (1초 간격 - Idle/Heartbeat/Noti)');

    }, [stopAllTimers, sendHeartbeat, logout, checkNotifications]);


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
            setUser(response.data);
            localStorage.setItem('session_id', response.data.session_id); 

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


    const refreshUser = useCallback(async () => {
        await checkSession();
    }, [checkSession]);

    // --- 5. 최종 렌더링 ---
    const contextValue = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        checkSession,
        refreshUser, // Add this line
        hasRole,
        hasPermission,
        hasUnreadNotification, // ✅ 추가 (개인 알림)
        hasUnreadPublicNotice, // ✅ 추가 (공지사항)
        refreshNotifications: checkNotifications // 강제 새로고침 필요 시 사용
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