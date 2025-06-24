// src/api/services/employeeService.ts
import { apiClient } from '../utils/apiClient';
import { Employee, EmployeeCreate } from '../types';

export class EmployeeService {
    async getEmployees(params?: {
        skip?: number;
        limit?: number;
        search?: string;
        department?: string;
        status?: string;
    }): Promise<Employee[]> {
        const response = await apiClient.get('/hr/', { params });
        return response.data;
    }

    async getEmployee(id: number): Promise<Employee> {
        const response = await apiClient.get(`/hr/${id}`);
        return response.data;
    }

    async createEmployee(data: EmployeeCreate): Promise<Employee> {
        const response = await apiClient.post('/hr/', data);
        return response.data;
    }

    async updateEmployee(id: number, data: Partial<EmployeeCreate>): Promise<Employee> {
        const response = await apiClient.put(`/hr/${id}`, data);
        return response.data;
    }

    async getDepartments(): Promise<{ departments: Array<{ name: string; employee_count: number }> }> {
        const response = await apiClient.get('/hr/departments');
        return response.data;
    }
}

// 인스턴스 export (중요!)
export const employeeService = new EmployeeService();
