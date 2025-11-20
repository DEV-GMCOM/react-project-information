import { apiClient } from '../utils/apiClient';
import {
    Role,
    Permission,
    RoleCreate,
    RoleUpdate,
    PermissionCreate,
    PermissionUpdate,
    Employee
} from '../types';

export class RoleService {
    // --- 직원-역할 관련 (기존) ---
    async getEmployeeRole(employeeId: number): Promise<Role> {
        const response = await apiClient.get(`/hr/${employeeId}/role`);
        return response.data;
    }

    async updateEmployeeRole(employeeId: number, roleId: number): Promise<Role> {
        const response = await apiClient.put(`/hr/${employeeId}/role`, { role_id: roleId });
        return response.data;
    }

    // --- 역할(Role) 관련 메소드 ---
    async getAllRoles(): Promise<Role[]> {
        const response = await apiClient.get('/permissions/roles');
        return response.data;
    }

    async createRole(roleData: RoleCreate): Promise<Role> {
        const response = await apiClient.post('/permissions/roles', roleData);
        return response.data;
    }

    async getRoleDetails(roleId: number): Promise<Role> {
        const response = await apiClient.get(`/permissions/roles/${roleId}`);
        return response.data;
    }

    async updateRole(roleId: number, roleData: RoleUpdate): Promise<Role> {
        const response = await apiClient.put(`/permissions/roles/${roleId}`, roleData);
        return response.data;
    }

    async deleteRole(roleId: number): Promise<void> {
        await apiClient.delete(`/permissions/roles/${roleId}`);
    }

    // --- 권한(Permission) 관련 메소드 ---
    async getAllPermissions(): Promise<Permission[]> {
        const response = await apiClient.get('/permissions/permissions');
        return response.data;
    }

    async createPermission(permissionData: PermissionCreate): Promise<Permission> {
        const response = await apiClient.post('/permissions/permissions', permissionData);
        return response.data;
    }

    async updatePermission(permissionId: number, permissionData: PermissionUpdate): Promise<Permission> {
        const response = await apiClient.put(`/permissions/permissions/${permissionId}`, permissionData);
        return response.data;
    }

    async deletePermission(permissionId: number): Promise<void> {
        await apiClient.delete(`/permissions/permissions/${permissionId}`);
    }


    // --- 역할-권한 매핑 ---
    async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
        await apiClient.put(`/permissions/roles/${roleId}/permissions`, { permission_ids: permissionIds });
    }

    // --- [추가] 리소스 및 액션 타입 동적 조회 ---
    async getResourceTypes(): Promise<string[]> {
        const response = await apiClient.get('/permissions/resource-types');
        return response.data;
    }

    async getActionTypes(resourceType?: string): Promise<string[]> {
        const params = resourceType ? { resource_type: resourceType } : {};
        const response = await apiClient.get('/permissions/action-types', { params });
        return response.data;
    }

    // --- 역할-직원 매핑 ---
    async getEmployeesForRole(roleId: number): Promise<Employee[]> {
        const response = await apiClient.get(`/permissions/roles/${roleId}/employees`);
        return response.data;
    }

    async unassignRoleFromEmployee(employeeId: number): Promise<void> {
        await apiClient.delete(`/permissions/employees/${employeeId}/role`);
    }

    async assignRoleToEmployeesBatch(roleId: number, employeeIds: number[]): Promise<void> {
        await apiClient.post(`/permissions/roles/${roleId}/employees`, { employee_ids: employeeIds });
    }
}

export const roleService = new RoleService();
