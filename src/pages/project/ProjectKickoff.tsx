import React, { useState, useRef } from 'react';
import ProjectBasicInfoForm from '../../components/common/ProjectBasicInfoForm';
import {ExtendedProjectData, ProjectBasicInfo} from '../../types/project';
import { handleApiError } from '../../api/utils/errorUtils';
import apiClient from '../../api/utils/apiClient';
import '../../styles/ProjectKickoff.css';

interface UploadedFile {
    id: string;
    name: string;
    size: number;
    type: string;
    uploadedBy: string;
    createdDate: string;
    modifiedDate: string;
    uploadedDate: string;
}

interface ProjectKickoff {
    // 프로젝트 기본 정보
    projectName: string;
    inflowPath: string;
    client: string;
    manager: string;
    eventDate: string;
    eventLocation: string;
    attendees: string;
    eventNature: string;
    otSchedule: string;
    submissionSchedule: string;
    expectedRevenue: string;
    expectedCompetitors: string;
    scoreTable: string;
    bidAmount: string;

    // 프로젝트 상세 정보
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    comparison: string;

    // 프로젝트 착수보고 (실제 git 코드 기준 6개 필드)
    department: string;           // 담당부서
    presenter: string;            // PT발표자
    personnel: string;            // 기획자 (투입인력)
    collaboration: string;        // 협업조직
    schedule: string;             // 추진 일정 (UI에서는 schedule, DB에서는 progress_schedule)
    others: string;               // 기타 (UI에서는 others, DB에서는 other_notes)

    // 작성자 정보
    writerName: string;
    writerDepartment: string;

    // 프로젝트 검토 데이터
    swotAnalysis?: string;
    direction?: string;
    resourcePlan?: string;
    writerOpinion?: string;
}

const ProjectKickoffForm: React.FC = () => {
    const [showProfileTables, setShowProfileTables] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 새로 추가된 상태들
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [saveMode, setSaveMode] = useState<'insert' | 'update'>('insert');
    const [loading, setLoading] = useState(false);

    const allowedExtensions = ['txt', 'text', 'md', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg'];

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Byte';
        const k = 1024;
        const sizes = ['Byte', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleString('ko-KR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const validateFileType = (fileName: string): boolean => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return extension ? allowedExtensions.includes(extension) : false;
    };

    const processFiles = (files: FileList) => {
        const validFiles: UploadedFile[] = [];

        Array.from(files).forEach(file => {
            if (validateFileType(file.name)) {
                const uploadedFile: UploadedFile = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: file.name,
                    size: file.size,
                    type: file.type || 'application/octet-stream',
                    uploadedBy: '사용자명', // 임시 사용자명
                    createdDate: formatDate(new Date(file.lastModified || Date.now())),
                    modifiedDate: formatDate(new Date(file.lastModified || Date.now())),
                    uploadedDate: formatDate(new Date())
                };
                validFiles.push(uploadedFile);
            } else {
                alert(`지원하지 않는 파일 형식입니다: ${file.name}\n지원 형식: ${allowedExtensions.join(', ')}`);
            }
        });

        if (validFiles.length > 0) {
            setUploadedFiles(prev => [...prev, ...validFiles]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            processFiles(files);
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            processFiles(files);
        }
        // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const removeFile = (fileId: string) => {
        setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    };

    // formData에서 plannedExpense 제거
    const [formData, setFormData] = useState<ProjectKickoff>({
        projectName: '',
        inflowPath: '',
        client: '',
        manager: '',
        eventDate: '',
        eventLocation: '',
        attendees: '',
        eventNature: '',
        otSchedule: '',
        submissionSchedule: '',
        expectedRevenue: '',
        expectedCompetitors: '',
        scoreTable: '',
        bidAmount: '',
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        department: '',
        presenter: '',
        personnel: '',
        collaboration: '',
        schedule: '',
        others: '',
        writerName: '',
        writerDepartment: '',
        swotAnalysis: '',
        direction: '',
        resourcePlan: '',
        writerOpinion: ''
    });

    // const handleBasicInfoChange = (name: keyof ProjectBasicInfo, value: string) => {
    const handleBasicInfoChange = (name: keyof ExtendedProjectData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 프로젝트 선택 시 호출되는 핸들러 추가
    const handleProjectSelect = async (projectData: any) => {
        try {
            console.log('프로젝트 선택 데이터:', projectData);

            // 프로파일 및 착수보고 데이터 매핑
            if (projectData.profile_info) {
                setFormData(prev => ({
                    ...prev,
                    swotAnalysis: projectData.profile_info.swot_analysis || '',
                    direction: projectData.profile_info.direction || '',
                    resourcePlan: projectData.profile_info.resource_plan || '',
                    writerOpinion: projectData.profile_info.writer_opinion || ''
                }));
            }

            if (projectData.kickoff_info) {
                setFormData(prev => ({
                    ...prev,
                    department: projectData.kickoff_info.department || '',
                    presenter: projectData.kickoff_info.presenter || '',
                    personnel: projectData.kickoff_info.personnel || '',
                    collaboration: projectData.kickoff_info.collaboration || '',
                    schedule: projectData.kickoff_info.progress_schedule || '',    // progress_schedule -> schedule
                    others: projectData.kickoff_info.other_notes || ''           // other_notes -> others
                }));
                setSaveMode('update');
            } else {
                setSaveMode('insert');
            }

            setSelectedProjectId(projectData.project_id);
            setShowProfileTables(true);

        } catch (error) {
            const errorMessage = handleApiError(error);
            alert(`프로젝트 데이터 처리 중 오류가 발생했습니다: ${errorMessage}`);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 텍스트에 자동으로 bullet point 추가하는 함수
    const formatWithBullets = (text: string): string => {
        if (!text) return text;

        const lines = text.split('\n');
        return lines.map(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('•') && !trimmedLine.startsWith('-')) {
                return `• ${trimmedLine}`;
            }
            return line;
        }).join('\n');
    };

    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 착수보고 저장 로직으로 handleSubmit 수정
    const handleSubmit = async () => {
        if (!selectedProjectId) {
            alert('프로젝트를 먼저 선택해주세요.');
            return;
        }

        try {
            setLoading(true);

            // UI 필드명을 API 필드명으로 매핑
            const kickoffData = {
                department: formData.department,
                presenter: formData.presenter,
                personnel: formData.personnel,
                collaboration: formData.collaboration,
                progress_schedule: formData.schedule,    // schedule -> progress_schedule
                other_notes: formData.others            // others -> other_notes
            };

            await apiClient(`/projects/${selectedProjectId}/kickoff`, {
                method: 'POST',
                data: kickoffData
            });

            alert('프로젝트 착수보고가 저장되었습니다.');
            setSaveMode('update');

        } catch (error) {
            const errorMessage = handleApiError(error);
            alert(`저장 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="project-kickoff-container">
            {/* 헤더 */}
            <div className="kickoff-header">
                <div>
                    <h1 className="kickoff-title">
                        별텀 2-3. 프로젝트 착수서 양식
                    </h1>
                </div>
                <div className="kickoff-logo">
                    GMCOM
                </div>
            </div>

            {/* 메인 착수서 섹션 */}
            <div className="kickoff-main">
                <div className="kickoff-title-section">
                    <h2 className="kickoff-subtitle">
                        프로젝트 착수서
                    </h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>
                                최종 작성자 : {formData.writerName} {formData.writerDepartment && `(${formData.writerDepartment})`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-main">
                    {/* 공통 컴포넌트 사용 - 검색 기능 유지 */}
                    <ProjectBasicInfoForm
                        formData={formData}
                        onChange={handleBasicInfoChange}
                        onProjectSelect={handleProjectSelect} // 프로젝트 선택 핸들러 추가
                        showSearch={true}  // 검색 기능 유지
                        showDetailSection={true}              // ✓ 이제 인식됨
                        includeDataSections={["basic", "detail", "profile", "kickoff"]}  // ✓ 이제 인식됨
                        readOnly={true}
                        className="project-section"
                        tableClassName="project-table"
                        inputClassName="project-input"
                    />
                </div>

                {/* Project Profile 토글 버튼 */}
                <div className="table-action-section">
                    <button
                        type="button"
                        className="toggle-profile-btn"
                        onClick={() => setShowProfileTables(!showProfileTables)}
                    >
                        Project Profile {showProfileTables ? '숨기기' : '보기'}
                    </button>
                </div>

                {/* 프로젝트 상세 정보 (5x2 테이블) - 토글 애니메이션 */}
                <div
                    className={`profile-tables-container ${showProfileTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}
                    style={{
                        opacity: showProfileTables ? 1 : 0,
                        maxHeight: showProfileTables ? '2000px' : '0',
                        transform: showProfileTables ? 'translateY(0)' : 'translateY(-20px)',
                        marginBottom: showProfileTables ? '0' : '0',
                        transition: 'all 1s ease-in-out'
                    }}
                >
                    {showProfileTables && (
                        <>
                            <div className="kickoff-section">
                                <h3 className="section-header">
                                    ■ 프로젝트 상세 정보 (읽기 전용)
                                </h3>
                                <table className="kickoff-table">
                                    <tbody>
                                    <tr>
                                        <td className="table-header">구분</td>
                                        <td className="table-header">내용</td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">목적 및 배경</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="purposeBackground"
                                                value={formData.purposeBackground}
                                                className="kickoff-textarea textarea-medium"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">주요 내용</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="mainContent"
                                                value={formData.mainContent}
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">핵심 요구사항</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="coreRequirements"
                                                value={formData.coreRequirements}
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">비교</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="comparison"
                                                value={formData.comparison}
                                                className="kickoff-textarea textarea-medium"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* 프로젝트 검토 (ProjectProfile.tsx에서 가져온 테이블) */}
                            <div className="kickoff-section">
                                <h3 className="section-header">
                                    ■ 프로젝트 검토 (읽기 전용)
                                </h3>

                                <table className="kickoff-table">
                                    <tbody>
                                    <tr>
                                        <td className="table-header">구분</td>
                                        <td className="table-header">내용</td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">SWOT 분석</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="swotAnalysis"
                                                value={formData.swotAnalysis || ''}
                                                className="kickoff-textarea textarea-xlarge bullet-textarea"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">추진방향</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="direction"
                                                value={formData.direction || ''}
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">리소스 활용방안</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="resourcePlan"
                                                value={formData.resourcePlan || ''}
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">작성자 의견</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="writerOpinion"
                                                value={formData.writerOpinion || ''}
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* 프로젝트 착수보고 (8x2 테이블) */}
                <div className="kickoff-section">
                    <h3 className="section-header">
                        ■ 프로젝트 착수보고
                    </h3>

                    <table className="kickoff-table">
                        <tbody>
                        <tr>
                            <td className="table-header">구분</td>
                            <td className="table-header">내용</td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">담당부서</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="department"
                                    value={formData.department}
                                    onChange={handleBulletTextChange}
                                    placeholder="X본부 Y팀"
                                    className="kickoff-textarea textarea-small bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">PT발표자</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    name="presenter"
                                    value={formData.presenter}
                                    onChange={handleInputChange}
                                    className="kickoff-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">
                                기획자
                            </td>
                            <td className="table-cell-input">
                                <textarea
                                    name="personnel"
                                    value={formData.personnel}
                                    onChange={handleBulletTextChange}
                                    placeholder="메인 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )&#10;서브 XXX PM ( 기여도 YY% 예정 )"
                                    className="kickoff-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">협업조직</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="collaboration"
                                    value={formData.collaboration}
                                    onChange={handleBulletTextChange}
                                    placeholder="키비주얼 : 디자인팀&#10;3D 디자인 : XX 사&#10;영상 : 영상팀"
                                    className="kickoff-textarea textarea-large bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">추진 일정</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="schedule"
                                    value={formData.schedule}
                                    onChange={handleBulletTextChange}
                                    placeholder="기획 Kickoff, Ideation 회의, 디자인 의뢰, 제안서 리뷰, PT 리허설 등 일정&#10;*D-0 일 기준으로 작성"
                                    className="kickoff-textarea textarea-xlarge bullet-textarea"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">기타</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="others"
                                    value={formData.others}
                                    onChange={handleBulletTextChange}
                                    className="kickoff-textarea textarea-medium bullet-textarea"
                                />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* RFP 첨부 버튼 */}
                <div className="table-action-section">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept=".txt,.text,.md,.pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.png,.jpg,.jpeg"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="rfp-attach-btn"
                        onClick={handleFileSelect}
                    >
                        RFP 첨부
                    </button>
                </div>

                {/* 파일 업로드 영역 */}
                <div className="file-upload-section">
                    <div
                        className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={handleFileSelect}
                    >
                        {uploadedFiles.length === 0 ? (
                            <div className="drop-zone-message">
                                <div className="drop-zone-icon">📁</div>
                                <div className="drop-zone-text">
                                    <p>파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                                    <p className="drop-zone-hint">
                                        지원 형식: {allowedExtensions.join(', ')}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="file-list">
                                {uploadedFiles.map(file => (
                                    <div key={file.id} className="file-item">
                                        <div className="file-info">
                                            <div className="file-name">{file.name}</div>
                                            <div className="file-details">
                                                <span className="file-size">{formatFileSize(file.size)}</span>
                                                <span className="file-uploader">업로드: {file.uploadedBy}</span>
                                            </div>
                                            <div className="file-dates">
                                                <div className="file-date">생성: {file.createdDate}</div>
                                                <div className="file-date">수정: {file.modifiedDate}</div>
                                                <div className="file-date">업로드: {file.uploadedDate}</div>
                                            </div>
                                        </div>
                                        <button
                                            className="file-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removeFile(file.id);
                                            }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                                <div className="drop-zone-add-more" onClick={handleFileSelect}>
                                    <span>+ 더 많은 파일 추가</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 버튼 영역 */}
                <div className="button-section">
                    <button
                        onClick={handleSubmit}
                        className="submit-btn"
                        disabled={loading || !selectedProjectId}
                    >
                        {loading ? '저장 중...' : (saveMode === 'update' ? '수정' : '저장')}
                    </button>
                    <button onClick={handlePrint} className="print-btn">
                        인쇄
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectKickoffForm;