import React, { useState, useEffect, useMemo } from 'react';
import { roleService } from '../../../api/services/roleService';
import { Employee, Role, Permission, RoleCreate, RoleUpdate, PermissionCreate, PermissionUpdate } from '../../../api/types';
import EmployeeSearchModal from '../../../components/meeting/EmployeeSearchModal';
import '../../../styles/RbacBuilder.css';
import { useAuth } from '../../../contexts/AuthContext';

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

// --- Nav Menu Data (Mirrored from Layout.tsx) ---
interface MenuItem {
    path: string;
    name: string;
    subMenus?: { path: string; name: string }[];
}

const NAV_MENUS: MenuItem[] = [
    {
        path: '/information',
        name: '기본정보',
        subMenus: [
            { path: '/info-management/advertiser', name: '기업 / 광고주 ( 담당자 )' },
            { path: '/info-management/project', name: '프로젝트 프로파일' }
        ]
    },
    { path: '/project-kickoff', name: '프로젝트 착수서' },
    { path: '/pt-checklist', name: 'PT 전 체크' },
    { path: '/pt-postmortem', name: 'PT 결과분석' },
    { path: '/project-execution', name: '프로젝트 실행파일링' },
    { path: '/project-postmortem', name: '프로젝트 결과분석' },
    { path: '/working/meeting-minutes', name: '자동 회의록' },
    { path: '/admin/permission', name: '권한 관리' },
    // Dev Menus
    { path: '/hr/employee-management', name: '직원정보 관리' },
    { path: '/working/fms', name: 'GMCOM 저장소' },
    { path: '/working/clock-in-out', name: '출퇴근 체크' },
    { path: '/sales/schedule', name: '영업스케쥴' },
    { path: '/working/scheduling', name: '스케쥴링' },
];

// Flatten menu for easy lookup
const FLATTENED_MENUS = NAV_MENUS.reduce<{path: string, name: string}[]>((acc, item) => {
    if (item.subMenus) {
        // 상위 메뉴도 포함 (필요 시)
        acc.push({ path: item.path, name: item.name });
        item.subMenus.forEach(sub => acc.push({ path: sub.path, name: sub.name }));
    } else {
        acc.push({ path: item.path, name: item.name });
    }
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

    const { user } = useAuth(); // Auth Context 가져오기

    // --- Computed ---
    const { tree, orphans } = useMemo(() => buildPermissionTree(permissions), [permissions]);

    // --- Data Fetching ---
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (selectedRole) {
            const isSuperAdmin = selectedRole.role_code === 'SUPER_ADMIN'; 
            
            if (isSuperAdmin) {
                const allPermsForSuperAdmin = new Set<number>();
                const allVirtualPageIdsForSuperAdmin = new Set<string>();

                tree.forEach(pageNode => {
                    if (!pageNode.isVirtual) {
                        allPermsForSuperAdmin.add(pageNode.permission.permission_id);
                    } else {
                        allVirtualPageIdsForSuperAdmin.add(pageNode.id);
                    }
                    pageNode.children.forEach(child => {
                        allPermsForSuperAdmin.add(child.permission.permission_id);
                    });
                });
                orphans.forEach(orphanPerm => allPermsForSuperAdmin.add(orphanPerm.permission_id));
                
                setPendingPermissionIds(allPermsForSuperAdmin);
                setSelectedVirtualNodes(allVirtualPageIdsForSuperAdmin);

            } else {
                setPendingPermissionIds(new Set(selectedRole.permissions.map(p => p.permission_id)));
                setSelectedVirtualNodes(new Set()); 
            }

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
        // Super Admin은 권한 변경 불가
        if (selectedRole && selectedRole.role_code === 'SUPER_ADMIN') {
            return;
        }

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

        // --- [추가] 자가 삭제 방지 로직 ---
        // 사용자가 자기 자신의 계정을 SUPER_ADMIN에서 제거하려는지 확인
        const currentIds = new Set(assignedEmployees.map(e => e.id));
        const initialIds = new Set(initialAssignedEmployees.map(e => e.id));
        const toRemove = initialAssignedEmployees.filter(e => !currentIds.has(e.id)).map(e => e.id);

        if (isSuperAdmin && user && toRemove.includes(user.emp_id)) {
            alert("자신의 계정을 최고 관리자(Super Admin) 역할에서 제거할 수 없습니다.");
            // UI 복구 (제거된 본인을 다시 추가)
            const me = initialAssignedEmployees.find(e => e.id === user.emp_id);
            if (me) {
                setAssignedEmployees(prev => [...prev, me]);
            }
            return;
        }
        // -----------------------------------

        try {
            // 0. Create Virtual Permissions First
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
            if (isSuperAdmin) {
                // Super Admin인 경우 모든 권한 (DB + 가상)을 최종 권한으로 설정
                const allPermIdsForSuperAdmin = new Set<number>();
                tree.forEach(pageNode => {
                    if (!pageNode.isVirtual) {
                        allPermIdsForSuperAdmin.add(pageNode.permission.permission_id);
                    }
                    pageNode.children.forEach(child => {
                        allPermIdsForSuperAdmin.add(child.permission.permission_id);
                    });
                });
                orphans.forEach(orphanPerm => allPermIdsForSuperAdmin.add(orphanPerm.permission_id));
                finalPermissionIds = Array.from(allPermIdsForSuperAdmin);
            }
            finalPermissionIds = [...finalPermissionIds, ...createdPermissionIds];


            await roleService.updateRolePermissions(selectedRole.role_id, finalPermissionIds);
            
            setPendingPermissionIds(new Set(finalPermissionIds)); // Save state

            // 2. Save Employees (Diffing)
            // const currentIds = new Set(assignedEmployees.map(e => e.id)); // 위에서 정의함
            // const initialIds = new Set(initialAssignedEmployees.map(e => e.id)); // 위에서 정의함
            const toAdd = assignedEmployees.filter(e => !initialIds.has(e.id)).map(e => e.id);
            // const toRemove = initialAssignedEmployees.filter(e => !currentIds.has(e.id)).map(e => e.id); // 위에서 정의함

            if (toAdd.length > 0) await roleService.assignRoleToEmployeesBatch(selectedRole.role_id, toAdd);
            if (toRemove.length > 0) await Promise.all(toRemove.map(id => roleService.unassignRoleFromEmployee(id)));
            
            alert('저장되었습니다.');
            
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

        // 1. Check Permission Changes
        let permissionsChanged = false;

        // Super Admin의 경우, 모든 권한이 할당되어야 하므로 이를 기준으로 비교
        if (isSuperAdmin) {
            const allDesiredPermsFromTree = new Set<number>();
            const allDesiredVirtualPageIds = new Set<string>();

            tree.forEach(node => {
                if (!node.isVirtual) { // 실제 DB에 있는 권한만 포함 (가상 노드의 임시 ID는 제외)
                    allDesiredPermsFromTree.add(node.permission.permission_id);
                } else { // 가상 노드는 ID로 추적
                    allDesiredVirtualPageIds.add(node.id);
                }
                node.children.forEach(child => allDesiredPermsFromTree.add(child.permission.permission_id));
            });
            orphans.forEach(orphan => allDesiredPermsFromTree.add(orphan.permission_id));

            // 현재 DB에 저장된 super_admin의 권한 ID 목록
            const originalAssignedPermIdsInDb = new Set(selectedRole.permissions.map(p => p.permission_id));
            
            // 모든 desired DB 권한이 원래 할당되어 있는지 확인
            if (allDesiredPermsFromTree.size !== originalAssignedPermIdsInDb.size) {
                permissionsChanged = true;
            } else {
                for (const permId of allDesiredPermsFromTree) {
                    if (!originalAssignedPermIdsInDb.has(permId)) {
                        permissionsChanged = true;
                        break;
                    }
                }
            }

            // 모든 desired 가상 페이지가 실제로 DB에 생성되어 할당되었는지 확인
            // (즉, selectedVirtualNodes에 아직 남아있는 가상 페이지가 있다면 변경사항)
            // selectedVirtualNodes는 useEffect에서 모든 가상 노드로 채워지고, 저장을 통해 비워져야 한다.
            if (selectedVirtualNodes.size > 0) { 
                permissionsChanged = true;
            }

        } else { // 일반 역할의 경우
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
    }, [selectedRole, pendingPermissionIds, selectedVirtualNodes, initialAssignedEmployees, assignedEmployees, tree, orphans]);


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
                <p>왼쪽에서 역할을 선택하고, 오른쪽에서 메뉴별 접근 권한을 설정하세요. (Super Admin은 모든 접근이 가능합니다)</p>
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
                                                    disabled={selectedRole?.role_code === 'SUPER_ADMIN'}
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
                                                                    disabled={selectedRole?.role_code === 'SUPER_ADMIN'}
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
                                                        disabled={selectedRole?.role_code === 'SUPER_ADMIN'}
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
                                    <h3>멤버 관리 ({assignedEmployees.length})</h3>
                                    <button onClick={() => setIsEmployeeModalOpen(true)}>+ 멤버 추가</button>
                                </div>
                                <div className="members-list">
                                    {assignedEmployees.map(emp => (
                                        <div key={emp.id} className="member-chip">
                                            {emp.name}
                                            <button onClick={() => handleRemoveEmployee(emp.id)}>×</button>
                                        </div>
                                    ))}
                                </div>
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