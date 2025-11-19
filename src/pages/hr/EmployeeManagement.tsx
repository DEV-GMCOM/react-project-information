
import React, { useState, useEffect } from 'react';
import { employeeService } from '../../api/services/employeeService';
import { Employee, Department } from '../../api/types';
import '../../styles/EmployeeList.css'; // Reusing styles from EmployeeList

const EmployeeManagement: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // Department Management State
    const [newDepartmentName, setNewDepartmentName] = useState('');
    const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

    // Employee Editing State
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<number | ''>();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [emps, depts] = await Promise.all([
                employeeService.getEmployees(),
                employeeService.getAllDepartments(),
            ]);
            setEmployees(emps);
            setDepartments(depts);
        } catch (error) {
            console.error("Failed to fetch data:", error);
        } finally {
            setLoading(false);
        }
    };

    // Department CRUD Handlers
    const handleCreateDepartment = async () => {
        if (!newDepartmentName.trim()) {
            alert("부서명을 입력해주세요.");
            return;
        }
        try {
            const newDept = await employeeService.createDepartment({ name: newDepartmentName });
            setDepartments([...departments, newDept]);
            setNewDepartmentName('');
        } catch (error) {
            console.error("Failed to create department:", error);
        }
    };

    const handleUpdateDepartment = async () => {
        if (!editingDepartment || !editingDepartment.name.trim()) {
            alert("부서명을 입력해주세요.");
            return;
        }
        try {
            const updatedDept = await employeeService.updateDepartment(editingDepartment.id, { name: editingDepartment.name });
            setDepartments(departments.map(d => d.id === updatedDept.id ? updatedDept : d));
            setEditingDepartment(null);
        } catch (error) {
            console.error("Failed to update department:", error);
        }
    };

    const handleDeleteDepartment = async (id: number) => {
        if (window.confirm("정말로 이 부서를 삭제하시겠습니까?")) {
            try {
                await employeeService.deleteDepartment(id);
                setDepartments(departments.filter(d => d.id !== id));
            } catch (error) {
                console.error("Failed to delete department:", error);
            }
        }
    };

    // Employee Edit Handlers
    const handleEditEmployee = (employee: Employee) => {
        setEditingEmployee(employee);
        setSelectedDepartment(employee.department?.id || '');
    };

    const handleUpdateEmployeeDepartment = async () => {
        if (!editingEmployee || selectedDepartment === '') {
            return;
        }
        try {
            // Assuming employeeService has an update method
            const updatedEmployee = await employeeService.updateEmployee(editingEmployee.id, { department_id: selectedDepartment as number });
            setEmployees(employees.map(e => e.id === updatedEmployee.id ? updatedEmployee : e));
            setEditingEmployee(null);
            setSelectedDepartment('');
        } catch (error) {
            console.error("Failed to update employee department:", error);
        }
    };


    if (loading) {
        return <div>로딩 중...</div>;
    }

    return (
        <div className="employee-list-container">
            <h1>직원 정보 관리</h1>

            <div className="section-container">
                <h2>전사 부서 조직 구성</h2>
                <div className="add-item-form">
                    <input
                        type="text"
                        value={newDepartmentName}
                        onChange={(e) => setNewDepartmentName(e.target.value)}
                        placeholder="새 부서명"
                    />
                    <button onClick={handleCreateDepartment}>부서 추가</button>
                </div>
                <ul className="department-list">
                    {departments.map(dept => (
                        <li key={dept.id}>
                            {editingDepartment && editingDepartment.id === dept.id ? (
                                <>
                                    <input
                                        type="text"
                                        value={editingDepartment.name}
                                        onChange={(e) => setEditingDepartment({ ...editingDepartment, name: e.target.value })}
                                    />
                                    <button onClick={handleUpdateDepartment}>저장</button>
                                    <button onClick={() => setEditingDepartment(null)}>취소</button>
                                </>
                            ) : (
                                <>
                                    <span>{dept.name}</span>
                                    <div>
                                        <button onClick={() => setEditingDepartment(dept)}>수정</button>
                                        <button onClick={() => handleDeleteDepartment(dept.id)}>삭제</button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            <div className="section-container">
                <h2>직원 목록</h2>
                <table className="employee-table">
                    <thead>
                        <tr>
                            <th>이름</th>
                            <th>부서</th>
                            <th>직급</th>
                            <th>수정</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id}>
                                <td>{emp.name}</td>
                                <td>
                                    {editingEmployee && editingEmployee.id === emp.id ? (
                                        <select
                                            value={selectedDepartment}
                                            onChange={(e) => setSelectedDepartment(Number(e.target.value))}
                                        >
                                            <option value="">부서 선택</option>
                                            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    ) : (
                                        emp.department?.name || '미지정'
                                    )}
                                </td>
                                <td>{emp.position || '미지정'}</td>
                                <td>
                                    {editingEmployee && editingEmployee.id === emp.id ? (
                                        <>
                                            <button onClick={handleUpdateEmployeeDepartment}>저장</button>
                                            <button onClick={() => setEditingEmployee(null)}>취소</button>
                                        </>
                                    ) : (
                                        <button onClick={() => handleEditEmployee(emp)}>부서 수정</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EmployeeManagement;
