import React, { useState, useEffect, useMemo } from 'react';
import { roleService } from '../../../api/services/roleService';
import { Employee, Role, Permission, RoleCreate, RoleUpdate, PermissionCreate, PermissionUpdate } from '../../../api/types';
import EmployeeSearchModal from '../../../components/meeting/EmployeeSearchModal';
import '../../../styles/RbacBuilder.css';
import { useAuth } from '../../../contexts/AuthContext';
// Layout.tsx에서 메뉴 데이터를 import
import { baseMainMenuItems, devMenuItems, NavMenuItem, NavSubMenuItem } from '../../../components/common/Layout';


// --- Types ---

type PermissionType = 'PAGE' | 'SECTION' | 'ACTION' | 'UNKNOWN';

interface GroupedPermission {
    type: PermissionType;
    id: string; // derived from code
    permission: Permission;
    children: GroupedPermission[];
    parentId?: string;
    isVirtual?: boolean; // DB에 없고 메뉴에만 있는 경우
    navName?: string; // 메뉴에서 가져온 이름
}

interface PermissionFormData {
    name: string;
    code: string; // Full code or suffix
    type: PermissionType;
    resourceType: string;
    actionType: string;
    description: string;
    parentId: string; // For Sections/Actions, the Page ID
}

// 모든 메뉴 항목을 병합 (개발 메뉴 포함)
const ALL_MENUS_FOR_RBAC: (NavMenuItem | NavSubMenuItem)[] = [
    ...baseMainMenuItems.flatMap(item => item.subMenus ? [item, ...item.subMenus] : [item]),
    ...devMenuItems.flatMap(item => item.subMenus ? [item, ...item.subMenus] : [item]),
];

// Flatten menu for easy lookup (모든 메뉴 포함)
const FLATTENED_MENUS = ALL_MENUS_FOR_RBAC.reduce<{path: string, name: string}[]>((acc, item) => {
    acc.push({ path: item.path, name: item.name });
    return acc;
}, []);

// Helper: Convert path to permission code ID (remove leading slash, replace / with _)
const pathToId = (path: string) => path.replace(/^\//, '').replace(/\//g, '_');


// --- Helper Functions ---

const parsePermissionCode = (code: string): { type: PermissionType, id: string, parentId?: string } => {
    if (code.startsWith('page:')) {
        const id = code.replace(/^page:(view_)?/, '');
        return { type: 'PAGE', id };
    } else if (code.startsWith('section:')) {
        const parts = code.split(':');
        if (parts.length === 3) {
            return { type: 'SECTION', parentId: parts[1], id: parts[2] };
        } else {
            const id = code.replace(/^section:(view_)?/, '');
            return { type: 'SECTION', id, parentId: 'unknown' };
        }
    } else if (code.startsWith('action:')) {
        const parts = code.split(':');
        if (parts.length === 3) {
            return { type: 'ACTION', parentId: parts[1], id: parts[2] };
        } else {
             return { type: 'ACTION', id: code, parentId: 'unknown' };
        }
    }
    return { type: 'UNKNOWN', id: code, parentId: 'unknown' };
};

const buildPermissionTree = (permissions: Permission[]): { tree: GroupedPermission[], orphans: Permission[] } => {
    const pages = new Map<string, GroupedPermission>();
    const orphans: Permission[] = [];
    const processingQueue: { perm: Permission, info: any }[] = [];

    // 1. Existing DB Permissions
    permissions.forEach(p => {
        const info = parsePermissionCode(p.permission_code);
        if (info.type === 'PAGE') {
            pages.set(info.id, {
                type: 'PAGE',
                id: info.id,
                permission: p,
                children: [],
                isVirtual: false
            });
        } else {
            processingQueue.push({ perm: p, info });
        }
    });

    // 2. Sync with Nav Menu (Virtual Nodes)
    FLATTENED_MENUS.forEach(menu => {
        const pageId = pathToId(menu.path);
        if (!pages.has(pageId)) {
            // Create Virtual Permission Node
            pages.set(pageId, {
                type: 'PAGE',
                id: pageId,
                permission: {
                    permission_id: -1 * Math.floor(Math.random() * 100000), // Temporary ID
                    permission_name: menu.name,
                    permission_code: `page:${pageId}`,
                    resource_type: 'PAGE',
                    action_type: 'VIEW',
                    description: `[Auto-Generated] ${menu.name} 페이지 접근 권한`,
                    is_active: true,
                    created_at: '',
                    modified_at: ''
                },
                children: [],
                isVirtual: true,
                navName: menu.name
            });
        }
    });

    // 3. Process Children (Sections/Actions)
    processingQueue.forEach(({ perm, info }) => {
        if ((info.type === 'SECTION' || info.type === 'ACTION') && info.parentId && pages.has(info.parentId)) {
            const page = pages.get(info.parentId)!;
            page.children.push({
                type: info.type,
                id: info.id,
                permission: perm,
                children: [],
                parentId: info.parentId
            });
        } else {
            orphans.push(perm);
        }
    });

    return { tree: Array.from(pages.values()), orphans };
};


const RbacBuilder: React.FC = () => {
    // --- State ---
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);
    
    // Role Form State
    const [roleForm, setRoleForm] = useState<{ name: string, code: string, id?: number }>({ name: '', code: '' });
    const [isRoleEditing, setIsRoleEditing] = useState(false);

    // Permission Assignment State
    const [pendingPermissionIds, setPendingPermissionIds] = useState<Set<number>>(new Set());
    // 추적용: 가상 권한 중 선택된 것들 (저장 시 생성해야 함)
    const [selectedVirtualNodes, setSelectedVirtualNodes] = useState<Set<string>>(new Set()); 

    // Employee Assignment State
    const [assignedEmployees, setAssignedEmployees] = useState<Employee[]>([]);
    const [initialAssignedEmployees, setInitialAssignedEmployees] = useState<Employee[]>([]);
    const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
    const [applyingToAll, setApplyingToAll] = useState(false); // 모든 직원에게 적용 여부
    
    // Permission Modal State (Sub-items only)
    const [isPermModalOpen, setIsPermModalOpen] = useState(false);
    const [permForm, setPermForm] = useState<PermissionFormData>({
        name: '',
        code: '',
        type: 'PAGE',
        resourceType: 'PAGE',
        actionType: 'VIEW',
        description: '',
        parentId: ''
    });
    const [editingPermId, setEditingPermId] = useState<number | null>(null);

    const { user, refreshUser } = useAuth(); // Auth Context 가져오기

    // --- Computed ---
    const { tree, orphans } = useMemo(() => buildPermissionTree(permissions), [permissions]);

    // --- Data Fetching ---
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            // super_admin 여부와 관계없이 다른 역할과 동일하게 처리
            setPendingPermissionIds(new Set(selectedRole.permissions.map(p => p.permission_id)));
            setSelectedVirtualNodes(new Set());
            setApplyingToAll(selectedRole.applying_to_all || false); // 모든 직원 적용 여부 설정

            roleService.getEmployeesForRole(selectedRole.role_id).then(emps => {
                setAssignedEmployees(emps);
                setInitialAssignedEmployees(emps);
            });
            setRoleForm({ name: '', code: '' });
            setIsRoleEditing(false);
        } else {
            setPendingPermissionIds(new Set());
            setAssignedEmployees([]);
            setInitialAssignedEmployees([]);
            setSelectedVirtualNodes(new Set());
            setApplyingToAll(false);
        }
    }, [selectedRole, tree, orphans]); 

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

    // --- Role Handlers ---
    const handleSaveRole = async () => {
        if (!roleForm.name || !roleForm.code) {
            alert('역할 이름과 코드를 입력해주세요.');
            return;
        }
        try {
            if (isRoleEditing && roleForm.id) {
                 await roleService.updateRole(roleForm.id, { role_name: roleForm.name, role_code: roleForm.code });
            } else {
                await roleService.createRole({ role_name: roleForm.name, role_code: roleForm.code });
            }
            const updatedRoles = await roleService.getAllRoles();
            setRoles(updatedRoles);
            setRoleForm({ name: '', code: '' });
            setIsRoleEditing(false);
            if (isRoleEditing && selectedRole) {
                 const updated = updatedRoles.find(r => r.role_id === selectedRole.role_id);
                 if (updated) setSelectedRole(updated);
            }
        } catch (e) {
            console.error(e);
            alert('역할 저장 실패');
        }
    };

    const handleDeleteRole = async (roleId: number) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;
        try {
            await roleService.deleteRole(roleId);
            setRoles(prev => prev.filter(r => r.role_id !== roleId));
            if (selectedRole?.role_id === roleId) setSelectedRole(null);
        } catch (e) {
            console.error(e);
            alert('삭제 실패');
        }
    };

    // --- Permission Assignment Handlers ---
    const togglePermission = (node: GroupedPermission, checked: boolean) => {
        // super_admin 여부와 관계없이 다른 역할과 동일하게 처리

        if (node.isVirtual) {
            setSelectedVirtualNodes(prev => {
                const next = new Set(prev);
                if (checked) next.add(node.id);
                else next.delete(node.id);
                return next;
            });
        } else {
            setPendingPermissionIds(prev => {
                const next = new Set(prev);
                if (checked) next.add(node.permission.permission_id);
                else next.delete(node.permission.permission_id);
                return next;
            });
        }
    };
    
    const handleSaveAssignments = async () => {
        if (!selectedRole) return;

        const isSuperAdmin = selectedRole.role_code === 'SUPER_ADMIN';

        // --- [수정] 자가 삭제 방지 로직 제거 (다중 역할 지원으로 인해 제거해도 무방하거나, 복잡도 증가) ---
        // 만약 SUPER_ADMIN 역할이 '유일한' 역할인 경우에만 막아야 하는데,
        // 현재 UI에서는 해당 사용자의 다른 역할 보유 여부를 알 수 없음.
        // 일단 경고 없이 진행하거나, 정말 필요하다면 백엔드에서 막는 것이 좋음.

        try {
            // 0. Update role's applying_to_all field if changed
            if (applyingToAll !== (selectedRole.applying_to_all || false)) {
                await roleService.updateRole(selectedRole.role_id, {
                    applying_to_all: applyingToAll
                });
            }

            // 1. Create Virtual Permissions First
            const createdPermissionIds: number[] = [];
            const virtualNodesToCreate = Array.from(selectedVirtualNodes); 

            for (const pageId of virtualNodesToCreate) {
                const menu = FLATTENED_MENUS.find(m => pathToId(m.path) === pageId);
                if (!menu) continue;

                const payload: PermissionCreate = {
                    permission_name: menu.name,
                    permission_code: `page:${pageId}`,
                    resource_type: 'PAGE',
                    action_type: 'VIEW',
                    description: `[Auto-Generated] ${menu.name} 페이지 접근 권한`
                };
                const newPerm = await roleService.createPermission(payload);
                createdPermissionIds.push(newPerm.permission_id);
            }

            // 1. Save All Permissions (Existing + Newly Created)
            let finalPermissionIds = Array.from(pendingPermissionIds);
            // super_admin 여부와 관계없이 다른 역할과 동일하게 처리 (모든 권한 기본 할당 로직 제거)
            finalPermissionIds = [...finalPermissionIds, ...createdPermissionIds];


            await roleService.updateRolePermissions(selectedRole.role_id, finalPermissionIds);
            
            setPendingPermissionIds(new Set(finalPermissionIds)); // Save state

            // 2. Save Employees (Diffing)
            const currentIds = new Set(assignedEmployees.map(e => e.id));
            const initialIds = new Set(initialAssignedEmployees.map(e => e.id));
            const toAdd = assignedEmployees.filter(e => !initialIds.has(e.id)).map(e => e.id);
            const toRemove = initialAssignedEmployees.filter(e => !currentIds.has(e.id)).map(e => e.id);

            if (toAdd.length > 0) await roleService.assignRoleToEmployeesBatch(selectedRole.role_id, toAdd);
            
            // [수정] unassign 시 role_id 전달 필요 (N:M 지원)
            // roleService.unassignRoleFromEmployee(employeeId) -> (employeeId, roleId) 로 변경 필요하지만
            // 현재 roleService.ts 파일도 수정해야 함. (아래에서 진행 예정)
            // 일단 여기서 role_id를 인자로 넘기는 것으로 가정하고 호출.
            if (toRemove.length > 0) {
                await Promise.all(toRemove.map(id => roleService.unassignRoleFromEmployee(id, selectedRole.role_id)));
            }
            
            alert('저장되었습니다.');
            
            // AuthContext의 사용자 정보(권한)를 갱신
            await refreshUser();
            
            // Refresh Role & Employee Data
            const updatedRoles = await roleService.getAllRoles();
            const updatedPerms = await roleService.getAllPermissions(); 
            setRoles(updatedRoles);
            setPermissions(updatedPerms);
            setSelectedVirtualNodes(new Set()); 
            
            const updated = updatedRoles.find(r => r.role_id === selectedRole.role_id);
            if (updated) {
                setSelectedRole(updated);
                setPendingPermissionIds(new Set(updated.permissions.map(p => p.permission_id)));
                roleService.getEmployeesForRole(updated.role_id).then(emps => {
                    setAssignedEmployees(emps);
                    setInitialAssignedEmployees(emps);
                });
            }
        } catch (e: any) { // any 타입 추가
            console.error(e);
            // 에러 메시지 표시 강화
            if (e.response && e.response.status === 403) {
                alert('권한이 없어 작업을 완료할 수 없습니다. (403 Forbidden)');
            } else {
                alert('저장 실패: ' + (e.message || '알 수 없는 오류가 발생했습니다.'));
            }
        }
    };

    // --- Computed: Check for Unsaved Changes ---
    const hasUnsavedChanges = useMemo(() => {
        if (!selectedRole) return false;

        const isSuperAdmin = selectedRole.role_code === 'SUPER_ADMIN';

        // 0. Check applying_to_all Changes
        if (applyingToAll !== (selectedRole.applying_to_all || false)) {
            return true;
        }

        // 1. Check Permission Changes
        let permissionsChanged = false;

        // 모든 역할의 경우
        const currentAssignedPerms = new Set<number>();
        Array.from(pendingPermissionIds).forEach(id => currentAssignedPerms.add(id));
        // 가상 노드 중 선택된 것이 있다면 변경사항으로 간주
        if (selectedVirtualNodes.size > 0) permissionsChanged = true;

        const originalAssignedPermsInDb = new Set(selectedRole.permissions.map(p => p.permission_id));

        if (originalAssignedPermsInDb.size !== currentAssignedPerms.size) {
            permissionsChanged = true;
        } else {
            for (const permId of originalAssignedPermsInDb) {
                if (!currentAssignedPerms.has(permId)) {
                    permissionsChanged = true;
                    break;
                }
            }
        }

        if (permissionsChanged) return true;

        // 2. Check Employee Changes
        const originalEmpIds = new Set(initialAssignedEmployees.map(e => e.id));
        const currentEmpIds = new Set(assignedEmployees.map(e => e.id));
        
        if (originalEmpIds.size !== currentEmpIds.size) return true;
        for (const id of originalEmpIds) {
            if (!currentEmpIds.has(id)) return true;
        }
        for (const id of currentEmpIds) {
            if (!originalEmpIds.has(id)) return true;
        }

        return false;
    }, [selectedRole, pendingPermissionIds, selectedVirtualNodes, initialAssignedEmployees, assignedEmployees, tree, orphans, applyingToAll]);


    // --- Sub-Permission CRUD Handlers ---
    const openPermModal = (type: PermissionType = 'PAGE', parentId: string = '', perm?: Permission) => {
        if (perm) {
            const info = parsePermissionCode(perm.permission_code);
            setEditingPermId(perm.permission_id);
            setPermForm({
                name: perm.permission_name,
                code: info.id,
                type: info.type === 'UNKNOWN' ? 'PAGE' : info.type,
                resourceType: perm.resource_type,
                actionType: perm.action_type,
                description: perm.description || '',
                parentId: info.parentId || ''
            });
        } else {
            setEditingPermId(null);
            setPermForm({
                name: '',
                code: '',
                type: type,
                resourceType: type === 'PAGE' ? 'PAGE' : (type === 'SECTION' ? 'SECTION' : 'DATA'),
                actionType: type === 'PAGE' || type === 'SECTION' ? 'VIEW' : '',
                description: '',
                parentId: parentId
            });
        }
        setIsPermModalOpen(true);
    };

    const handleSavePermission = async () => {
        try {
            let fullCode = permForm.code;
            if (permForm.type === 'PAGE') {
                fullCode = `page:${permForm.code}`;
            } else if (permForm.type === 'SECTION') {
                fullCode = `section:${permForm.parentId}:${permForm.code}`;
            } else if (permForm.type === 'ACTION') {
                fullCode = `action:${permForm.parentId}:${permForm.code}`;
            }

            const payload: PermissionCreate = {
                permission_name: permForm.name,
                permission_code: fullCode,
                resource_type: permForm.resourceType,
                action_type: permForm.actionType,
                description: permForm.description
            };

            if (editingPermId) {
                await roleService.updatePermission(editingPermId, payload);
            } else {
                await roleService.createPermission(payload);
            }
            
            const perms = await roleService.getAllPermissions();
            setPermissions(perms);
            setIsPermModalOpen(false);
        } catch (e) {
            console.error(e);
            alert('권한 저장 실패');
        }
    };

    const handleDeletePermission = async (id: number) => {
        if (!confirm('권한을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
        try {
            await roleService.deletePermission(id);
            setPermissions(prev => prev.filter(p => p.permission_id !== id));
        } catch (e) {
            console.error(e);
            alert('삭제 실패');
        }
    };

    const handleRemoveEmployee = (empId: number) => {
        setAssignedEmployees(prev => prev.filter(e => e.id !== empId));
    };

    return (
        <div className="rbac-builder-container">
            
            {/* Top Header Area (No CRUD, just title) */}
            <div className="rbac-layout-bottom-header" style={{marginTop: '20px'}}>
                <h2>역할 및 접근 권한 관리</h2>
                <p>왼쪽에서 역할을 선택하고, 오른쪽에서 메뉴별 접근 권한을 설정하세요.</p>
            </div>

            <div className="rbac-layout">
                {/* Left Sidebar: Role List */}
                <div className="role-sidebar">
                    <div className="sidebar-header">
                        <h3>역할 목록</h3>
                        <button onClick={() => { setIsRoleEditing(false); setRoleForm({name:'', code:''}); setSelectedRole(null); }}>
                            + 새 역할
                        </button>
                    </div>
                    
                    {(!selectedRole || isRoleEditing) && (
                         <div className="role-mini-form">
                            <input 
                                placeholder="역할명" 
                                value={roleForm.name} 
                                onChange={e => setRoleForm({...roleForm, name: e.target.value})} 
                            />
                            <input 
                                placeholder="코드 (예: ROLE_ADMIN)" 
                                value={roleForm.code} 
                                onChange={e => setRoleForm({...roleForm, code: e.target.value})} 
                            />
                            <div className="form-actions">
                                <button onClick={handleSaveRole}>저장</button>
                                {isRoleEditing && <button onClick={() => setIsRoleEditing(false)}>취소</button>}
                            </div>
                         </div>
                    )}

                    <ul className="role-list">
                        {roles.map(role => (
                            <li 
                                key={role.role_id} 
                                className={selectedRole?.role_id === role.role_id ? 'active' : ''}
                                onClick={() => {
                                    setSelectedRole(role);
                                    setRoleForm({ name: role.role_name, code: role.role_code, id: role.role_id });
                                    setIsRoleEditing(false);
                                }}
                            >
                                <div className="role-info">
                                    <span className="role-name">{role.role_name}</span>
                                    <span className="role-code">{role.role_code}</span>
                                </div>
                                <div className="role-actions">
                                    <button className="icon-btn edit" onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedRole(role);
                                        setRoleForm({ name: role.role_name, code: role.role_code, id: role.role_id });
                                        setIsRoleEditing(true);
                                    }}>✎</button>
                                    <button className="icon-btn delete" onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteRole(role.role_id);
                                    }}>×</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main Content: Permissions Tree */}
                <div className="permission-content">
                    <div className="content-header">
                        <h2>{selectedRole ? `${selectedRole.role_name} 권한 설정` : '역할을 선택해주세요'}</h2>
                        {selectedRole && (
                            <div className="header-actions">
                                <button className="btn-primary" onClick={handleSaveAssignments} disabled={!hasUnsavedChanges}>변경사항 저장</button>
                            </div>
                        )}
                    </div>

                    {selectedRole ? (
                        <div className="permission-tree-container">
                            {/* Pages Tree (Sync with Nav) */}
                            {tree.map(pageNode => {
                                const isPageChecked = pageNode.isVirtual 
                                    ? selectedVirtualNodes.has(pageNode.id)
                                    : pendingPermissionIds.has(pageNode.permission.permission_id);

                                return (
                                    <div key={pageNode.id} className={`tree-node page-node ${pageNode.isVirtual ? 'virtual' : ''}`}>
                                        <div className="node-header">
                                            <label>
                                                <input 
                                                    type="checkbox" 
                                                    checked={isPageChecked}
                                                    onChange={(e) => togglePermission(pageNode, e.target.checked)}
                                                    
                                                />
                                                <span className="node-title">{pageNode.permission.permission_name}</span>
                                                {pageNode.isVirtual && <span className="badge-new">New (미등록)</span>}
                                                <span className="node-code">({pageNode.id})</span>
                                            </label>
                                            
                                            {/* 섹션/기능 추가는 DB에 저장된 페이지에 대해서만 가능 */}
                                            {!pageNode.isVirtual && (
                                                <div className="node-actions">
                                                    <button onClick={() => openPermModal('SECTION', pageNode.id)}>+ 섹션</button>
                                                    <button onClick={() => openPermModal('ACTION', pageNode.id)}>+ 기능</button>
                                                    {/* 페이지 삭제는 자동 동기화이므로 숨김 or DB 삭제만 허용 */}
                                                    <button className="icon-btn delete" onClick={() => handleDeletePermission(pageNode.permission.permission_id)}>×</button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="node-children">
                                            {pageNode.children.length > 0 ? (
                                                <div className="children-grid">
                                                     {pageNode.children.map(child => (
                                                         <div key={child.permission.permission_id} className={`child-node ${child.type.toLowerCase()}-node`}>
                                                             <label>
                                                                 <input 
                                                                    type="checkbox"
                                                                    checked={pendingPermissionIds.has(child.permission.permission_id)}
                                                                    onChange={(e) => togglePermission(child, e.target.checked)}
                                                                    
                                                                 />
                                                                 <span className="child-type-badge">{child.type === 'SECTION' ? 'S' : 'A'}</span>
                                                                 <span>{child.permission.permission_name}</span>
                                                             </label>
                                                             <div className="child-actions">
                                                                <button className="icon-btn" onClick={() => openPermModal(child.type, pageNode.id, child.permission)}>✎</button>
                                                                <button className="icon-btn delete" onClick={() => handleDeletePermission(child.permission.permission_id)}>×</button>
                                                             </div>
                                                         </div>
                                                     ))}
                                                </div>
                                            ) : (
                                                <div className="empty-children">
                                                    {!pageNode.isVirtual ? '하위 권한 없음' : '권한 저장 후 섹션/기능을 추가할 수 있습니다.'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Orphans (Legacy) */}
                            {orphans.length > 0 && (
                                <div className="tree-node orphan-node">
                                    <div className="node-header orphan-header">
                                        <span className="node-title">미분류 / 기타 권한</span>
                                    </div>
                                    <div className="node-children children-grid">
                                        {orphans.map(perm => (
                                            <div key={perm.permission_id} className="child-node unknown-node">
                                                <label>
                                                    <input 
                                                        type="checkbox"
                                                        checked={pendingPermissionIds.has(perm.permission_id)}
                                                        onChange={(e) => togglePermission({permission: perm, type: 'UNKNOWN', id: '', children: []}, e.target.checked)}
                                                        
                                                    />
                                                    <span>{perm.permission_name}</span>
                                                    <span className="node-code">({perm.permission_code})</span>
                                                </label>
                                                <div className="child-actions">
                                                    <button className="icon-btn delete" onClick={() => handleDeletePermission(perm.permission_id)}>×</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Role Members */}
                            <div className="role-members-section">
                                <div className="section-header">
                                    <h3>멤버 관리 ({applyingToAll ? '모든 직원' : assignedEmployees.length})</h3>
                                    {!applyingToAll && <button onClick={() => setIsEmployeeModalOpen(true)}>+ 멤버 추가</button>}
                                </div>

                                {/* 모든 직원에게 적용 체크박스 */}
                                <div className="applying-to-all-checkbox" style={{ marginBottom: '1rem', padding: '0.75rem', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={applyingToAll}
                                            onChange={(e) => setApplyingToAll(e.target.checked)}
                                            style={{ marginRight: '0.5rem' }}
                                        />
                                        <span style={{ fontWeight: 500 }}>모든 직원에게 적용</span>
                                        <span style={{ marginLeft: '0.5rem', fontSize: '0.85rem', color: '#666' }}>
                                            (체크 시 모든 직원이 자동으로 이 역할을 부여받습니다)
                                        </span>
                                    </label>
                                </div>

                                {!applyingToAll && (
                                    <div className="members-list">
                                        {assignedEmployees.map(emp => {
                                            const deptInfo = [emp.division, emp.team].filter(Boolean).join(' ');
                                            return (
                                                <div key={emp.id} className="member-chip">
                                                    <span>
                                                        {emp.name} | {emp.position || '-'} | {deptInfo || '-'}
                                                    </span>
                                                    <button onClick={() => handleRemoveEmployee(emp.id)}>×</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {applyingToAll && (
                                    <div className="members-list" style={{ padding: '1rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
                                        모든 직원이 이 역할을 부여받습니다.
                                    </div>
                                )}
                            </div>

                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>왼쪽 목록에서 역할을 선택하여 권한을 관리하세요.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Sub-Permission Modal */}
            {isPermModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content permission-modal">
                        <h3>{editingPermId ? '권한 수정' : '하위 권한 추가'}</h3>
                        <div className="form-group">
                            <label>유형</label>
                            <select 
                                value={permForm.type} 
                                disabled 
                                onChange={e => setPermForm({...permForm, type: e.target.value as PermissionType})}
                            >
                                <option value="SECTION">섹션 (Section)</option>
                                <option value="ACTION">기능 (Action)</option>
                            </select>
                        </div>
                        
                        <div className="form-group">
                            <label>상위 페이지 ID</label>
                            <input value={permForm.parentId} disabled readOnly />
                        </div>

                        <div className="form-group">
                            <label>권한명</label>
                            <input 
                                placeholder="예: 급여 정보 보기, 엑셀 다운로드" 
                                value={permForm.name} 
                                onChange={e => setPermForm({...permForm, name: e.target.value})}
                            />
                        </div>

                        <div className="form-group">
                            <label>식별 ID (Code)</label>
                            <div className="input-group">
                                <span className="prefix">
                                    {permForm.type === 'SECTION' ? `section:${permForm.parentId}:` : 
                                     permForm.type === 'ACTION' ? `action:${permForm.parentId}:` : ''}
                                </span>
                                <input 
                                    placeholder="view_salary" 
                                    value={permForm.code} 
                                    onChange={e => setPermForm({...permForm, code: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>설명</label>
                            <textarea 
                                value={permForm.description} 
                                onChange={e => setPermForm({...permForm, description: e.target.value})}
                            />
                        </div>

                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setIsPermModalOpen(false)}>취소</button>
                            <button className="btn-primary" onClick={handleSavePermission}>저장</button>
                        </div>
                    </div>
                </div>
            )}

            {isEmployeeModalOpen && (
                <EmployeeSearchModal
                    onClose={() => setIsEmployeeModalOpen(false)}
                    onSelect={(emps) => {
                        setAssignedEmployees(prev => {
                            const existing = new Set(prev.map(e => e.id));
                            const newEmps = emps.filter(e => !existing.has(e.id));
                            return [...prev, ...newEmps];
                        });
                        setIsEmployeeModalOpen(false);
                    }}
                    initialSelected={assignedEmployees}
                />
            )}
        </div>
    );
};

export default RbacBuilder;