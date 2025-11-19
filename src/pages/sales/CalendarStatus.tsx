
import React, { useState, useEffect, useCallback } from 'react';
import { projectService } from '../../api/services/projectService';
import { ProjectCalendarEntry } from '../../api/types';
import '../../styles/SalesSchedule.css';

const CalendarStatus: React.FC = () => { // Renamed from SalesSchedule to CalendarStatus

    const [calendarEntries, setCalendarEntries] = useState<ProjectCalendarEntry[]>([]);
    const [year, setYear] = useState<number | ''>(new Date().getFullYear());
    const [month, setMonth] = useState<number | ''>(new Date().getMonth() + 1);
    const [advertisers, setAdvertisers] = useState<string[]>([]);
    const [selectedAdvertiser, setSelectedAdvertiser] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch advertiser list on component mount
    useEffect(() => {
        const fetchAdvertisers = async () => {
            try {
                const data = await projectService.getProjectCalendarAdvertisers();
                setAdvertisers(data);
            } catch (err) {
                console.error("Failed to fetch advertisers:", err);
            }
        };
        fetchAdvertisers();
    }, []);

    const fetchCalendarEntries = useCallback(async (fetchYear: number | '', fetchMonth: number | '', fetchAdvertiser: string) => {
        setLoading(true);
        setError(null);
        try {
            const data = await projectService.getProjectCalendar({ year: fetchYear, month: fetchMonth, advertiser: fetchAdvertiser });

            // Sorting logic based on filters
            if (fetchYear === '') {
                // All years selected, sort by year -> month -> event_name
                data.sort((a, b) => {
                    if (a.year !== b.year) return a.year - b.year;
                    if (a.month !== b.month) return a.month - b.month;
                    return a.event_name.localeCompare(b.event_name);
                });
            } else if (fetchMonth === '') {
                // Specific year, all months
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
        fetchCalendarEntries(year, month, selectedAdvertiser);
    }, [year, month, selectedAdvertiser, fetchCalendarEntries]);

    const yearOptions = Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i);
    const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    
    const colorMeaningMap: Record<string, string> = {
        'f7e3d7': '4회',
        'dff1d3': '3회',
        'eccfed': '2회',
        'FFFF00': '체험존',
        'c7e5f3': '유니시티',
        'ffcfed': 'SKT특화',
    };

    const renderTable = (entries: ProjectCalendarEntry[], showYearColumn: boolean = true) => {
        const rows = entries.map((entry, index) => {
            const showMonthCell = index === 0 || entry.month !== entries[index - 1].month;
            let rowSpan = 1;
            if (showMonthCell) {
                for (let i = index + 1; i < entries.length; i++) {
                    if (entries[i].month === entry.month) {
                        rowSpan++;
                    } else {
                        break;
                    }
                }
            }

            const formattedCellColor = entry.cell_color ? `#${entry.cell_color}` : 'transparent';
            const rowStyle = { backgroundColor: formattedCellColor };
            const whiteBackgroundCellStyle = { backgroundColor: 'white' };
            const transparentCellStyle = { backgroundColor: 'transparent' };

            return (
                <tr key={entry.event_id} className={showMonthCell ? 'month-start-row' : ''} style={rowStyle}>
                    {showYearColumn ? <td style={whiteBackgroundCellStyle}>{entry.year}</td> : null}
                    
                    {showMonthCell ? (
                        <td rowSpan={rowSpan} style={{ ...whiteBackgroundCellStyle, verticalAlign: 'middle', textAlign: 'center' }}>
                            {entry.month}월
                        </td>
                    ) : null}

                    <td style={transparentCellStyle}>{entry.event_name}</td>
                    <td style={transparentCellStyle}>{entry.advertiser || 'N/A'}</td>
                    <td style={transparentCellStyle}>{entry.budget?.toLocaleString() || 'N/A'}</td>
                    <td style={transparentCellStyle}>{entry.ot_date || 'N/A'}</td>
                    <td style={transparentCellStyle}>
                        {entry.cell_color ? <span style={{ backgroundColor: formattedCellColor, padding: '2px 8px', borderRadius: '4px' }}>{colorMeaningMap[entry.cell_color] || entry.cell_color}</span> : 'N/A'}
                    </td>
                </tr>
            );
        });

        return (
            <table className="sales-schedule-table">
                <thead>
                    <tr>
                        {showYearColumn && <th>연도</th>}
                        <th>월</th>
                        <th>이벤트명</th>
                        <th>광고주</th>
                        <th>예산</th>
                        <th>날짜</th>
                        <th>색상</th>
                    </tr>
                </thead>
                <tbody>
                    {rows}
                </tbody>
            </table>
        );
    };

    const renderContent = () => {
        if (loading) {
            return <div className="loading">로딩 중...</div>;
        }
        if (error) {
            return <div className="error" style={{ color: 'red' }}>{error}</div>;
        }
        if (calendarEntries.length === 0) {
            return <div className="no-results">표시할 영업 스케쥴이 없습니다.</div>;
        }

        return (
            <>
                <div className="total-count">
                    총 {calendarEntries.length}개의 스케쥴이 있습니다.
                </div>
                {year === '' ? (() => {
                    const groupedByYear = calendarEntries.reduce((acc, entry) => {
                        const yearKey = entry.year;
                        if (!acc[yearKey]) {
                            acc[yearKey] = [];
                        }
                        acc[yearKey].push(entry);
                        return acc;
                    }, {} as Record<number, ProjectCalendarEntry[]>);
        
                    const sortedYears = Object.keys(groupedByYear).map(Number).sort((a, b) => a - b);

                    return (
                        <div>
                            {sortedYears.map(yearKey => (
                                <div key={yearKey} className="year-sector">
                                    <h2 className="year-header">{yearKey}년</h2>
                                    {renderTable(groupedByYear[yearKey], false)}
                                </div>
                            ))}
                        </div>
                    );
                })() : (
                    renderTable(calendarEntries, true)
                )}
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
                    <select value={month} onChange={e => setMonth(e.target.value === '' ? '' : Number(e.target.value))}>
                        <option value="">전체</option>
                        {monthOptions.map(m => <option key={m} value={m}>{m}월</option>)}
                    </select>
                </div>
                {renderContent()}
            </div>
        </div>
    );
};

export default CalendarStatus;
