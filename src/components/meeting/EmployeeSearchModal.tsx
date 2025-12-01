// src/components/meeting/EmployeeSearchModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, EmployeeSimple } from '../../api/types';
import { employeeService } from '../../api/services/employeeService';
import '../../styles/modal.css';

interface EmployeeSearchModalProps {
    onClose: () => void;
    onSelect: (selectedEmployees: Employee[]) => void;
    initialSelected: Employee[] | EmployeeSimple[]; // 둘 다 지원
    currentUserId?: number; // 현재 로그인한 사용자 ID (목록에서 제외)
}

const EmployeeSearchModal: React.FC<EmployeeSearchModalProps> = ({ onClose, onSelect, initialSelected, currentUserId }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<Employee[]>([]);
    const [selected, setSelected] = useState<Employee[]>([]);
    // 정렬 상태 추가
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'dept' | null, direction: 'asc' | 'desc' }>({ key: null, direction: 'asc' });

    const handleSearch = async () => {
        setLoading(true);
        try {
            const params: any = {
                limit: 1000  // 충분히 큰 값으로 설정하여 모든 직원 가져오기
            };
            // 검색어가 있을 때만 search 파라미터 추가
            if (searchTerm && searchTerm.trim() !== '') {
                params.search = searchTerm;
            }
            const employees = await employeeService.getEmployees(params);
            // 현재 사용자와 employee_id가 'admin'인 경우 제외
            const filteredEmployees = employees.filter(emp => {
                if (currentUserId && emp.emp_id === currentUserId) return false;
                if (emp.employee_id === 'admin') return false;
                return true;
            });
            setResults(filteredEmployees);
        } catch (error) {
            console.error("직원 검색 오류:", error);
            alert("직원을 검색하는 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        handleSearch(); // 컴포넌트 마운트 시 전체 직원 목록 로드
    }, []);

    useEffect(() => {
        // initialSelected가 EmployeeSimple[]인 경우 id만으로 매칭
        // results에서 해당 id를 찾아 Employee[]로 변환
        const initialIds = initialSelected.map(emp => emp.id);
        const matchedEmployees = results.filter(emp => initialIds.includes(emp.id));
        setSelected(matchedEmployees);
    }, [initialSelected, results]);

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

    // 전체 선택 핸들러
    const handleSelectAll = () => {
        if (results.length === 0) return;

        const allSelected = results.every(emp => selected.some(s => s.id === emp.id));

        if (allSelected) {
            // 전체 해제: 현재 결과에 있는 항목들을 selected에서 제거
            setSelected(prev => prev.filter(s => !results.some(r => r.id === s.id)));
        } else {
            // 전체 선택: 현재 결과 항목들을 selected에 추가 (중복 방지)
            const newSelected = [...selected];
            results.forEach(emp => {
                if (!newSelected.some(s => s.id === emp.id)) {
                    newSelected.push(emp);
                }
            });
            setSelected(newSelected);
        }
    };

    // 전체 선택 상태 여부
    const isAllSelected = results.length > 0 && results.every(emp => selected.some(s => s.id === emp.id));

    // 부서명 표시 헬퍼 함수
    const getDeptString = (emp: Employee) => {
        const div = emp.division || '';
        const team = emp.team || '';
        if (!div && !team) return '-';
        if (div === team) return div;
        return [div, team].filter(Boolean).join(' ');
    };

    // 정렬 핸들러
    const handleSort = (key: 'name' | 'dept') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // 정렬된 데이터 계산
    const sortedResults = useMemo(() => {
        let sortableItems = [...results];

        // 1. 정렬 로직 적용
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = '';
                let bValue = '';

                if (sortConfig.key === 'name') {
                    aValue = a.name;
                    bValue = b.name;
                } else if (sortConfig.key === 'dept') {
                    aValue = getDeptString(a);
                    bValue = getDeptString(b);
                }

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }

        // 2. 선택된 항목을 상단에 배치
        const selectedItems = sortableItems.filter(emp => selected.some(s => s.id === emp.id));
        const unselectedItems = sortableItems.filter(emp => !selected.some(s => s.id === emp.id));

        return [...selectedItems, ...unselectedItems];
    }, [results, sortConfig, selected]);

    // 정렬 아이콘 렌더링
    const renderSortIcon = (key: 'name' | 'dept') => {
        if (sortConfig.key !== key) {
            return <span style={{ opacity: 0.3, marginLeft: '4px', fontSize: '1em' }}>▲▼</span>;
        }
        return <span style={{ marginLeft: '4px', fontSize: '1em' }}>{sortConfig.direction === 'asc' ? '▲' : '▼'}</span>;
    };

    return (
        <div className="modal-overlay">
            {/* Flex column 레이아웃으로 변경하여 스크롤 영역 분리 */}
            <div className="modal-content" style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh', padding: 0, width: '500px', maxWidth: '95%' }}>
                <div className="modal-header" style={{ padding: '20px 24px', borderBottom: '1px solid #eee', flexShrink: 0 }}>
                    <h3 style={{ margin: 0 }}>직원 검색</h3>
                    <button onClick={onClose} className="modal-close-btn" style={{ top: '20px', right: '24px' }}>&times;</button>
                </div>

                {/* 검색 영역: 스크롤 밖으로 이동 (고정) */}
                <div style={{ padding: '20px 24px 0', flexShrink: 0 }}>
                    <div className="input-with-search" style={{ marginBottom: '10px' }}>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                            placeholder="이름 또는 부서로 검색"
                            className="project-input"
                        />
                        <button onClick={handleSearch} className="search-btn">🔍</button>
                    </div>
                </div>

                {/* 리스트 영역: 스크롤 가능 */}
                <div className="modal-body" style={{ padding: '0 24px 20px', flexGrow: 1, overflowY: 'auto' }}>
                    {loading ? (
                        <div className="loading" style={{ textAlign: 'center', padding: '20px' }}>검색 중...</div>
                    ) : (
                        <table className="search-table" style={{ width: '100%' }}>
                            <thead style={{ position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
                            <tr>
                                <th style={{ width: '50px', textAlign: 'center' }}>
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={handleSelectAll}
                                        className="meeting-minutes-checkbox"
                                    />
                                </th>
                                <th
                                    onClick={() => handleSort('name')}
                                    style={{ cursor: 'pointer', userSelect: 'none', width: '5rem' }}
                                >
                                    이름 {renderSortIcon('name')}
                                </th>
                                <th
                                    onClick={() => handleSort('dept')}
                                    style={{ cursor: 'pointer', userSelect: 'none' }}
                                >
                                    부서 {renderSortIcon('dept')}
                                </th>
                                <th>직급</th>
                            </tr>
                            </thead>
                            <tbody>
                            {sortedResults.length > 0 ? (
                                sortedResults.map(emp => (
                                    <tr key={emp.id}>
                                        <td style={{ textAlign: 'center' }}>
                                            <input
                                                type="checkbox"
                                                checked={selected.some(e => e.id === emp.id)}
                                                onChange={() => handleCheckboxChange(emp)}
                                                className="meeting-minutes-checkbox"
                                            />
                                        </td>
                                        <td style={{ textAlign: 'center' }}>{emp.name}</td>
                                        <td>{getDeptString(emp)}</td>
                                        <td>{emp.position || '-'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="no-results" style={{ textAlign: 'center', padding: '20px' }}>검색 결과가 없습니다.</td>
                                </tr>
                            )}
                            </tbody>
                        </table>
                    )}
                </div>

                <div className="modal-footer" style={{ padding: '15px 24px', borderTop: '1px solid #eee', textAlign: 'right', flexShrink: 0 }}>
                    <button className="btn-primary" onClick={handleConfirm}>확인</button>
                    <button className="btn-secondary" onClick={onClose} style={{ marginLeft: '10px' }}>취소</button>
                </div>
            </div>
        </div>
    );
};

export default EmployeeSearchModal;