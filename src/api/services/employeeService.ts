// src/api/services/employeeService.ts
import { apiClient } from '../utils/apiClient';
import { Employee, EmployeeCreate, Department } from '../types';

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

    async getAllDepartments(): Promise<Department[]> {
        const response = await apiClient.get('/department/');
        return response.data;
    }

    async createDepartment(data: { name: string }): Promise<Department> {
        const response = await apiClient.post('/department/', data);
        return response.data;
    }

    async updateDepartment(id: number, data: { name: string }): Promise<Department> {
        const response = await apiClient.put(`/department/${id}`, data);
        return response.data;
    }

    async deleteDepartment(id: number): Promise<void> {
        await apiClient.delete(`/department/${id}`);
    }
}

// 인스턴스 export (중요!)
export const employeeService = new EmployeeService();
