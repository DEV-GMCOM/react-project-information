import { apiClient } from '../utils/apiClient';
import {
    Role,
    Permission,
    RoleCreate,
    RoleUpdate,
    PermissionCreate,
    PermissionUpdate
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
        const response = await apiClient.get('/hr/management/roles');
        return response.data;
    }

    async createRole(roleData: RoleCreate): Promise<Role> {
        const response = await apiClient.post('/hr/management/roles', roleData);
        return response.data;
    }

    async getRoleDetails(roleId: number): Promise<Role> {
        const response = await apiClient.get(`/hr/management/roles/${roleId}`);
        return response.data;
    }

    async updateRole(roleId: number, roleData: RoleUpdate): Promise<Role> {
        const response = await apiClient.put(`/hr/management/roles/${roleId}`, roleData);
        return response.data;
    }

    async deleteRole(roleId: number): Promise<void> {
        await apiClient.delete(`/hr/management/roles/${roleId}`);
    }

    // --- 권한(Permission) 관련 메소드 ---
    async getAllPermissions(): Promise<Permission[]> {
        const response = await apiClient.get('/hr/management/permissions');
        return response.data;
    }

    async createPermission(permissionData: PermissionCreate): Promise<Permission> {
        const response = await apiClient.post('/hr/management/permissions', permissionData);
        return response.data;
    }

    async updatePermission(permissionId: number, permissionData: PermissionUpdate): Promise<Permission> {
        const response = await apiClient.put(`/hr/management/permissions/${permissionId}`, permissionData);
        return response.data;
    }

    async deletePermission(permissionId: number): Promise<void> {
        await apiClient.delete(`/hr/management/permissions/${permissionId}`);
    }


    // --- 역할-권한 매핑 ---
    async updateRolePermissions(roleId: number, permissionIds: number[]): Promise<void> {
        await apiClient.put(`/hr/management/roles/${roleId}/permissions`, { permission_ids: permissionIds });
    }
}

export const roleService = new RoleService();
