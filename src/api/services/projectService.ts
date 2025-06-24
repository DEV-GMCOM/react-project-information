// src/api/services/projectService.ts
import { apiClient } from '../utils/apiClient';
import { Project } from '../types';

export class ProjectService {
    async getProjects(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        status?: string;
        company_id?: number;
    }): Promise<Project[]> {
        const response = await apiClient.get('/project/', { params });
        return response.data;
    }

    async getProject(id: number): Promise<Project> {
        const response = await apiClient.get(`/project/${id}`);
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
        const response = await apiClient.post('/project/', data);
        return response.data;
    }

    async updateProject(id: number, data: Partial<Project>): Promise<Project> {
        const response = await apiClient.put(`/project/${id}`, data);
        return response.data;
    }
}

// 인스턴스 export (중요!)
export const projectService = new ProjectService();