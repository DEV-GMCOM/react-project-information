// src/api/services/curatorSchedulingService.ts
import { apiClient } from '../utils/apiClient';

export interface Curator {
    id: number;
    name: string;
    email?: string;
    phone?: string;
    is_active: number;
    created_at: string;
}

export interface ScheduleSlot {
    id: number;
    day: string;
    time: string;
    curator_id: number;
    curator_name: string;
    created_at: string;
}

export interface ScheduleSlotCreate {
    day: string;
    time: string;
    curator_id: number;
}

export interface OptimizationRequest {
    days?: string[];
    time_slots?: string[];
    max_hours_per_day?: number;
    excluded_slots?: { [curatorId: number]: string[] };
}

export interface OptimizationResponse {
    success: boolean;
    message: string;
    schedules: ScheduleSlotCreate[];
    stats: { [name: string]: number };
}

class CuratorSchedulingService {
    private baseUrl = '/curator-scheduling';

    // 큐레이터 관리
    async getCurators(): Promise<Curator[]> {
        const response = await apiClient.get(`${this.baseUrl}/curators`);
        return response.data;
    }

    async initCurators(): Promise<Curator[]> {
        const response = await apiClient.post(`${this.baseUrl}/curators/init`);
        return response.data;
    }

    async createCurator(name: string): Promise<Curator> {
        const response = await apiClient.post(`${this.baseUrl}/curators`, { name });
        return response.data;
    }

    async deleteCurator(curatorId: number): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/curators/${curatorId}`);
    }

    // 스케줄 관리
    async getSchedules(): Promise<ScheduleSlot[]> {
        const response = await apiClient.get(`${this.baseUrl}/schedules`);
        return response.data;
    }

    async createSchedule(schedule: ScheduleSlotCreate): Promise<ScheduleSlot> {
        const response = await apiClient.post(`${this.baseUrl}/schedules`, schedule);
        return response.data;
    }

    async deleteSchedule(day: string, time: string): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/schedules/${encodeURIComponent(day)}/${encodeURIComponent(time)}`);
    }

    async bulkCreateSchedules(schedules: ScheduleSlotCreate[]): Promise<ScheduleSlot[]> {
        const response = await apiClient.post(`${this.baseUrl}/schedules/bulk`, { schedules });
        return response.data;
    }

    async clearAllSchedules(): Promise<void> {
        await apiClient.delete(`${this.baseUrl}/schedules`);
    }

    async optimizeSchedule(request: OptimizationRequest = {}): Promise<OptimizationResponse> {
        const response = await apiClient.post(`${this.baseUrl}/optimize`, request);
        return response.data;
    }
}

export const curatorSchedulingService = new CuratorSchedulingService();
