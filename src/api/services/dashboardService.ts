// src/api/services/dashboardService.ts
import { apiClient } from '../utils/apiClient';
import {
    DashboardStats,
    ProjectDashboardStats,
    ProjectDashboardFilter,
    ProjectListResponse,
    ProjectStatusUpdateRequest,
    ProjectStatusUpdateResponse,
    ProjectHierarchy,
    OccupancyData,
    Recent30DaysStats
} from '../types';

export class DashboardService {
    // 기존 메서드들
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

    // ============ 프로젝트 대시보드 API ============

    // 프로젝트 대시보드 통계
    async getProjectDashboardStats(filter: ProjectDashboardFilter): Promise<ProjectDashboardStats> {
        const params = new URLSearchParams();
        params.append('period_type', filter.period_type);
        if (filter.year) params.append('year', filter.year.toString());
        if (filter.month) params.append('month', filter.month.toString());
        if (filter.quarter) params.append('quarter', filter.quarter.toString());
        if (filter.half_year) params.append('half_year', filter.half_year.toString());
        if (filter.start_date) params.append('start_date', filter.start_date);
        if (filter.end_date) params.append('end_date', filter.end_date);

        const response = await apiClient.get(`/project-dashboard/project-stats?${params.toString()}`);
        return response.data;
    }

    // 프로젝트 목록 조회
    async getProjectList(filter: ProjectDashboardFilter, skip: number = 0, limit: number = 50): Promise<ProjectListResponse> {
        const params = new URLSearchParams();
        params.append('period_type', filter.period_type);
        if (filter.year) params.append('year', filter.year.toString());
        if (filter.month) params.append('month', filter.month.toString());
        if (filter.quarter) params.append('quarter', filter.quarter.toString());
        if (filter.half_year) params.append('half_year', filter.half_year.toString());
        if (filter.start_date) params.append('start_date', filter.start_date);
        if (filter.end_date) params.append('end_date', filter.end_date);
        if (filter.status) params.append('status', filter.status);
        if (filter.client) params.append('client', filter.client);
        if (filter.search) params.append('search', filter.search);
        params.append('skip', skip.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get(`/project-dashboard/project-list?${params.toString()}`);
        return response.data;
    }

    // 프로젝트 상태 변경
    async updateProjectStatus(request: ProjectStatusUpdateRequest): Promise<ProjectStatusUpdateResponse> {
        const response = await apiClient.put('/project-dashboard/project-status', request);
        return response.data;
    }

    // 프로젝트 계층 구조 (트리 뷰)
    async getProjectHierarchy(year?: number): Promise<ProjectHierarchy> {
        const params = new URLSearchParams();
        if (year) params.append('year', year.toString());

        const response = await apiClient.get(`/project-dashboard/project-hierarchy?${params.toString()}`);
        return response.data;
    }

    // 점유율 분석
    async getOccupancyRate(periodType: string, year?: number, month?: number): Promise<OccupancyData> {
        const params = new URLSearchParams();
        params.append('period_type', periodType);
        if (year) params.append('year', year.toString());
        if (month) params.append('month', month.toString());

        const response = await apiClient.get(`/project-dashboard/occupancy-rate?${params.toString()}`);
        return response.data;
    }

    // 최근 30일 통계
    async getRecent30DaysStats(): Promise<Recent30DaysStats> {
        const response = await apiClient.get('/project-dashboard/recent-30-days');
        return response.data;
    }
}

// 인스턴스 export (중요!)
export const dashboardService = new DashboardService();
