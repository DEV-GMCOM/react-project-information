// src/hooks/useIdleTimer.ts
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseIdleTimerOptions {
    timeout: number;
    warningTime?: number;
    onIdle: () => void;
    onActive?: () => void;
    enabled?: boolean;
    stopOnIdle?: boolean;  // ✅ 추가
}

// src/hooks/useIdleTimer.ts

export const useIdleTimer = ({
                                 timeout,
                                 warningTime = 30000,
                                 onIdle,
                                 onActive,
                                 enabled = true,
                                 stopOnIdle = true
                             }: UseIdleTimerOptions) => {
    const [isIdle, setIsIdle] = useState(false);
    const [remainingTime, setRemainingTime] = useState(timeout);
    const timerRef = useRef<NodeJS.Timeout>();
    const countdownRef = useRef<NodeJS.Timeout>();
    const lastActivityRef = useRef(Date.now());

    // ✅ startIdleTimer를 별도로 분리
    const startIdleTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }

        timerRef.current = setTimeout(() => {
            console.log('🔴 Idle 전환 시작');
            setIsIdle(true);
            onIdle();

            // 카운트다운 시작
            let countdown = Math.ceil(warningTime / 1000);
            setRemainingTime(countdown * 1000);

            console.log(`⏱️ 카운트다운 시작: ${countdown}초`);

            countdownRef.current = setInterval(() => {
                countdown -= 1;
                console.log(`⏱️ 카운트다운: ${countdown}초 남음`);
                setRemainingTime(countdown * 1000);

                if (countdown <= 0) {
                    console.log('⏱️ 카운트다운 종료');
                    clearInterval(countdownRef.current!);
                }
            }, 1000);
        }, timeout);
    }, [timeout, warningTime, onIdle]);

    const resetTimer = useCallback(() => {
        if (!enabled) return;

        lastActivityRef.current = Date.now();

        if (isIdle) {
            console.log('🟢 Active 전환');
            setIsIdle(false);
            onActive?.();

            if (countdownRef.current) {
                clearInterval(countdownRef.current);
            }
        }

        setRemainingTime(timeout);
        startIdleTimer();  // ✅ 분리된 함수 호출
    }, [timeout, isIdle, onActive, enabled, startIdleTimer]);

    // useEffect(() => {
    //     if (!enabled) {
    //         return;
    //     }
    //
    //     const events = [
    //         'mousedown',
    //         'mousemove',
    //         'keypress',
    //         'keydown',
    //         'scroll',
    //         'touchstart',
    //         'click'
    //     ];
    //
    //     const handleActivity = () => {
    //         if (stopOnIdle && isIdle) {
    //             console.log('🚫 Idle 상태 - 활동 무시');
    //             return;
    //         }
    //         resetTimer();
    //     };
    //
    //     events.forEach(event => {
    //         window.addEventListener(event, handleActivity);
    //     });
    //
    //     // ✅ 초기 타이머 시작 (한 번만)
    //     if (!isIdle) {
    //         startIdleTimer();
    //     }
    //
    //     return () => {
    //         events.forEach(event => {
    //             window.removeEventListener(event, handleActivity);
    //         });
    //         if (timerRef.current) {
    //             clearTimeout(timerRef.current);
    //         }
    //         if (countdownRef.current) {
    //             clearInterval(countdownRef.current);
    //         }
    //     };
    // }, [enabled, isIdle, stopOnIdle, startIdleTimer]); // ✅ resetTimer 제거
    useEffect(() => {
        if (!enabled) {
            if (timerRef.current) clearTimeout(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
            return;
        }

        const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            if (stopOnIdle && isIdle) {
                console.log('🚫 Idle 상태 - 활동 무시');
                return;
            }
            resetTimer();
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        // ✅ 초기 실행 시에만 타이머 시작
        startIdleTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (timerRef.current) clearTimeout(timerRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [enabled, stopOnIdle]); // ✅ isIdle, startIdleTimer 제거

    const getLastActivityTime = useCallback(() => {
        return lastActivityRef.current;
    }, []);

    return {
        isIdle,
        remainingTime,
        resetTimer,
        getLastActivityTime
    };
};