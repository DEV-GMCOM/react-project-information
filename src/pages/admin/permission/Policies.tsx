// src/admin/permission/Policies.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { employeeService } from '../../../api/services/employeeService';
import { roleService } from '../../../api/services/roleService';
import { Employee, Role, Permission } from '../../../api/types'; // Employee, Role, Permission 타입 임포트
import '../../../styles/Policies.css'; // 기존 스타일

// 권한 편집 모달 컴포넌트
interface PermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
    employee: Employee | null;
    allRoles: Role[];
    onSave: (employeeId: number, newRoleId: number) => void;
    currentRole?: Role; // 현재 할당된 역할
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
        if (selectedRoleId !== undefined) {
            onSave(employee.emp_id, selectedRoleId);
        }
        onClose();
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
                    <p><strong>부서:</strong> {employee.department || 'N/A'}</p>
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
                                    {/* 직접적인 권한 플래그 표시 */}
                                    <li><strong>재무 정보 조회:</strong> {displayRole.can_view_finance ? '허용' : '불가'}</li>
                                    <li><strong>재무 정보 편집:</strong> {displayRole.can_edit_finance ? '허용' : '불가'}</li>
                                    {/* 상세 권한 목록 표시 */}
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
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [allRoles, setAllRoles] = useState<Role[]>([]);
    const [showPermissionModal, setShowPermissionModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [selectedEmployeeRole, setSelectedEmployeeRole] = useState<Role | undefined>(undefined);

    const fetchEmployees = useCallback(async () => {
        try {
            // 백엔드에서 역할 정보를 포함하여 직원 목록을 가져옵니다.
            const fetchedEmployees = await employeeService.getEmployees();
            setEmployees(fetchedEmployees);
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
        fetchEmployees();
        fetchAllRoles();
    }, [fetchEmployees, fetchAllRoles]);

    const handleEditPermissions = (employee: Employee) => {
        setSelectedEmployee(employee);
        // getEmployees에서 이미 역할 정보를 가져왔으므로, 추가 API 호출이 필요 없습니다.
        setSelectedEmployeeRole(employee.role);
        setShowPermissionModal(true);
    };

    const handleSavePermissions = async (employeeId: number, newRoleId: number) => {
        try {
            await roleService.updateEmployeeRole(employeeId, newRoleId); // roleId 직접 전달
            alert("역할이 성공적으로 업데이트되었습니다.");
            fetchEmployees(); // 목록 새로고침
        } catch (error) {
            console.error("역할 업데이트 중 오류 발생:", error);
            alert("역할 업데이트에 실패했습니다.");
        }
    };

    return (
        <div className="policies-container">
            <div className="policies-header">
                <div>
                    <h1 className="policies-title">권한 관리</h1>
                </div>
                <div className="policies-logo">GMCOM</div>
            </div>

            <div className="policies-main">
                <div className="policies-title-section">
                    <h2 className="policies-subtitle">직원 역할 및 권한 설정</h2>
                </div>

                <div className="policies-section">
                    <h3 className="section-header">■ 직원 목록</h3>
                    <div className="table-action-section">
                        {/* TODO: 검색/필터링 UI 추가 */}
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
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} style={{ textAlign: 'center' }}>직원 정보가 없습니다.</td>
                                    </tr>
                                ) : (
                                    employees.map(emp => (
                                        <tr key={emp.emp_id}>
                                            <td>{emp.employee_id}</td>
                                            <td>{emp.name}</td>
                                            <td>{emp.department || 'N/A'}</td>
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