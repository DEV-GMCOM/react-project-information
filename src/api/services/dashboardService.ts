// src/api/services/dashboardService.ts
import { apiClient } from '../utils/apiClient';
import { DashboardStats } from '../types';

export class DashboardService {
    async getDashboardStats(): Promise<DashboardStats> {
        const response = await apiClient.get('/dashboard/stats');
        return response.data;
    }

    async getProjectsByStatus(): Promise<any> {
        const response = await apiClient.get('/dashboard/charts/projects-by-status');
        return response.data;
    }

    async getEmployeesByDepartment(): Promise<any> {
        const response = await apiClient.get('/dashboard/charts/employees-by-department');
        return response.data;
    }

    async healthCheck(): Promise<any> {
        const response = await apiClient.get('/health');
        return response.data;
    }
}

// 인스턴스 export (중요!)
export const dashboardService = new DashboardService();
