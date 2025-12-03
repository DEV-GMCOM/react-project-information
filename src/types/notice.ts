export type NoticeType = 'system' | 'maintenance' | 'alert' | 'emergency' | 'guide';
export type ContentType = 'text' | 'html';

export interface Notice {
    id: number;
    title: string;
    content: string;
    contentType: ContentType; // 추가
    noticeType: NoticeType;
    notifyStartAt?: string | null;
    notifyEndAt?: string | null;
    isActive: boolean;
    createdBy?: number;
    creatorName?: string; // 추가
    updatedBy?: number | null;
    updaterName?: string | null; // 추가
    createdAt?: string;
    updatedAt?: string;
}

export interface NoticePayload {
    title: string;
    content: string;
    contentType: ContentType; // 추가
    noticeType: NoticeType;
    notifyStartAt?: string | null;
    notifyEndAt?: string | null;
    isActive: boolean;
}

export interface NoticeListResponse {
    items: Notice[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
