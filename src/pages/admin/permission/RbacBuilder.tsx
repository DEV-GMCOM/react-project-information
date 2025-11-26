import React, { useState, useEffect, useMemo } from 'react';
import { roleService } from '../../../api/services/roleService';
import { Employee, EmployeeSimple, Role, Permission, RoleCreate, RoleUpdate, PermissionCreate, PermissionUpdate } from '../../../api/types';
import EmployeeSearchModal from '../../../components/meeting/EmployeeSearchModal';
import '../../../styles/RbacBuilder.css';


const RbacBuilder: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
    const [pendingAssignedEmployees, setPendingAssignedEmployees] = useState<Employee[]>([]);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

    const [pendingPermissionIds, setPendingPermissionIds] = useState<Set<number>>(new Set());

    // --- [역할 관리] 폼 상태 ---
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleCode, setNewRoleCode] = useState('');

    // --- [권한 관리] 폼 상태 ---
    const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
    const [newPermissionName, setNewPermissionName] = useState('');
    const [newPermissionCode, setNewPermissionCode] = useState('');
    const [newResourceType, setNewResourceType] = useState('');
    const [newActionType, setNewActionType] = useState('');
    const [newPermissionDescription, setNewPermissionDescription] = useState('');

    // --- [동적 데이터] 리소스 및 액션 타입 ---
    const [resourceTypes, setResourceTypes] = useState<string[]>([]);
    const [actionTypes, setActionTypes] = useState<string[]>([]);


    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            setPendingPermissionIds(new Set(selectedRole.permissions.map(p => p.permission_id)));
            roleService.getEmployeesForRole(selectedRole.role_id).then(employees => {
                setAssignedEmployees(employees);
                setPendingAssignedEmployees(employees);
            });
        } else {
            setPendingPermissionIds(new Set());
            setAssignedEmployees([]);
            setPendingAssignedEmployees([]);
        }
    }, [selectedRole]);

    // --- [리소스 타입 변경 시 액션 타입 리로드] ---
    useEffect(() => {
        if (newResourceType) {
            roleService.getActionTypes(newResourceType).then(setActionTypes);
        } else {
            setActionTypes([]);
        }
    }, [newResourceType]);

    // --- [리소스/액션 타입 변경 핸들러] ---
    const handleResourceTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedResource = e.target.value;
        setNewResourceType(selectedResource);
        setNewActionType(''); // 리소스가 바뀌면 액션은 초기화
        if (selectedResource && newActionType) {
             // 액션이 초기화되므로 코드는 incomplete 상태가 됨, 혹은 리소스만 반영?
             // 보통 리소스 바꾸면 액션도 다시 골라야 하므로 코드는 초기화 혹은 리소스 부분만 반영
             setNewPermissionCode(''); 
        } else {
            setNewPermissionCode('');
        }
    };

    const handleActionTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAction = e.target.value;
        setNewActionType(selectedAction);
        if (newResourceType && selectedAction) {
            setNewPermissionCode(`${newResourceType}:${selectedAction}`);
        }
    };


    const fetchData = async () => {
        try {
            const [rolesData, permissionsData, resourcesData] = await Promise.all([
                roleService.getAllRoles(),
                roleService.getAllPermissions(),
                roleService.getResourceTypes(),
            ]);
            setRoles(rolesData);
            setPermissions(permissionsData);
            setResourceTypes(resourcesData);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        }
    };

    // --- [역할 선택 핸들러 - 편집용] ---
    const handleSelectRole = (role: Role) => {
        setEditingRole(role);
        setNewRoleName(role.role_name);
        setNewRoleCode(role.role_code);
    };

    // --- [역할 폼 초기화] ---
    const handleResetRoleForm = () => {
        setEditingRole(null);
        setNewRoleName('');
        setNewRoleCode('');
    };

    // --- [역할 추가] ---
    const handleCreateRole = async () => {
        if (!newRoleName.trim() || !newRoleCode.trim()) {
            alert('역할(Role)이름, 코드값 모두 필요합니다.');
            return;
        }
        const isDuplicateCode = roles.some(role => role.role_code === newRoleCode.trim());
        if (isDuplicateCode) {
            alert(`역할 코드 '${newRoleCode}'가 이미 존재합니다. 고유한 코드를 사용해주세요.`);
            return;
        }
        try {
            const roleData: RoleCreate = { role_name: newRoleName, role_code: newRoleCode };
            const newRole = await roleService.createRole(roleData);
            setRoles([...roles, newRole]);
            handleResetRoleForm();
        } catch (error) {
            console.error('Failed to create role:', error);
            alert('역할 추가에 실패했습니다.');
        }
    };

    // --- [역할 수정] ---
    const handleUpdateRole = async () => {
        if (!editingRole) return;
        if (!newRoleName.trim() || !newRoleCode.trim()) {
            alert('역할(Role)이름, 코드값 모두 필요합니다.');
            return;
        }
        // 다른 역할과 코드가 중복되는지 확인
        const isDuplicateCode = roles.some(role =>
            role.role_id !== editingRole.role_id && role.role_code === newRoleCode.trim()
        );
        if (isDuplicateCode) {
            alert(`역할 코드 '${newRoleCode}'가 이미 존재합니다. 고유한 코드를 사용해주세요.`);
            return;
        }
        try {
            const roleData: RoleUpdate = { role_name: newRoleName, role_code: newRoleCode };
            await roleService.updateRole(editingRole.role_id, roleData);
            // 역할 목록 새로고침
            const updatedRoles = await roleService.getAllRoles();
            setRoles(updatedRoles);
            // 선택된 역할 업데이트
            if (selectedRole?.role_id === editingRole.role_id) {
                const updatedSelectedRole = updatedRoles.find(r => r.role_id === editingRole.role_id);
                setSelectedRole(updatedSelectedRole || null);
            }
            handleResetRoleForm();
            alert('역할이 성공적으로 수정되었습니다!');
        } catch (error) {
            console.error('Failed to update role:', error);
            alert('역할 수정에 실패했습니다.');
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
            // 편집 중인 역할이 삭제되면 폼 초기화
            if (editingRole?.role_id === roleId) {
                handleResetRoleForm();
            }
        } catch (error) {
            console.error('Failed to delete role:', error);
        }
    };

    // --- [권한 선택 핸들러] ---
    const handleSelectPermission = (permission: Permission) => {
        setSelectedPermission(permission);
        setNewPermissionName(permission.permission_name);
        setNewPermissionCode(permission.permission_code);
        setNewResourceType(permission.resource_type);
        setNewActionType(permission.action_type);
        setNewPermissionDescription(permission.description || '');
    };

    // --- [권한 폼 초기화] ---
    const handleResetPermissionForm = () => {
        setSelectedPermission(null);
        setNewPermissionName('');
        setNewResourceType('');
        setNewActionType('');
        setNewPermissionCode('');
        setNewPermissionDescription('');
    };

    // --- [권한 추가] ---
    const handleCreatePermission = async () => {
        if (!newPermissionName.trim() || !newResourceType.trim() || !newActionType.trim() || !newPermissionCode.trim()) {
            alert('권한명, 리소스 타입, 액션 타입이 모두 필요합니다.');
            return;
        }
        try {
            const permData: PermissionCreate = {
                permission_name: newPermissionName,
                permission_code: newPermissionCode,
                resource_type: newResourceType,
                action_type: newActionType,
                description: newPermissionDescription,
            };
            const newPermission = await roleService.createPermission(permData);
            setPermissions([...permissions, newPermission]);
            handleResetPermissionForm();
        } catch (error) {
            console.error('Failed to create permission:', error);
            alert('권한 추가에 실패했습니다.');
        }
    };

    // --- [권한 수정] ---
    const handleUpdatePermission = async () => {
        if (!selectedPermission) return;
        if (!newPermissionName.trim() || !newResourceType.trim() || !newActionType.trim() || !newPermissionCode.trim()) {
            alert('권한명, 리소스 타입, 액션 타입이 모두 필요합니다.');
            return;
        }
        try {
            const permData: PermissionUpdate = {
                permission_name: newPermissionName,
                permission_code: newPermissionCode,
                resource_type: newResourceType,
                action_type: newActionType,
                description: newPermissionDescription,
            };
            await roleService.updatePermission(selectedPermission.permission_id, permData);
            // 권한 목록 새로고침
            const updatedPermissions = await roleService.getAllPermissions();
            setPermissions(updatedPermissions);
            handleResetPermissionForm();
            alert('권한이 성공적으로 수정되었습니다!');
        } catch (error) {
            console.error('Failed to update permission:', error);
            alert('권한 수정에 실패했습니다.');
        }
    };

    const handleDeletePermission = async (permissionId: number) => {
        if (!window.confirm('정말로 이 권한을 삭제하시겠습니까? 이 권한을 사용하는 모든 역할에서 제거됩니다.')) {
            return;
        }
        try {
            await roleService.deletePermission(permissionId);
            setPermissions(permissions.filter(p => p.permission_id !== permissionId));
            if (selectedRole) {
                const updatedSelectedRolePermissions = selectedRole.permissions.filter(p => p.permission_id !== permissionId);
                setSelectedRole({ ...selectedRole, permissions: updatedSelectedRolePermissions });
            }
            // 선택된 권한이 삭제되면 폼 초기화
            if (selectedPermission?.permission_id === permissionId) {
                handleResetPermissionForm();
            }
        } catch (error) {
            console.error('Failed to delete permission:', error);
            alert('권한 삭제에 실패했습니다.');
        }
    };

    const handleSaveAllChanges = async () => {
        if (!selectedRole) return;
        if (!window.confirm('모든 변경 사항을 저장하시겠습니까?')) {
            return;
        }

        try {
            // 1. 역할-권한 매핑 업데이트
            const permissionIds = Array.from(pendingPermissionIds);
            await roleService.updateRolePermissions(selectedRole.role_id, permissionIds);

            // 2. 역할-직원 매핑 업데이트
            const pendingEmployeeIds = pendingAssignedEmployees.map(e => e.id);
            await roleService.assignRoleToEmployeesBatch(selectedRole.role_id, pendingEmployeeIds);

            // 3. 삭제된 직원들 처리 (기존에는 있었지만 pending에는 없는 직원)
            const removedEmployees = assignedEmployees.filter(
                emp => !pendingAssignedEmployees.some(p => p.id === emp.id)
            );
            for (const emp of removedEmployees) {
                await roleService.unassignRoleFromEmployee(emp.id);
            }

            // 4. 데이터 새로고침
            const updatedRoles = await roleService.getAllRoles();
            setRoles(updatedRoles);
            const newlySelectedRole = updatedRoles.find(r => r.role_id === selectedRole.role_id);
            setSelectedRole(newlySelectedRole || null);

            alert('모든 변경사항이 성공적으로 저장되었습니다!');
        } catch (error) {
            console.error('Failed to save changes:', error);
            alert('저장에 실패했습니다.');
        }
    };

    const handlePermissionChange = (permissionId: number, isChecked: boolean) => {
        setPendingPermissionIds(prevIds => {
            const newIds = new Set(prevIds);
            if (isChecked) newIds.add(permissionId);
            else newIds.delete(permissionId);
            return newIds;
        });
    };

    const hasUnsavedChanges = useMemo(() => {
        if (!selectedRole) return false;

        // 권한 변경사항 체크
        const originalIds = new Set(selectedRole.permissions.map(p => p.permission_id));
        if (originalIds.size !== pendingPermissionIds.size) return true;
        for (const id of originalIds) {
            if (!pendingPermissionIds.has(id)) return true;
        }

        // 직원 변경사항 체크
        if (assignedEmployees.length !== pendingAssignedEmployees.length) return true;
        const originalEmpIds = new Set(assignedEmployees.map(e => e.id));
        const pendingEmpIds = new Set(pendingAssignedEmployees.map(e => e.id));
        if (originalEmpIds.size !== pendingEmpIds.size) return true;
        for (const id of originalEmpIds) {
            if (!pendingEmpIds.has(id)) return true;
        }

        return false;
    }, [selectedRole, pendingPermissionIds, assignedEmployees, pendingAssignedEmployees]);

    const handleAssignEmployeesToRole = (selectedEmployees: Employee[]) => {
        if (!selectedRole) return;
        setPendingAssignedEmployees(selectedEmployees);
        setIsEmployeeModalOpen(false);
    };

    const handleRemoveEmployeeFromRole = (employee: Employee) => {
        setPendingAssignedEmployees(pendingAssignedEmployees.filter(e => e.id !== employee.id));
    };

    return (
        <div className="rbac-builder-container">
            <h1>RBAC - 역할 & 권한 관리</h1>

            {/* 섹션1: 권한 관리 (full width, 상단) */}
            <div className="permission-management-section">
                <h2>권한 관리</h2>
                <div className="permission-form-and-list">
                    <div className="permission-form">
                        <select
                            value={newResourceType}
                            onChange={handleResourceTypeChange}
                        >
                            <option value="" disabled>리소스 선택</option>
                            {resourceTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        <select
                            value={newActionType}
                            onChange={handleActionTypeChange}
                        >
                            <option value="" disabled>액션 선택</option>
                            {actionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
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
                            placeholder="자동 생성 또는 직접 입력"
                        />
                        <textarea
                            id="permissionDescription"
                            value={newPermissionDescription}
                            onChange={(e) => setNewPermissionDescription(e.target.value)}
                            placeholder="이 권한이 시스템에서 어떤 작업을 허용하는지 상세하게 설명합니다."
                            rows={3}
                            style={{ resize: 'vertical' }}
                        />
                        <div className="form-buttons">
                            {selectedPermission ? (
                                <>
                                    <button className="btn-update" onClick={handleUpdatePermission}>권한 수정</button>
                                    <button className="btn-cancel" onClick={handleResetPermissionForm}>취소</button>
                                </>
                            ) : (
                                <button className="btn-create" onClick={handleCreatePermission}>권한 추가</button>
                            )}
                        </div>
                    </div>
                    <div className="permission-list-grid">
                        {permissions.map(permission => (
                            <div
                                key={permission.permission_id}
                                className={`permission-list-item ${selectedPermission?.permission_id === permission.permission_id ? 'selected' : ''}`}
                                onClick={() => handleSelectPermission(permission)}
                            >
                                <div className="permission-info">
                                    <div className="permission-header">
                                        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.2rem'}}>
                                            <strong style={{fontSize: '1rem'}}>{permission.permission_name}</strong>
                                            <span className="permission-code" style={{fontSize: '0.85rem', color: '#888'}}>{permission.permission_code}</span>
                                        </div>
                                        <button
                                            className="delete-btn"
                                            onClick={(e) => { e.stopPropagation(); handleDeletePermission(permission.permission_id); }}
                                        >
                                            X
                                        </button>
                                    </div>
                                    {permission.description && (
                                        <p className="permission-desc" style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>
                                            {permission.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 섹션2, 섹션3, 섹션4: 역할 & 권한 할당 & 멤버 관리 */}
            <div className="rbac-main-content">
                {/* 섹션2: 역할 목록 */}
                <div className="roles-section">
                    <h2>역할</h2>
                    <div className="add-item-form multi-line">
                        <input
                            type="text"
                            value={newRoleName}
                            onChange={(e) => setNewRoleName(e.target.value)}
                            placeholder="역할 이름"
                        />
                        <input
                            type="text"
                            value={newRoleCode}
                            onChange={(e) => setNewRoleCode(e.target.value)}
                            placeholder="역할 코드"
                        />
                        {editingRole ? (
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button onClick={handleUpdateRole}>역할 수정</button>
                                <button onClick={handleResetRoleForm} className="btn-cancel">취소</button>
                            </div>
                        ) : (
                            <button onClick={handleCreateRole}>역할 추가</button>
                        )}
                    </div>
                    <ul>
                        {roles.map(role => (
                            <li
                                key={role.role_id}
                                className={selectedRole?.role_id === role.role_id ? 'selected' : ''}
                                onClick={() => {
                                    setSelectedRole(roles.find(r => r.role_id === role.role_id) || null);
                                    handleSelectRole(role);
                                }}
                            >
                                <span style={{ flex: 1 }}>
                                    {role.role_name} ({role.role_code})
                                </span>
                                <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteRole(role.role_id); }}>X</button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 섹션3 & 섹션4: 권한 할당 + 멤버 관리 (우측, 2단 구조) */}
                <div className="right-panel">
                    {/* 섹션3: 선택된 역할의 권한 체크박스 */}
                    <div className="permissions-section">
                        <h2>{selectedRole ? `"${selectedRole.role_name}" 역할의 권한` : '역할을 선택하세요'}</h2>
                        {selectedRole ? (
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
                        ) : (
                            <p style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
                                왼쪽에서 역할을 선택하면 권한을 할당할 수 있습니다.
                            </p>
                        )}
                    </div>

                    {/* 섹션4: 역할 멤버 관리 */}
                    {selectedRole && (
                        <div className="assigned-employees-section">
                            <div className="section-header">
                                <h3>{`"${selectedRole.role_name}" 역할 멤버 (${pendingAssignedEmployees.length}명)`}</h3>
                                <button className="btn-add-member" onClick={() => setIsEmployeeModalOpen(true)}>+ 멤버 추가</button>
                            </div>
                            <div className="employee-list">
                                {pendingAssignedEmployees.length > 0 ? (
                                    pendingAssignedEmployees.map(emp => {
                                        const deptInfo = [emp.division, emp.team].filter(Boolean).join(' ');
                                        return (
                                            <div key={emp.id} className="employee-item">
                                                <span>
                                                    {emp.name} | {emp.position || '-'} | {deptInfo || '-'}
                                                </span>
                                                <button className="btn-remove-member" onClick={() => handleRemoveEmployeeFromRole(emp)}>X</button>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p>이 역할에 할당된 직원이 없습니다.</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 페이지 최하단 저장 버튼 */}
            {selectedRole && hasUnsavedChanges && (
                <div className="global-save-section">
                    <button
                        onClick={handleSaveAllChanges}
                        className="global-save-btn"
                    >
                        수정내역 저장
                    </button>
                </div>
            )}

            {isEmployeeModalOpen && (
                <EmployeeSearchModal
                    onClose={() => setIsEmployeeModalOpen(false)}
                    onSelect={handleAssignEmployeesToRole}
                    initialSelected={pendingAssignedEmployees}
                />
            )}
        </div>
    );
};

export default RbacBuilder;