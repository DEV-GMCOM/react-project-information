
import React, { useState, useEffect, useMemo } from 'react';
import { roleService } from '../../../api/services/roleService';
import { employeeService } from '../../../api/services/employeeService';
import { Employee, Role, Permission, RoleCreate, PermissionCreate } from '../../../api/types';
import '../../../styles/RbacBuilder.css';

// --- [추가] 직원 검색 모달 (MeetingMinutes.tsx에서 가져옴) ---
interface EmployeeSearchModalProps {
    onClose: () => void;
    onSelect: (selectedEmployees: Employee[]) => void;
    initialSelected: Employee[];
    allEmployees: Employee[];
}

const EmployeeSearchModal: React.FC<EmployeeSearchModalProps> = ({ onClose, onSelect, initialSelected, allEmployees }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selected, setSelected] = useState<Employee[]>(initialSelected);

    const filteredEmployees = useMemo(() => {
        if (!searchTerm) return allEmployees;
        return allEmployees.filter(emp =>
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (emp.department?.name && emp.department.name.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [searchTerm, allEmployees]);

    const handleCheckboxChange = (employee: Employee) => {
        setSelected(prev => {
            if (prev.some(e => e.id === employee.id)) {
                return prev.filter(e => e.id !== employee.id);
            } else {
                return [...prev, employee];
            }
        });
    };

    const handleConfirm = () => {
        onSelect(selected);
        onClose();
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>직원 검색</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <div style={{ marginBottom: '15px' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="이름 또는 부서로 검색"
                            className="project-input"
                            style={{ width: '100%' }}
                        />
                    </div>
                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="search-table">
                            <thead>
                                <tr>
                                    <th>선택</th>
                                    <th>이름</th>
                                    <th>부서</th>
                                    <th>직급</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEmployees.length > 0 ? (
                                    filteredEmployees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={selected.some(e => e.id === emp.id)}
                                                    onChange={() => handleCheckboxChange(emp)}
                                                />
                                            </td>
                                            <td>{emp.name}</td>
                                            <td>{emp.department?.name || '-'}
                                            </td>
                                            <td>{emp.position || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="no-results">검색 결과가 없습니다.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="modal-footer" style={{ padding: '15px', textAlign: 'right' }}>
                    <button className="btn-primary" onClick={handleConfirm}>확인</button>
                    <button className="btn-secondary" onClick={onClose} style={{ marginLeft: '10px' }}>취소</button>
                </div>
            </div>
        </div>
    );
};
// --- ▲▲▲ 직원 검색 모달 종료 ▲▲▲ ---


const RbacBuilder: React.FC = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

    const [pendingPermissionIds, setPendingPermissionIds] = useState<Set<number>>(new Set());

    const [newRoleName, setNewRoleName] = useState('');
    const [newRoleCode, setNewRoleCode] = useState('');
    // --- [수정] 권한 추가 폼 상태 관리 ---
    const [newPermissionName, setNewPermissionName] = useState('');
    const [newPermissionCode, setNewPermissionCode] = useState(''); // 이제 자동 생성
        const [newResourceType, setNewResourceType] = useState(''); // 드롭다운으로 변경
        const [newActionType, setNewActionType] = useState('');     // 드롭다운으로 변경
    
        // --- [수정] 동적으로 불러올 리소스 및 액션 타입 ---
        const [resourceTypes, setResourceTypes] = useState<string[]>([]);
        const [actionTypes, setActionTypes] = useState<string[]>([]);
    
    
        useEffect(() => {
            fetchData();
            employeeService.getEmployees({ limit: 1000 }).then(setAllEmployees);
        }, []);
    
        useEffect(() => {
            if (selectedRole) {
                setPendingPermissionIds(new Set(selectedRole.permissions.map(p => p.permission_id)));
                roleService.getEmployeesForRole(selectedRole.role_id).then(setAssignedEmployees);
            } else {
                setPendingPermissionIds(new Set());
                setAssignedEmployees([]);
            }
            }, [selectedRole]);
        
            // --- [추가] 리소스 및 액션 변경 시 권한 코드 자동 생성 ---
            useEffect(() => {
                if (newResourceType && newActionType) {
                    setNewPermissionCode(`${newResourceType}:${newActionType}`);
                } else {
                    setNewPermissionCode('');
                }
            }, [newResourceType, newActionType]);
        
            // --- [추가] 리소스 타입 변경 시 관련 액션 타입 목록 다시 불러오기 ---
            useEffect(() => {
                if (newResourceType) {
                    // 리소스 타입이 변경되면, 액션 타입 선택을 초기화
                    setNewActionType('');
                    // 해당 리소스에 맞는 액션 타입 목록을 가져옴
                    roleService.getActionTypes(newResourceType).then(setActionTypes);
                } else {
                    // 리소스 타입이 선택되지 않으면 액션 목록을 비움
                    setActionTypes([]);
                }
            }, [newResourceType]);
        
        
            const fetchData = async () => {
                try {
                    // actionTypes는 리소스 타입 선택 시 동적으로 로드되므로 Promise.all에서 제외
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
            };    const handleCreateRole = async () => {
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
        // --- [수정] 유효성 검사 및 데이터 전달 ---
        if (!newPermissionName.trim() || !newResourceType.trim() || !newActionType.trim() || !newPermissionCode.trim()) {
            alert('권한명, 리소스 타입, 액션 타입이 모두 필요합니다.');
            return;
        }
        try {
            const permData: PermissionCreate = {
                permission_name: newPermissionName,
                permission_code: newPermissionCode, // 자동 생성된 코드 사용
                resource_type: newResourceType,
                action_type: newActionType,
            };
            const newPermission = await roleService.createPermission(permData);
            setPermissions([...permissions, newPermission]);
            // 폼 초기화
            setNewPermissionName('');
            setNewResourceType('');
            setNewActionType('');
            setNewPermissionCode(''); // 자동 생성 필드도 초기화
        } catch (error) {
            console.error('Failed to create permission:', error);
        }
    };

    const handleDeletePermission = async (permissionId: number) => {
        if (!window.confirm('정말로 이 권한을 삭제하시겠습니까? 이 권한을 사용하는 모든 역할에서 제거됩니다.')) {
            return;
        }
        try {
            await roleService.deletePermission(permissionId);
            setPermissions(permissions.filter(p => p.permission_id !== permissionId));
            // 선택된 역할의 권한 목록도 업데이트 (만약 삭제된 권한이 선택된 역할에 포함되어 있었다면)
            if (selectedRole) {
                const updatedSelectedRolePermissions = selectedRole.permissions.filter(p => p.permission_id !== permissionId);
                setSelectedRole({ ...selectedRole, permissions: updatedSelectedRolePermissions });
            }
        } catch (error) {
            console.error('Failed to delete permission:', error);
            alert('권한 삭제에 실패했습니다.');
        }
    };

    const handleSaveChanges = async () => {
        if (!selectedRole) return;
        if (!window.confirm('변경 사항을 저장하시겠습니까?')) {
            return;
        }
        const permissionIds = Array.from(pendingPermissionIds);
        try {
            await roleService.updateRolePermissions(selectedRole.role_id, permissionIds);
            const updatedRoles = await roleService.getAllRoles();
            setRoles(updatedRoles);
            const newlySelectedRole = updatedRoles.find(r => r.role_id === selectedRole.role_id);
            setSelectedRole(newlySelectedRole || null);
            alert('권한이 성공적으로 업데이트되었습니다!');
        } catch (error) {
            console.error('Failed to update permissions:', error);
            alert('권한 저장에 실패했습니다.');
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
        const originalIds = new Set(selectedRole.permissions.map(p => p.permission_id));
        if (originalIds.size !== pendingPermissionIds.size) return true;
        for (const id of originalIds) {
            if (!pendingPermissionIds.has(id)) return true;
        }
        return false;
    }, [selectedRole, pendingPermissionIds]);

    const handleRemoveEmployeeFromRole = async (employee: Employee) => {
        if (!window.confirm(`${employee.name}님을 현재 역할에서 제외하시겠습니까?`)) return;
        try {
            await roleService.unassignRoleFromEmployee(employee.id);
            setAssignedEmployees(prev => prev.filter(emp => emp.id !== employee.id));
            alert(`${employee.name}님이 역할에서 제외되었습니다.`);
        } catch (error) {
            console.error("Failed to remove employee from role:", error);
            alert("역할 제외에 실패했습니다.");
        }
    };

    const handleAssignEmployeesToRole = async (selectedEmployees: Employee[]) => {
        if (!selectedRole) return;
        // 현재 역할에 이미 할당된 직원은 제외
        const currentAssignedIds = new Set(assignedEmployees.map(emp => emp.id));
        const employeesToAssign = selectedEmployees.filter(emp => !currentAssignedIds.has(emp.id));

        if (employeesToAssign.length === 0) {
            alert('새로 추가할 직원이 없습니다.');
            return;
        }

        const employeeIds = employeesToAssign.map(emp => emp.id);
        try {
            await roleService.assignRoleToEmployeesBatch(selectedRole.role_id, employeeIds);
            // Refetch assigned employees to include newly assigned ones
            const updatedAssignedEmployees = await roleService.getEmployeesForRole(selectedRole.role_id);
            setAssignedEmployees(updatedAssignedEmployees);
            alert('직원이 성공적으로 할당되었습니다.');
        } catch (error) {
            console.error("Failed to assign employees:", error);
            alert("직원 할당에 실패했습니다.");
        } finally {
            setIsEmployeeModalOpen(false); // 모달 닫기
        }
    };

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
                    <h2>{selectedRole ? `"${selectedRole.role_name}"` : '권한 목록'}</h2>
                    <div className="add-item-form multi-line">
                        {/* --- [수정] 리소스 타입 드롭다운 --- */}
                        <select
                            value={newResourceType}
                            onChange={(e) => setNewResourceType(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="" disabled>리소스 선택</option>
                            {resourceTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {/* --- [수정] 액션 타입 드롭다운 --- */}
                        <select
                            value={newActionType}
                            onChange={(e) => setNewActionType(e.target.value)}
                            style={{ width: '100%' }}
                        >
                            <option value="" disabled>액션 선택</option>
                            {actionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                        {/* --- [수정] 권한명 입력 --- */}
                        <input
                            type="text"
                            value={newPermissionName}
                            onChange={(e) => setNewPermissionName(e.target.value)}
                            placeholder="권한명 (예: 게시물 생성)"
                            style={{ width: '100%' }}
                        />
                        {/* --- [수정] 권한 코드 (자동 생성, 읽기 전용) --- */}
                        <input
                            type="text"
                            value={newPermissionCode}
                            readOnly
                            placeholder="자동 생성 (리소스:액션)"
                            style={{ width: '100%', backgroundColor: '#f0f0f0' }}
                        />
                        <button onClick={handleCreatePermission}>권한 추가</button>
                    </div>

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
                                            disabled={!selectedRole}
                                        />
                                        {permission.permission_name} ({permission.permission_code})
                                    </label>
                                    <button className="delete-btn" onClick={(e) => { e.stopPropagation(); handleDeletePermission(permission.permission_id); }}>X</button>
                                </div>
                            );
                        })}
                    </div>
                    {selectedRole && (
                        <div className="save-actions">
                            <button
                                onClick={handleSaveChanges}
                                disabled={!hasUnsavedChanges}
                                className="save-btn"
                            >
                                수정내역 저장
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedRole && (
                <div className="assigned-employees-section">
                    <div className="section-header">
                        <h3>{`"${selectedRole.role_name}" 역할 멤버 (${assignedEmployees.length}명)`}</h3>
                        <button className="btn-add-member" onClick={() => setIsEmployeeModalOpen(true)}>+ 멤버 추가</button>
                    </div>
                    <div className="employee-list">
                        {assignedEmployees.length > 0 ? (
                            assignedEmployees.map(emp => (
                                <div key={emp.id} className="employee-item">
                                    <span>{emp.name} ({emp.department?.name || '부서 없음'})</span>
                                    <button className="btn-remove-member" onClick={() => handleRemoveEmployeeFromRole(emp)}>X</button>
                                </div>
                            ))
                        ) : (
                            <p>이 역할에 할당된 직원이 없습니다.</p>
                        )}
                    </div>
                </div>
            )}

            {isEmployeeModalOpen && (
                <EmployeeSearchModal
                    onClose={() => setIsEmployeeModalOpen(false)}
                    onSelect={handleAssignEmployeesToRole}
                    initialSelected={assignedEmployees}
                    allEmployees={allEmployees}
                />
            )}
        </div>
    );
};
export default RbacBuilder;

