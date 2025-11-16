// src/pages/admin/permission/AccessControl.tsx

import React, { useState, useEffect } from 'react';
import { roleService } from '../../../api/services/roleService';
import { Role, RoleCreate, RoleUpdate, Permission, PermissionCreate, PermissionUpdate } from '../../../api/types';
import '../../../styles/Policies.css';
import '../../../styles/modal.css';

const AccessControl: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'roles' | 'permissions'>('roles');
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 역할(Role) 모달/폼 상태
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [roleFormData, setRoleFormData] = useState<RoleCreate | RoleUpdate>({ role_name: '', role_code: '', description: '' });
    const [selectedPermissions, setSelectedPermissions] = useState<Set<number>>(new Set());

    // 권한(Permission) 모달/폼 상태
    const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
    const [editingPermission, setEditingPermission] = useState<Permission | null>(null);
    const [permissionFormData, setPermissionFormData] = useState<PermissionCreate | PermissionUpdate>({ permission_name: '', permission_code: '', resource_type: '', action_type: '', description: '' });

    useEffect(() => {
        setIsLoading(true);
        Promise.all([fetchRoles(), fetchAllPermissions()])
            .catch(err => setError('데이터를 불러오는 데 실패했습니다.'))
            .finally(() => setIsLoading(false));
    }, []);

    const fetchRoles = async () => {
        const fetchedRoles = await roleService.getAllRoles();
        setRoles(fetchedRoles);
    };

    const fetchAllPermissions = async () => {
        const fetchedPermissions = await roleService.getAllPermissions();
        setPermissions(fetchedPermissions);
    };

    // --- 핸들러: 역할(Role) ---
    const handleCreateRole = () => {
        setEditingRole(null);
        setRoleFormData({ role_name: '', role_code: '', description: '' });
        setSelectedPermissions(new Set());
        setIsRoleModalOpen(true);
    };

    const handleEditRole = async (role: Role) => {
        setIsLoading(true);
        try {
            const roleDetails = await roleService.getRoleDetails(role.role_id);
            setEditingRole(roleDetails);
            setRoleFormData({ role_name: roleDetails.role_name, role_code: roleDetails.role_code, description: roleDetails.description });
            setSelectedPermissions(new Set(roleDetails.permissions.map(p => p.permission_id)));
            setIsRoleModalOpen(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveRole = async () => {
        const isEditMode = editingRole !== null;
        if (!roleFormData.role_name || !roleFormData.role_code) {
            alert('역할 이름과 코드는 필수 항목입니다.');
            return;
        }
        setIsLoading(true);
        try {
            if (isEditMode) {
                await Promise.all([
                    roleService.updateRole(editingRole.role_id, roleFormData),
                    roleService.updateRolePermissions(editingRole.role_id, Array.from(selectedPermissions))
                ]);
                alert('역할이 성공적으로 수정되었습니다.');
            } else {
                const newRole = await roleService.createRole(roleFormData as RoleCreate);
                await roleService.updateRolePermissions(newRole.role_id, Array.from(selectedPermissions));
                alert('새 역할이 성공적으로 생성되었습니다.');
            }
            setIsRoleModalOpen(false);
            await fetchRoles();
        } catch (err) {
            alert(`역할 ${isEditMode ? '수정' : '생성'}에 실패했습니다.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteRole = async (roleId: number) => {
        if (window.confirm('정말로 이 역할을 삭제하시겠습니까?')) {
            setIsLoading(true);
            try {
                await roleService.deleteRole(roleId);
                alert('역할이 삭제되었습니다.');
                await fetchRoles();
            } catch (err) {
                alert('역할 삭제에 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // --- 핸들러: 권한(Permission) ---
    const handleCreatePermission = () => {
        setEditingPermission(null);
        setPermissionFormData({ permission_name: '', permission_code: '', resource_type: '', action_type: '', description: '' });
        setIsPermissionModalOpen(true);
    };

    const handleEditPermission = (p: Permission) => {
        setEditingPermission(p);
        setPermissionFormData({ ...p });
        setIsPermissionModalOpen(true);
    };
    
    const handleSavePermission = async () => {
        const isEditMode = editingPermission !== null;
        if (!permissionFormData.permission_name || !permissionFormData.permission_code || !permissionFormData.resource_type || !permissionFormData.action_type) {
            alert('권한 이름, 코드, 리소스, 액션은 필수 항목입니다.');
            return;
        }
        setIsLoading(true);
        try {
            if (isEditMode) {
                await roleService.updatePermission(editingPermission.permission_id, permissionFormData as PermissionUpdate);
                alert('권한이 성공적으로 수정되었습니다.');
            } else {
                await roleService.createPermission(permissionFormData as PermissionCreate);
                alert('새 권한이 성공적으로 생성되었습니다.');
            }
            setIsPermissionModalOpen(false);
            await fetchAllPermissions();
        } catch (err) {
            alert(`권한 ${isEditMode ? '수정' : '생성'}에 실패했습니다.`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeletePermission = async (p: Permission) => {
        if (window.confirm(`'${p.permission_name}' 권한을 정말로 삭제하시겠습니까?`)) {
            setIsLoading(true);
            try {
                await roleService.deletePermission(p.permission_id);
                alert('권한이 삭제되었습니다.');
                await fetchAllPermissions();
            } catch (err) {
                alert('권한 삭제에 실패했습니다.');
            } finally {
                setIsLoading(false);
            }
        }
    };

    // --- 공용 핸들러 ---
    const handlePermissionToggle = (permissionId: number) => {
        setSelectedPermissions(prev => {
            const newSet = new Set(prev);
            newSet.has(permissionId) ? newSet.delete(permissionId) : newSet.add(permissionId);
            return newSet;
        });
    };

    // --- 렌더링 함수 ---
    const renderRoleManagement = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="section-header">■ 역할 목록</h3>
                <button onClick={handleCreateRole} className="form-button">새 역할 생성</button>
            </div>
            <table className="policies-table">
                <thead><tr><th>역할 이름</th><th>역할 코드</th><th>설명</th><th style={{ width: '15%' }}>관리</th></tr></thead>
                <tbody>
                    {roles.map(role => (
                        <tr key={role.role_id}>
                            <td>{role.role_name}</td><td>{role.role_code}</td><td>{role.description}</td>
                            <td>
                                <button onClick={() => handleEditRole(role)} className="form-button-secondary" style={{ marginRight: '5px' }}>수정</button>
                                <button onClick={() => handleDeleteRole(role.role_id)} className="form-button-danger">삭제</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderPermissionManagement = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="section-header">■ 권한 목록</h3>
                <button onClick={handleCreatePermission} className="form-button">새 권한 생성</button>
            </div>
            <table className="policies-table">
                <thead><tr><th>권한 이름</th><th>권한 코드</th><th>대상 리소스</th><th>액션</th><th>설명</th><th style={{ width: '15%' }}>관리</th></tr></thead>
                <tbody>
                    {permissions.map(p => (
                        <tr key={p.permission_id}>
                            <td>{p.permission_name}</td><td>{p.permission_code}</td><td>{p.resource_type}</td><td>{p.action_type}</td><td>{p.description}</td>
                            <td>
                                <button onClick={() => handleEditPermission(p)} className="form-button-secondary" style={{ marginRight: '5px' }}>수정</button>
                                <button onClick={() => handleDeletePermission(p)} className="form-button-danger">삭제</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderRoleModal = () => {
        if (!isRoleModalOpen) return null;
        const isEditMode = editingRole !== null;
        return (
            <div className="modal-overlay">
                <div className="modal-content" style={{ maxWidth: '600px' }}>
                    <h2>{isEditMode ? '역할 수정' : '새 역할 생성'}</h2>
                    <div className="form-group"><label>역할 이름 *</label><input type="text" name="role_name" value={roleFormData.role_name} onChange={e => setRoleFormData({...roleFormData, role_name: e.target.value})} className="form-control" /></div>
                    <div className="form-group"><label>역할 코드 *</label><input type="text" name="role_code" value={roleFormData.role_code} onChange={e => setRoleFormData({...roleFormData, role_code: e.target.value})} className="form-control" /></div>
                    <div className="form-group"><label>설명</label><textarea name="description" value={roleFormData.description || ''} onChange={e => setRoleFormData({...roleFormData, description: e.target.value})} className="form-control" rows={2} /></div>
                    <div className="form-group"><label>권한 설정</label>
                        <div className="permission-grid">
                            {permissions.map(p => (
                                <div key={p.permission_id} className="permission-item">
                                    <input type="checkbox" id={`perm-${p.permission_id}`} checked={selectedPermissions.has(p.permission_id)} onChange={() => handlePermissionToggle(p.permission_id)} />
                                    <label htmlFor={`perm-${p.permission_id}`}>{p.permission_name}</label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button onClick={handleSaveRole} className="btn-primary">저장</button>
                        <button onClick={() => setIsRoleModalOpen(false)} className="btn-secondary">취소</button>
                    </div>
                </div>
            </div>
        );
    };

    const renderPermissionModal = () => {
        if (!isPermissionModalOpen) return null;
        const isEditMode = editingPermission !== null;
        const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            setPermissionFormData(prev => ({...prev, [e.target.name]: e.target.value}));
        };
        return (
            <div className="modal-overlay">
                <div className="modal-content">
                    <h2>{isEditMode ? '권한 수정' : '새 권한 생성'}</h2>
                    <div className="form-group"><label>권한 이름 *</label><input type="text" name="permission_name" value={permissionFormData.permission_name} onChange={handleFormChange} className="form-control" /></div>
                    <div className="form-group"><label>권한 코드 *</label><input type="text" name="permission_code" value={permissionFormData.permission_code} onChange={handleFormChange} className="form-control" /></div>
                    <div className="form-group"><label>대상 리소스 *</label><input type="text" name="resource_type" value={permissionFormData.resource_type} onChange={handleFormChange} className="form-control" /></div>
                    <div className="form-group"><label>액션 타입 *</label><input type="text" name="action_type" value={permissionFormData.action_type} onChange={handleFormChange} className="form-control" /></div>
                    <div className="form-group"><label>설명</label><textarea name="description" value={permissionFormData.description || ''} onChange={handleFormChange} className="form-control" rows={2} /></div>
                    <div className="modal-actions">
                        <button onClick={handleSavePermission} className="btn-primary">저장</button>
                        <button onClick={() => setIsPermissionModalOpen(false)} className="btn-secondary">취소</button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="policies-container">
            {isLoading && <div className="loading-overlay"><span>로딩중...</span></div>}
            {renderRoleModal()}
            {renderPermissionModal()}
            <div className="policies-header">
                <div><h1 className="policies-title">접근 제어 관리</h1></div>
                <div className="policies-logo">GMCOM</div>
            </div>
            <div className="policies-main">
                <div className="policies-title-section"><h2 className="policies-subtitle">역할 및 권한 설정</h2></div>
                <div className="tab-navigation" style={{ marginBottom: '20px' }}>
                    <button className={`tab-button ${activeTab === 'roles' ? 'active' : ''}`} onClick={() => setActiveTab('roles')}>역할 관리</button>
                    <button className={`tab-button ${activeTab === 'permissions' ? 'active' : ''}`} onClick={() => setActiveTab('permissions')}>권한 관리</button>
                </div>
                <div className="policies-section">
                    {activeTab === 'roles' && renderRoleManagement()}
                    {activeTab === 'permissions' && renderPermissionManagement()}
                </div>
            </div>
        </div>
    );
};

export default AccessControl;