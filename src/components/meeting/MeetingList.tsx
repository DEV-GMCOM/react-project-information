// src/components/meeting/MeetingList.tsx
import React from 'react';
import { MeetingMinute } from '../../api/types';

interface MeetingListProps {
    meetings: MeetingMinute[];
    onSelect: (meeting: MeetingMinute) => void;
    onDelete?: (meeting: MeetingMinute) => void;
    showDelete?: boolean;
    hideCreatorColumn?: boolean; // ✅ 추가
    // [추가] 정렬 관련 props
    onSort: (column: string) => void;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
}

const MeetingList: React.FC<MeetingListProps> = ({
                                                     meetings,
                                                     onSelect,
                                                     onDelete,
                                                     showDelete = false,
                                                     hideCreatorColumn = false,
                                                     onSort, // ✅ 추가
                                                     sortBy, // ✅ 추가
                                                     sortOrder // ✅ 추가
                                                 }) => {
    // 날짜 포맷 함수 (필요시)
    const formatDateTime = (isoString: string) => {
        try {
            return new Date(isoString).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (e) {
            return isoString;
        }
    };

    const colSpanValue = 6 - (hideCreatorColumn ? 1 : 0); // ✅ colSpan 계산 (작업 컬럼 제거)

    // [추가] 정렬 아이콘 렌더링 헬퍼
    const renderSortIcon = (columnName: string) => {
        if (sortBy === columnName) {
            return sortOrder === 'asc' ? ' ▲' : ' ▼';
        }
        return '';
    };

    return (
        <table className="meeting-list-table">
            <thead>
            <tr>
                <th onClick={() => onSort('meeting_title')} style={{ cursor: 'pointer' }}>
                    회의명{renderSortIcon('meeting_title')}
                </th>
                <th onClick={() => onSort('meeting_datetime')} style={{ cursor: 'pointer' }}>
                    회의일시{renderSortIcon('meeting_datetime')}
                </th>
                <th onClick={() => onSort('project_name')} style={{ cursor: 'pointer' }}>
                    연계프로젝트{renderSortIcon('project_name')}
                </th>
                {!hideCreatorColumn && <th>작성자</th>}
                <th>태그</th>
                <th>상태</th>
            </tr>
            </thead>
            <tbody>
            {meetings.length === 0 ? (
                <tr>
                    <td colSpan={colSpanValue} className="no-results">회의록이 없습니다.</td>
                </tr>
            ) : (
                meetings.map(meeting => (
                    <tr key={meeting.meeting_id} onClick={() => onSelect(meeting)} className="meeting-list-item" title="클릭하여 상세 정보 보기">
                        <td className="meeting-title-cell">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                <span className="meeting-link">{meeting.meeting_title}</span>{showDelete && (
                                    <button
                                        className="btn-delete-mini"
                                        onClick={(e) => {
                                            e.stopPropagation(); // 이벤트 버블링 방지
                                            onDelete?.(meeting);
                                        }}
                                        title="삭제"
                                    >
                                        🗑️
                                    </button>
                                )}
                            </div>
                        </td>
                        <td>{formatDateTime(meeting.meeting_datetime)}</td>
                        <td title={meeting.project_name}>{meeting.project_name || 'N/A'}</td>
                        {!hideCreatorColumn && <td>{meeting.creator_name || 'N/A'}</td>}
                        <td>
                            {meeting.tags?.map(tag => (
                                <span key={tag} className="tag-badge" title={tag}>{tag}</span>
                            ))}
                        </td>
                        <td>
                            {meeting.has_llm_documents ? '✔️ AI 생성' : '-'}
                        </td>
                    </tr>
                ))
            )}
            </tbody>
        </table>
    );
};

export default MeetingList;