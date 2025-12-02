// src/data/noticeData.ts

export interface NoticeItem {
    id: number; // 인덱스 값
    title: string;
    date: string;
    content: React.ReactNode; // JSX 지원
}

// 공지사항 데이터 (ID를 기준으로 읽음 여부 관리)
export const noticeData: NoticeItem[] = [
    {
        id: 101, // 유니크한 ID
        title: '🎉 시스템 업데이트 안내',
        date: '2025-12-03',
        content: '회의록 자동 문서화 기능이 추가되었습니다.
음성 파일을 업로드하여 자동으로 회의록을 생성할 수 있습니다.'
    },
    {
        id: 102,
        title: '⚠️ 정기 점검 안내',
        date: '2025-12-03',
        content: '매주 금요일 18시~22시 정기 점검이 진행됩니다.
해당 시간에는 서비스 이용이 제한될 수 있습니다.'
    },
    {
        id: 103,
        title: '📋 사용 가이드',
        date: '2025-12-03',
        content: '프로젝트 관리 시스템 사용 가이드가 업데이트되었습니다.
상단 메뉴의 "도움말"을 참고해주세요.'
    }
];
