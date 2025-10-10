// src/pages/project/ProjectKickoff.tsx - 완전 정리된 최종 버전
import React, { useState, useRef } from 'react';
import ProjectBasicInfoForm from '../../components/common/ProjectBasicInfoForm';
import { ExtendedProjectData } from '../../types/project';
import { handleApiError } from '../../api/utils/errorUtils';
import apiClient from '../../api/utils/apiClient';
import { projectKickoffService } from '../../api/services/projectKickoffService';
import { fileUploadService, FileAttachmentInfo } from '../../api/services/fileUploadService';
import '../../styles/ProjectKickoff.css';

// 착수보고에서만 관리할 데이터
interface KickoffFormData {
    // 착수보고 전용 필드들
    department: string;           // 담당부서
    presenter: string;            // PT발표자
    personnel: string;            // 기획자 (투입인력)
    collaboration: string;        // 협업조직
    schedule: string;             // 추진 일정
    others: string;               // 기타

    // 작성자 정보
    writerName: string;
    writerDepartment: string;

    // 프로젝트 검토 데이터 (읽기 전용)
    swotAnalysis?: string;        // SWOT 분석
    resourcePlan?: string;        // 리소스 활용방안
    writerOpinion?: string;       // 작성자 의견
    proceedDecision?: string;     // 진행부결사유 (proceed_decision)
}

const ProjectKickoffForm: React.FC = () => {
    // 기본 상태 관리
    const [showProfileTables, setShowProfileTables] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [saveMode, setSaveMode] = useState<'insert' | 'update'>('insert');
    const [loading, setLoading] = useState(false);

    // 파일 관련 상태
    const [serverFiles, setServerFiles] = useState<FileAttachmentInfo[]>([]);
    const [isFileUploading, setIsFileUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const allowedExtensions = ['txt', 'text', 'md', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'zip', 'rar', '7z'];

    // ProjectBasicInfoForm에서 관리할 기본/상세 정보
    const [basicFormData, setBasicFormData] = useState<ExtendedProjectData>({
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
    });

    // 착수보고 전용 데이터
    const [kickoffData, setKickoffData] = useState<KickoffFormData>({
        department: '',
        presenter: '',
        personnel: '',
        collaboration: '',
        schedule: '',
        others: '',
        writerName: '',
        writerDepartment: '',
        swotAnalysis: '',
        resourcePlan: '',
        writerOpinion: '',
        proceedDecision: ''
    });

    // 파일 크기 포맷팅
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Byte';
        const k = 1024;
        const sizes = ['Byte', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // 파일 확장자 검증
    const validateFileType = (fileName: string): boolean => {
        const extension = fileName.split('.').pop()?.toLowerCase();
        return extension ? allowedExtensions.includes(extension) : false;
    };

    // 프로젝트 ID 선택 시 데이터 로드
    const handleProjectIdSelected = async (projectId: number) => {
        console.log('프로젝트 ID 수신:', projectId);
        setSelectedProjectId(projectId);

        try {
            setLoading(true);

            // // 1. 프로젝트 검토 데이터 가져오기 (profile)
            // const profileResponse = await apiClient(`/projects/${projectId}/profile`);
            //
            // if (profileResponse.data) {
            //     setKickoffData(prev => ({
            //         ...prev,
            //         swotAnalysis: profileResponse.data.swot_analysis || '',
            //         resourcePlan: profileResponse.data.resource_plan || '',
            //         writerOpinion: profileResponse.data.writer_opinion || '',
            //         proceedDecision: profileResponse.data.proceed_decision || '' // 진행부결사유 올바른 매핑
            //     }));
            // }

            // 2. 착수보고 데이터 가져오기 (kickoff)
            const kickoffResponse = await apiClient(`/projects/${projectId}/kickoff`);

            if (kickoffResponse.data) {
                setKickoffData(prev => ({
                    ...prev,
                    department: kickoffResponse.data.department || '',
                    presenter: kickoffResponse.data.presenter || '',
                    personnel: kickoffResponse.data.personnel || '',
                    collaboration: kickoffResponse.data.collaboration || '',
                    schedule: kickoffResponse.data.progress_schedule || '',
                    others: kickoffResponse.data.other_notes || ''
                }));
                setSaveMode('update');
            } else {
                setSaveMode('insert');
            }

            // 3. 작성자 정보 설정
            setKickoffData(prev => ({
                ...prev,
                writerName: '작성자명',
                writerDepartment: '소속부서'
            }));

            // 4. 프로젝트 파일 목록 로드
            await loadProjectFiles(projectId);

        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error('프로젝트 데이터 로드 오류:', errorMessage);
            alert(`프로젝트 데이터를 불러오는 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // 프로젝트 파일 목록 로드
    const loadProjectFiles = async (projectId: number) => {
        try {
            const files = await fileUploadService.getRfpFiles(projectId);
            setServerFiles(files);
        } catch (error) {
            console.error('파일 목록 로드 실패:', error);
        }
    };

    // 토글 상태 변경
    const handleToggleStateChange = (isVisible: boolean) => {
        setShowProfileTables(isVisible);
    };

    // ProjectBasicInfoForm 변경 핸들러
    const handleBasicInfoChange = (name: keyof ExtendedProjectData, value: string) => {
        setBasicFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 착수보고 데이터 변경 핸들러
    const handleKickoffChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setKickoffData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 파일 업로드 처리
    const uploadFiles = async (files: FileList) => {
        if (!selectedProjectId) {
            alert('프로젝트를 먼저 선택해주세요.');
            return;
        }

        setIsFileUploading(true);
        const validFiles: File[] = [];
        const errors: string[] = [];

        Array.from(files).forEach(file => {
            if (validateFileType(file.name)) {
                if (file.size <= 100 * 1024 * 1024) {
                    validFiles.push(file);
                } else {
                    errors.push(`파일 크기가 너무 큽니다: ${file.name} (최대 100MB)`);
                }
            } else {
                errors.push(`지원하지 않는 파일 형식입니다: ${file.name}`);
            }
        });

        if (errors.length > 0) {
            alert(errors.join('\n'));
        }

        if (validFiles.length === 0) {
            setIsFileUploading(false);
            return;
        }

        try {
            const uploadPromises = validFiles.map(file =>
                fileUploadService.uploadFile(selectedProjectId, file, 'rfp')
            );

            const uploadedFiles = await Promise.all(uploadPromises);

            setServerFiles(prev => [...prev, ...uploadedFiles.map(file => ({
                id: file.id,
                project_id: selectedProjectId,
                file_name: file.file_name,
                original_file_name: file.original_file_name,
                file_path: '',
                file_size: file.file_size,
                file_type: file.file_type || '',
                mime_type: '',
                attachment_type: 'rfp',
                uploaded_by: 1,
                uploaded_at: file.uploaded_at,
                is_active: true,
                is_readonly: true,
                access_level: 'project'
            }))]);

            alert(`${uploadedFiles.length}개 파일이 성공적으로 업로드되었습니다.`);

        } catch (error: any) {
            console.error('파일 업로드 실패:', error);
            alert(`파일 업로드 실패: ${error.message || '알 수 없는 오류'}`);
        } finally {
            setIsFileUploading(false);
        }
    };

    // 파일 다운로드
    const handleFileDownload = async (file: FileAttachmentInfo) => {
        if (!selectedProjectId) return;

        try {
            await fileUploadService.downloadFile(selectedProjectId, file.id, file.original_file_name);
        } catch (error: any) {
            alert(error.message || '파일 다운로드에 실패했습니다.');
        }
    };

    // 파일 삭제
    const handleFileDelete = async (file: FileAttachmentInfo) => {
        if (!selectedProjectId) return;

        if (!confirm(`'${file.original_file_name}' 파일을 삭제하시겠습니까?`)) {
            return;
        }

        try {
            await fileUploadService.deleteFile(selectedProjectId, file.id);
            setServerFiles(prev => prev.filter(f => f.id !== file.id));
            alert('파일이 삭제되었습니다.');
        } catch (error: any) {
            alert(error.message || '파일 삭제에 실패했습니다.');
        }
    };

    // 드래그 앤 드롭 이벤트들
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
            uploadFiles(files);
        }
    };

    const handleFileSelect = () => {
        fileInputRef.current?.click();
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            uploadFiles(files);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // 착수보고 저장
    const handleSubmit = async () => {
        if (!selectedProjectId) {
            alert('프로젝트를 먼저 선택해주세요.');
            return;
        }

        try {
            setLoading(true);

            const submitData = {
                project_id: selectedProjectId,
                department: kickoffData.department,
                presenter: kickoffData.presenter,
                personnel: kickoffData.personnel,
                collaboration: kickoffData.collaboration,
                progress_schedule: kickoffData.schedule,
                other_notes: kickoffData.others
            };

            await projectKickoffService.upsertKickoff(selectedProjectId, submitData);
            alert('착수보고가 성공적으로 저장되었습니다.');
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
                        별첨 2-3. 프로젝트 착수서 양식
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
                                최종 작성자 : {kickoffData.writerName} {kickoffData.writerDepartment && `(${kickoffData.writerDepartment})`}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="profile-main">
                    {/* ProjectBasicInfoForm 컴포넌트 - 기본/상세 정보 관리 */}
                    <ProjectBasicInfoForm
                        formData={basicFormData}
                        onChange={handleBasicInfoChange}
                        showSearch={true}
                        onProjectIdSelected={handleProjectIdSelected}
                        onDetailSectionChange={handleToggleStateChange}
                        showDetailSection={showProfileTables}
                        enableDetailSectionToggle={true}
                        includeDataSections={["basic", "detail"]}
                        className="project-section"
                        tableClassName="project-table"
                        inputClassName="project-input"
                        readOnly={true}
                    />
                </div>

                {/*/!* 프로젝트 검토 테이블 (토글로 제어) *!/*/}
                {/*<div*/}
                {/*    className={`profile-tables-container ${showProfileTables ? 'profile-tables-enter-active' : 'profile-tables-exit-active'}`}*/}
                {/*    style={{*/}
                {/*        opacity: showProfileTables ? 1 : 0,*/}
                {/*        maxHeight: showProfileTables ? '2000px' : '0',*/}
                {/*        transform: showProfileTables ? 'translateY(0)' : 'translateY(-20px)',*/}
                {/*        transition: 'all 1s ease-in-out'*/}
                {/*    }}*/}
                {/*>*/}
                {/*    {showProfileTables && (*/}
                {/*        <div className="kickoff-section">*/}
                {/*            <h3 className="section-header">*/}
                {/*                🔒 프로젝트 검토*/}
                {/*            </h3>*/}
                {/*            <table className="kickoff-table">*/}
                {/*                <tbody>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-header">구분</td>*/}
                {/*                    <td className="table-header">내용</td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">SWOT 분석</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="swotAnalysis"*/}
                {/*                            value={kickoffData.swotAnalysis || ''}*/}
                {/*                            className="kickoff-textarea textarea-xlarge bullet-textarea"*/}
                {/*                            readOnly*/}
                {/*                            style={{ backgroundColor: '#f5f5f5' }}*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">리소스 활용방안</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="resourcePlan"*/}
                {/*                            value={kickoffData.resourcePlan || ''}*/}
                {/*                            className="kickoff-textarea textarea-large bullet-textarea"*/}
                {/*                            readOnly*/}
                {/*                            style={{ backgroundColor: '#f5f5f5' }}*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">작성자 의견</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="writerOpinion"*/}
                {/*                            value={kickoffData.writerOpinion || ''}*/}
                {/*                            className="kickoff-textarea textarea-large bullet-textarea"*/}
                {/*                            readOnly*/}
                {/*                            style={{ backgroundColor: '#f5f5f5' }}*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                <tr>*/}
                {/*                    <td className="table-cell table-cell-label">진행 부결 사유</td>*/}
                {/*                    <td className="table-cell-input">*/}
                {/*                        <textarea*/}
                {/*                            name="proceedDecision"*/}
                {/*                            value={kickoffData.proceedDecision || ''}*/}
                {/*                            className="kickoff-textarea textarea-large bullet-textarea"*/}
                {/*                            readOnly*/}
                {/*                            style={{ backgroundColor: '#f5f5f5' }}*/}
                {/*                        />*/}
                {/*                    </td>*/}
                {/*                </tr>*/}
                {/*                </tbody>*/}
                {/*            </table>*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</div>*/}

                {/* 프로젝트 착수보고 */}
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
                                    value={kickoffData.department}
                                    onChange={handleKickoffChange}
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
                                    value={kickoffData.presenter}
                                    onChange={handleKickoffChange}
                                    className="kickoff-input"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">기획자</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="personnel"
                                    value={kickoffData.personnel}
                                    onChange={handleKickoffChange}
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
                                    value={kickoffData.collaboration}
                                    onChange={handleKickoffChange}
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
                                    value={kickoffData.schedule}
                                    onChange={handleKickoffChange}
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
                                    value={kickoffData.others}
                                    onChange={handleKickoffChange}
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
                        accept=".txt,.text,.md,.pdf,.ppt,.pptx,.doc,.docx,.hwp,.hwpx,.png,.jpg,.jpeg,.xls,.xlsx,.zip,.rar,.7z"
                        onChange={handleFileInputChange}
                        style={{ display: 'none' }}
                    />
                    <button
                        type="button"
                        className="rfp-attach-btn"
                        onClick={handleFileSelect}
                        disabled={!selectedProjectId || isFileUploading}
                    >
                        {isFileUploading ? '업로드 중...' : `RFP 첨부${serverFiles.length > 0 ? ` (${serverFiles.length})` : ''}`}
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
                        {serverFiles.length === 0 ? (
                            <div className="drop-zone-message">
                                <div className="drop-zone-icon">📁</div>
                                <div className="drop-zone-text">
                                    <p>파일을 여기로 드래그하거나 클릭하여 업로드하세요</p>
                                    <p className="drop-zone-hint">
                                        지원 형식: {allowedExtensions.join(', ')} (최대 100MB)
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="file-list">
                                {serverFiles.map(file => (
                                    <div key={`server-${file.id}`} className="file-item uploaded-file">
                                        <div className="file-info">
                                            <div className="file-name">
                                                <button
                                                    className="file-download-link"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleFileDownload(file);
                                                    }}
                                                    title="클릭하여 다운로드"
                                                >
                                                    📄 {file.original_file_name}
                                                </button>
                                                {file.is_readonly && <span className="readonly-badge">🔒</span>}
                                            </div>
                                            <div className="file-details">
                                                <span className="file-size">{formatFileSize(file.file_size)}</span>
                                                <span className="file-type">{file.file_type?.toUpperCase()}</span>
                                                <span className="upload-date">
                                                    {new Date(file.uploaded_at).toLocaleString('ko-KR')}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="file-remove-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleFileDelete(file);
                                            }}
                                            title="파일 삭제"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                ))}

                                <div
                                    className="drop-zone-add-more"
                                    onClick={handleFileSelect}
                                    style={{ display: isFileUploading ? 'none' : 'flex' }}
                                >
                                    <span>+ 더 많은 파일 추가</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {isFileUploading && (
                        <div className="upload-progress">
                            <div className="upload-spinner">⏳</div>
                            <span>파일을 업로드하고 있습니다...</span>
                        </div>
                    )}
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
                    {/*<button*/}
                    {/*    type="button"*/}
                    {/*    className="print-btn"*/}
                    {/*    onClick={handlePrint}*/}
                    {/*>*/}
                    {/*    인쇄*/}
                    {/*</button>*/}
                </div>
            </div>
        </div>
    );
};

export default ProjectKickoffForm;