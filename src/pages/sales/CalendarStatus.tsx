
import React, { useState, useEffect, useCallback } from 'react';
import { projectService } from '../../api/services/projectService';
import { ProjectCalendarEntry } from '../../api/types';
import '../../styles/SalesSchedule.css';

const CalendarStatus: React.FC = () => { // Renamed from SalesSchedule to CalendarStatus

    const [calendarEntries, setCalendarEntries] = useState<ProjectCalendarEntry[]>([]);
    const [year, setYear] = useState<number | ''>(new Date().getFullYear());
    const [advertisers, setAdvertisers] = useState<string[]>([]);
    const [yearOptions, setYearOptions] = useState<number[]>([]);
    const [selectedAdvertiser, setSelectedAdvertiser] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [collapsedEntries, setCollapsedEntries] = useState<Set<number>>(new Set());
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean;
        x: number;
        y: number;
        entry?: ProjectCalendarEntry | null;
    }>({
        visible: false,
        x: 0,
        y: 0,
        entry: null
    });

    // Fetch initial data (advertisers and years) on component mount
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [advertisersData, yearsData] = await Promise.all([
                    projectService.getProjectCalendarAdvertisers(),
                    projectService.getProjectCalendarYears()
                ]);
                setAdvertisers(advertisersData);
                setYearOptions(yearsData);

                // Set default year based on available data
                const currentYear = new Date().getFullYear();
                if (yearsData.length > 0) {
                    if (yearsData.includes(currentYear)) {
                        setYear(currentYear);
                    } else {
                        setYear(yearsData[0]); // Default to the most recent available year
                    }
                }
            } catch (err) {
                console.error("Failed to fetch initial data:", err);
                // Fallback year options if API fails could be handled here, or just leave empty
            }
        };
        fetchInitialData();
    }, []);

    const fetchCalendarEntries = useCallback(async (fetchYear: number | '', fetchAdvertiser: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await projectService.getProjectCalendar({ year: fetchYear, advertiser: fetchAdvertiser });

            // Sorting logic based on filters
            if (fetchYear === '') {
                // All years selected, sort by year -> month -> event_name
                data.sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    if (a.month !== b.month) return a.month - b.month;
                    return a.event_name.localeCompare(b.event_name);
                });
            } else { // Specific year, all months
                data.sort((a, b) => {
                    if (a.month !== b.month) return a.month - b.month;
                    return a.event_name.localeCompare(b.event_name);
                });
            }
            setCalendarEntries(data);
        } catch (err) {
            console.error("Failed to fetch project calendar entries:", err);
            setError("영업 스케쥴 데이터를 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCalendarEntries(year, selectedAdvertiser);
    }, [year, selectedAdvertiser, fetchCalendarEntries]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(prev => (prev.visible ? { visible: false, x: 0, y: 0, entry: null } : prev));
    }, []);

    useEffect(() => {
        const handleGlobalClick = () => closeContextMenu();
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                closeContextMenu();
            }
        };
        document.addEventListener('click', handleGlobalClick);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('click', handleGlobalClick);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [closeContextMenu]);

    const handleContextMenu = (event: React.MouseEvent, entry: ProjectCalendarEntry, isCollapsed: boolean) => {
        if (!isCollapsed) {
            closeContextMenu();
            return;
        }
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            visible: true,
            x: event.clientX,
            y: event.clientY,
            entry
        });
    };

    const handleContextMenuAction = (action: 'register' | 'detail') => {
        if (!contextMenu.entry) return;
        // 추후 실제 동작 연동 지점을 여기서 처리
        console.info(`[context] ${action} for`, contextMenu.entry);
        closeContextMenu();
    };

    
    const colorMeaningMap: Record<string, string> = {
        'f7e3d7': '4회',
        'dff1d3': '3회',
        'eccfed': '2회',
        'FFFF00': '체험존',
        'c7e5f3': '유니시티',
        'ffcfed': 'SKT특화',
    };

    // Helper to group entries by Year-Month
    const groupEntries = (entries: ProjectCalendarEntry[]) => {
        const groups: Record<string, ProjectCalendarEntry[]> = {};
        entries.forEach(entry => {
            // Key format: YYYY-MM
            const key = `${entry.year}-${entry.month}`;
            if (!groups[key]) {
                groups[key] = [];
            }
            groups[key].push(entry);
        });
        return groups;
    };

    const renderYearGrid = (yearToRender: number, groupedData: Record<string, ProjectCalendarEntry[]>) => {
        // Generate array of months 1-12
        const months = Array.from({ length: 12 }, (_, i) => i + 1);

        return (
            <div key={yearToRender} className="year-sector">
                <h2 className="year-header">{yearToRender}년</h2>
                <div className="calendar-year-container">
                    {months.map(m => {
                        const key = `${yearToRender}-${m}`;
                        const monthEntries = groupedData[key] || [];

                        return (
                            <div key={key} className="calendar-month-card">
                                <div className="calendar-month-header">
                                    {m}월 ({monthEntries.length}건)
                                </div>
                                <div className="calendar-month-body">
                                    {monthEntries.length > 0 ? (
                                        monthEntries.map(entry => {
                                            const formattedCellColor = entry.cell_color ? `#${entry.cell_color}` : 'transparent';
                                            // const badgeText = colorMeaningMap[entry.cell_color || ''] || ''; // Option to use badge text if needed
                                            const isCollapsed = collapsedEntries.has(entry.event_id);

                                            const toggleEntryCollapse = () => {
                                                setCollapsedEntries(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(entry.event_id)) {
                                                        next.delete(entry.event_id);
                                                    } else {
                                                        next.add(entry.event_id);
                                                    }
                                                    return next;
                                                });
                                            };

                                            return (
                                                <div
                                                    key={entry.event_id}
                                                    className={`calendar-event-item${isCollapsed ? ' collapsed' : ''}`}
                                                    style={{ borderLeftColor: entry.cell_color ? formattedCellColor : '#ddd' }}
                                                    role="button"
                                                    tabIndex={0}
                                                    aria-expanded={!isCollapsed}
                                                    onClick={toggleEntryCollapse}
                                                    onContextMenu={e => handleContextMenu(e, entry, isCollapsed)}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            toggleEntryCollapse();
                                                        }
                                                    }}
                                                >
                                                    <div className="calendar-event-top">
                                                        <div className="calendar-event-title">{entry.event_name}</div>
                                                        <span className="calendar-event-chevron" aria-hidden="true">
                                                            {isCollapsed ? '▸' : '▾'}
                                                        </span>
                                                    </div>
                                                    <div className="calendar-event-meta">
                                                        <span>{entry.advertiser || '-'}</span>
                                                        <span>{entry.ot_date ? entry.ot_date.slice(5) : '-'}</span>
                                                    </div>
                                                    {!isCollapsed && (
                                                        <div className="calendar-event-details">
                                                            {entry.budget && (
                                                                <div className="calendar-event-row">
                                                                    <span>예산: {entry.budget.toLocaleString()}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="no-events-placeholder">-</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const renderContent = () => {
        if (loading) {
            return (
                <div className="spinner-container">
                    <div className="spinner"></div>
                </div>
            );
        }
        if (error) {
            return <div className="error" style={{ color: 'red' }}>{error}</div>;
        }
        if (calendarEntries.length === 0) {
            return <div className="no-results">표시할 영업 스케쥴이 없습니다.</div>;
        }

        const grouped = groupEntries(calendarEntries);
        
        // Determine which years to render
        let yearsToRender: number[] = [];
        if (year !== '') {
            yearsToRender = [Number(year)];
        } else {
            // If "All Years" selected, find all unique years in the data
            const years = new Set(calendarEntries.map(e => e.year));
            yearsToRender = Array.from(years).sort((a, b) => b - a); // Descending order usually better for years
        }

        return (
            <>
                <div className="total-count">
                    총 {calendarEntries.length}개의 프로젝트가 있습니다.
                </div>
                <div>
                    {yearsToRender.map(y => renderYearGrid(y, grouped))}
                </div>
            </>
        );
    };

    return (
        // The outer container and header will be in the layout component, 
        // but for now, we keep them here and move them later.
        <div className="sales-schedule-container">
            <div className="sales-schedule-header">
                <h1 className="sales-schedule-title">영업 스케쥴 현황</h1>
            </div>
            <div className="sales-schedule-main">
                <div className="schedule-filters">
                    <select value={selectedAdvertiser} onChange={e => setSelectedAdvertiser(e.target.value)}>
                        <option value="">전체 광고주</option>
                        {advertisers.map(ad => <option key={ad} value={ad}>{ad}</option>)}
                    </select>
                    <select value={year} onChange={e => setYear(e.target.value === '' ? '' : Number(e.target.value))}>
                        <option value="">전체</option>
                        {yearOptions.map(y => <option key={y} value={y}>{y}년</option>)}
                    </select>
                </div>
                {renderContent()}
            </div>
            {contextMenu.visible && (
                <div
                    className="context-menu"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    onClick={e => e.stopPropagation()}
                >
                    <button
                        type="button"
                        className="context-menu-item"
                        onClick={() => handleContextMenuAction('register')}
                    >
                        스케쥴에 등록하기
                    </button>
                    <button
                        type="button"
                        className="context-menu-item"
                        onClick={() => handleContextMenuAction('detail')}
                    >
                        상세내용 확인하기
                    </button>
                </div>
            )}
        </div>
    );
};

export default CalendarStatus;
