// src/components/meeting/MeetingList.tsx
import React from 'react';
import { MeetingMinute } from '../../api/types';

interface MeetingListProps {
    meetings: MeetingMinute[];
    onSelect: (meeting: MeetingMinute) => void;
    onDelete?: (meeting: MeetingMinute) => void;
    showDelete?: boolean;
}

const MeetingList: React.FC<MeetingListProps> = ({
                                                     meetings,
                                                     onSelect,
                                                     onDelete,
                                                     showDelete = false
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

    return (
        <table className="meeting-list-table">
            <thead>
            <tr>
                <th>회의명</th>
                <th>회의일시</th>
                <th>연계프로젝트</th>
                <th>작성자</th>
                <th>참석자</th>
                <th>태그</th>
                <th>상태</th>
                {showDelete && <th>작업</th>}
            </tr>
            </thead>
            <tbody>
            {meetings.length === 0 ? (
                <tr>
                    <td colSpan={showDelete ? 8 : 7} className="no-results">회의록이 없습니다.</td>
                </tr>
            ) : (
                meetings.map(meeting => (
                    <tr key={meeting.meeting_id} onClick={() => onSelect(meeting)} className="meeting-list-item" title="클릭하여 상세 정보 보기">
                        <td className="meeting-title-cell">
                            <span className="meeting-link">{meeting.meeting_title}</span>
                        </td>
                        <td>{formatDateTime(meeting.meeting_datetime)}</td>
                        <td title={meeting.project_name}>{meeting.project_name || 'N/A'}</td>
                        <td>{meeting.creator_name || 'N/A'}</td>
                        <td title={meeting.attendees_display}>{meeting.attendees_display}</td>
                        <td>
                            {meeting.tags?.map(tag => (
                                <span key={tag} className="tag-badge" title={tag}>{tag}</span>
                            ))}
                        </td>
                        <td>{meeting.has_llm_documents ? '✔️ AI 생성' : '-'}</td>
                        {showDelete && (
                            <td onClick={(e) => e.stopPropagation()}>
                                <button
                                    className="btn-delete-mini"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete?.(meeting);
                                    }}
                                    title="삭제"
                                >
                                    🗑️
                                </button>
                            </td>
                        )}
                    </tr>
                ))
            )}
            </tbody>
        </table>
    );
};

export default MeetingList;