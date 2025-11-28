// src/pages/hr/OrganizationChart.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
    employee_count: number;
    manager_name: string | null;
}

interface DeptTreeNode {
    dept: Department;
    children: DeptTreeNode[];
    employees: Employee[];
    level: number;
    isExpanded: boolean;
}

const OrganizationChart: React.FC = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [expandedDepts, setExpandedDepts] = useState<Set<number>>(new Set());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [empData, deptData] = await Promise.all([
                apiService.getEmployees({ limit: 1000 }),
                apiService.getDepartments().catch(() => [])
            ]);
            setEmployees(empData);
            setDepartments(deptData);
            // 모든 부서 펼치기
            setExpandedDepts(new Set(deptData.map((d: Department) => d.dept_id)));
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // 부서 데이터 없을 때 직원 기반 트리 (useMemo 전에 선언)
    const buildFallbackTree = (): DeptTreeNode[] => {
        const divisionMap = new Map<string, Employee[]>();

        employees.forEach(emp => {
            const div = emp.division || '미지정';
            if (!divisionMap.has(div)) {
                divisionMap.set(div, []);
            }
            divisionMap.get(div)!.push(emp);
        });

        let idx = 1;
        const roots: DeptTreeNode[] = [];

        divisionMap.forEach((emps, divName) => {
            // 팀별로 그룹화
            const teamMap = new Map<string, Employee[]>();
            emps.forEach(emp => {
                const team = emp.team || divName;
                if (!teamMap.has(team)) {
                    teamMap.set(team, []);
                }
                teamMap.get(team)!.push(emp);
            });

            const children: DeptTreeNode[] = [];
            teamMap.forEach((teamEmps, teamName) => {
                if (teamName !== divName) {
                    children.push({
                        dept: {
                            dept_id: idx++,
                            dept_name: teamName,
                            dept_code: null,
                            description: null,
                            parent_dept_id: null,
                            manager_emp_id: null,
                            sort_order: 0,
                            is_active: true,
                            employee_count: teamEmps.length,
                            manager_name: null
                        },
                        children: [],
                        employees: teamEmps,
                        level: 1,
                        isExpanded: true
                    });
                }
            });

            roots.push({
                dept: {
                    dept_id: idx++,
                    dept_name: divName,
                    dept_code: null,
                    description: null,
                    parent_dept_id: null,
                    manager_emp_id: null,
                    sort_order: 0,
                    is_active: true,
                    employee_count: emps.length,
                    manager_name: null
                },
                children,
                employees: children.length === 0 ? emps : [],
                level: 0,
                isExpanded: true
            });
        });

        return roots;
    };

    // 부서를 트리 구조로 변환
    const departmentTree = useMemo((): DeptTreeNode[] => {
        if (departments.length === 0) {
            // 부서 데이터 없으면 직원의 division 기반으로 fallback
            return buildFallbackTree();
        }

        const deptMap = new Map<number, DeptTreeNode>();

        // 모든 부서를 노드로 변환
        departments.forEach(dept => {
            deptMap.set(dept.dept_id, {
                dept,
                children: [],
                employees: [],
                level: 0,
                isExpanded: expandedDepts.has(dept.dept_id)
            });
        });

        // 직원을 부서에 매핑 (dept_name으로 매칭)
        employees.forEach(emp => {
            const matchingDept = departments.find(d => d.dept_name === emp.division || d.dept_name === emp.team);
            if (matchingDept) {
                deptMap.get(matchingDept.dept_id)?.employees.push(emp);
            }
        });

        const roots: DeptTreeNode[] = [];

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

        // 레벨 설정 및 정렬
        const setLevels = (nodes: DeptTreeNode[], level: number) => {
            nodes.forEach(node => {
                node.level = level;
                node.children.sort((a, b) => a.dept.sort_order - b.dept.sort_order);
                setLevels(node.children, level + 1);
            });
        };

        roots.sort((a, b) => a.dept.sort_order - b.dept.sort_order);
        setLevels(roots, 0);

        return roots;
    }, [departments, employees, expandedDepts, buildFallbackTree]);

    const toggleDept = (deptId: number) => {
        setExpandedDepts(prev => {
            const next = new Set(prev);
            if (next.has(deptId)) {
                next.delete(deptId);
            } else {
                next.add(deptId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedDepts(new Set(departments.map(d => d.dept_id)));
    };

    const collapseAll = () => {
        setExpandedDepts(new Set());
    };

    // 부서의 총 직원 수 계산 (하위 포함)
    const getTotalEmployeeCount = (node: DeptTreeNode): number => {
        let count = node.employees.length;
        node.children.forEach(child => {
            count += getTotalEmployeeCount(child);
        });
        return count;
    };

    // 부서 노드 렌더링
    const renderDeptNode = (node: DeptTreeNode): React.ReactNode => {
        const hasChildren = node.children.length > 0;
        const hasEmployees = node.employees.length > 0;
        const isExpanded = expandedDepts.has(node.dept.dept_id);
        const totalCount = getTotalEmployeeCount(node);

        return (
            <div key={node.dept.dept_id} className="tree-node">
                <div
                    className={`tree-node-content depth-${node.level} division`}
                    style={{
                        marginLeft: `${node.level * 24}px`,
                        padding: '10px 15px',
                        borderLeft: node.level > 0 ? '2px solid #007bff' : 'none',
                        backgroundColor: node.level === 0 ? '#f0f7ff' : 'white',
                        marginBottom: '4px',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}
                >
                    {/* 펼치기/접기 버튼 */}
                    {(hasChildren || hasEmployees) ? (
                        <button
                            onClick={() => toggleDept(node.dept.dept_id)}
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
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    ) : (
                        <span style={{ width: '28px', textAlign: 'center', color: '#ccc' }}>●</span>
                    )}

                    {/* 부서 아이콘 */}
                    <span style={{ fontSize: '18px' }}>
                        {node.level === 0 ? '🏢' : hasChildren ? '📁' : '📂'}
                    </span>

                    {/* 부서명 */}
                    <span style={{
                        fontWeight: node.level === 0 ? 'bold' : 'normal',
                        fontSize: node.level === 0 ? '16px' : '14px'
                    }}>
                        {node.dept.dept_name}
                    </span>

                    {/* 부서장 */}
                    {node.dept.manager_name && (
                        <span style={{
                            color: '#666',
                            fontSize: '12px',
                            backgroundColor: '#e9ecef',
                            padding: '2px 8px',
                            borderRadius: '4px'
                        }}>
                            부서장: {node.dept.manager_name}
                        </span>
                    )}

                    {/* 하위 부서 개수 */}
                    {hasChildren && (
                        <span style={{
                            color: '#007bff',
                            fontSize: '12px',
                            backgroundColor: '#e7f1ff',
                            padding: '2px 6px',
                            borderRadius: '4px'
                        }}>
                            하위 {node.children.length}개
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
                        {hasChildren
                            ? `${node.employees.length}명 (총 ${totalCount}명)`
                            : `${totalCount}명`
                        }
                    </span>
                </div>

                {/* 하위 부서 */}
                {isExpanded && hasChildren && (
                    <div className="tree-children">
                        {node.children.map(child => renderDeptNode(child))}
                    </div>
                )}

                {/* 직원 목록 */}
                {isExpanded && hasEmployees && (
                    <div
                        className="employee-list"
                        style={{
                            marginLeft: `${(node.level + 1) * 24 + 38}px`,
                            marginBottom: '8px'
                        }}
                    >
                        {node.employees.map(emp => (
                            <div
                                key={emp.emp_id}
                                onClick={() => setSelectedEmployee(emp)}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: selectedEmployee?.emp_id === emp.emp_id ? '#e7f1ff' : '#f8f9fa',
                                    border: selectedEmployee?.emp_id === emp.emp_id ? '1px solid #007bff' : '1px solid #eee',
                                    borderRadius: '4px',
                                    marginBottom: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    fontSize: '13px'
                                }}
                            >
                                <span>👤</span>
                                <span style={{ fontWeight: 500 }}>{emp.name}</span>
                                <span style={{ color: '#666' }}>
                                    {emp.title || emp.position || '직원'}
                                </span>
                                {emp.team && emp.team !== node.dept.dept_name && (
                                    <span style={{
                                        color: '#888',
                                        fontSize: '12px',
                                        backgroundColor: '#e9ecef',
                                        padding: '1px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        {emp.team}
                                    </span>
                                )}
                                <span style={{
                                    marginLeft: 'auto',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    backgroundColor: emp.is_active ? '#d4edda' : '#f8d7da',
                                    color: emp.is_active ? '#155724' : '#721c24'
                                }}>
                                    {emp.is_active ? '재직' : '퇴사'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="loading">조직도를 불러오는 중...</div>;
    }

    return (
        <div className="organization-chart">
            <div className="chart-header" style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <div>
                    <h2 style={{ margin: 0 }}>조직도</h2>
                    <div className="chart-stats" style={{ marginTop: '5px', color: '#666', fontSize: '14px' }}>
                        <span>총 {employees.filter(e => e.is_active).length}명 (재직)</span>
                        <span style={{ margin: '0 10px' }}>|</span>
                        <span>부서 {departments.length}개</span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={expandAll}
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
                        onClick={collapseAll}
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
                </div>
            </div>

            <div className="chart-content" style={{ display: 'flex', gap: '20px' }}>
                <div className="tree-view" style={{ flex: 1 }}>
                    <div className="tree-root">
                        {/* 회사 루트 노드 */}
                        <div
                            className="company-node"
                            style={{
                                padding: '15px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                borderRadius: '8px',
                                marginBottom: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}
                        >
                            <span style={{ fontSize: '24px' }}>🏢</span>
                            <span style={{ fontSize: '18px', fontWeight: 'bold' }}>GMCOM</span>
                            <span style={{
                                backgroundColor: 'rgba(255,255,255,0.2)',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '14px'
                            }}>
                                {employees.filter(e => e.is_active).length}명
                            </span>
                        </div>

                        {/* 부서 트리 */}
                        <div className="tree-children">
                            {departmentTree.map(node => renderDeptNode(node))}
                        </div>
                    </div>
                </div>

                {/* 직원 상세 패널 */}
                {selectedEmployee && (
                    <div
                        className="employee-detail-panel"
                        style={{
                            width: '350px',
                            padding: '20px',
                            border: '1px solid #ddd',
                            borderRadius: '8px',
                            backgroundColor: 'white',
                            position: 'sticky',
                            top: '20px',
                            height: 'fit-content'
                        }}
                    >
                        <div
                            className="panel-header"
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '20px',
                                paddingBottom: '10px',
                                borderBottom: '1px solid #eee'
                            }}
                        >
                            <h3 style={{ margin: 0 }}>직원 상세 정보</h3>
                            <button
                                className="close-button"
                                onClick={() => setSelectedEmployee(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    color: '#666'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div className="panel-content">
                            {[
                                { label: '이름', value: selectedEmployee.name },
                                { label: '사번', value: selectedEmployee.id },
                                { label: '부서', value: selectedEmployee.division || '-' },
                                { label: '팀', value: selectedEmployee.team || '-' },
                                { label: '직급', value: selectedEmployee.title || '-' },
                                { label: '직책', value: selectedEmployee.position || '-' },
                                { label: '이메일', value: selectedEmployee.email || '-' },
                                { label: '휴대폰', value: selectedEmployee.mobile || '-' },
                            ].map(({ label, value }) => (
                                <div
                                    key={label}
                                    className="detail-row"
                                    style={{
                                        display: 'flex',
                                        marginBottom: '12px'
                                    }}
                                >
                                    <span
                                        className="label"
                                        style={{
                                            width: '80px',
                                            color: '#666',
                                            fontWeight: 500
                                        }}
                                    >
                                        {label}
                                    </span>
                                    <span className="value">{value}</span>
                                </div>
                            ))}
                            <div
                                className="detail-row"
                                style={{
                                    display: 'flex',
                                    marginBottom: '12px'
                                }}
                            >
                                <span
                                    className="label"
                                    style={{
                                        width: '80px',
                                        color: '#666',
                                        fontWeight: 500
                                    }}
                                >
                                    상태
                                </span>
                                <span
                                    className={`status-badge ${selectedEmployee.is_active ? 'active' : 'inactive'}`}
                                    style={{
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        fontSize: '13px',
                                        backgroundColor: selectedEmployee.is_active ? '#d4edda' : '#f8d7da',
                                        color: selectedEmployee.is_active ? '#155724' : '#721c24'
                                    }}
                                >
                                    {selectedEmployee.is_active ? '재직' : '퇴사'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrganizationChart;
