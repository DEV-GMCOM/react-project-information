// src/pages/hr/DepartmentManagementTab.tsx
import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom';
import { apiService } from '../../api';
import type { Employee } from '../../api/types';

interface Department {
    dept_id: number;
    dept_name: string;
    dept_code: string | null;
    description: string | null;
    parent_dept_id: number | null;
    manager_emp_id: number | null;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    employee_count: number;
    manager_name: string | null;
}

interface DepartmentTreeNode extends Department {
    children: DepartmentTreeNode[];
    level: number;
}

interface DepartmentFormData {
    dept_name: string;
    dept_code: string;
    description: string;
    parent_dept_id: number | null;
    manager_emp_id: number | null;
    sort_order: number;
}

const DepartmentManagementTab: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDept, setSelectedDept] = useState<Department | null>(null);
    const [deptEmployees, setDeptEmployees] = useState<Employee[]>([]);
    const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());

    // 모달 상태
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState<DepartmentFormData>({
        dept_name: '',
        dept_code: '',
        description: '',
        parent_dept_id: null,
        manager_emp_id: null,
        sort_order: 0
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const empData = await apiService.getEmployees({ limit: 1000 });
            setEmployees(empData);

            try {
                const deptData = await apiService.getDepartments();
                setDepartments(deptData);
                // 모든 부서 펼치기
                setExpandedDepts(new Set(deptData.map((d: Department) => d.dept_id)));
            } catch {
                const deptMap = new Map<string, { count: number; employees: Employee[] }>();
                empData.forEach(emp => {
                    const div = emp.division || '미지정';
                    if (!deptMap.has(div)) {
                        deptMap.set(div, { count: 0, employees: [] });
                    }
                    deptMap.get(div)!.count++;
                    deptMap.get(div)!.employees.push(emp);
                });

                const fakeDepts: Department[] = Array.from(deptMap.entries()).map(([name, data], idx) => ({
                    dept_id: idx + 1,
                    dept_name: name,
                    dept_code: null,
                    description: null,
                    parent_dept_id: null,
                    manager_emp_id: null,
                    sort_order: idx,
                    is_active: true,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    employee_count: data.count,
                    manager_name: null
                }));
                setDepartments(fakeDepts);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // 부서를 트리 구조로 변환
    const departmentTree = useMemo((): DepartmentTreeNode[] => {
        const deptMap = new Map<number, DepartmentTreeNode>();

        // 모든 부서를 노드로 변환
        departments.forEach(dept => {
            deptMap.set(dept.dept_id, { ...dept, children: [], level: 0 });
        });

        const roots: DepartmentTreeNode[] = [];

        // 부모-자식 관계 설정
        departments.forEach(dept => {
            const node = deptMap.get(dept.dept_id)!;
            if (dept.parent_dept_id && deptMap.has(dept.parent_dept_id)) {
                const parent = deptMap.get(dept.parent_dept_id)!;
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // 레벨 설정 (재귀)
        const setLevels = (nodes: DepartmentTreeNode[], level: number) => {
            nodes.forEach(node => {
                node.level = level;
                node.children.sort((a, b) => a.sort_order - b.sort_order);
                setLevels(node.children, level + 1);
            });
        };

        roots.sort((a, b) => a.sort_order - b.sort_order);
        setLevels(roots, 0);

        return roots;
    }, [departments]);

    // 트리를 평탄화 (펼침/접기 상태 반영)
    const flattenedDepartments = useMemo((): DepartmentTreeNode[] => {
        const result: DepartmentTreeNode[] = [];

        const traverse = (nodes: DepartmentTreeNode[]) => {
            nodes.forEach(node => {
                result.push(node);
                if (expandedDepts.has(node.dept_id) && node.children.length > 0) {
                    traverse(node.children);
                }
            });
        };

        traverse(departmentTree);
        return result;
    }, [departmentTree, expandedDepts]);

    // 특정 부서의 모든 자식 부서 ID 가져오기
    const getAllChildIds = (deptId: number): number[] => {
        const result: number[] = [];
        const traverse = (nodes: DepartmentTreeNode[]) => {
            nodes.forEach(node => {
                if (node.dept_id === deptId) {
                    const collectChildren = (n: DepartmentTreeNode) => {
                        n.children.forEach(child => {
                            result.push(child.dept_id);
                            collectChildren(child);
                        });
                    };
                    collectChildren(node);
                } else {
                    traverse(node.children);
                }
            });
        };
        traverse(departmentTree);
        return result;
    };

    const toggleExpand = (deptId: number) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptId)) {
                next.delete(deptId);
                // 자식들도 접기
                getAllChildIds(deptId).forEach(id => next.delete(id));
            } else {
                next.add(deptId);
            }
            return next;
        });
    };

    const loadDeptEmployees = (dept: Department) => {
        setSelectedDept(dept);
        // 해당 부서와 하위 부서의 모든 직원
        const deptNames = new Set<string>([dept.dept_name]);
        getAllChildIds(dept.dept_id).forEach(id => {
            const childDept = departments.find(d => d.dept_id === id);
            if (childDept) deptNames.add(childDept.dept_name);
        });
        const emps = employees.filter(e => e.division && deptNames.has(e.division));
        setDeptEmployees(emps);
    };

    const handleCreate = (parentDept?: Department) => {
        setEditingDept(null);
        setFormData({
            dept_name: '',
            dept_code: '',
            description: '',
            parent_dept_id: parentDept?.dept_id || null,
            manager_emp_id: null,
            sort_order: departments.length
        });
        setIsModalOpen(true);
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({
            dept_name: dept.dept_name,
            dept_code: dept.dept_code || '',
            description: dept.description || '',
            parent_dept_id: dept.parent_dept_id,
            manager_emp_id: dept.manager_emp_id,
            sort_order: dept.sort_order
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.dept_name.trim()) {
            alert('부서명을 입력해주세요.');
            return;
        }

        try {
            if (editingDept) {
                await apiService.updateDepartment(editingDept.dept_id, formData);
                alert('부서 정보가 수정되었습니다.');
            } else {
                await apiService.createDepartment(formData);
                alert('새 부서가 등록되었습니다.');
            }
            setIsModalOpen(false);
            loadData();
        } catch (error: any) {
            alert(`오류: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleDelete = async (dept: Department) => {
        // 하위 부서 확인
        const childDepts = departments.filter(d => d.parent_dept_id === dept.dept_id);
        if (childDepts.length > 0) {
            alert(`하위 부서가 ${childDepts.length}개 있습니다. 먼저 하위 부서를 삭제하거나 이동해주세요.`);
            return;
        }

        if (dept.employee_count > 0) {
            alert(`해당 부서에 ${dept.employee_count}명의 직원이 있습니다. 먼저 직원을 다른 부서로 이동해주세요.`);
            return;
        }

        if (!window.confirm(`"${dept.dept_name}" 부서를 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await apiService.deleteDepartment(dept.dept_id);
            alert('부서가 삭제되었습니다.');
            loadData();
            if (selectedDept?.dept_id === dept.dept_id) {
                setSelectedDept(null);
                setDeptEmployees([]);
            }
        } catch (error: any) {
            alert(`오류: ${error.response?.data?.detail || error.message}`);
        }
    };

    // 상위 부서 이름 가져오기
    const getParentName = (parentId: number | null): string => {
        if (!parentId) return '';
        const parent = departments.find(d => d.dept_id === parentId);
        return parent ? parent.dept_name : '';
    };

    // 총 직원 수 계산 (하위 포함)
    const getTotalEmployeeCount = (dept: DepartmentTreeNode): number => {
        let count = dept.employee_count;
        dept.children.forEach(child => {
            count += getTotalEmployeeCount(child);
        });
        return count;
    };

    if (loading) {
        return <div style={{ padding: '20px', textAlign: 'center' }}>부서 정보를 불러오는 중...</div>;
    }

    return (
        <div style={{ padding: '20px' }}>
            {/* 헤더 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>부서 관리</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setExpandedDepts(new Set(departments.map(d => d.dept_id)))}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        모두 펼치기
                    </button>
                    <button
                        onClick={() => setExpandedDepts(new Set())}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        모두 접기
                    </button>
                    <button
                        onClick={() => handleCreate()}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#007bff',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        + 최상위 부서 추가
                    </button>
                </div>
            </div>

            {/* 메인 레이아웃 */}
            <div style={{ display: 'flex', gap: '20px' }}>
                {/* 부서 트리 */}
                <div style={{ flex: '1', minWidth: '400px' }}>
                    <h3>조직도 ({departments.length}개 부서)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {flattenedDepartments.map(dept => {
                            const hasChildren = dept.children.length > 0;
                            const isExpanded = expandedDepts.has(dept.dept_id);
                            const totalCount = getTotalEmployeeCount(dept);

                            return (
                                <div
                                    key={dept.dept_id}
                                    style={{
                                        marginLeft: `${dept.level * 24}px`,
                                        padding: '12px 15px',
                                        border: selectedDept?.dept_id === dept.dept_id ? '2px solid #007bff' : '1px solid #ddd',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        backgroundColor: selectedDept?.dept_id === dept.dept_id
                                            ? '#f0f7ff'
                                            : dept.level === 0 ? '#f8f9fa' : 'white',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div
                                            style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                                            onClick={() => loadDeptEmployees(dept)}
                                        >
                                            {/* 펼치기/접기 버튼 */}
                                            {hasChildren ? (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); toggleExpand(dept.dept_id); }}
                                                    style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        border: '1px solid #007bff',
                                                        borderRadius: '4px',
                                                        background: isExpanded ? '#007bff' : 'white',
                                                        color: isExpanded ? 'white' : '#007bff',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '16px',
                                                        fontWeight: 'bold'
                                                    }}
                                                    title={isExpanded ? '접기' : '펼치기'}
                                                >
                                                    {isExpanded ? '▼' : '▶'}
                                                </button>
                                            ) : (
                                                <span style={{ width: '28px', display: 'inline-block', textAlign: 'center', color: '#ccc' }}>●</span>
                                            )}

                                            {/* 부서명 */}
                                            <span style={{
                                                fontWeight: dept.level === 0 ? 'bold' : 'normal',
                                                fontSize: dept.level === 0 ? '16px' : '14px'
                                            }}>
                                                {dept.dept_name}
                                            </span>

                                            {/* 하위 부서 개수 표시 */}
                                            {hasChildren && (
                                                <span style={{
                                                    color: '#007bff',
                                                    fontSize: '12px',
                                                    backgroundColor: '#e7f1ff',
                                                    padding: '2px 6px',
                                                    borderRadius: '4px'
                                                }}>
                                                    하위 {dept.children.length}개
                                                </span>
                                            )}

                                            {/* 인원수 */}
                                            <span style={{
                                                color: '#666',
                                                fontSize: '13px',
                                                backgroundColor: '#e9ecef',
                                                padding: '2px 8px',
                                                borderRadius: '10px'
                                            }}>
                                                {hasChildren ? `${dept.employee_count}명 (총 ${totalCount}명)` : `${dept.employee_count}명`}
                                            </span>
                                        </div>

                                        {/* 버튼들 */}
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleCreate(dept); }}
                                                title="하위 부서 추가"
                                                style={{
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    border: '1px solid #28a745',
                                                    borderRadius: '4px',
                                                    background: 'white',
                                                    color: '#28a745',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                + 추가
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleEdit(dept); }}
                                                style={{
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    background: 'white',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                수정
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDelete(dept); }}
                                                style={{
                                                    padding: '4px 8px',
                                                    cursor: 'pointer',
                                                    border: '1px solid #dc3545',
                                                    borderRadius: '4px',
                                                    background: 'white',
                                                    color: '#dc3545',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                삭제
                                            </button>
                                        </div>
                                    </div>

                                    {/* 부가 정보 */}
                                    <div style={{
                                        marginTop: '8px',
                                        marginLeft: '32px',
                                        fontSize: '13px',
                                        color: '#666',
                                        display: 'flex',
                                        gap: '15px',
                                        flexWrap: 'wrap'
                                    }}>
                                        {dept.dept_code && <span>코드: {dept.dept_code}</span>}
                                        {dept.manager_name && <span>부서장: {dept.manager_name}</span>}
                                        {dept.description && (
                                            <span style={{ color: '#888' }}>{dept.description}</span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 선택된 부서의 직원 목록 */}
                {selectedDept && (
                    <div style={{ flex: '1.5' }}>
                        <h3>{selectedDept.dept_name} 소속 직원 ({deptEmployees.length}명)</h3>

                        {deptEmployees.length === 0 ? (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>소속 직원이 없습니다.</div>
                        ) : (
                            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>사번</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>이름</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>부서</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>팀</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>직급</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd' }}>상태</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {deptEmployees.map(emp => (
                                        <tr key={emp.emp_id}>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.id}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.name}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.division || '-'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.team || '-'}</td>
                                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{emp.title || '-'}</td>
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
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                        <p style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                            * 직원 부서 이동은 "직원 관리" 탭에서 가능합니다.
                        </p>
                    </div>
                )}
            </div>

            {/* 부서 추가/수정 모달 - Portal로 body에 렌더링 */}
            {isModalOpen && ReactDOM.createPortal(
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999
                }} onClick={() => setIsModalOpen(false)}>
                    <div style={{
                        backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '450px', maxWidth: '90%', position: 'relative', zIndex: 100000
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginTop: 0 }}>
                            {editingDept ? '부서 정보 수정' : '새 부서 추가'}
                            {formData.parent_dept_id && !editingDept && (
                                <span style={{ fontWeight: 'normal', fontSize: '14px', color: '#666' }}>
                                    {' '}(상위: {getParentName(formData.parent_dept_id)})
                                </span>
                            )}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>부서명 *</label>
                                <input
                                    type="text"
                                    value={formData.dept_name}
                                    onChange={(e) => setFormData({ ...formData, dept_name: e.target.value })}
                                    required
                                    placeholder="예: 1본부 또는 개발팀"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>상위 부서</label>
                                <select
                                    value={formData.parent_dept_id || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        parent_dept_id: e.target.value ? Number(e.target.value) : null
                                    })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                >
                                    <option value="">없음 (최상위 부서)</option>
                                    {departments
                                        .filter(d => !editingDept || d.dept_id !== editingDept.dept_id)
                                        .map(dept => (
                                            <option key={dept.dept_id} value={dept.dept_id}>
                                                {'─'.repeat(flattenedDepartments.find(fd => fd.dept_id === dept.dept_id)?.level || 0)} {dept.dept_name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>부서 코드</label>
                                <input
                                    type="text"
                                    value={formData.dept_code}
                                    onChange={(e) => setFormData({ ...formData, dept_code: e.target.value })}
                                    placeholder="예: DIV1, TEAM1"
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>설명</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="부서에 대한 설명을 입력하세요"
                                    rows={3}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                />
                            </div>
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>부서장</label>
                                <select
                                    value={formData.manager_emp_id || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        manager_emp_id: e.target.value ? Number(e.target.value) : null
                                    })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
                                >
                                    <option value="">선택 안함</option>
                                    {employees.filter(e => e.is_active).map(emp => (
                                        <option key={emp.emp_id} value={emp.emp_id}>
                                            {emp.name} ({emp.title || emp.position || '직원'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
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
                                    {editingDept ? '수정' : '등록'}
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

export default DepartmentManagementTab;
