import { apiClient } from '../utils/apiClient';
import { Notice, NoticePayload, NoticeType, NoticeListResponse } from '../../types/notice';

export interface NoticeQuery {
    isActive?: boolean;
    noticeType?: NoticeType;
    page?: number;
    limit?: number;
}

export const noticeService = {
    async getNotices(params?: NoticeQuery): Promise<NoticeListResponse> {
        const response = await apiClient.get('/notices', { params });
        return response.data;
    },
    async createNotice(payload: NoticePayload): Promise<Notice> {
        const response = await apiClient.post('/notices', payload);
        return response.data;
    },
    async updateNotice(id: number, payload: NoticePayload): Promise<Notice> {
        const response = await apiClient.put(`/notices/${id}`, payload);
        return response.data;
    },
    async deleteNotice(id: number): Promise<void> {
        await apiClient.delete(`/notices/${id}`);
    }
};
