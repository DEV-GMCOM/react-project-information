// src/services/api.ts
import axios, { AxiosResponse } from 'axios';

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8001/api';
// services/api.ts에서
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'; // 프록시 사용

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 요청 인터셉터
apiClient.interceptors.request.use(
    (config) => {
        console.log(`🚀 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
    },
    (error) => {
        console.error('❌ API 요청 오류:', error);
        return Promise.reject(error);
    }
);

// 응답 인터셉터
apiClient.interceptors.response.use(
    (response) => {
        console.log(`✅ API 응답: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        console.error('❌ API 응답 오류:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// 타입 정의
export interface Company {
    id: number;
    company_name: string;
    business_number?: string;
    industry?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    created_at: string;
    updated_at: string;
}

export interface CompanyCreate {
    company_name: string;
    business_number?: string;
    industry?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
}

export interface Employee {
    id: number;
    employee_id: string;
    name: string;
    department?: string;
    position?: string;
    email?: string;
    phone?: string;
    hire_date?: string;
    birth_date?: string;
    address?: string;
    status: 'active' | 'inactive' | 'terminated';
    created_at: string;
    updated_at: string;
}

export interface EmployeeCreate {
    employee_id: string;
    name: string;
    department?: string;
    position?: string;
    email?: string;
    phone?: string;
    hire_date?: string;
    birth_date?: string;
    address?: string;
    status: 'active' | 'inactive' | 'terminated';
}

export interface Project {
    id: number;
    project_code: string;
    project_name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
    budget?: number;
    company_id?: number;
    manager_id?: number;
    company_name?: string;
    manager_name?: string;
    created_at: string;
    updated_at: string;
}

export interface ProjectCreate {
    project_code: string;
    project_name: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    status: 'planning' | 'active' | 'completed' | 'cancelled';
    budget?: number;
    company_id?: number;
    manager_id?: number;
}

export interface DashboardStats {
    total_stats: {
        companies: number;
        employees: number;
        projects: number;
    };
    active_stats: {
        employees: number;
        projects: number;
    };
    monthly_stats: {
        new_companies: number;
        new_employees: number;
    };
}

export interface ChartData {
    data: Array<{
        [key: string]: string | number;
    }>;
}

export interface DepartmentData {
    departments: Array<{
        name: string;
        employee_count: number;
    }>;
}

// API 서비스 클래스
class ApiService {
    // 대시보드 관련
    async getDashboardStats(): Promise<DashboardStats> {
        try {
            const response: AxiosResponse<DashboardStats> = await apiClient.get('/dashboard/stats');
            return response.data;
        } catch (error) {
            console.error('Dashboard stats fetch error:', error);
            throw error;
        }
    }

    async getProjectsByStatus(): Promise<ChartData> {
        try {
            const response: AxiosResponse<ChartData> = await apiClient.get('/dashboard/charts/projects-by-status');
            return response.data;
        } catch (error) {
            console.error('Projects by status fetch error:', error);
            throw error;
        }
    }

    async getEmployeesByDepartment(): Promise<ChartData> {
        try {
            const response: AxiosResponse<ChartData> = await apiClient.get('/dashboard/charts/employees-by-department');
            return response.data;
        } catch (error) {
            console.error('Employees by department fetch error:', error);
            throw error;
        }
    }

    // 업체 관리 관련
    async getCompanies(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        industry?: string;
    }): Promise<Company[]> {
        try {
            const response: AxiosResponse<Company[]> = await apiClient.get('/company/', { params });
            return response.data;
        } catch (error) {
            console.error('Companies fetch error:', error);
            throw error;
        }
    }

    async getCompany(id: number): Promise<Company> {
        try {
            const response: AxiosResponse<Company> = await apiClient.get(`/company/${id}`);
            return response.data;
        } catch (error) {
            console.error('Company fetch error:', error);
            throw error;
        }
    }

    async createCompany(data: CompanyCreate): Promise<Company> {
        try {
            const response: AxiosResponse<Company> = await apiClient.post('/company/', data);
            return response.data;
        } catch (error) {
            console.error('Company create error:', error);
            throw error;
        }
    }

    async updateCompany(id: number, data: Partial<CompanyCreate>): Promise<Company> {
        try {
            const response: AxiosResponse<Company> = await apiClient.put(`/company/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Company update error:', error);
            throw error;
        }
    }

    async deleteCompany(id: number): Promise<void> {
        try {
            await apiClient.delete(`/company/${id}`);
        } catch (error) {
            console.error('Company delete error:', error);
            throw error;
        }
    }

    // 직원 관리 관련
    async getEmployees(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        department?: string;
        status?: string;
    }): Promise<Employee[]> {
        try {
            const response: AxiosResponse<Employee[]> = await apiClient.get('/hr/', { params });
            return response.data;
        } catch (error) {
            console.error('Employees fetch error:', error);
            throw error;
        }
    }

    async getEmployee(id: number): Promise<Employee> {
        try {
            const response: AxiosResponse<Employee> = await apiClient.get(`/hr/${id}`);
            return response.data;
        } catch (error) {
            console.error('Employee fetch error:', error);
            throw error;
        }
    }

    async createEmployee(data: EmployeeCreate): Promise<Employee> {
        try {
            const response: AxiosResponse<Employee> = await apiClient.post('/hr/', data);
            return response.data;
        } catch (error) {
            console.error('Employee create error:', error);
            throw error;
        }
    }

    async updateEmployee(id: number, data: Partial<EmployeeCreate>): Promise<Employee> {
        try {
            const response: AxiosResponse<Employee> = await apiClient.put(`/hr/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Employee update error:', error);
            throw error;
        }
    }

    async getDepartments(): Promise<DepartmentData> {
        try {
            const response: AxiosResponse<DepartmentData> = await apiClient.get('/hr/departments');
            return response.data;
        } catch (error) {
            console.error('Departments fetch error:', error);
            throw error;
        }
    }

    // 프로젝트 관리 관련
    async getProjects(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        status?: string;
        company_id?: number;
    }): Promise<Project[]> {
        try {
            const response: AxiosResponse<Project[]> = await apiClient.get('/project/', { params });
            return response.data;
        } catch (error) {
            console.error('Projects fetch error:', error);
            throw error;
        }
    }

    async getProject(id: number): Promise<Project> {
        try {
            const response: AxiosResponse<Project> = await apiClient.get(`/project/${id}`);
            return response.data;
        } catch (error) {
            console.error('Project fetch error:', error);
            throw error;
        }
    }

    async createProject(data: ProjectCreate): Promise<Project> {
        try {
            const response: AxiosResponse<Project> = await apiClient.post('/project/', data);
            return response.data;
        } catch (error) {
            console.error('Project create error:', error);
            throw error;
        }
    }

    async updateProject(id: number, data: Partial<ProjectCreate>): Promise<Project> {
        try {
            const response: AxiosResponse<Project> = await apiClient.put(`/project/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('Project update error:', error);
            throw error;
        }
    }

    // 헬스 체크
    async healthCheck(): Promise<{ status: string; database: string; service: string }> {
        try {
            const response = await apiClient.get('/health');
            return response.data;
        } catch (error) {
            console.error('Health check error:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();
export default apiClient;