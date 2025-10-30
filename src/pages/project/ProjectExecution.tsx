import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

// ▼▼▼ [추가] 지적해주신 빠진 import 구문입니다 ▼▼▼
import { ExtendedProjectData, IProject } from '../../types/project';
import { fileUploadService } from '../../api/services/fileUploadService';  // ✅ 추가

import ProjectBasicInfoForm from '../../components/common/ProjectBasicInfoForm';
import { useHelp } from '../../contexts/HelpContext';
import '../../styles/FormPage.css';
import '../../styles/ProjectExecution.css';

// --- 데이터 구조 정의 (Interfaces) ---
// ... (IServerFile, ISubCategory, IMainCategory, IStagedFile 인터페이스는 기존과 동일) ...
interface IServerFile {
    id: number;
    original_file_name: string;
    file_size: number;
    file_type: string;
    uploaded_at: string;
    is_readonly: boolean;
    mainCategoryId: number;
    subCategoryId: number;
}
interface ISubCategory {
    id: number;
    name: string;
}
interface IMainCategory {
    id: number;
    name: string;
    subCategories: ISubCategory[];
}
interface IStagedFile {
    id: string;
    file: File;
    categoryId: string;
}


// --- 파일 유형 선택 모달 컴포넌트 ---
// ... (FileCategoryModal 컴포넌트는 기존과 동일) ...
interface FileCategoryModalProps {
    isOpen: boolean;
    categories: IMainCategory[];
    onClose: () => void;
    onConfirm: (categoryId: string) => void;
}

const FileCategoryModal: React.FC<FileCategoryModalProps> = ({ isOpen, categories, onClose, onConfirm }) => {
    const [selectedCategoryId, setSelectedCategoryId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedCategoryId('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content file-category-modal">
                <div className="modal-header">
                    <h3>파일 유형 선택</h3>
                    <button className="modal-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="modal-body">
                    <p>업로드할 파일의 유형을 선택해주세요.</p>
                    <div className="radio-group">
                        {categories.map(mainCat => (
                            <div key={mainCat.id} className="category-group">
                                <strong>{mainCat.name}</strong>
                                {mainCat.subCategories.map(subCat => (
                                    <label className="radio-label" key={subCat.id}>
                                        <input
                                            type="radio"
                                            name="fileCategory"
                                            value={`${mainCat.id}-${subCat.id}`}
                                            onChange={e => setSelectedCategoryId(e.target.value)}
                                        />
                                        <span>{subCat.name}</span>
                                    </label>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="modal-actions">
                    <button className="btn-secondary" onClick={onClose}>취소</button>
                    <button className="btn-primary" onClick={() => onConfirm(selectedCategoryId)} disabled={!selectedCategoryId}>
                        선택 완료
                    </button>
                </div>
            </div>
        </div>
    );
};


const ProjectExecution: React.FC = () => {
    // --- 상태 및 ref ---
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
    const allowedExtensions = ['txt', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'zip', 'rar', '7z'];
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [droppedFiles, setDroppedFiles] = useState<FileList | null>(null);
    const selectedCategoryRef = useRef<string>('');
    const [categories, setCategories] = useState<IMainCategory[]>([]);
    const [serverFiles, setServerFiles] = useState<IServerFile[]>([]);
    const [stagedFiles, setStagedFiles] = useState<IStagedFile[]>([]);

    const [projectFormData, setProjectFormData] = useState<ExtendedProjectData>({
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
    });

    const handleProjectSelect = useCallback((project: IProject | null) => {
        setSelectedProject(project);
    }, []);

    // ▼▼▼ [추가] 추가 정보 섹션들의 상태를 정의합니다. ▼▼▼
    const [showProfileTables, setShowProfileTables] = useState(false);
    const [showKickoff, setShowKickoff] = useState(false);
    const [showPTPostmortem, setShowPTPostmortem] = useState(false);

    const { setHelpContent } = useHelp();

    useEffect(() => {
        setHelpContent({
            pageName: '프로젝트 실행',
            content: (
                <>
                    <div className="help-section">
                        <h3>📋 프로젝트 실행 관리 가이드</h3>
                        <p>
                            프로젝트 실행 단계에서 진행 상황을 추적하고
                            이슈를 관리하며 실시간으로 프로젝트 현황을 파악하는 문서입니다.
                        </p>
                    </div>

                    <div className="help-section">
                        <h3>🔍 프로젝트 선택 및 정보 확인</h3>
                        <ul>
                            <li><strong>프로젝트 검색:</strong> 실행 중인 프로젝트를 검색하여 선택합니다.</li>
                            <li><strong>연관 정보 토글:</strong> 프로젝트 프로파일, 착수보고 정보를 확인할 수 있습니다.</li>
                            <li><strong>진행 상황 로드:</strong> 이전에 작성한 실행 현황이 자동으로 로드됩니다.</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📝 프로젝트 실행 관리 항목</h3>

                        <p><strong>1. 전체 진행률:</strong></p>
                        <ul>
                            <li>프로젝트 전체 진행률(%) 입력</li>
                            <li>계획 대비 실제 진행률 비교</li>
                            <li>예정 일정 대비 지연/앞당김 여부</li>
                            <li>진행률 산정 기준 (작업 완료 기준, 투입 시간 기준 등)</li>
                        </ul>

                        <p><strong>2. 단계별 진행 현황:</strong></p>
                        <ul>
                            <li><strong>분석/설계:</strong> 요구사항 분석, 시스템 설계 진행 상태</li>
                            <li><strong>개발:</strong> 프론트엔드, 백엔드 개발 진척도</li>
                            <li><strong>테스트:</strong> 단위/통합/시스템 테스트 진행 상황</li>
                            <li><strong>배포:</strong> 스테이징/프로덕션 배포 준비 상태</li>
                            <li>각 단계별 완료 예정일 및 실제 완료일</li>
                        </ul>

                        <p><strong>3. 작업(Task) 관리:</strong></p>
                        <ul>
                            <li><strong>작업 추가:</strong> '+ 작업 추가' 버튼으로 세부 작업 등록</li>
                            <li><strong>작업 정보:</strong>
                                <ul>
                                    <li>Task ID (자동 부여 또는 수동 입력)</li>
                                    <li>작업명 및 상세 설명</li>
                                    <li>담당자 지정 (직원 검색 가능)</li>
                                    <li>우선순위 (High, Medium, Low)</li>
                                </ul>
                            </li>
                            <li><strong>일정 관리:</strong>
                                <ul>
                                    <li>시작일, 예정 완료일</li>
                                    <li>실제 완료일 (완료 시 입력)</li>
                                    <li>소요 예상 시간 (M/D)</li>
                                </ul>
                            </li>
                            <li><strong>상태 관리:</strong>
                                <ul>
                                    <li>대기(Pending)</li>
                                    <li>진행중(In Progress)</li>
                                    <li>완료(Done)</li>
                                    <li>지연(Delayed)</li>
                                    <li>보류(On Hold)</li>
                                </ul>
                            </li>
                            <li><strong>진행률:</strong> 작업별 진행률(%) 입력</li>
                        </ul>

                        <p><strong>4. 이슈 관리:</strong></p>
                        <ul>
                            <li><strong>이슈 등록:</strong> 발생한 이슈를 즉시 기록</li>
                            <li><strong>이슈 정보:</strong>
                                <ul>
                                    <li>이슈 ID 및 제목</li>
                                    <li>발생일 및 발견자</li>
                                    <li>이슈 분류 (기술, 일정, 리소스, 요구사항 등)</li>
                                    <li>심각도 (Critical, High, Medium, Low)</li>
                                </ul>
                            </li>
                            <li><strong>이슈 내용:</strong>
                                <ul>
                                    <li>상세 설명</li>
                                    <li>발생 원인 분석</li>
                                    <li>영향 범위</li>
                                </ul>
                            </li>
                            <li><strong>대응 계획:</strong>
                                <ul>
                                    <li>해결 방안</li>
                                    <li>담당자 지정</li>
                                    <li>목표 해결일</li>
                                    <li>현재 상태 (Open, In Progress, Resolved, Closed)</li>
                                </ul>
                            </li>
                        </ul>

                        <p><strong>5. 리스크 모니터링:</strong></p>
                        <ul>
                            <li>착수보고에서 식별한 리스크의 실제 발생 여부</li>
                            <li>신규 리스크 발견 시 즉시 등록</li>
                            <li>리스크별 대응 조치 실행 상태</li>
                            <li>리스크 영향도 및 발생 확률 재평가</li>
                        </ul>

                        <p><strong>6. 마일스톤 현황:</strong></p>
                        <ul>
                            <li>주요 마일스톤별 달성 여부</li>
                            <li>계획 대비 실제 달성일 비교</li>
                            <li>지연 시 원인 및 만회 계획</li>
                            <li>다음 마일스톤까지의 계획</li>
                        </ul>

                        <p><strong>7. 투입 인력 현황:</strong></p>
                        <ul>
                            <li>계획 대비 실제 투입 인력</li>
                            <li>인력별 투입율 변경 사항</li>
                            <li>추가 투입 또는 철수 인력</li>
                            <li>인력 변동 사유</li>
                        </ul>

                        <p><strong>8. 예산 집행 현황:</strong></p>
                        <ul>
                            <li>총 예산 대비 집행액</li>
                            <li>항목별 예산 집행 내역 (인건비, 외주비, 경비 등)</li>
                            <li>예산 초과/절감 항목 및 사유</li>
                            <li>향후 예상 지출</li>
                        </ul>

                        <p><strong>9. 산출물 현황:</strong></p>
                        <ul>
                            <li>완료된 산출물 목록</li>
                            <li>진행 중인 산출물</li>
                            <li>검수 대기 중인 산출물</li>
                            <li>검수 완료 및 승인 상태</li>
                        </ul>

                        <p><strong>10. 주간/월간 활동 요약:</strong></p>
                        <ul>
                            <li>해당 기간 동안 완료한 주요 작업</li>
                            <li>다음 기간 계획</li>
                            <li>특이 사항 및 주요 의사결정</li>
                            <li>클라이언트 피드백 및 요청 사항</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📊 보고 및 모니터링</h3>
                        <ul>
                            <li><strong>정기 보고:</strong> 주간 또는 월간 단위로 진행 상황 업데이트</li>
                            <li><strong>실시간 대시보드:</strong> 주요 지표를 한눈에 파악</li>
                            <li><strong>알림 설정:</strong> 지연 작업, 긴급 이슈 발생 시 알림</li>
                            <li><strong>히스토리 관리:</strong> 모든 변경 이력을 자동 기록</li>
                        </ul>
                    </div>

                    <div className="help-section">
                        <h3>📎 첨부파일</h3>
                        <ul>
                            <li><strong>진행 보고서:</strong> 주간/월간 진행 보고서</li>
                            <li><strong>회의록:</strong> 주요 회의 결과 문서</li>
                            <li><strong>이슈 상세:</strong> 복잡한 이슈의 분석 자료</li>
                            <li><strong>산출물:</strong> 단계별 산출물 파일</li>
                        </ul>
                    </div>

                    <div className="help-tip">
                        <strong>💡 TIP:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>작업 상태는 최소 주 1회 이상 업데이트하여 정확한 진척도를 유지하세요.</li>
                            <li>이슈는 발생 즉시 등록하고, 해결 과정을 상세히 기록하세요.</li>
                            <li>진행률 산정 기준을 명확히 하여 일관성을 유지하세요.</li>
                            <li>중요한 의사결정이나 변경 사항은 반드시 기록으로 남기세요.</li>
                        </ul>
                    </div>

                    <div className="help-warning">
                        <strong>⚠️ 주의사항:</strong>
                        <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                            <li>지연 발생 시 즉시 보고하고 만회 계획을 수립하세요.</li>
                            <li>이슈 해결 완료 후에도 재발 방지 대책을 기록하세요.</li>
                            <li>예산 초과 우려 시 조기에 경보하고 대응 방안을 마련하세요.</li>
                            <li>클라이언트 요청 사항은 범위 변경 여부를 명확히 확인하세요.</li>
                        </ul>
                    </div>
                </>
            )
        });

        return () => {
            setHelpContent(null);
        };
    }, [setHelpContent]);

    // ▼▼▼ [추가] onProjectIdSelected에 연결할 핸들러를 정의합니다. ▼▼▼
    const handleProjectIdSelected = (projectId: number) => {
        // ID만 넘어오므로, 전체 프로젝트 정보가 필요한 다른 로직을 위해
        // state에는 project_id만 담은 임시 객체를 저장합니다.
        // 실제 API 호출 시에는 이 ID를 사용합니다.
        setSelectedProject({ project_id: projectId } as IProject);
    };

    // ▼▼▼ [추가] onDetailSectionChange에 연결할 핸들러를 정의합니다. ▼▼▼
    const handleToggleStateChange = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter(prev => !prev);
    };

    // --- 데이터 로딩 (useEffect) ---
    // // ▼▼▼ [추가] 컴포넌트가 처음 로드될 때 '분류 기준'을 항상 불러옵니다. ▼▼▼
    // useEffect(() => {
    //     const categoryData: IMainCategory[] = [
    //         {
    //             id: 1, name: '업무추진사항', subCategories:
    //                 [
    //                     { id: 101, name: '미팅/회의' },
    //                     { id: 102, name: 'RFP 문서 / 기타 요구사항' },
    //                     { id: 103, name: '제출 견적' },
    //                     { id: 104, name: '제출 문서' },
    //                     { id: 105, name: '기타 관련 파일' }
    //                 ]
    //         },
    //         {
    //             id: 2, name: '디자인/기획', subCategories:
    //                 [
    //                     { id: 201, name: '시안' },
    //                     { id: 202, name: '최종 디자인' }
    //                 ]
    //         }
    //     ];
    //     setCategories(categoryData);
    // }, []); // 빈 배열을 전달하여 최초 1회만 실행

    // ▼▼▼ [수정] '파일 목록'은 프로젝트 선택 여부에 따라 다르게 불러옵니다. ▼▼▼
    useEffect(() => {
        // 프로젝트가 선택되지 않은 초기 상태에서만 예제 데이터를 설정합니다.
        if (!selectedProject) {
            // 1. 분류 기준 데이터 설정
            const categoryData: IMainCategory[] = [
                {
                    id: 1, name: '업무추진사항',
                    subCategories: [
                        { id: 101, name: '미팅/회의' },
                        { id: 102, name: 'RFP/기타 고객요구사항' },
                        { id: 103, name: '제출 견적' },
                        { id: 104, name: '제출 문서' },
                        { id: 105, name: '기타 관련 파일' }
                    ]
                },
                {
                    id: 2, name: '디자인/기획',
                    subCategories: [
                        { id: 201, name: '시안' },
                        { id: 202, name: '최종 디자인' }
                    ]
                },
                {
                    id: 3, name: '지출/정산',
                    subCategories: [
                        { id: 301, name: '지출 결의' },
                        { id: 302, name: '정산' }
                    ]
                }
            ];
            setCategories(categoryData);

            // 2. 서버 파일 리스트 예제 데이터 복구
            const serverFileData: IServerFile[] = [
                { id: 1, original_file_name: '2025년 1차 회의록.docx', file_size: 12345, file_type: 'docx', uploaded_at: '2025-10-14T10:00:00Z', is_readonly: false, mainCategoryId: 1, subCategoryId: 101 },
                { id: 2, original_file_name: '2025년 2차 회의록.pdf', file_size: 54321, file_type: 'pdf', uploaded_at: '2025-10-15T11:00:00Z', is_readonly: false, mainCategoryId: 1, subCategoryId: 101 },
                { id: 3, original_file_name: '최종 제안서.pptx', file_size: 98765, file_type: 'pptx', uploaded_at: '2025-10-16T14:30:00Z', is_readonly: false, mainCategoryId: 1, subCategoryId: 102 },
                { id: 4, original_file_name: 'A시안.jpg', file_size: 123456, file_type: 'jpg', uploaded_at: '2025-10-17T16:00:00Z', is_readonly: false, mainCategoryId: 2, subCategoryId: 201 },
            ];
            setServerFiles(serverFileData);

            // 3. 파일 업로드 선택박스(stagedFiles) 예제 데이터 복구
            const sampleFile = new File(["이것은 더미 파일입니다."], "기획안_v1.hwp", { type: "application/haansofthwp" });
            const stagedFileData: IStagedFile[] = [
                {
                    id: `sample-staged-file-1`,
                    file: sampleFile,
                    categoryId: '1-104', // '제출 문서'로 임의 지정
                }
            ];
            setStagedFiles(stagedFileData);
        }
        // 프로젝트가 선택되면, 해당 프로젝트의 데이터를 불러옵니다.
        else {
            console.log(`${selectedProject.project_id} 프로젝트의 파일 목록을 API로 불러옵니다.`);
            // TODO: 실제 API를 호출하여 아래 예제 데이터를 교체해야 합니다.
            const fileDataForProject: IServerFile[] = [
                { id: 5, original_file_name: `[${selectedProject.project_name}] 최종보고서.pdf`, file_size: 789123, file_type: 'pdf', uploaded_at: '2025-10-20T17:00:00Z', is_readonly: false, mainCategoryId: 1, subCategoryId: 102 },
            ];
            setServerFiles(fileDataForProject);

            // 프로젝트가 선택되었으므로, 업로드 대기 파일 목록은 비워주는 것이 자연스럽습니다.
            setStagedFiles([]);
        }
    }, [selectedProject]); // selectedProject 상태가 변경될 때마다 이 로직이 실행됩니다.

    // ... (이하 모든 핸들러, 헬퍼 함수 및 useMemo는 기존과 동일하게 유지) ...
    const groupedData = useMemo(() => {
        if (categories.length === 0) return [];
        const filesBySubCategory = new Map<number, IServerFile[]>();
        serverFiles.forEach(file => {
            if (!filesBySubCategory.has(file.subCategoryId)) {
                filesBySubCategory.set(file.subCategoryId, []);
            }
            filesBySubCategory.get(file.subCategoryId)?.push(file);
        });
        return categories.map(mainCat => {
            const subCategoriesWithFiles = mainCat.subCategories.map(subCat => {
                const files = filesBySubCategory.get(subCat.id) || [];
                return { ...subCat, files };
            });
            const mainRowSpan = subCategoriesWithFiles.length || 1;
            return { ...mainCat, subCategories: subCategoriesWithFiles, rowSpan: mainRowSpan };
        });
    }, [categories, serverFiles]);
    const getCategoryNameById = useCallback((categoryId: string): string => {
        if (!categoryId || categories.length === 0) return '분류 없음';
        const [mainId, subId] = categoryId.split('-').map(Number);
        const mainCategory = categories.find(cat => cat.id === mainId);
        if (!mainCategory) return '알 수 없는 분류';
        const subCategory = mainCategory.subCategories.find(sub => sub.id === subId);
        return subCategory ? subCategory.name : '알 수 없는 분류';
    }, [categories]);
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const stageFilesForUpload = (files: FileList | null, categoryIdString: string) => {
        if (!files || files.length === 0) return;
        const newStagedFiles: IStagedFile[] = Array.from(files).map(file => ({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file: file,
            categoryId: categoryIdString,
        }));
        setStagedFiles(prev => [...prev, ...newStagedFiles]);
    };
    const removeStagedFile = (fileId: string) => {
        setStagedFiles(prevStagedFiles => prevStagedFiles.filter(f => f.id !== fileId));
    };
    const handleSubmit = async () => {
        if (!selectedProject?.project_id) {
            alert("프로젝트가 선택되지 않았습니다.");
            return;
        }
        setLoading(true);
        console.log("저장 버튼 클릭됨. 저장할 데이터가 있다면 API 호출을 여기에 구현합니다.");
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert("성공적으로 저장되었습니다.");
        } catch (error) {
            console.error("저장 중 오류 발생:", error);
            alert("저장에 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        stageFilesForUpload(e.target.files, selectedCategoryRef.current);
        selectedCategoryRef.current = '';
    };
    const handleCategoryConfirm = (categoryIdString: string) => {
        setShowCategoryModal(false);
        if (droppedFiles) {
            stageFilesForUpload(droppedFiles, categoryIdString);
            setDroppedFiles(null);
        } else {
            selectedCategoryRef.current = categoryIdString;
            fileInputRef.current?.click();
        }
    };

    // ✅ categoryId를 attachment_type으로 변환하는 헬퍼 함수
    const getAttachmentTypeFromCategory = (categoryId: string): string => {
        const [mainId, subId] = categoryId.split('-').map(Number);

        const typeMap: Record<string, string> = {
            '1-101': 'meeting_minutes',  // 미팅/회의
            '1-102': 'rfp',               // RFP/기타 고객요구사항
            '1-103': 'submission',        // 제출 견적
            '1-104': 'submission',        // 제출 문서
            '1-105': 'other',             // 기타 관련 파일
            '2-201': 'design',            // 시안
            '2-202': 'design',            // 최종 디자인
            '3-301': 'other',             // 지출 결의
            '3-302': 'other',             // 정산
        };

        return typeMap[categoryId] || 'other';
    };

    // getAttachmentTypeFromCategory 함수를 숫자 반환하도록 변경
    const getAttachmentTypeIdFromCategory = (categoryId: string): number => {
        const [mainId, subId] = categoryId.split('-').map(Number);

        const typeMap: Record<string, number> = {
            '1-101': 2,   // meeting_minutes
            '1-102': 1,   // rfp
            '1-103': 5,   // submission
            '1-104': 5,   // submission
            '1-105': 99,  // other
            '2-201': 6,   // design
            '2-202': 6,   // design
            '3-301': 99,  // other
            '3-302': 99,  // other
        };

        return typeMap[categoryId] || 99;
    };

    const handleUploadStagedFiles = async () => {
        if (stagedFiles.length === 0) return;

        setIsFileUploading(true);
        console.log("업로드를 시작합니다:", stagedFiles);

        try {
            const uploadPromises = stagedFiles.map(stagedFile => {
                const attachmentType = getAttachmentTypeFromCategory(stagedFile.categoryId);

                return fileUploadService.uploadFileAuto(
                    selectedProject?.project_id || 0,
                    stagedFile.file,
                    getAttachmentTypeIdFromCategory(stagedFile.categoryId),  // ✅ number
                    (progress: number) => {  // ✅ 타입 명시
                        console.log(`${stagedFile.file.name}: ${progress.toFixed(1)}%`);
                    }
                );
            });

            const uploadedFiles = await Promise.all(uploadPromises);

            alert(`${uploadedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`);
            setStagedFiles([]);

            // TODO: 서버에서 파일 목록 다시 로드하는 로직 추가

        } catch (error: any) {
            console.error("파일 업로드 중 오류 발생:", error);
            alert(`파일 업로드에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
        } finally {
            setIsFileUploading(false);
        }
    };


    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setDroppedFiles(e.dataTransfer.files);
            setShowCategoryModal(true);
        }
    };
    const handleFileSelect = () => {
        setDroppedFiles(null);
        setShowCategoryModal(true);
    };
    const handleModalClose = () => {
        setShowCategoryModal(false);
        setDroppedFiles(null);
    };
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleFileDownload = (file: IServerFile) => { console.log("다운로드:", file.original_file_name); };
    const handleFileDelete = (file: IServerFile) => { console.log("서버 파일 삭제:", file.original_file_name); };


    return (
        <div className="project-execution-container">
            <div className="project-execution-header">
                <div><h1 className="project-execution-title">프로젝트 실행파일링</h1></div>
                <div className="project-execution-logo">GMCOM</div>
            </div>

            <div className="project-execution-main">

                <div className="project-execution-title-section">
                    <h2 className="project-execution-subtitle">실행 관련 파일 리스트</h2>
                    <div className="profile-writer"><div className="writer-form"><div>최종 작성자 :</div></div></div>
                </div>

                <div className="project-default-profile-section">
                    <ProjectBasicInfoForm
                        formData={projectFormData}
                        readOnly={true}

                        showSearch={true}
                        onProjectIdSelected={handleProjectIdSelected}

                        // Project Profile
                        enableDetailSectionToggle={true}
                        showDetailSection={showProfileTables}
                        // onDetailSectionChange={handleToggleStateChange}
                        onDetailSectionChange={() => handleToggleStateChange(setShowProfileTables)}

                        // Project Kickoff
                        enableKickoffSectionToggle={true}
                        showKickoffSection={showKickoff}
                        // onKickoffSectionChange={setShowKickoff}
                        onKickoffSectionChange={() => handleToggleStateChange(setShowKickoff)}

                        // PT Postmortem
                        enablePTPostmortemSectionToggle={true}
                        showPTPostmortemSection={showPTPostmortem}
                        // onPTPostmortemSectionChange={setShowPTPostmortem}
                        onPTPostmortemSectionChange={() => handleToggleStateChange(setShowPTPostmortem)}

                        // // Project Postmortem
                        // enableProjectPostmortemSectionToggle={true}
                        // // showProjectPostmortemSection={showProjPostmortem}
                        // // onProjectPostmortemSectionChange={setShowProjPostmortem}

                        includeDataSections={["basic", "detail"]}
                        // 현재 구현에서는 필요가 없을듯 하여 일단 막아놓음. by longjaw.
                        // className="project-section"
                        // tableClassName="project-table"
                        // inputClassName="project-input"
                    />
                </div>

                <div className="project-execution-section">
                    <h3 className="section-header">■ 서버 파일 리스트</h3>
                </div>

                {/* ... (이하 JSX 테이블 및 파일 업로드 영역은 기존과 동일) ... */}
                <table className="execution-file-list-table server-file-data-table">
                    <thead>
                    <tr>
                        <th style={{ width: '15%' }}>대분류</th>
                        <th style={{ width: '15%' }}>소분류</th>
                        <th style={{ width: '70%' }}>첨부파일 리스트</th>
                    </tr>
                    </thead>
                    <tbody>
                    {groupedData.map(mainCat => (
                        mainCat.subCategories.map((subCat, subIndex) => (
                            <tr key={subCat.id}>
                                {subIndex === 0 && (
                                    <td className="category-cell" rowSpan={mainCat.rowSpan}>
                                        {mainCat.name}
                                    </td>
                                )}
                                <td className="category-cell">
                                    {subCat.name}
                                </td>
                                <td className="file-list-cell">
                                    {subCat.files.length === 0 ? (
                                        <p className="no-files-message">업로드된 파일이 없습니다.</p>
                                    ) : (
                                        <div className="file-items-container">
                                            {subCat.files.map(file => (
                                                <div key={file.id} className="file-item">
                                                    <div className="file-info">
                                                        <span className="file-name">📄 {file.original_file_name}</span>
                                                        <div className="file-details">
                                                            <span className="file-size">{formatFileSize(file.file_size)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="file-actions">
                                                        <button className="file-download-btn" onClick={() => handleFileDownload(file)} title="다운로드">📥</button>
                                                        <button className="file-remove-btn" onClick={() => handleFileDelete(file)} title="삭제">🗑️</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))
                    ))}
                    </tbody>
                </table>
                <div className="project-execution-section">
                    <h3 className="section-header">■ 파일 업로드</h3>
                </div>
                <div className="file-upload-section">
                    <input ref={fileInputRef} type="file" multiple accept={allowedExtensions.map(ext => `.${ext}`).join(',')} onChange={handleFileInputChange} style={{ display: 'none' }} />
                    <div className={`file-drop-zone ${isDragOver ? 'drag-over' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop} onClick={handleFileSelect}>
                        {stagedFiles.length === 0 ? (
                            <div className="drop-zone-message">
                                <div className="drop-zone-icon">📁</div>
                                <div className="drop-zone-text">
                                    <p>파일을 여기로 드래그하거나 클릭하여 추가하세요</p>
                                    <p className="drop-zone-hint">업로드할 파일들이 여기에 표시됩니다.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="file-list staged-file-list">
                                {stagedFiles.map(stagedFile => (
                                    <div key={stagedFile.id} className="file-item staged-file">
                                        <div className="file-info">
                                            <span className="file-name">📄 {stagedFile.file.name}</span>
                                            <div className="file-details">
                                                <span className="file-category-badge">{getCategoryNameById(stagedFile.categoryId)}</span>
                                                <span className="file-size">{formatFileSize(stagedFile.file.size)}</span>
                                            </div>
                                        </div>
                                        <button className="file-remove-btn" onClick={(e) => { e.stopPropagation(); removeStagedFile(stagedFile.id); }} title="목록에서 제거">
                                            🗑️
                                        </button>
                                    </div>
                                ))}
                                <div className="drop-zone-add-more" onClick={(e) => { e.stopPropagation(); handleFileSelect(); }}>
                                    <span>+ 더 많은 파일 추가</span>
                                </div>
                            </div>
                        )}
                    </div>
                    {stagedFiles.length > 0 && (
                        <div className="upload-actions">
                            <button className="btn-primary" onClick={handleUploadStagedFiles} disabled={isFileUploading}>
                                {isFileUploading ? '업로드 중...' : `${stagedFiles.length}개 파일 업로드`}
                            </button>
                        </div>
                    )}
                </div>
                <div className="button-section">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="submit-btn"
                        disabled={loading || isFileUploading}
                    >
                        {loading ? '저장 중...' : '저장'}
                    </button>
                </div>
            </div>

            <FileCategoryModal isOpen={showCategoryModal} categories={categories} onClose={handleModalClose} onConfirm={handleCategoryConfirm} />
        </div>
    );
};

export default ProjectExecution;