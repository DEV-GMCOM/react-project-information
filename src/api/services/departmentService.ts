// src/api/services/departmentService.ts
import { apiClient } from '../utils/apiClient';
import { DepartmentFull, DepartmentCreate, DepartmentUpdate, DepartmentEmployeesResponse } from '../types';

export class DepartmentService {
    /**
     * 부서 목록 조회
     */
    async getDepartments(params?: {
        skip?: number;
        limit?: number;
        include_inactive?: boolean;
    }): Promise<DepartmentFull[]> {
        const response = await apiClient.get('/departments/', { params });
        return response.data;
    }

    /**
     * 부서 상세 조회
     */
    async getDepartment(deptId: number): Promise<DepartmentFull> {
        const response = await apiClient.get(`/departments/${deptId}`);
        return response.data;
    }

    /**
     * 부서 생성
     */
    async createDepartment(data: DepartmentCreate): Promise<DepartmentFull> {
        const response = await apiClient.post('/departments/', data);
        return response.data;
    }

    /**
     * 부서 수정
     */
    async updateDepartment(deptId: number, data: DepartmentUpdate): Promise<DepartmentFull> {
        const response = await apiClient.put(`/departments/${deptId}`, data);
        return response.data;
    }

    /**
     * 부서 삭제 (비활성화)
     */
    async deleteDepartment(deptId: number): Promise<{ message: string; dept_id: number }> {
        const response = await apiClient.delete(`/departments/${deptId}`);
        return response.data;
    }

    /**
     * 부서 소속 직원 목록 조회
     */
    async getDepartmentEmployees(deptId: number): Promise<DepartmentEmployeesResponse> {
        const response = await apiClient.get(`/departments/${deptId}/employees`);
        return response.data;
    }

    /**
     * 직원 부서 이동
     */
    async moveEmployeesToDepartment(deptId: number, empIds: number[], deptName: string): Promise<{ message: string }> {
        const response = await apiClient.put(`/departments/${deptId}/employees`, {
            emp_ids: empIds,
            dept_name: deptName
        });
        return response.data;
    }

    /**
     * 직원 테이블로부터 부서 동기화
     */
    async syncDepartmentsFromEmployees(): Promise<{ message: string; total_divisions: number; created: number }> {
        const response = await apiClient.post('/departments/sync-from-employees');
        return response.data;
    }
}

// 인스턴스 export
export const departmentService = new DepartmentService();
