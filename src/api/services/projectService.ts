// src/api/services/projectService.ts
import { apiClient } from '../utils/apiClient';
import { Project, ProjectCalendarEntry, ProjectCalendarBundle, ProjectCalendarBundleCreateRequest } from '../types';

export class ProjectService {
    async getProjects(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        status?: string;
        company_id?: number;
    }): Promise<Project[]> { // Changed from Paginated<Project> to Project[] assuming backend returns array
        const response = await apiClient.get('/projects/', { params });
        return response.data;
    }
    
    // ... existing methods ...

    async getProjectCalendarBundles(params?: { year?: number | ''; month?: number | '' }): Promise<ProjectCalendarBundle[]> {
        const queryParams: any = {};
        if (params?.year) queryParams.year = params.year;
        if (params?.month) queryParams.month = params.month;
        
        const response = await apiClient.get('/project-calendar/bundles', { params: queryParams });
        return response.data;
    }

    async createProjectCalendarBundle(data: ProjectCalendarBundleCreateRequest): Promise<any> {
        const response = await apiClient.post('/project-calendar/bundles', data);
        return response.data;
    }

    async updateProjectCalendarBundle(bundleId: number, data: ProjectCalendarBundleCreateRequest): Promise<any> {
        const response = await apiClient.put(`/project-calendar/bundles/${bundleId}`, data);
        return response.data;
    }

    async deleteProjectCalendarBundle(bundleId: number): Promise<any> {
        const response = await apiClient.delete(`/project-calendar/bundles/${bundleId}`);
        return response.data;
    }

    async getProject(id: number): Promise<Project> {
        const response = await apiClient.get(`/projects/${id}`);
        return response.data;
    }

    async createProject(data: {
        project_code: string;
        project_name: string;
        description: string;
        start_date: string | undefined;
        end_date: string | undefined;
        status: string;
        budget: number | undefined;
        company_id: number | undefined;
        manager_id: number | undefined;
        project_type: string | undefined
    }): Promise<Project> {
        const response = await apiClient.post('/projects/', data);
        return response.data;
    }

    async updateProject(id: number, data: Partial<Project>): Promise<Project> {
        const response = await apiClient.put(`/projects/${id}`, data);
        return response.data;
    }

    async getProjectCalendar(params: { year?: number | ''; month?: number | ''; advertiser?: string }): Promise<ProjectCalendarEntry[]> {
        const queryParams: { year?: number; month?: number; advertiser?: string } = {};
        if (params.year) {
            queryParams.year = params.year as number;
        }
        if (params.month) {
            queryParams.month = params.month as number;
        }
        if (params.advertiser) {
            queryParams.advertiser = params.advertiser;
        }
        const response = await apiClient.get('/project-calendar/', { params: queryParams });
        return response.data;
    }

    async getProjectCalendarAdvertisers(): Promise<string[]> {
        const response = await apiClient.get('/project-calendar/advertisers');
        return response.data;
    }

    async getProjectCalendarYears(): Promise<number[]> {
        const response = await apiClient.get('/project-calendar/years');
        return response.data;
    }
}

// 인스턴스 export (중요!)
export const projectService = new ProjectService();