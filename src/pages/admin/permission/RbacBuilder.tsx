
import React, { useState, useEffect, useMemo } from 'react';
import { roleService } from '../../../api/services/roleService';
import { Role, Permission, RoleCreate, PermissionCreate } from '../../../api/types';
import '../../../styles/RbacBuilder.css';

const RbacBuilder: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    
    // New state to track pending changes for permissions
    const [pendingPermissionIds, setPendingPermissionIds] = useState<Set<number>>(new Set());

    // Role creation form state
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleCode, setNewRoleCode] = useState('');

    // Permission creation form state
    const [newPermissionName, setNewPermissionName] = useState('');
    const [newPermissionCode, setNewPermissionCode] = useState('');
    const [newResourceType, setNewResourceType] = useState('');
    const [newActionType, setNewActionType] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    // When a role is selected, reset the pending permissions to match the role's current permissions
    useEffect(() => {
        if (selectedRole) {
            const currentIds = new Set(selectedRole.permissions.map(p => p.permission_id));
            setPendingPermissionIds(currentIds);
        } else {
            setPendingPermissionIds(new Set());
        }
    }, [selectedRole]);

    const fetchData = async () => {
        try {
            const [rolesData, permissionsData] = await Promise.all([
                roleService.getAllRoles(),
                roleService.getAllPermissions(),
            ]);
            setRoles(rolesData);
            setPermissions(permissionsData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    const handleCreateRole = async () => {
        if (!newRoleName.trim() || !newRoleCode.trim()) {
            alert('역할(Role)이름, 코드값 모두 필요합니다.');
            return;
        }

        // Check for duplicate role code
        const isDuplicateCode = roles.some(role => role.role_code === newRoleCode.trim());
        if (isDuplicateCode) {
            alert(`역할 코드 '${newRoleCode}'가 이미 존재합니다. 고유한 코드를 사용해주세요.`);
            return;
        }

        try {
            const roleData: RoleCreate = { role_name: newRoleName, role_code: newRoleCode };
            const newRole = await roleService.createRole(roleData);
            setRoles([...roles, newRole]);
            setNewRoleName('');
            setNewRoleCode('');
        } catch (error) {
            console.error('Failed to create role:', error);
        }
    };

    const handleDeleteRole = async (roleId: number) => {
        if (!window.confirm('정말로 이 역할을 삭제하시겠습니까?')) {
            return;
        }
        try {
            await roleService.deleteRole(roleId);
            setRoles(roles.filter(role => role.role_id !== roleId));
            if (selectedRole?.role_id === roleId) {
                setSelectedRole(null);
            }
        } catch (error) {
            console.error('Failed to delete role:', error);
        }
    };
    
    const handleCreatePermission = async () => {
        if (!newPermissionName.trim() || !newPermissionCode.trim() || !newResourceType.trim() || !newActionType.trim()) {
            alert('모든 권한 필드를 입력해야 합니다.');
            return;
        }
        try {
            const permData: PermissionCreate = {
                permission_name: newPermissionName,
                permission_code: newPermissionCode,
                resource_type: newResourceType,
                action_type: newActionType,
            };
            const newPermission = await roleService.createPermission(permData);
            setPermissions([...permissions, newPermission]);
            setNewPermissionName('');
            setNewPermissionCode('');
            setNewResourceType('');
            setNewActionType('');
        } catch (error) {
            console.error('Failed to create permission:', error);
        }
    };

    // This function is now called only when the save button is clicked
    const handleSaveChanges = async () => {
        if (!selectedRole) return;
        if (!window.confirm('변경 사항을 저장하시겠습니까?')) {
            return;
        }

        const permissionIds = Array.from(pendingPermissionIds);
        try {
            await roleService.updateRolePermissions(selectedRole.role_id, permissionIds);
            // Refetch all data to ensure UI is consistent with the backend
            const updatedRoles = await roleService.getAllRoles();
            setRoles(updatedRoles);
            
            // Find the just-updated role from the new list and update the selectedRole state
            const newlySelectedRole = updatedRoles.find(r => r.role_id === selectedRole.role_id);
            setSelectedRole(newlySelectedRole || null);

            alert('권한이 성공적으로 업데이트되었습니다!');
        } catch (error) {
            console.error('Failed to update permissions:', error);
            alert('권한 저장에 실패했습니다.');
        }
    };

    // This function now only updates the local pending state
    const handlePermissionChange = (permissionId: number, isChecked: boolean) => {
        setPendingPermissionIds(prevIds => {
            const newIds = new Set(prevIds);
            if (isChecked) {
                newIds.add(permissionId);
            } else {
                newIds.delete(permissionId);
            }
            return newIds;
        });
    };

    // Memoized value to check if there are unsaved changes
    const hasUnsavedChanges = useMemo(() => {
        if (!selectedRole) return false;
        const originalIds = new Set(selectedRole.permissions.map(p => p.permission_id));
        if (originalIds.size !== pendingPermissionIds.size) return true;
        for (const id of originalIds) {
            if (!pendingPermissionIds.has(id)) return true;
        }
        return false;
    }, [selectedRole, pendingPermissionIds]);

    return (
        <div className="rbac-builder-container">
            <h1>RBAC - 역할 & 권한 관리</h1>
            <div className="rbac-main-content">
                <div className="roles-section">
                    <h2>역할</h2>
                    <div className="add-item-form">
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="신규 역할(Role) 이름"
                        />
                        <input
                            type="text"
                            value={newRoleCode}
                            onChange={(e) => setNewRoleCode(e.target.value)}
                            placeholder="코드값 (도움말 참고)"
                        />
                        <button onClick={handleCreateRole}>역할 추가</button>
                    </div>
                    <ul>
                        {roles.map(role => (
                            <li 
                                key={role.role_id} 
                                className={selectedRole?.role_id === role.role_id ? 'selected' : ''}
                                onClick={() => setSelectedRole(roles.find(r => r.role_id === role.role_id) || null)}
                            >
                                {role.role_name} ({role.role_code})
                                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.role_id); }}>X</button>
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="permissions-section">
                    <h2>{selectedRole ? `"${selectedRole.role_name}"` : '...'} 권한 관리</h2>
                     <div className="add-item-form multi-line">
                        <input
                            type="text"
                            value={newPermissionName}
                            onChange={(e) => setNewPermissionName(e.target.value)}
                            placeholder="권한명 (예: 게시물 생성)"
                        />
                        <input
                            type="text"
                            value={newPermissionCode}
                            onChange={(e) => setNewPermissionCode(e.target.value)}
                            placeholder="권한 코드 (예: post:create)"
                        />
                        <input
                            type="text"
                            value={newResourceType}
                            onChange={(e) => setNewResourceType(e.target.value)}
                            placeholder="리소스 타입 (예: post)"
                        />
                        <input
                            type="text"
                            value={newActionType}
                            onChange={(e) => setNewActionType(e.target.value)}
                            placeholder="액션 타입 (예: create)"
                        />
                        <button onClick={handleCreatePermission}>권한 추가</button>
                    </div>
                    {selectedRole ? (
                        <>
                            <div className="permission-grid">
                                {permissions.map(permission => {
                                    const hasPermission = pendingPermissionIds.has(permission.permission_id);
                                    return (
                                        <div key={permission.permission_id} className="permission-item">
                                            <label>
                                                <input
                                                    type="checkbox"
                                                    checked={hasPermission}
                                                    onChange={(e) => handlePermissionChange(permission.permission_id, e.target.checked)}
                                                />
                                                {permission.permission_name} ({permission.permission_code})
                                            </label>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="save-actions">
                                <button 
                                    onClick={handleSaveChanges} 
                                    disabled={!hasUnsavedChanges}
                                    className="save-btn"
                                >
                                    수정내역 저장
                                </button>
                            </div>
                        </>
                    ) : (
                        <p>권한을 관리할 역할을 선택하세요.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RbacBuilder;
