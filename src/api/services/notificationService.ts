import { apiClient } from '../utils/apiClient';

export interface Notification {
    id: number;
    empId: number;
    notice_type: string;
    title: string;
    content: string;
    isRead: boolean;
    readAt: string | null;
    createDt: string;
}

export interface NotificationResponse {
    id: number;
    empId: number;
    notice_type: string;
    title: string;
    content: string;
    isRead: boolean;
    readAt: string | null;
    createDt: string;
}

export const notificationService = {
    async getNotifications(unreadOnly: boolean = false, limit: number = 20): Promise<NotificationResponse[]> {
        const response = await apiClient.get('/notifications', { params: { unreadOnly, limit } });
        return response.data;
    },

    async getUnreadCount(): Promise<number> {
        const response = await apiClient.get('/notifications/unread-count');
        return response.data;
    },

    async markAsRead(id: number): Promise<NotificationResponse> {
        const response = await apiClient.patch(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead(): Promise<void> {
        await apiClient.post('/notifications/read-all');
    },

    async deleteNotification(id: number): Promise<void> {
        await apiClient.delete(`/notifications/${id}`);
    }
};
