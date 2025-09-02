import React, { useState, useRef } from 'react';
import ProjectBasicInfoForm from '../../components/common/ProjectBasicInfoForm';
import { ProjectBasicInfo } from '../../types/project';
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

    // 프로젝트 착수보고
    department: string;
    presenter: string;
    personnel: string;
    collaboration: string;
    plannedExpense: string;
    schedule: string;
    others: string;

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
        plannedExpense: '',
        schedule: '',
        others: '',
        writerName: '',
        writerDepartment: ''
    });

    const handleBasicInfoChange = (name: keyof ProjectBasicInfo, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
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

    const handleSubmit = () => {
        console.log('프로젝트 착수서 저장:', formData);
        // TODO: API 연동
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
                                최종 작성자 :
                            </div>
                        </div>
                    </div>

                    {/*<div className="kickoff-writer">*/}
                    {/*    <div className="writer-form">*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">등록자 이름:</label>*/}
                    {/*            <input*/}
                    {/*                type="text"*/}
                    {/*                name="writerName"*/}
                    {/*                value={formData.writerName}*/}
                    {/*                onChange={handleInputChange}*/}
                    {/*                placeholder="홍길동"*/}
                    {/*                className="writer-field-input"*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*        <div className="writer-field">*/}
                    {/*            <label className="writer-field-label">부서:</label>*/}
                    {/*            <input*/}
                    {/*                type="text"*/}
                    {/*                name="writerDepartment"*/}
                    {/*                value={formData.writerDepartment}*/}
                    {/*                onChange={handleInputChange}*/}
                    {/*                placeholder="영업팀"*/}
                    {/*                className="writer-field-input"*/}
                    {/*            />*/}
                    {/*        </div>*/}
                    {/*    </div>*/}
                    {/*</div>*/}
                </div>

                {/*/!* 프로젝트 기본 정보 (8x4 테이블) *!/*/}
                {/*<div className="kickoff-section">*/}
                {/*    <h3 className="section-header">*/}
                {/*        ■ 프로젝트 기본 정보*/}
                {/*    </h3>*/}

                {/*    <table className="kickoff-table">*/}
                {/*        <tbody>*/}
                {/*        <tr>*/}
                {/*            <td className="table-header">구분</td>*/}
                {/*            <td className="table-header">내용</td>*/}
                {/*            <td className="table-header">구분</td>*/}
                {/*            <td className="table-header">내용</td>*/}
                {/*            /!*<td className="table-header table-header-empty"></td>*!/*/}
                {/*            /!*<td className="table-header table-header-empty"></td>*!/*/}
                {/*        </tr>*/}
                {/*        <tr>*/}
                {/*            <td className="table-cell table-cell-label">프로젝트명</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="projectName"*/}
                {/*                    value={formData.projectName}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*            <td className="table-cell table-cell-label">유입경로</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="inflowPath"*/}
                {/*                    value={formData.inflowPath}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*        </tr>*/}
                {/*        <tr>*/}
                {/*            <td className="table-cell table-cell-label">발주처</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="client"*/}
                {/*                    value={formData.client}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*            <td className="table-cell table-cell-label">담당자</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <div className="input-container">*/}
                {/*                    <input*/}
                {/*                        type="text"*/}
                {/*                        name="manager"*/}
                {/*                        value={formData.manager}*/}
                {/*                        onChange={handleInputChange}*/}
                {/*                        className="kickoff-input input-with-inner-btn"*/}
                {/*                    />*/}
                {/*                    <button*/}
                {/*                        type="button"*/}
                {/*                        className="inner-profile-btn"*/}
                {/*                        onClick={() => {*/}
                {/*                            console.log('광고주 Profile 버튼 클릭');*/}
                {/*                            // TODO: 광고주 Profile 페이지로 이동 또는 모달 열기*/}
                {/*                        }}*/}
                {/*                    >*/}
                {/*                        광고주 Profile*/}
                {/*                    </button>*/}
                {/*                </div>*/}
                {/*            </td>*/}
                {/*        </tr>*/}
                {/*        <tr>*/}
                {/*            <td className="table-cell table-cell-label">행사일</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="date"*/}
                {/*                    name="eventDate"*/}
                {/*                    value={formData.eventDate ? formData.eventDate.replace(/\./g, '-') : ''}*/}
                {/*                    onChange={(e) => {*/}
                {/*                        const selectedDate = e.target.value;*/}
                {/*                        if (selectedDate) {*/}
                {/*                            const formattedDate = selectedDate.replace(/-/g, '.');*/}
                {/*                            setFormData(prev => ({ ...prev, eventDate: formattedDate }));*/}
                {/*                        } else {*/}
                {/*                            setFormData(prev => ({ ...prev, eventDate: '' }));*/}
                {/*                        }*/}
                {/*                    }}*/}
                {/*                    className="kickoff-date-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*            <td className="table-cell table-cell-label">행사장소</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="eventLocation"*/}
                {/*                    value={formData.eventLocation}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*        </tr>*/}
                {/*        <tr>*/}
                {/*            <td className="table-cell table-cell-label">참석대상</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="attendees"*/}
                {/*                    value={formData.attendees}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    placeholder="VIP XX명, 약 XX명 예상"*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*            <td className="table-cell table-cell-label">행사성격</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="eventNature"*/}
                {/*                    value={formData.eventNature}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*        </tr>*/}
                {/*        <tr>*/}
                {/*            <td className="table-cell table-cell-label">OT 일정</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="date"*/}
                {/*                    name="otSchedule"*/}
                {/*                    value={formData.otSchedule ? formData.otSchedule.replace(/\./g, '-') : ''}*/}
                {/*                    onChange={(e) => {*/}
                {/*                        const selectedDate = e.target.value;*/}
                {/*                        if (selectedDate) {*/}
                {/*                            const formattedDate = selectedDate.replace(/-/g, '.');*/}
                {/*                            setFormData(prev => ({ ...prev, otSchedule: formattedDate }));*/}
                {/*                        } else {*/}
                {/*                            setFormData(prev => ({ ...prev, otSchedule: '' }));*/}
                {/*                        }*/}
                {/*                    }}*/}
                {/*                    className="kickoff-date-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*            <td className="table-cell table-cell-label">제출 / PT 일정</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="date"*/}
                {/*                    name="submissionSchedule"*/}
                {/*                    value={formData.submissionSchedule ? formData.submissionSchedule.replace(/\./g, '-') : ''}*/}
                {/*                    onChange={(e) => {*/}
                {/*                        const selectedDate = e.target.value;*/}
                {/*                        if (selectedDate) {*/}
                {/*                            const formattedDate = selectedDate.replace(/-/g, '.');*/}
                {/*                            setFormData(prev => ({ ...prev, submissionSchedule: formattedDate }));*/}
                {/*                        } else {*/}
                {/*                            setFormData(prev => ({ ...prev, submissionSchedule: '' }));*/}
                {/*                        }*/}
                {/*                    }}*/}
                {/*                    className="kickoff-date-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*        </tr>*/}
                {/*        <tr>*/}
                {/*            <td className="table-cell table-cell-label">*/}
                {/*                예상매출<br/>*/}
                {/*                ( 단위 : 억원 )*/}
                {/*            </td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="expectedRevenue"*/}
                {/*                    value={formData.expectedRevenue}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    placeholder="XX.X [ 수익 X.X ]"*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*            <td className="table-cell table-cell-label">예상 경쟁사</td>*/}
                {/*            <td className="table-cell-input">*/}
                {/*                <input*/}
                {/*                    type="text"*/}
                {/*                    name="expectedCompetitors"*/}
                {/*                    value={formData.expectedCompetitors}*/}
                {/*                    onChange={handleInputChange}*/}
                {/*                    placeholder="XX, YY 등 N개사"*/}
                {/*                    className="kickoff-input"*/}
                {/*                />*/}
                {/*            </td>*/}
                {/*        </tr>*/}
                {/*        </tbody>*/}
                {/*    </table>*/}
                {/*</div>*/}
                <div className="profile-main">
                    {/* 공통 컴포넌트 사용 */}
                    <ProjectBasicInfoForm
                        formData={formData}
                        onChange={handleBasicInfoChange}
                        // onProjectSearch={handleProjectSearch}
                        // onCompanySearch={handleCompanySearch}
                        // onContactSearch={handleContactSearch}
                        showSearch={true}
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
                        // marginBottom: showProfileTables ? '30px' : '0',
                        marginBottom: showProfileTables ? '0' : '0',
                        transition: 'all 1s ease-in-out'
                    }}
                >
                    {showProfileTables && (
                        <>
                            <div className="kickoff-section">
                                <h3 className="section-header">
                                    ■ 프로젝트 상세 정보
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
                                                onChange={handleInputChange}
                                                className="kickoff-textarea textarea-medium"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">주요 내용</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="mainContent"
                                                value={formData.mainContent}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">핵심 요구사항</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="coreRequirements"
                                                value={formData.coreRequirements}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 Profile 토대로 수정/변경/업데이트 가능"
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">비교</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="comparison"
                                                value={formData.comparison}
                                                onChange={handleInputChange}
                                                className="kickoff-textarea textarea-medium"
                                            />
                                        </td>
                                    </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* 프로젝트 검토 (ProjectProfile.tsx에서 가져온 테이블) */}
                            <div className="kickoff-section">
                                <h3 className="section-header">
                                    ■ 프로젝트 검토
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
                                                onChange={handleBulletTextChange}
                                                placeholder="강점: 독보적 경험과 노하우 활요, 높은 수주가능성&#10;약점: 내수율 저조&#10;기회: 매출달성에 기여, 차기 Proj 기약&#10;위험: 내정자에 따른 휴먼 리소스 소모"
                                                className="kickoff-textarea textarea-xlarge bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">추진방향</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="direction"
                                                value={formData.direction || ''}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 추진 방향성&#10;리소스 활용방법"
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">리소스 활용방안</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="resourcePlan"
                                                value={formData.resourcePlan || ''}
                                                onChange={handleBulletTextChange}
                                                placeholder="내부 전담조직 및 참여자 역량&#10;협업 조직: XX사 3D 디자인, 영상팀"
                                                className="kickoff-textarea textarea-large bullet-textarea"
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="table-cell table-cell-label">작성자 의견</td>
                                        <td className="table-cell-input">
                                            <textarea
                                                name="writerOpinion"
                                                value={formData.writerOpinion || ''}
                                                onChange={handleBulletTextChange}
                                                placeholder="프로젝트 진행여부 판단 의견 요약"
                                                className="kickoff-textarea textarea-large bullet-textarea"
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
                                투입인력 및<br/>
                                역할, 기여도
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
                            <td className="table-cell table-cell-label">기획 예상경비</td>
                            <td className="table-cell-input">
                                <textarea
                                    name="plannedExpense"
                                    value={formData.plannedExpense}
                                    onChange={handleBulletTextChange}
                                    placeholder="출장, 야근택시비, 용역비 등"
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
                    <button onClick={handleSubmit} className="submit-btn">
                        저장
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