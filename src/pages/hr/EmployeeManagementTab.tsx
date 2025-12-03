// src/pages/hr/EmployeeManagementTab.tsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { apiService } from '../../api';
import type { Employee, EmployeeCreate, EmployeeUpdate } from '../../api/types';

interface Department {
    dept_id: number;
    dept_name: string;
    employee_count: number;
}

const EmployeeManagementTab: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDivision, setFilterDivision] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // 선택된 직원
    const [selectedEmployees, setSelectedEmployees] = useState<number[]>([]);

    // 부서 이동 모달
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [targetDeptName, setTargetDeptName] = useState('');

    // 직원 등록/수정 모달 state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [formData, setFormData] = useState<Partial<EmployeeCreate>>({
        id: '',
        pw: '',
        name: '',
        division: '',
        team: '',
        position: '',
        title: '',
        mobile: '',
        birth: '',
        is_active: true
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const empData = await apiService.getEmployees({ limit: 1000 });
            setEmployees(empData);

            // 부서 목록 로드 시도
            try {
                const deptData = await apiService.getDepartments();
                setDepartments(deptData);
            } catch {
                // 부서 API가 없으면 직원 데이터에서 추출
                const divSet = new Set(empData.map(e => e.division).filter(Boolean));
                const fakeDepts: Department[] = Array.from(divSet).map((name, idx) => ({
                    dept_id: idx + 1,
                    dept_name: name as string,
                    employee_count: empData.filter(e => e.division === name).length
                }));
                setDepartments(fakeDepts);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingEmployee(null);
        setFormData({
            id: '',
            pw: '',
            name: '',
            division: '',
            team: '',
            position: '',
            title: '',
            mobile: '',
            birth: '',
            is_active: true
        });
        setIsModalOpen(true);
    };

    const handleEdit = (emp: Employee) => {
        setEditingEmployee(emp);
        setFormData({
            id: emp.id,
            name: emp.name,
            division: emp.division || '',
            team: emp.team || '',
            position: emp.position || '',
            title: emp.title || '',
            mobile: emp.mobile || '',
            birth: emp.birth || '',
            is_active: emp.is_active
        });
        setIsModalOpen(true);
    };

    // 휴대폰 번호 포맷 검증 (010-1234-5678 형태)
    const validateMobile = (mobile: string): boolean => {
        if (!mobile) return true; // 선택 입력이므로 빈 값 허용
        const mobileRegex = /^01[0-9]-[0-9]{3,4}-[0-9]{4}$/;
        return mobileRegex.test(mobile);
    };

    // 생년월일 포맷 검증 (YYMMDD 6자리)
    const validateBirth = (birth: string): boolean => {
        if (!birth) return true; // 선택 입력이므로 빈 값 허용
        const birthRegex = /^[0-9]{6}$/;
        return birthRegex.test(birth);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 휴대폰 번호 포맷 검증
        if (formData.mobile && !validateMobile(formData.mobile)) {
            alert('휴대폰 번호는 010-1234-5678 형식으로 입력해주세요.');
            return;
        }

        // 생년월일 포맷 검증
        if (formData.birth && !validateBirth(formData.birth)) {
            alert('생년월일은 6자리(YYMMDD)로 입력해주세요. 예: 941004');
            return;
        }

        try {
            if (editingEmployee) {
                const updateData: EmployeeUpdate = {
                    name: formData.name,
                    division: formData.division,
                    team: formData.team,
                    position: formData.position,
                    title: formData.title,
                    mobile: formData.mobile,
                    birth: formData.birth,
                    is_active: formData.is_active
                };
                await apiService.updateEmployee(editingEmployee.emp_id, updateData);
                alert('직원 정보가 수정되었습니다.');
            } else {
                if (!formData.id || !formData.pw || !formData.name) {
                    alert('사번, 비밀번호, 이름은 필수 입력 항목입니다.');
                    return;
                }
                const createData: EmployeeCreate = {
                    id: formData.id!,
                    pw: formData.pw!,
                    name: formData.name!,
                    division: formData.division,
                    team: formData.team,
                    position: formData.position,
                    title: formData.title,
                    mobile: formData.mobile,
                    birth: formData.birth,
                    is_active: true // 항상 재직 상태로 등록
                };
                await apiService.createEmployee(createData);
                alert('새 직원이 등록되었습니다.');
            }

            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            alert(`오류: ${error.response?.data?.detail || error.message}`);
        }
    };

    // 직원 선택 토글
    const toggleEmployeeSelection = (empId: number) => {
        setSelectedEmployees(prev =>
            prev.includes(empId)
                ? prev.filter(id => id !== empId)
                : [...prev, empId]
        );
    };

    // 전체 선택
    const selectAllEmployees = () => {
        if (selectedEmployees.length === filteredEmployees.length) {
            setSelectedEmployees([]);
        } else {
            setSelectedEmployees(filteredEmployees.map(e => e.emp_id));
        }
    };

    // 부서 이동 모달 열기
    const handleOpenMoveModal = () => {
        if (selectedEmployees.length === 0) {
            alert('이동할 직원을 선택해주세요.');
            return;
        }
        setTargetDeptName('');
        setIsMoveModalOpen(true);
    };

    // 부서 이동 실행
    const handleConfirmMove = async () => {
        if (!targetDeptName) {
            alert('이동할 부서를 선택해주세요.');
            return;
        }

        try {
            for (const empId of selectedEmployees) {
                await apiService.updateEmployee(empId, { division: targetDeptName });
            }

            alert(`${selectedEmployees.length}명의 직원이 ${targetDeptName} 부서로 이동되었습니다.`);
            setIsMoveModalOpen(false);
            setSelectedEmployees([]);
            loadData();
        } catch (error: any) {
            alert(`오류: ${error.response?.data?.detail || error.message}`);
        }
    };

    // 필터링된 직원 목록
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch =
            emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDivision = !filterDivision || emp.division === filterDivision;

        const matchesStatus =
            filterStatus === 'all' ||
            (filterStatus === 'active' && emp.is_active) ||
            (filterStatus === 'inactive' && !emp.is_active);

        return matchesSearch && matchesDivision && matchesStatus;
    });

    // 부서 목록 (필터용)
    const divisions = Array.from(new Set(employees.map(e => e.division).filter(Boolean)));

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>직원 목록을 불러오는 중...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>직원 관리</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    {selectedEmployees.length > 0 && (
                        <button
                            onClick={handleOpenMoveModal}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            선택한 직원 부서 이동 ({selectedEmployees.length})
                        </button>
                    )}
                    <button
                        onClick={handleCreate}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        + 직원 등록
                    </button>
                </div>
            </div>

            {/* 검색 및 필터 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <input
                    type="text"
                    placeholder="이름 또는 사번으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <select
                    value={filterDivision}
                    onChange={(e) => setFilterDivision(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '150px' }}
                >
                    <option value="">모든 부서</option>
                    {divisions.map(div => (
                        <option key={div} value={div}>{div}</option>
                    ))}
                </select>
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px', minWidth: '100px' }}
                >
                    <option value="all">전체</option>
                    <option value="active">재직</option>
                    <option value="inactive">퇴사</option>
                </select>
            </div>

            {/* 직원 테이블 */}
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '10px', border: '1px solid #ddd', width: '40px' }}>
                            <input
                                type="checkbox"
                                checked={selectedEmployees.length === filteredEmployees.length && filteredEmployees.length > 0}
                                onChange={selectAllEmployees}
                            />
                        </th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>사번</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>이름</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>부서</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>팀</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>직급</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>직책</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>이메일</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>휴대폰</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>상태</th>
                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>작업</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredEmployees.length === 0 ? (
                        <tr>
                            <td colSpan={11} style={{ textAlign: 'center', padding: '40px' }}>
                                등록된 직원이 없습니다.
                            </td>
                        </tr>
                    ) : (
                        filteredEmployees.map(emp => (
                            <tr key={emp.emp_id}>
                                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedEmployees.includes(emp.emp_id)}
                                        onChange={() => toggleEmployeeSelection(emp.emp_id)}
                                    />
                                </td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.id}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.name}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.division || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.team || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.title || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.position || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.email || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.mobile || '-'}</td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    <span style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        backgroundColor: emp.is_active ? '#d4edda' : '#f8d7da',
                                        color: emp.is_active ? '#155724' : '#721c24'
                                    }}>
                                        {emp.is_active ? '재직' : '퇴사'}
                                    </span>
                                </td>
                                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                    <button
                                        onClick={() => handleEdit(emp)}
                                        style={{ padding: '4px 8px', cursor: 'pointer', border: '1px solid #ddd', borderRadius: '4px', background: 'white' }}
                                    >
                                        수정
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* 부서 이동 모달 - Portal로 body에 렌더링 */}
            {isMoveModalOpen && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }} onClick={() => setIsMoveModalOpen(false)}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '400px', maxWidth: '90%', position: 'relative', zIndex: 100000
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>직원 부서 이동</h3>
                        <p>{selectedEmployees.length}명의 직원을 이동합니다.</p>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이동할 부서 선택</label>
                            <select
                                value={targetDeptName}
                                onChange={(e) => setTargetDeptName(e.target.value)}
                                style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                            >
                                <option value="">부서 선택</option>
                                {departments.map(dept => (
                                    <option key={dept.dept_id} value={dept.dept_name}>
                                        {dept.dept_name} ({dept.employee_count}명)
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={() => setIsMoveModalOpen(false)}
                                style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white' }}
                            >
                                취소
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmMove}
                                style={{ padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                이동
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* 직원 등록/수정 모달 - Portal로 body에 렌더링 */}
            {isModalOpen && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }} onClick={() => setIsModalOpen(false)}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '500px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', zIndex: 100000
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>{editingEmployee ? '직원 정보 수정' : '새 직원 등록'}</h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>사번 *</label>
                                    <input
                                        type="text"
                                        value={formData.id}
                                        onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                                        disabled={!!editingEmployee}
                                        required
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                {!editingEmployee && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>비밀번호 *</label>
                                        <input
                                            type="password"
                                            value={formData.pw}
                                            onChange={(e) => setFormData({ ...formData, pw: e.target.value })}
                                            required
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                )}
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>이름 *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>부서</label>
                                    <select
                                        value={formData.division}
                                        onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    >
                                        <option value="">부서 선택</option>
                                        {departments.map(dept => (
                                            <option key={dept.dept_id} value={dept.dept_name}>
                                                {dept.dept_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>팀</label>
                                    <input
                                        type="text"
                                        value={formData.team}
                                        onChange={(e) => setFormData({ ...formData, team: e.target.value })}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>직급</label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="예: 대리, 과장"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>직책</label>
                                    <input
                                        type="text"
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                                        placeholder="예: 팀장, PM"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>휴대폰</label>
                                    <input
                                        type="tel"
                                        value={formData.mobile}
                                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                                        placeholder="010-1234-5678"
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>생년월일</label>
                                    <input
                                        type="text"
                                        value={formData.birth}
                                        onChange={(e) => setFormData({ ...formData, birth: e.target.value })}
                                        placeholder="YYMMDD (예: 941004)"
                                        maxLength={6}
                                        style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                    />
                                </div>
                                {editingEmployee && (
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>재직 상태</label>
                                        <select
                                            value={formData.is_active ? 'active' : 'inactive'}
                                            onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                                            style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                        >
                                            <option value="active">재직</option>
                                            <option value="inactive">퇴사</option>
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', background: 'white' }}
                                >
                                    취소
                                </button>
                                <button
                                    type="submit"
                                    style={{ padding: '8px 16px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    {editingEmployee ? '수정' : '등록'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default EmployeeManagementTab;
