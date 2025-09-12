// ProjectKickoff.tsx - Git 소스 기반 State Lifting 적용 버전
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
    etc: string;

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
    // ✅ State Lifting: 부모에서 상세 섹션 상태 관리
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
        direction: '',
        resourcePlan: '',
        writerOpinion: ''
    });

    // ✅ 상세 섹션 토글 핸들러 (State Lifting용)
    const handleDetailSectionToggle = (visible: boolean) => {
        setShowProfileTables(visible);
    };

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
                    others: projectData.kickoff_info.other_notes || ''            // other_notes -> others
                }));
            }

            // 작성자 정보 업데이트
            if (projectData.writer_info) {
                setFormData(prev => ({
                    ...prev,
                    writerName: projectData.writer_info.name || '',
                    writerDepartment: projectData.writer_info.department || ''
                }));
            }

            // 프로젝트 ID 저장
            setSelectedProjectId(projectData.project_id);
            setSaveMode('update');

        } catch (error) {
            console.error('프로젝트 데이터 매핑 중 오류:', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.projectName.trim()) {
            alert('프로젝트명을 입력해주세요.');
            return;
        }

        setLoading(true);
        try {
            const submitData = {
                project_id: selectedProjectId,
                basic_info: {
                    project_name: formData.projectName,
                    inflow_path: formData.inflowPath,
                    client: formData.client,
                    client_manager_name: formData.manager,
                    project_period_start: formData.eventDate,
                    event_location: formData.eventLocation,
                    attendees: formData.attendees,
                    business_type: formData.eventNature,
                    ot_schedule: formData.otSchedule,
                    project_period_end: formData.submissionSchedule,
                    contract_amount: formData.expectedRevenue ? parseFloat(formData.expectedRevenue) : null,
                    expected_competitors: formData.expectedCompetitors
                },
                detail_info: {
                    project_background: formData.purposeBackground,
                    project_overview: formData.mainContent,
                    deliverables: formData.coreRequirements,
                    special_requirements: formData.etc
                },
                kickoff_info: {
                    department: formData.department,
                    presenter: formData.presenter,
                    personnel: formData.personnel,
                    collaboration: formData.collaboration,
                    progress_schedule: formData.schedule,
                    other_notes: formData.others
                },
                profile_info: {
                    swot_analysis: formData.swotAnalysis,
                    direction: formData.direction,
                    resource_plan: formData.resourcePlan,
                    writer_opinion: formData.writerOpinion
                },
                writer_info: {
                    name: formData.writerName,
                    department: formData.writerDepartment
                }
            };

            let response;
            if (saveMode === 'insert') {
                response = await apiClient('/projects/', {
                    method: 'POST',
                    data: submitData
                });
                console.log('착수서 신규 저장 완료:', response.data);
                alert('착수서가 성공적으로 저장되었습니다.');
                setSelectedProjectId(response.data.project_id);
                setSaveMode('update');
            } else {
                response = await apiClient(`/projects/${selectedProjectId}/data`, {
                    method: 'PUT',
                    data: submitData
                });
                console.log('착수서 업데이트 완료:', response.data);
                alert('착수서가 성공적으로 업데이트되었습니다.');
            }

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
                    {/* ✅ State Lifting 적용된 ProjectBasicInfoForm */}
                    <ProjectBasicInfoForm
                        formData={formData}
                        // onChange={handleBasicInfoChange}
                        // onProjectSelect={handleProjectSelect}
                        showSearch={true}
                        // ✅ 핵심: 상세 섹션 제어를 부모에서 관리
                        showDetailSection={showProfileTables}           // 부모 상태 전달
                        onDetailSectionChange={handleDetailSectionToggle} // 콜백 전달
                        enableDetailSectionToggle={false}               // 내부 버튼 숨김
                        includeDataSections={["basic", "detail", "profile", "kickoff"]}
                        className="project-section"
                        tableClassName="project-table"
                        inputClassName="project-input"
                    />
                </div>

                {/* ✅ 부모에서 관리하는 외부 테이블들 (기존과 동일하게 유지) */}
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
                                                value={formData.swotAnalysis}
                                                className="kickoff-textarea textarea-large"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">추진 방향성</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="direction"
                                                value={formData.direction}
                                                className="kickoff-textarea textarea-large"
                                                readOnly
                                                style={{ backgroundColor: '#f5f5f5' }}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">내외부 리소스 활용</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="resourcePlan"
                                                value={formData.resourcePlan}
                                                className="kickoff-textarea textarea-large"
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
                                                value={formData.writerOpinion}
                                                className="kickoff-textarea textarea-large"
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

                {/* ✅ 부모에서 관리하는 토글 버튼 */}
                <div className="table-action-section">
                    <button
                        type="button"
                        className="toggle-profile-btn"
                        onClick={() => setShowProfileTables(!showProfileTables)}
                    >
                        Project Profile {showProfileTables ? '숨기기' : '보기'}
                    </button>
                </div>

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
                                    value={formData.department}
                                    onChange={(e) => handleBasicInfoChange('department', e.target.value)}
                                    className="kickoff-input"
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
                                    onChange={(e) => handleBasicInfoChange('presenter', e.target.value)}
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
                                                onChange={(e) => handleBasicInfoChange('personnel', e.target.value)}
                                                placeholder="- 기획자, 디자이너, 개발자 등 투입인력&#10;- PM: 홍길동, 디자이너: 김철수 등"
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
                                                onChange={(e) => handleBasicInfoChange('collaboration', e.target.value)}
                                                placeholder="내부 전담조직 및 참여자 역량&#10;협업 조직: XX사 3D 디자인, 영상팀"
                                                className="kickoff-textarea textarea-medium bullet-textarea"
                                            />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">추진 일정</td>
                            <td className="table-cell-input" colSpan={3}>
                                            <textarea
                                                name="schedule"
                                                value={formData.schedule}
                                                onChange={(e) => handleBasicInfoChange('schedule', e.target.value)}
                                                placeholder="- 주요 마일스톤별 일정&#10;- 1단계: XX일까지 기획안 완료&#10;- 2단계: XX일까지 디자인 완료&#10;- 3단계: XX일까지 최종 검수 완료"
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                            />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">기타</td>
                            <td className="table-cell-input" colSpan={3}>
                                            <textarea
                                                name="others"
                                                value={formData.others}
                                                onChange={(e) => handleBasicInfoChange('others', e.target.value)}
                                                placeholder="기타 참고사항, 특이사항, 위험요소 등"
                                                className="kickoff-textarea textarea-medium"
                                            />
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 섹션 */}
                <div className="button-section">
                    <button onClick={handleSubmit} className="submit-btn" disabled={loading}>
                        {loading ? '저장 중...' : (saveMode === 'insert' ? '착수서 저장' : '착수서 업데이트')}
                    </button>
                    {/*<button onClick={handlePrint} className="print-btn">*/}
                    {/*    인쇄하기*/}
                    {/*</button>*/}
                </div>
            </div>
        </div>
    );
};

export default ProjectKickoffForm;