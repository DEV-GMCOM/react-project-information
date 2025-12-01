// src/admin/permission/Policies.tsx

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { employeeService } from '../../../api/services/employeeService';
import { roleService } from '../../../api/services/roleService';
import { Employee, Role } from '../../../api/types';
import { useAuth } from '../../../contexts/AuthContext';
import '../../../styles/Policies.css';

interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    allRoles: Role[];
    onSave: (employeeId: number, newRoleId: number) => void;
    currentRole?: Role;
}

const PermissionModal: React.FC<PermissionModalProps> = ({
    isOpen,
    onClose,
    employee,
    allRoles,
    onSave,
    currentRole
}) => {
    const [selectedRoleId, setSelectedRoleId] = useState<number | undefined>(currentRole?.role_id);
    const [displayRole, setDisplayRole] = useState<Role | undefined>(currentRole);

    useEffect(() => {
        setSelectedRoleId(currentRole?.role_id);
        setDisplayRole(currentRole);
    }, [currentRole]);

    useEffect(() => {
        if (selectedRoleId) {
            setDisplayRole(allRoles.find(r => r.role_id === selectedRoleId));
        } else {
            setDisplayRole(undefined);
        }
    }, [selectedRoleId, allRoles]);

    if (!isOpen || !employee) return null;

    const handleSave = () => {
        if (selectedRoleId) {
            onSave(employee.emp_id, selectedRoleId);
            onClose();
        } else {
            // 선택된 역할이 없을 때 아무것도 하지 않음 (또는 alert 등 추가 가능)
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{employee.name} 님의 권한 편집</h3>
                    <button onClick={onClose} className="modal-close-btn">&times;</button>
                </div>
                <div className="modal-body">
                    <p><strong>사원번호:</strong> {employee.employee_id}</p>
                    <p><strong>부서:</strong> {employee.department?.name || 'N/A'}</p>
                    <p><strong>직급:</strong> {employee.position || 'N/A'}</p>
                    <p><strong>이메일:</strong> {employee.email || 'N/A'}</p>

                    <h4 style={{ marginTop: '20px' }}>역할 할당</h4>
                    <select
                        value={selectedRoleId || ''}
                        onChange={(e) => setSelectedRoleId(Number(e.target.value))}
                        className="policies-select"
                    >
                        <option value="">역할 선택</option>
                        {allRoles.map(role => (
                            <option key={role.role_id} value={role.role_id}>
                                {role.role_name} ({role.role_code})
                            </option>
                        ))}
                    </select>

                    {displayRole && (
                        <div style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                            <h4>선택된 역할 권한: {displayRole.role_name}</h4>
                            {displayRole.permissions && displayRole.permissions.length > 0 ? (
                                <ul className="permission-list">
                                    <li><strong>재무 정보 조회:</strong> {displayRole.can_view_finance ? '허용' : '불가'}</li>
                                    <li><strong>재무 정보 편집:</strong> {displayRole.can_edit_finance ? '허용' : '불가'}</li>
                                    {displayRole.permissions.map(perm => (
                                        <li key={perm.permission_id}>
                                            <strong>{perm.permission_name}</strong> ({perm.resource_type} - {perm.action_type})
                                            {perm.description && `: ${perm.description}`}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p>할당된 권한이 없습니다.</p>
                            )}
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn-primary" onClick={handleSave}>저장</button>
                    <button className="btn-secondary" onClick={onClose}>취소</button>
                </div>
            </div>
        </div>
    );
};

const Policies: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedEmployeeRole, setSelectedEmployeeRole] = useState<Role | undefined>(undefined);

    const MANAGERIAL_POSITIONS = ['팀장', '본부장', '부문장', '부사장'];

    const fetchEmployees = useCallback(async () => {
        try {
            const fetchedEmployees = await employeeService.getEmployees();
            // admin 계정 제외
            const filteredEmployees = fetchedEmployees.filter(emp => emp.employee_id !== 'admin');
            setEmployees(filteredEmployees);
        } catch (error) {
            console.error("직원 목록을 불러오는 중 오류 발생:", error);
        }
    }, []);

    const fetchAllRoles = useCallback(async () => {
        try {
            const fetchedRoles = await roleService.getAllRoles();
            setAllRoles(fetchedRoles);
        } catch (error) {
            console.error("역할 목록을 불러오는 중 오류 발생:", error);
        }
    }, []);

    useEffect(() => {
        const isCurrentUserSuperAdmin = currentUser?.role?.role_code === 'SUPER_ADMIN';
        const isCurrentUserManager = currentUser?.position && MANAGERIAL_POSITIONS.includes(currentUser.position);

        if (isCurrentUserSuperAdmin || isCurrentUserManager) {
            fetchEmployees();
            fetchAllRoles();
        }
    }, [fetchEmployees, fetchAllRoles, currentUser]);

    const handleEditPermissions = (employee: Employee) => {
        setSelectedEmployee(employee);
        setSelectedEmployeeRole(employee.role);
        setShowPermissionModal(true);
    };

    const handleSavePermissions = async (employeeId: number, newRoleId: number) => {
        try {
            await roleService.updateEmployeeRole(employeeId, newRoleId);
            alert("역할이 성공적으로 업데이트되었습니다.");
            fetchEmployees();
        } catch (error) {
            console.error("역할 업데이트 중 오류 발생:", error);
            alert("역할 업데이트에 실패했습니다.");
        }
    };

    const canEditEmployee = useCallback((targetEmployee: Employee): boolean => {
        if (!currentUser || !targetEmployee) return false;
        if (currentUser.emp_id === targetEmployee.emp_id) return false; // 본인 수정 불가

        const isCurrentUserSuperAdmin = currentUser.role?.role_code === 'SUPER_ADMIN';
        if (isCurrentUserSuperAdmin) {
            return true; // 슈퍼 관리자는 본인 제외 모든 직원 수정 가능
        }

        // Division head check: Employee type does not have division info. This check cannot be performed.
        // TODO: Add division to Employee type in backend and frontend to enable this logic.
        // if (currentUser.position && ['본부장', '부문장', '부사장'].includes(currentUser.position)) {
        //     return currentUser.division === targetEmployee.division;
        // }

        if (currentUser.position === '팀장') {
            return currentUser.team === targetEmployee.department;
        }

        return false;
    }, [currentUser]);

    const visibleEmployees = useMemo(() => {
        return employees.filter(canEditEmployee);
    }, [employees, canEditEmployee]);

    const isCurrentUserSuperAdmin = currentUser?.role?.role_code === 'SUPER_ADMIN';
    const isCurrentUserManager = currentUser?.position && MANAGERIAL_POSITIONS.includes(currentUser.position);
    const isCurrentUserAllowed = isCurrentUserSuperAdmin || isCurrentUserManager;

    if (!isCurrentUserAllowed) {
        return (
            <div className="policies-container" style={{ padding: '2rem' }}>
                <h1>접근 권한이 없습니다.</h1>
                <p>이 페이지는 관리자 직책 또는 슈퍼 관리자만 접근할 수 있습니다.</p>
            </div>
        );
    }

    return (
        <div className="policies-container">
            <div className="policies-header">
                <div>
                    <h1 className="policies-title">구성원 역할/권한 설정</h1>
                </div>
                <div className="policies-logo">GMCOM</div>
            </div>

            <div className="policies-main">
                <div className="policies-title-section">
                    <h2 className="policies-subtitle">직원별 역할/권한</h2>
                </div>

                <div className="policies-section">
                    <h3 className="section-header">■ 직원 목록</h3>
                    <div className="table-action-section">
                        <table className="policies-table">
                            <thead>
                                <tr>
                                    <th>사원번호</th>
                                    <th>이름</th>
                                    <th>부서</th>
                                    <th>직급</th>
                                    <th>이메일</th>
                                    <th>현재 역할</th>
                                    <th>액션</th>
                                </tr>
                            </thead>
                            <tbody>
                                {visibleEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center' }}>관리할 수 있는 직원 정보가 없습니다.</td>
                                    </tr>
                                ) : (
                                    visibleEmployees.map(emp => (
                                        <tr key={emp.id}>
                                            <td>{emp.employee_id}</td>
                                            <td>{emp.name}</td>
                                            <td>{emp.department?.name || 'N/A'}</td>
                                            <td>{emp.position || 'N/A'}</td>
                                            <td>{emp.email || 'N/A'}</td>
                                            <td>{emp.role?.role_name || '역할 없음'}</td>
                                            <td>
                                                <button
                                                    className="btn-primary"
                                                    onClick={() => handleEditPermissions(emp)}
                                                >
                                                    권한 편집
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <PermissionModal
                isOpen={showPermissionModal}
                onClose={() => setShowPermissionModal(false)}
                employee={selectedEmployee}
                allRoles={allRoles}
                onSave={handleSavePermissions}
                currentRole={selectedEmployeeRole}
            />
        </div>
    );
};

export default Policies;
