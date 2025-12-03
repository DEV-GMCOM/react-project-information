// src/components/dashboard/ProjectDetailModal.tsx
import React, { useState, useEffect } from 'react';
import { ProjectBasicInfo, PROJECT_PROJECT_STATUS_LABELS, PROJECT_PROJECT_STATUS_COLORS } from '../../api/types';
import { dashboardService } from '../../api/services/dashboardService';
import './ProjectDetailModal.css';

interface ProjectDetailModalProps {
    projectId: number | null;
    isOpen: boolean;
    onClose: () => void;
    onStatusChange?: (projectId: number, newStatus: string) => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
    projectId,
    isOpen,
    onClose,
    onStatusChange
}) => {
    const [project, setProject] = useState<ProjectBasicInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [editingStatus, setEditingStatus] = useState(false);
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        if (projectId && isOpen) {
            loadProjectDetail();
        }
    }, [projectId, isOpen]);

    const loadProjectDetail = async () => {
        if (!projectId) return;

        try {
            setLoading(true);
            // 프로젝트 상세 정보 로드
            const filter = { period_type: 'yearly' as const };
            const response = await dashboardService.getProjectList(filter, 0, 100);
            const foundProject = response.items.find(p => p.project_id === projectId);
            if (foundProject) {
                setProject(foundProject);
                setNewStatus(foundProject.status);
            }
        } catch (err) {
            console.error('Project detail loading error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!projectId || !newStatus) return;

        try {
            await dashboardService.updateProjectStatus({
                project_id: projectId,
                new_status: newStatus
            });
            setEditingStatus(false);
            if (onStatusChange) {
                onStatusChange(projectId, newStatus);
            }
            loadProjectDetail();
        } catch (err) {
            console.error('Status update error:', err);
            alert('상태 변경에 실패했습니다.');
        }
    };

    if (!isOpen) return null;

    const statusOptions = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
        value,
        label
    }));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>프로젝트 상세 정보</h2>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                {loading ? (
                    <div className="modal-loading">
                        <div className="spinner"></div>
                        <p>로딩 중...</p>
                    </div>
                ) : project ? (
                    <div className="modal-body">
                        {/* 프로젝트 기본 정보 */}
                        <div className="info-section">
                            <h3>기본 정보</h3>
                            <div className="info-grid">
                                <div className="info-item full-width">
                                    <label>프로젝트명</label>
                                    <span className="project-name">{project.project_name}</span>
                                </div>
                                <div className="info-item">
                                    <label>유입경로</label>
                                    <span>{project.inflow_path || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>발주처</label>
                                    <span>{project.client || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>담당자</label>
                                    <span>{project.manager || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>행사일</label>
                                    <span>{project.event_date || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 행사 정보 */}
                        <div className="info-section">
                            <h3>행사 정보</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>행사장소</label>
                                    <span>{project.event_location || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>참석대상</label>
                                    <span>{project.attendees || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>행사성격</label>
                                    <span>{project.event_nature || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 일정 정보 */}
                        <div className="info-section">
                            <h3>일정</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>OT 일정</label>
                                    <span>{project.ot_schedule || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>제출 일정</label>
                                    <span>{project.submission_schedule || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>PT 일정</label>
                                    <span>{project.pt_schedule || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 금액 정보 */}
                        <div className="info-section">
                            <h3>금액 정보</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>예산 (단위: 천만원)</label>
                                    <span className="budget-value">{project.budget || '-'}</span>
                                </div>
                                <div className="info-item">
                                    <label>제출/투찰 금액</label>
                                    <span className="budget-value">{project.bid_amount || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 경쟁 정보 */}
                        <div className="info-section">
                            <h3>경쟁 정보</h3>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>예상 경쟁사</label>
                                    <span>{project.expected_competitors || '-'}</span>
                                </div>
                                <div className="info-item full-width">
                                    <label>배점표</label>
                                    <span>{project.score_table || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* 상태 정보 */}
                        <div className="info-section status-section">
                            <h3>프로젝트 상태</h3>
                            <div className="status-row">
                                {editingStatus ? (
                                    <div className="status-edit">
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value)}
                                        >
                                            {statusOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                        <button className="btn-save" onClick={handleStatusUpdate}>
                                            저장
                                        </button>
                                        <button className="btn-cancel" onClick={() => setEditingStatus(false)}>
                                            취소
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <span
                                            className="status-badge large"
                                            style={{
                                                backgroundColor: PROJECT_STATUS_COLORS[project.status as keyof typeof PROJECT_STATUS_COLORS] || '#6B7280'
                                            }}
                                        >
                                            {project.status_label || PROJECT_STATUS_LABELS[project.status as keyof typeof PROJECT_STATUS_LABELS] || project.status}
                                        </span>
                                        <button
                                            className="btn-change-status"
                                            onClick={() => setEditingStatus(true)}
                                        >
                                            상태 변경
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="modal-empty">
                        <p>프로젝트 정보를 찾을 수 없습니다.</p>
                    </div>
                )}

                <div className="modal-footer">
                    <button className="btn-close" onClick={onClose}>
                        닫기
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectDetailModal;
