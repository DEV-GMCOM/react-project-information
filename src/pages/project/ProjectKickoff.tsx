// src/pages/project/ProjectKickoff.tsx - 파일 업로드 기능 통합
import React, { useState, useEffect, useCallback } from 'react';
import ProjectBasicInfoForm from '../../components/common/ProjectBasicInfoForm';
import FileUploadComponent from '../../components/project/FileUploadComponent';
import UploadedFilesList from '../../components/project/UploadedFilesList';
import { ExtendedProjectData } from '../../types/project';
import { handleApiError } from '../../api/utils/errorUtils';
import { projectKickoffService } from '../../api/services/projectKickoffService';
import { UploadedFileInfo } from '../../api/services/fileUploadService';
import '../../styles/ProjectKickoff.css';

interface ProjectKickoff {
    // 기존 프로젝트 정보들...
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
    purposeBackground: string;
    mainContent: string;
    coreRequirements: string;
    etc: string;

    // 착수보고 필드들
    department: string;
    presenter: string;
    personnel: string;
    collaboration: string;
    schedule: string;
    others: string;

    // 작성자 정보
    writerName: string;
    writerDepartment: string;

    // 검토 정보
    swotAnalysis?: string;
    resourcePlan?: string;
    writerOpinion?: string;
}

const ProjectKickoffForm: React.FC = () => {
    // 기존 상태들...
    const [showProfileTables, setShowProfileTables] = useState(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [saveMode, setSaveMode] = useState<'insert' | 'update'>('insert');
    const [loading, setLoading] = useState(false);

    // 파일 업로드 관련 상태
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [uploadedFilesCount, setUploadedFilesCount] = useState(0);

    // 폼 데이터 상태
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
        etc: '',
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
        writerOpinion: ''
    });

    // 프로젝트 ID 선택 시 호출되는 핸들러
    const handleProjectIdSelected = async (projectId: number) => {
        console.log('프로젝트 ID 수신:', projectId);
        setSelectedProjectId(projectId);

        try {
            setLoading(true);
            // 기존 프로젝트 데이터 로드 로직...
            // (기존 코드와 동일)

            setFormData(prev => ({
                ...prev,
                writerName: '작성자명',
                writerDepartment: '소속부서'
            }));

        } catch (error) {
            const errorMessage = handleApiError(error);
            console.error('프로젝트 데이터 로드 오류:', errorMessage);
            alert(`프로젝트 데이터를 불러오는 중 오류가 발생했습니다: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    // 토글 상태 변경 핸들러
    const handleToggleStateChange = (isVisible: boolean) => {
        console.log('토글 상태 변경:', isVisible);
        setShowProfileTables(isVisible);
    };

    // 기본 정보 변경 핸들러
    const handleBasicInfoChange = (name: keyof ExtendedProjectData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 입력 변경 핸들러
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Bullet point 자동 추가
    const handleBulletTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // 파일 업로드 성공 핸들러
    const handleFilesUploaded = useCallback((files: UploadedFileInfo[]) => {
        console.log('파일 업로드 완료:', files);
        setUploadedFilesCount(prev => prev + files.length);
        // 필요시 알림 표시
        if (files.length === 1) {
            alert(`${files[0].original_file_name} 파일이 업로드되었습니다.`);
        } else {
            alert(`${files.length}개 파일이 업로드되었습니다.`);
        }
    }, []);

    // 파일 삭제 핸들러
    const handleFileDeleted = useCallback((fileId: number) => {
        console.log('파일 삭제됨:', fileId);
        setUploadedFilesCount(prev => Math.max(0, prev - 1));
    }, []);

    // 파일 관련 에러 핸들러
    const handleFileError = useCallback((error: string) => {
        console.error('파일 오류:', error);
        alert(error);
    }, []);

    // RFP 첨부 버튼 클릭 핸들러
    const handleRfpAttachClick = () => {
        if (!selectedProjectId) {
            alert('프로젝트를 먼저 선택해주세요.');
            return;
        }
        setShowFileUpload(true);
    };

    // 저장 핸들러
    const handleSubmit = async () => {
        if (!selectedProjectId) {
            alert('프로젝트를 먼저 선택해주세요.');
            return;
        }

        try {
            setLoading(true);

            const kickoffData = {
                project_id: selectedProjectId,
                department: formData.department,
                presenter: formData.presenter,
                personnel: formData.personnel,
                collaboration: formData.collaboration,
                progress_schedule: formData.schedule,
                other_notes: formData.others
            };

            await projectKickoffService.upsertKickoff(selectedProjectId, kickoffData);
            alert('착수보고가 성공적으로 저장되었습니다.');
            setSaveMode('update');
        } catch (error) {
            const errorMessage = handleApiError(error);
            alert(`저장 중 오류가 발생했습니다: ${errorMessage}`);
            console.error('저장 오류:', error);
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
                    {/* ProjectBasicInfoForm 컴포넌트 */}
                    <ProjectBasicInfoForm
                        formData={formData}
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
                    />
                </div>

                {/* 프로젝트 검토 및 착수보고 테이블들 */}
                <div className={`profile-tables-container ${showProfileTables ? 'show' : 'hide'}`}>
                    {/* 기존 테이블들... (생략) */}

                    {/* 착수보고 테이블 */}
                    <div className="kickoff-section">
                        <h3 className="section-title">프로젝트 착수보고</h3>
                        <table className="kickoff-table">
                            <tbody>
                            <tr>
                                <td className="table-cell table-cell-label">담당부서</td>
                                <td className="table-cell-input">
                                        <textarea
                                            name="department"
                                            value={formData.department}
                                            onChange={handleBulletTextChange}
                                            placeholder="담당부서 입력"
                                            className="kickoff-textarea textarea-small bullet-textarea"
                                        />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">PT발표자</td>
                                <td className="table-cell-input">
                                        <textarea
                                            name="presenter"
                                            value={formData.presenter}
                                            onChange={handleBulletTextChange}
                                            placeholder="PT발표자 입력"
                                            className="kickoff-textarea textarea-small bullet-textarea"
                                        />
                                </td>
                            </tr>
                            <tr>
                                <td className="table-cell table-cell-label">기획자(투입인력)</td>
                                <td className="table-cell-input">
                                        <textarea
                                            name="personnel"
                                            value={formData.personnel}
                                            onChange={handleBulletTextChange}
                                            placeholder="투입인력 정보 입력"
                                            className="kickoff-textarea textarea-medium bullet-textarea"
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
                                            placeholder="협업조직 정보 입력"
                                            className="kickoff-textarea textarea-medium bullet-textarea"
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
                </div>

                {/* RFP 첨부 버튼 */}
                <div className="table-action-section">
                    <button
                        type="button"
                        className="rfp-attach-btn"
                        onClick={handleRfpAttachClick}
                        disabled={!selectedProjectId}
                    >
                        RFP 첨부 {uploadedFilesCount > 0 && `(${uploadedFilesCount})`}
                    </button>
                </div>

                {/* 파일 업로드 섹션 */}
                {showFileUpload && selectedProjectId && (
                    <div className="file-upload-section">
                        <div className="file-section-header">
                            <h4>RFP 파일 첨부</h4>
                            <button
                                type="button"
                                className="close-upload-btn"
                                onClick={() => setShowFileUpload(false)}
                            >
                                ✕ 닫기
                            </button>
                        </div>

                        {/* 파일 업로드 컴포넌트 */}
                        <FileUploadComponent
                            projectId={selectedProjectId}
                            onFilesUploaded={handleFilesUploaded}
                            onError={handleFileError}
                            className="rfp-file-upload"
                            multiple={true}
                            attachmentType="rfp"
                        />

                        {/* 업로드된 파일 목록 */}
                        <UploadedFilesList
                            projectId={selectedProjectId}
                            attachmentType="rfp"
                            onFileDeleted={handleFileDeleted}
                            onError={handleFileError}
                            className="rfp-files-list"
                            showDeleteButton={true}
                            showDownloadButton={true}
                        />
                    </div>
                )}

                {/* 기존에 업로드된 파일이 있는 경우 간단한 요약 표시 */}
                {!showFileUpload && selectedProjectId && uploadedFilesCount > 0 && (
                    <div className="file-summary-section">
                        <div className="file-summary">
                            📎 첨부된 파일: {uploadedFilesCount}개
                            <button
                                type="button"
                                className="view-files-btn"
                                onClick={() => setShowFileUpload(true)}
                            >
                                파일 보기/관리
                            </button>
                        </div>
                    </div>
                )}

                {/* 버튼 섹션 */}
                <div className="button-section">
                    <button
                        type="button"
                        className="submit-btn"
                        onClick={handleSubmit}
                        disabled={loading || !selectedProjectId}
                    >
                        {loading ? '저장 중...' : (saveMode === 'insert' ? '저장' : '수정')}
                    </button>
                    <button
                        type="button"
                        className="print-btn"
                        onClick={handlePrint}
                    >
                        인쇄
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProjectKickoffForm;