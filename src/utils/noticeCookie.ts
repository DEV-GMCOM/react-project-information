import Cookies from 'js-cookie';

const NOTICE_COOKIE_NAME = 'seen_public_notice_ids';

/**
 * 쿠키에서 이미 확인한 공지사항 ID 목록을 가져옵니다.
 */
export const getSeenNoticeIds = (): number[] => {
    const cookieValue = Cookies.get(NOTICE_COOKIE_NAME);
    try {
        return cookieValue ? JSON.parse(cookieValue) : [];
    } catch (e) {
        return [];
    }
};

/**
 * 확인한 공지사항 ID 목록을 쿠키에 저장합니다.
 * (기존 ID들과 합쳐서 중복 제거 후 저장)
 */
export const saveSeenNoticeIds = (newIds: number[]) => {
    const currentIds = getSeenNoticeIds();
    // Set을 사용하여 중복 제거 및 병합
    const mergedIds = Array.from(new Set([...currentIds, ...newIds]));
    Cookies.set(NOTICE_COOKIE_NAME, JSON.stringify(mergedIds), { expires: 365 });
};

/**
 * 서버의 최신 공지사항 ID 목록과 쿠키를 비교하여, 
 * 쿠키에 없는(새로운) 공지사항이 있는지 확인합니다.
 */
export const hasNewPublicNotices = (serverIds: number[]): boolean => {
    const seenIds = getSeenNoticeIds();
    // serverId 중에 seenIds에 없는 것이 하나라도 있으면 True
    return serverIds.some(id => !seenIds.includes(id));
};
