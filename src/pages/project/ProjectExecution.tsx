import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';

import '../../styles/FormPage.css';
import '../../styles/ProjectExecution.css';

// --- 데이터 구조 정의 (Interfaces) ---
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

    // ▼▼▼ [추가] 저장 버튼의 로딩 상태를 관리하는 state ▼▼▼
    const [loading, setLoading] = useState<boolean>(false);

    const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(1);
    const allowedExtensions = ['txt', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'zip', 'rar', '7z'];
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [droppedFiles, setDroppedFiles] = useState<FileList | null>(null);
    const selectedCategoryRef = useRef<string>('');
    const [categories, setCategories] = useState<IMainCategory[]>([]);
    const [serverFiles, setServerFiles] = useState<IServerFile[]>([]);
    const [stagedFiles, setStagedFiles] = useState<IStagedFile[]>([]);

    // --- 데이터 로딩 (useEffect) ---
    useEffect(() => {
        const fetchInitialData = async () => {
            const categoryData: IMainCategory[] = [
                {
                    id: 1, name: '업무추진사항', subCategories:
                        [
                            { id: 101, name: '미팅/회의' },
                            { id: 102, name: '제출 문서' },
                            { id: 103, name: '제출 견적' },
                            { id: 104, name: '기타 관련 파일' }
                        ]
                },
                {
                    id: 2, name: '디자인/기획', subCategories:
                        [
                            { id: 201, name: '시안' },
                            { id: 202, name: '최종 디자인' }
                        ]
                }
            ];
            setCategories(categoryData);
            const fileData: IServerFile[] = [
                { id: 1, original_file_name: '2025년 1차 회의록.docx', file_size: 12345, file_type: 'docx', uploaded_at: '2025-10-14T10:00:00Z', is_readonly: false, mainCategoryId: 1, subCategoryId: 101 },
                { id: 2, original_file_name: '2025년 2차 회의록.pdf', file_size: 54321, file_type: 'pdf', uploaded_at: '2025-10-15T11:00:00Z', is_readonly: false, mainCategoryId: 1, subCategoryId: 101 },
                { id: 3, original_file_name: '최종 제안서.pptx', file_size: 98765, file_type: 'pptx', uploaded_at: '2025-10-16T14:30:00Z', is_readonly: false, mainCategoryId: 1, subCategoryId: 102 },
                { id: 4, original_file_name: 'A시안.jpg', file_size: 123456, file_type: 'jpg', uploaded_at: '2025-10-17T16:00:00Z', is_readonly: false, mainCategoryId: 2, subCategoryId: 201 },
            ];
            setServerFiles(fileData);
        };
        fetchInitialData();
    }, [selectedProjectId]);

    // --- 테이블 렌더링을 위한 데이터 구조 가공 (useMemo) ---
    const groupedData = useMemo(() => {
        if (categories.length === 0) return [];

        // 1. 각 소분류별로 파일을 그룹화하는 것은 동일합니다.
        const filesBySubCategory = new Map<number, IServerFile[]>();
        serverFiles.forEach(file => {
            if (!filesBySubCategory.has(file.subCategoryId)) {
                filesBySubCategory.set(file.subCategoryId, []);
            }
            filesBySubCategory.get(file.subCategoryId)?.push(file);
        });

        // 2. 렌더링 구조를 만듭니다. (로직 변경)
        return categories.map(mainCat => {
            const subCategoriesWithFiles = mainCat.subCategories.map(subCat => {
                const files = filesBySubCategory.get(subCat.id) || [];
                // 각 소분류에 해당하는 파일들만 간단히 매핑합니다. (rowspan 계산 제거)
                return { ...subCat, files };
            });

            // 대분류의 rowspan은 이제 단순히 소속된 소분류의 개수입니다.
            const mainRowSpan = subCategoriesWithFiles.length || 1;

            return { ...mainCat, subCategories: subCategoriesWithFiles, rowSpan: mainRowSpan };
        });
    }, [categories, serverFiles]);

    // --- 헬퍼 및 유틸리티 함수 ---
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

    // --- 파일 처리 핸들러 ---
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

    // ▼▼▼ [추가] 저장 버튼 클릭 시 실행될 핸들러 함수 ▼▼▼
    const handleSubmit = async () => {
        if (!selectedProjectId) {
            alert("프로젝트가 선택되지 않았습니다.");
            return;
        }

        setLoading(true);
        console.log("저장 버튼 클릭됨. 저장할 데이터가 있다면 API 호출을 여기에 구현합니다.");

        try {
            // 이 페이지에 저장할 데이터가 있다면 API 호출을 구현합니다.
            // 예시: await apiClient.put(`/projects/${selectedProjectId}/execution`, { some_data: 'value' });

            // 현재는 API 호출을 시뮬레이션합니다.
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

    const handleUploadStagedFiles = async () => {
        if (stagedFiles.length === 0) return;
        setIsFileUploading(true);
        console.log("업로드를 시작합니다:", stagedFiles);
        try {
            // ... 실제 API 호출 로직 ...
            await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 딜레이 시뮬레이션
            alert(`${stagedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`);
            setStagedFiles([]);
        } catch (error) {
            console.error("파일 업로드 중 오류 발생:", error);
            alert("파일 업로드에 실패했습니다.");
        } finally {
            setIsFileUploading(false);
        }
    };

    // 드래그앤드롭 및 모달 관련 핸들러
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

    // 서버 파일 관련 핸들러
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

                <div>
                    <table className="execution-file-list-table">
                        <thead>
                        <tr>
                            <th>프로젝트 코드</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td>2025-12-어쩌고저쩌고</td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                <div className="project-execution-section">
                    <h3 className="section-header">■ 서버 파일 리스트</h3>
                </div>

                <table className="execution-file-list-table">
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
                                {/* 첫 번째 소분류 행에만 대분류 셀을 렌더링합니다. */}
                                {subIndex === 0 && (
                                    <td className="category-cell" rowSpan={mainCat.rowSpan}>
                                        {mainCat.name}
                                    </td>
                                )}
                                {/* 소분류 셀은 항상 렌더링합니다. */}
                                <td className="category-cell">
                                    {subCat.name}
                                </td>
                                {/* 파일 목록 셀: 파일이 여러 개라도 하나의 셀 안에 모두 렌더링합니다. */}
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


                {/* 버튼 영역 */}
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