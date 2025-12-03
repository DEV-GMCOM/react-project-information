export type NoticeType = 'system' | 'maintenance' | 'alert' | 'emergency' | 'guide';

export interface Notice {
    id: number;
    title: string;
    content: string;
    noticeType: NoticeType;
    notifyStartAt?: string | null;
    notifyEndAt?: string | null;
    isActive: boolean;
    createdBy?: number;
    updatedBy?: number | null;
    createdAt?: string;
    updatedAt?: string;
}

export interface NoticePayload {
    title: string;
    content: string;
    noticeType: NoticeType;
    notifyStartAt?: string | null;
    notifyEndAt?: string | null;
    isActive: boolean;
}
