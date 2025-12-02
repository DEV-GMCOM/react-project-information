// src/utils/noticeCookie.ts
import Cookies from 'js-cookie';
import { noticeData } from '../data/noticeData';

const NOTICE_COOKIE_NAME = 'notice_read_status';

// 쿠키 데이터 타입: { [id: number]: boolean }
interface ReadStatusMap {
    [key: number]: boolean;
}

/**
 * 쿠키에서 읽음 상태를 가져오고, 현재 존재하지 않는 공지사항 ID는 쿠키에서 정리합니다.
 */
export const getNoticeReadStatus = (): ReadStatusMap => {
    const cookieValue = Cookies.get(NOTICE_COOKIE_NAME);
    let statusMap: ReadStatusMap = {};

    try {
        statusMap = cookieValue ? JSON.parse(cookieValue) : {};
    } catch (e) {
        statusMap = {};
    }

    // 현재 공지사항 ID 목록
    const currentIds = noticeData.map(n => n.id);
    
    // 정리(Cleanup): 현재 공지사항에 없는 ID는 쿠키 맵에서 제거
    const cleanedMap: ReadStatusMap = {};
    let hasChanges = false;

    // 현재 존재하는 ID에 대해서만 상태 유지 (없는 건 자동 삭제됨)
    currentIds.forEach(id => {
        if (statusMap[id]) {
            cleanedMap[id] = true;
        }
    });

    // 기존 맵과 키 개수가 다르면(삭제된 게 있으면) 쿠키 업데이트 필요
    if (Object.keys(statusMap).length !== Object.keys(cleanedMap).length) {
        setNoticeReadStatus(cleanedMap);
        return cleanedMap;
    }

    return statusMap;
};

/**
 * 읽음 상태를 쿠키에 저장합니다.
 */
export const setNoticeReadStatus = (statusMap: ReadStatusMap) => {
    Cookies.set(NOTICE_COOKIE_NAME, JSON.stringify(statusMap), { expires: 365 }); // 1년 유지
};

/**
 * 모든 현재 공지사항을 읽음 처리합니다.
 */
export const markAllNoticesAsRead = () => {
    const currentIds = noticeData.map(n => n.id);
    const newStatusMap: ReadStatusMap = {};
    currentIds.forEach(id => {
        newStatusMap[id] = true;
    });
    setNoticeReadStatus(newStatusMap);
};

/**
 * 읽지 않은 공지사항이 있는지 확인합니다.
 */
export const hasUnreadNotices = (): boolean => {
    const statusMap = getNoticeReadStatus(); // 이때 cleanup도 수행됨
    const currentIds = noticeData.map(n => n.id);
    
    // 하나라도 false(또는 undefined)인 게 있으면 true 반환
    return currentIds.some(id => !statusMap[id]);
};