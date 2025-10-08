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
    const isIdleRef = useRef(false);  // ✅ 추가!

    // ✅ isIdle 상태와 ref 동기화
    useEffect(() => {
        isIdleRef.current = isIdle;
    }, [isIdle]);

    // ✅ startIdleTimer를 별도로 분리
    const startIdleTimer = useCallback(() => {
        // 기존 타이머들 정리
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }
        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = undefined;
        }

        timerRef.current = setTimeout(() => {
            console.log('🔴 Idle 전환 시작');
            setIsIdle(true);
            onIdle();

            // ✅ 카운트다운 시작 시간 기록
            const countdownStartTime = Date.now();
            const totalCountdown = Math.ceil(warningTime / 1000);

            console.log(`⏱️ 카운트다운 시작: ${totalCountdown}초`);
            // ✅ 즉시 한 번 실행
            setRemainingTime(totalCountdown * 1000);

            countdownRef.current = setInterval(() => {
                // ✅ 경과 시간을 계산하여 남은 시간 계산
                const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
                const remaining = Math.max(0, totalCountdown - elapsed);

                console.log(`⏱️ 카운트다운: ${remaining}초 남음`);
                setRemainingTime(remaining * 1000);

                if (remaining <= 0) {
                    console.log('⏱️ 카운트다운 종료');
                    if (countdownRef.current) {
                        clearInterval(countdownRef.current);
                        countdownRef.current = undefined;
                    }
                }
            }, 1000);
        }, timeout);
    }, [timeout, warningTime, onIdle]);

    const resetTimer = useCallback(() => {
        if (!enabled) return;

        console.log('🔄 resetTimer 호출 - remainingTime:', remainingTime);

        // ✅ 1. 가장 먼저 countdown을 동기적으로 정리 (race condition 방지)
        if (countdownRef.current) {
            console.log('⏹️ countdown interval 즉시 정리');
            clearInterval(countdownRef.current);
            countdownRef.current = undefined;
        }

        // ✅ 2. timer도 정리
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = undefined;
        }

        // ✅ 3. 마지막 활동 시간 업데이트
        lastActivityRef.current = Date.now();

        // ✅ 4. isIdle 상태 변경
        // if (isIdle) {
        //     console.log('🟢 Active 전환');
        //     setIsIdle(false);
        //     onActive?.();
        // }
        if (isIdleRef.current) {  // ✅ ref 사용
            console.log('🟢 Active 전환');
            setIsIdle(false);
            onActive?.();
        }

        // ✅ 5. remainingTime 복구
        setRemainingTime(timeout);

        // ✅ 6. 새로운 타이머 시작
        startIdleTimer();
    }, [timeout, isIdle, onActive, enabled, startIdleTimer, remainingTime]);

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
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = undefined;
            }
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = undefined;
            }
            return;
        }

        const events = ['mousedown', 'mousemove', 'keypress', 'keydown', 'scroll', 'touchstart', 'click'];

        const handleActivity = () => {
            // if (stopOnIdle && isIdle) {
            if (stopOnIdle && isIdleRef.current) {  // ✅ ref 사용!
                    console.log('🚫 Idle 상태 - 활동 무시');
                return;
            }
            resetTimer();
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        // ✅ 초기 마운트 시에만 타이머 시작
        // if (!timerRef.current && !isIdle) {
        if (!timerRef.current && !isIdleRef.current) {  // ✅ ref 사용
            startIdleTimer();
        }

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            // ✅ cleanup에서 타이머를 정리하지 않음! (다른 곳에서 관리)
        };
    }, [enabled, stopOnIdle]); // ✅ isIdle, startIdleTimer, resetTimer 제거!

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