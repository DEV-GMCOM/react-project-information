// src/pages/working/FileManagementSystem.tsx

import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../api/utils/apiClient';
import '../../styles/FileManagementSystem.css';
import * as XLSX from 'xlsx';
import { fileUploadService } from '../../api/services/fileUploadService';

// 📁 업로드된 파일 정보 타입
interface IServerFile {
    id: number;
    original_file_name: string;
    file_size: number;
    file_type: string;
    uploaded_at: string;
    is_readonly: boolean;
    attachment_type_id: number;
    download_url?: string;
}

// 📁 클라우드 파일 정보 타입
interface CloudFile {
    name: string;
    size?: number;
    url?: string;
    title?: string;
    content?: string;
}

// 📊 엑셀 메타데이터 타입
interface ExcelMetadata {
    fileName: string;
    fileSize?: string;
    uploadDate?: string;
    category?: string;
    description?: string;
    [key: string]: any; // 추가 필드
}

// 🔍 비교 결과 타입 (백엔드 응답과 일치 - 이름 기반 + LLM 기반)
interface ComparisonResult {
    cloudFile: CloudFile;
    matched: boolean; // 이름 기반 매칭 여부
    matchedMetadata: ExcelMetadata | null;
    explanation: string; // 이름 기반 매칭 설명
    llmMatched?: boolean; // LLM 기반 매칭 여부
    llmBestMatch?: ExcelMetadata | null; // LLM이 찾은 최적 매칭
    llmExplanation?: string; // LLM 매칭 설명
}

// 📂 파일 카테고리 타입
interface ISubCategory {
    id: number;
    name: string;
}

interface IMainCategory {
    id: number;
    name: string;
    subCategories: ISubCategory[];
}

// 📎 업로드 대기 파일 타입
interface IStagedFile {
    id: string;
    file: File;
    categoryId: string;
}

// ☁️ 고정 클라우드 URL
const CLOUD_URL = 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j';

const FileManagementSystem: React.FC = () => {
    // ✅ 상태 관리
    const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
    const [excelMetadata, setExcelMetadata] = useState<ExcelMetadata[]>([]);
    const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
    const [savedResults, setSavedResults] = useState<any[]>([]);  // DB에 저장된 매칭 결과
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEngine, setSelectedEngine] = useState<string>('claude'); // LLM 엔진 선택
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ✅ 파일 업로드 관련 상태
    const [categories, setCategories] = useState<IMainCategory[]>([]);
    const [stagedFiles, setStagedFiles] = useState<IStagedFile[]>([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [droppedFiles, setDroppedFiles] = useState<FileList | null>(null);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const [isFileUploading, setIsFileUploading] = useState<boolean>(false);
    const [serverFiles, setServerFiles] = useState<IServerFile[]>([]); // 업로드된 파일 목록

    // 📊 파일 미리보기 관련 state
    const [previewData, setPreviewData] = useState<any>(null);
    const [previewLoading, setPreviewLoading] = useState<boolean>(false);
    const [selectedFileForPreview, setSelectedFileForPreview] = useState<number | null>(null);

    // FMS 전용 프로젝트 ID (9999)
    const selectedProjectId = 9999;
    const selectedCategoryRef = useRef<string>('');
    const fileUploadInputRef = useRef<HTMLInputElement>(null);
    const allowedExtensions = ['txt', 'pdf', 'ppt', 'pptx', 'doc', 'docx', 'hwp', 'hwpx', 'png', 'jpg', 'jpeg', 'xls', 'xlsx', 'zip', 'rar', '7z'];

    // 📥 페이지 로드 시 자동으로 데이터 로드 및 비교
    useEffect(() => {
        loadDemoData();
        loadCategories();
        loadServerFiles(); // 업로드된 파일 목록 조회
        loadMatchingResults(); // DB 저장된 매칭 결과 조회
    }, []);

    // 📊 DB 저장된 매칭 결과 조회
    const loadMatchingResults = async () => {
        try {
            const response = await apiClient.get(`/fms/matching-results/${selectedProjectId}`);
            console.log('📌 기존 매칭 결과 로드:', response.data);
            setSavedResults(response.data.results || []);
        } catch (err: any) {
            console.error('매칭 결과 로드 실패:', err);
        }
    };

    // 📂 업로드된 파일 목록 조회
    const loadServerFiles = async () => {
        try {
            const files = await fileUploadService.getProjectFiles(selectedProjectId);
            setServerFiles(files);
            console.log('FMS 파일 목록 조회 성공:', files);
        } catch (err: any) {
            console.error('파일 목록 조회 실패:', err);
        }
    };

    // 📊 파일 미리보기 로드
    const loadFilePreview = async (fileId: number) => {
        setPreviewLoading(true);
        setSelectedFileForPreview(fileId);
        try {
            const response = await apiClient.get(`/fms/projects/${selectedProjectId}/files/${fileId}/preview`);
            setPreviewData(response.data);
            console.log('파일 미리보기 성공:', response.data);
        } catch (err: any) {
            console.error('파일 미리보기 실패:', err);
            alert(err.response?.data?.detail || '파일 미리보기에 실패했습니다.');
            setPreviewData(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    // 📊 미리보기 닫기
    const closePreview = () => {
        setPreviewData(null);
        setSelectedFileForPreview(null);
    };

    // 📂 카테고리 목록 로드
    const loadCategories = async () => {
        try {
            const response = await apiClient.get('/fms/categories');
            setCategories(response.data.categories);
        } catch (err: any) {
            console.error('카테고리 로드 실패:', err);
        }
    };

    // 🔗 데모 데이터 로드 및 자동 비교 (백엔드 API 호출)
    const loadDemoData = async () => {
        setLoading(true);
        setError(null);

        try {
            console.log('🔄 데모 데이터 로드 시작...');

            // 데모 데이터 가져오기
            const demoResponse = await apiClient.get('/fms/demo-data');
            console.log('✅ 데모 데이터 응답:', demoResponse.data);

            const { cloudFiles: demoCloudFiles, excelMetadata: demoExcelMetadata } = demoResponse.data;
            setCloudFiles(demoCloudFiles);
            setExcelMetadata(demoExcelMetadata);

            console.log(`📁 클라우드 파일 ${demoCloudFiles.length}개 로드됨`);
            console.log(`📊 엑셀 메타데이터 ${demoExcelMetadata.length}개 로드됨`);

            // 클라이언트 측에서 간단한 name-based 비교 수행
            const results: ComparisonResult[] = demoCloudFiles.map((cloudFile: CloudFile) => {
                const matchedMetadata = demoExcelMetadata.find(
                    (meta: ExcelMetadata) => meta.fileName?.toLowerCase() === cloudFile.name.toLowerCase()
                );

                return {
                    cloudFile,
                    matched: !!matchedMetadata,
                    matchedMetadata: matchedMetadata || null,
                    explanation: matchedMetadata
                        ? 'Exact name match - matched by file name'
                        : 'No matching metadata found in Excel file',
                    // LLM 비교 결과 (초기값 - 실제 LLM 호출은 별도 버튼으로 수행)
                    llmMatched: false,
                    llmBestMatch: null,
                    llmExplanation: 'LLM comparison not yet performed'
                };
            });

            setComparisonResults(results);
            console.log(`✅ 비교 완료: 매칭=${results.filter(r => r.matched).length}, 미매칭=${results.filter(r => !r.matched).length}`);
        } catch (err: any) {
            console.error('❌ API 호출 실패:', err);
            setError(err.response?.data?.detail || '백엔드 서버와 통신에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 🔗 클라우드 파일 다시 불러오기
    const loadCloudFiles = () => {
        loadDemoData();
    };

    // 📥 엑셀 파일 업로드 및 LLM 비교
    const handleExcelUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            console.log(`🔄 엑셀 파일 업로드 및 LLM(${selectedEngine}) 비교 시작...`);

            // 백엔드 API 호출: POST /api/fms/compare-with-llm (엑셀 파일 포함)
            const formData = new FormData();
            formData.append('cloud_url', CLOUD_URL);
            formData.append('use_demo', 'false');
            formData.append('engine', selectedEngine);
            formData.append('excel_file', file);
            formData.append('project_id', selectedProjectId.toString());

            const response = await apiClient.post('/fms/compare-with-llm', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ LLM 비교 응답 (엑셀 업로드):', response.data);

            // 응답 데이터 처리
            const { results, matchedCount, notFoundCount, totalMetadataRecords, savedResults: dbSavedResults } = response.data;

            // 클라우드 파일 목록 추출
            const cloudFileList = results.map((r: ComparisonResult) => r.cloudFile);
            setCloudFiles(cloudFileList);

            // 매칭된 메타데이터 추출
            const metadataList = results
                .map((r: ComparisonResult) => r.matchedMetadata)
                .filter((m: ExcelMetadata | null) => m !== null) as ExcelMetadata[];
            setExcelMetadata(metadataList);

            // 비교 결과 설정
            setComparisonResults(results);

            // DB에 저장된 매칭 결과 설정
            console.log('📌 savedResults 응답:', dbSavedResults);
            setSavedResults(dbSavedResults || []);
            console.log(`✅ DB에 저장된 매칭 결과: ${dbSavedResults?.length || 0}개`);

            console.log(`✅ 비교 완료: 클라우드=${cloudFileList.length}, 메타데이터=${metadataList.length}, 매칭=${matchedCount}`);
        } catch (err: any) {
            console.error('❌ API 호출 실패:', err);
            setError(err.response?.data?.detail || '엑셀 파일 업로드에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 🔍 클라우드 파일과 엑셀 메타데이터 비교 (더 이상 사용하지 않음 - 백엔드에서 처리)
    const compareFilesAuto = (excelData: ExcelMetadata[]) => {
        if (cloudFiles.length === 0) {
            setError('클라우드 파일을 불러오는 중입니다...');
            return;
        }

        const results: ComparisonResult[] = cloudFiles.map(cloudFile => {
            // 파일명으로 엑셀 데이터 찾기 (대소문자 무시)
            const excelDataItem = excelData.find(
                meta => meta.fileName?.toLowerCase() === cloudFile.name.toLowerCase()
            );

            return {
                cloudFile,
                excelData: excelDataItem || null,
                status: excelDataItem ? 'found' : 'not_found'
            };
        });

        setComparisonResults(results);
        console.log('🔍 비교 결과:', results);
    };

    // 🔍 수동 비교 버튼
    const compareFiles = () => {
        if (excelMetadata.length === 0) {
            setError('엑셀 파일을 먼저 업로드하세요.');
            return;
        }
        compareFilesAuto(excelMetadata);
    };

    // 📊 파일 크기 포맷팅
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Byte';
        const k = 1024;
        const sizes = ['Byte', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // ===== 파일 업로드 관련 함수들 =====

    // 파일 업로드 대기열에 추가
    const stageFilesForUpload = (files: FileList | null, categoryIdString: string) => {
        if (!files || files.length === 0) return;
        const newStagedFiles: IStagedFile[] = Array.from(files).map(file => ({
            id: `${file.name}-${file.lastModified}-${Math.random()}`,
            file: file,
            categoryId: categoryIdString,
        }));
        setStagedFiles(prev => [...prev, ...newStagedFiles]);
    };

    // 대기열에서 파일 제거
    const removeStagedFile = (fileId: string) => {
        setStagedFiles(prevStagedFiles => prevStagedFiles.filter(f => f.id !== fileId));
    };

    // 카테고리 이름 가져오기
    const getCategoryNameById = (categoryId: string): string => {
        if (!categoryId || categories.length === 0) return '분류 없음';
        const [mainId, subId] = categoryId.split('-').map(Number);
        const mainCategory = categories.find(cat => cat.id === mainId);
        if (!mainCategory) return '알 수 없는 분류';
        const subCategory = mainCategory.subCategories.find(sub => sub.id === subId);
        return subCategory ? subCategory.name : '알 수 없는 분류';
    };

    // 파일 선택 핸들러
    const handleFileSelect = () => {
        setDroppedFiles(null);
        setShowCategoryModal(true);
    };

    // 파일 입력 변경 핸들러
    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        stageFilesForUpload(e.target.files, selectedCategoryRef.current);
        selectedCategoryRef.current = '';
        if (e.target) e.target.value = '';
    };

    // 카테고리 선택 확인 핸들러
    const handleCategoryConfirm = (categoryIdString: string) => {
        setShowCategoryModal(false);
        if (droppedFiles) {
            stageFilesForUpload(droppedFiles, categoryIdString);
            setDroppedFiles(null);
        } else {
            selectedCategoryRef.current = categoryIdString;
            fileUploadInputRef.current?.click();
        }
    };

    // 드래그 앤 드롭 핸들러
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            setDroppedFiles(e.dataTransfer.files);
            setShowCategoryModal(true);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    // 모달 닫기
    const handleModalClose = () => {
        setShowCategoryModal(false);
        setDroppedFiles(null);
    };

    const handleSubmit = async () => {
            /*
        if (!selectedProject?.project_id) {
            alert("프로젝트가 선택되지 않았습니다.");
            return;
        }*/
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

    // category_id를 attachment_type_id로 변환하는 헬퍼 함수
    const getAttachmentTypeIdFromCategory = (categoryId: string): number => {
        const typeMap: Record<string, number> = {
            '1-101': 2,   // 미팅/회의 -> meeting_minutes
            '1-102': 1,   // RFP/기타 고객요구사항 -> rfp
            '1-103': 5,   // 제출 견적 -> submission
            '1-104': 5,   // 제출 문서 -> submission
            '1-105': 99,  // 기타 관련 파일 -> other
            '2-201': 6,   // 시안 -> design
            '2-202': 6,   // 최종 디자인 -> design
            '3-301': 99,  // 지출 결의 -> other
            '3-302': 99,  // 정산 -> other
        };
        return typeMap[categoryId] || 99;
    };

    // 파일 업로드 실행
    const handleUploadStagedFiles = async () => {
        if (stagedFiles.length === 0) return;

        /*
        if (!selectedProjectId) {
            alert('프로젝트를 먼저 선택해주세요.');
            return;
        }*/

        setIsFileUploading(true);

        try {
            const uploadPromises = stagedFiles.map(async (stagedFile) => {
                const formData = new FormData();
                formData.append('file', stagedFile.file);
                formData.append('attachment_type_id', getAttachmentTypeIdFromCategory(stagedFile.categoryId).toString());

                // ✅ 기존 백엔드 엔드포인트 사용
                return apiClient.post(`/projects/${selectedProjectId}/files/upload`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            });

            await Promise.all(uploadPromises);
            alert(`${stagedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`);

            // ✅ 엑셀 파일이 있으면 자동으로 compare-with-llm 호출
            const excelFiles = stagedFiles.filter(f =>
                f.file.name.toLowerCase().endsWith('.xlsx') ||
                f.file.name.toLowerCase().endsWith('.xls')
            );

            if (excelFiles.length > 0) {
                console.log(`🔄 엑셀 파일 ${excelFiles.length}개 감지 - LLM 비교 자동 실행...`);

                for (const excelFile of excelFiles) {
                    try {
                        const formData = new FormData();
                        formData.append('cloud_url', CLOUD_URL);
                        formData.append('use_demo', 'false');
                        formData.append('engine', selectedEngine);
                        formData.append('excel_file', excelFile.file);
                        formData.append('project_id', selectedProjectId.toString());

                        const response = await apiClient.post('/fms/compare-with-llm', formData, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        });

                        console.log('✅ LLM 비교 완료:', response.data);

                        // 응답 데이터 처리
                        const { results, matchedCount, savedResults: dbSavedResults } = response.data;

                        // 클라우드 파일 목록 추출
                        const cloudFileList = results.map((r: ComparisonResult) => r.cloudFile);
                        setCloudFiles(cloudFileList);

                        // 매칭된 메타데이터 추출
                        const metadataList = results
                            .map((r: ComparisonResult) => r.matchedMetadata)
                            .filter((m: ExcelMetadata | null) => m !== null) as ExcelMetadata[];
                        setExcelMetadata(metadataList);

                        // 비교 결과 설정
                        setComparisonResults(results);

                        // DB에 저장된 매칭 결과 설정
                        console.log('📌 savedResults 응답:', dbSavedResults);
                        setSavedResults(dbSavedResults || []);
                        console.log(`✅ DB에 저장된 매칭 결과: ${dbSavedResults?.length || 0}개`);

                        console.log(`✅ 자동 비교 완료: 매칭=${matchedCount}개`);
                    } catch (compareError: any) {
                        console.error('❌ LLM 비교 실패:', compareError);
                    }
                }
            }

            setStagedFiles([]);

            // ✅ 업로드 후 파일 목록 다시 조회
            await loadServerFiles();
        } catch (error: any) {
            console.error('파일 업로드 실패:', error);
            alert(`파일 업로드에 실패했습니다: ${error.response?.data?.detail || error.message}`);
        } finally {
            setIsFileUploading(false);
        }
    };

    return (
        <div className="file-management-system-container">
            {/* 헤더 */}
            <div className="file-management-system-header">
                <div>
                    <h1 className="file-management-system-title">파일 관리 - 클라우드 파일 & 엑셀 메타데이터 비교</h1>
                </div>
                <div className="file-management-system-logo">GMCOM</div>
            </div>

            <div className="file-management-system-main">
                {/* 클라우드 정보 표시 */}
                <div className="file-management-system-section">
                    <h3 className="section-header">■ 1. 클라우드 파일 정보</h3>
                    <div style={{ padding: '20px' }}>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>클라우드 URL:</strong> <span style={{ color: '#666' }}>{CLOUD_URL}</span>
                        </div>
                        {loading ? (
                            <p style={{ color: '#FF9800' }}>☁️ 클라우드 파일 불러오는 중...</p>
                        ) : (
                            <div>
                                <p style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                                    ✅ {cloudFiles.length}개 파일 로드됨
                                </p>
                                <button
                                    onClick={loadCloudFiles}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#4CAF50',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        marginTop: '10px'
                                    }}
                                >
                                    🔄 다시 불러오기
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* 엑셀 파일 업로드 섹션 */}
                <div className="file-management-system-section">
                    <h3 className="section-header">■ 2. 엑셀 메타데이터 파일 업로드</h3>
                    <div style={{ padding: '20px' }}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept=".xlsx,.xls"
                            onChange={handleExcelUpload}
                            style={{ display: 'none' }}
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            📊 엑셀 파일 선택
                        </button>
                        {excelMetadata.length > 0 && (
                            <span style={{ marginLeft: '15px', color: '#2196F3', fontWeight: 'bold' }}>
                                ✅ {excelMetadata.length}개 메타데이터 로드됨
                            </span>
                        )}
                    </div>
                </div>

                {/* 파일 업로드 섹션 */}
                <div className="project-execution-section">
                    <h3 className="section-header">■ 3. 프로젝트 파일 업로드</h3>
                    <p style={{ padding: '0 20px', color: '#666', fontSize: '14px' }}>
                        ※ FMS 전용 파일 저장소 (프로젝트 ID: 9999)
                    </p>
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

                {/* 업로드된 파일 목록 섹션 */}
                {serverFiles.length > 0 && (
                    <div className="project-execution-section">
                        <h3 className="section-header">■ 업로드된 파일 목록 ({serverFiles.length}개)</h3>
                        <div className="file-list-table-wrapper">
                            <table className="file-list-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '50px' }}>번호</th>
                                        <th style={{ width: '300px' }}>파일명</th>
                                        <th style={{ width: '100px' }}>파일 크기</th>
                                        <th style={{ width: '150px' }}>업로드 일시</th>
                                        <th style={{ width: '120px' }}>파일 타입</th>
                                        <th style={{ width: '180px' }}>작업</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {serverFiles.map((file, index) => (
                                        <tr key={file.id}>
                                            <td>{index + 1}</td>
                                            <td
                                                title={file.original_file_name}
                                                style={{ cursor: 'pointer', color: '#0066cc' }}
                                                onClick={() => loadFilePreview(file.id)}
                                            >
                                                📄 {file.original_file_name}
                                                {selectedFileForPreview === file.id && ' 👁️'}
                                            </td>
                                            <td>{formatFileSize(file.file_size)}</td>
                                            <td>{new Date(file.uploaded_at).toLocaleString('ko-KR')}</td>
                                            <td>
                                                <span className="file-type-badge">
                                                    {file.file_type || 'unknown'}
                                                </span>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => loadFilePreview(file.id)}
                                                    className="btn-preview"
                                                    style={{ marginRight: '5px' }}
                                                    title="미리보기"
                                                >
                                                    👁️ 미리보기
                                                </button>
                                                <a
                                                    href={fileUploadService.getDownloadUrl(selectedProjectId, file.id)}
                                                    className="btn-download"
                                                    download={file.original_file_name}
                                                    title="다운로드"
                                                >
                                                    ⬇️
                                                </a>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 파일 미리보기 섹션 */}
                {previewData && (
                    <div className="project-execution-section" style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 className="section-header">📊 파일 미리보기: {previewData.file_name}</h3>
                            <button onClick={closePreview} className="btn-close-preview">✖️ 닫기</button>
                        </div>

                        {previewLoading ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <p>파일을 불러오는 중...</p>
                            </div>
                        ) : (
                            <div className="file-list-table-wrapper" style={{ marginTop: '10px', maxHeight: '500px', overflowY: 'auto' }}>
                                {['.xlsx', 'xlsx', '.xls', 'xls', '.csv', 'csv', '.txt', 'txt', '.log', 'log', '.md', 'md'].includes(previewData.file_type) || previewData.content ? (
                                    <pre style={{
                                        padding: '10px',
                                        backgroundColor: '#f5f5f5',
                                        borderRadius: '5px',
                                        overflowX: 'auto',
                                        whiteSpace: 'pre-wrap',
                                        wordWrap: 'break-word'
                                    }}>
                                        {previewData.content || (previewData.data && previewData.data.join('\n'))}
                                    </pre>
                                ) : (
                                    <p>미리보기를 지원하지 않는 파일 형식입니다.</p>
                                )}
                            </div>
                        )}
                    </div>
                )}

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

                {/* DB에 저장된 매칭 결과 표시 */}
                <div className="file-management-system-section" style={{ marginTop: '20px' }}>
                    <h3 className="section-header">■ 4. DB 저장된 매칭 결과 (file_matching_results) - {savedResults.length}개</h3>
                {savedResults.length > 0 ? (
                    <>
                        <div style={{ padding: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#e3f2fd' }}>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>행 번호</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>콘텐츠 식별자</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>매칭 여부</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'left' }}>매칭된 클라우드 파일</th>
                                        <th style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>생성일시</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {savedResults.map((result, index) => (
                                        <tr key={result.id || index} style={{ backgroundColor: result.matched ? '#e8f5e9' : '#ffebee' }}>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {result.rowNumber}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                {result.contentIdentifier || '-'}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {result.matched ? '✅ 매칭' : '❌ 미매칭'}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                                                {result.matchedCloudFileName || '-'}
                                            </td>
                                            <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center', fontSize: '0.85em' }}>
                                                {result.createdAt ? new Date(result.createdAt).toLocaleString('ko-KR') : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
                                <p style={{ margin: 0, color: '#333' }}>
                                    총 저장 레코드: <strong>{savedResults.length}개</strong> |
                                    매칭: <strong style={{ color: '#4caf50' }}>
                                        {savedResults.filter(r => r.matched).length}개
                                    </strong> |
                                    미매칭: <strong style={{ color: '#f44336' }}>
                                        {savedResults.filter(r => !r.matched).length}개
                                    </strong>
                                </p>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ padding: '20px', color: '#999' }}>
                        저장된 매칭 결과가 없습니다. 엑셀 파일을 업로드하면 자동으로 저장됩니다.
                    </div>
                )}
                </div>

                {/* 비교 결과 섹션 */}
                {comparisonResults.length > 0 && (
                    <div className="file-management-system-section">
                        <h3 className="section-header">■ 5. 클라우드 파일과 엑셀 메타데이터 비교 결과</h3>
                        <div style={{ padding: '20px' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                marginTop: '10px'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', width: '80px' }}>
                                            상태
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', width: '200px' }}>
                                            파일명
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                            클라우드 파일 내용
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                            엑셀 메타데이터
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', width: '250px' }}>
                                            이름 기반 매칭
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', width: '250px' }}>
                                            🤖 LLM 기반 매칭
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {comparisonResults.map((result, index) => {
                                        return (
                                            <tr key={index} style={{
                                                backgroundColor: result.matched ? '#e8f5e9' : '#ffebee'
                                            }}>
                                                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                    {result.matched ? (
                                                        <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>✅</span>
                                                    ) : (
                                                        <span style={{ color: '#f44336', fontWeight: 'bold' }}>❌</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    <div style={{ fontSize: '0.95em' }}>
                                                        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                                            📄 {result.cloudFile.name}
                                                        </div>
                                                        <div style={{ fontSize: '0.85em', color: '#666' }}>
                                                            {result.cloudFile.size ? formatFileSize(result.cloudFile.size) : '-'}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {result.cloudFile.title || result.cloudFile.content ? (
                                                        <div style={{ fontSize: '0.85em' }}>
                                                            {result.cloudFile.title && (
                                                                <div style={{ marginBottom: '6px' }}>
                                                                    <strong style={{ color: '#1976D2' }}>제목:</strong> {result.cloudFile.title}
                                                                </div>
                                                            )}
                                                            {result.cloudFile.content && (
                                                                <div style={{ color: '#555', lineHeight: '1.5' }}>
                                                                    <strong>내용:</strong> {result.cloudFile.content}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>내용 없음</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    {result.matchedMetadata ? (
                                                        <div style={{ fontSize: '0.85em' }}>
                                                            {Object.entries(result.matchedMetadata).map(([key, value]) => (
                                                                <div key={key} style={{ marginBottom: '4px' }}>
                                                                    <strong>{key}:</strong> {String(value)}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span style={{ color: '#999' }}>메타데이터 없음</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    <div style={{ fontSize: '0.85em', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                                                        <div style={{
                                                            padding: '10px',
                                                            backgroundColor: '#f9f9f9',
                                                            borderRadius: '4px',
                                                            border: '1px solid #e0e0e0'
                                                        }}>
                                                            <div style={{
                                                                fontWeight: result.matched ? 'bold' : 'normal',
                                                                color: result.matched ? '#2E7D32' : '#C62828'
                                                            }}>
                                                                📝 {result.explanation}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                    <div style={{ fontSize: '0.85em', whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                                                        <div style={{
                                                            padding: '10px',
                                                            backgroundColor: result.llmMatched ? '#E8F5E9' : '#FFF3E0',
                                                            borderRadius: '4px',
                                                            border: '1px solid #e0e0e0'
                                                        }}>
                                                            <div style={{
                                                                fontWeight: result.llmMatched ? 'bold' : 'normal',
                                                                color: result.llmMatched ? '#2E7D32' : '#F57C00'
                                                            }}>
                                                                🤖 {result.llmExplanation || 'LLM comparison not yet performed'}
                                                            </div>
                                                            {result.llmBestMatch && (
                                                                <div style={{
                                                                    marginTop: '8px',
                                                                    paddingTop: '8px',
                                                                    borderTop: '1px solid #ddd',
                                                                    fontSize: '0.9em',
                                                                    color: '#666'
                                                                }}>
                                                                    <strong>Best Match:</strong> {result.llmBestMatch.fileName}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                <h4 style={{ margin: '0 0 10px 0' }}>📊 LLM 비교 요약</h4>
                                <p>
                                    전체 클라우드 파일: <strong>{comparisonResults.length}개</strong> |
                                    매칭: <strong style={{ color: '#4CAF50' }}>
                                        {comparisonResults.filter(r => r.matched).length}개
                                    </strong> |
                                    미매칭: <strong style={{ color: '#f44336' }}>
                                        {comparisonResults.filter(r => !r.matched).length}개
                                    </strong>
                                </p>
                                <p style={{ marginTop: '10px', color: '#666', fontSize: '0.9em' }}>
                                    🤖 LLM 엔진: <strong>{selectedEngine}</strong>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 클라우드 파일 목록 표시 */}
                {cloudFiles.length > 0 && comparisonResults.length === 0 && (
                    <div className="file-management-system-section">
                        <h3 className="section-header">■ 클라우드 파일 목록</h3>
                        <div style={{ padding: '20px' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                            파일명
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            파일 크기
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                            제목
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                            내용
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cloudFiles.map((file, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                📄 {file.name}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {file.size ? formatFileSize(file.size) : '-'}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                {file.title || '-'}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '0.85em', maxWidth: '400px' }}>
                                                {file.content || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 엑셀 메타데이터 목록 표시 */}
                {excelMetadata.length > 0 && comparisonResults.length === 0 && (
                    <div className="file-management-system-section">
                        <h3 className="section-header">■ 엑셀 메타데이터 목록</h3>
                        <div style={{ padding: '20px' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                            파일명
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            파일 크기
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            업로드 날짜
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                            카테고리
                                        </th>
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left' }}>
                                            설명
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {excelMetadata.map((metadata, index) => (
                                        <tr key={index}>
                                            <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                                                📊 {metadata.fileName}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {metadata.fileSize || '-'}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                {metadata.uploadDate || '-'}
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    backgroundColor: '#e3f2fd',
                                                    borderRadius: '4px',
                                                    fontSize: '0.9em'
                                                }}>
                                                    {metadata.category || '-'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', border: '1px solid #ddd', fontSize: '0.85em' }}>
                                                {metadata.description || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* 파일 카테고리 선택 모달 */}
            {showCategoryModal && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={handleModalClose}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            padding: '30px',
                            maxWidth: '600px',
                            width: '90%',
                            maxHeight: '80vh',
                            overflow: 'auto'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{ margin: 0 }}>파일 유형 선택</h3>
                            <button
                                onClick={handleModalClose}
                                style={{
                                    padding: '5px 10px',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <p style={{ marginBottom: '20px', color: '#666' }}>
                            업로드할 파일의 유형을 선택해주세요.
                        </p>

                        <div>
                            {categories.map(mainCat => (
                                <div key={mainCat.id} style={{ marginBottom: '20px' }}>
                                    <strong style={{
                                        display: 'block',
                                        marginBottom: '10px',
                                        fontSize: '16px',
                                        color: '#333'
                                    }}>
                                        {mainCat.name}
                                    </strong>
                                    <div style={{ paddingLeft: '10px' }}>
                                        {mainCat.subCategories.map(subCat => (
                                            <label
                                                key={subCat.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    padding: '8px',
                                                    marginBottom: '5px',
                                                    cursor: 'pointer',
                                                    borderRadius: '4px',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                <input
                                                    type="radio"
                                                    name="fileCategory"
                                                    value={`${mainCat.id}-${subCat.id}`}
                                                    onChange={(e) => selectedCategoryRef.current = e.target.value}
                                                    style={{ marginRight: '10px' }}
                                                />
                                                <span>{subCat.name}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '10px',
                            marginTop: '30px'
                        }}>
                            <button
                                onClick={handleModalClose}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#f5f5f5',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                            <button
                                onClick={() => {
                                    handleCategoryConfirm(selectedCategoryRef.current);
                                    /*
                                    if (selectedCategoryRef.current) {
                                        handleCategoryConfirm(selectedCategoryRef.current);
                                    } else {
                                        alert('카테고리를 선택해주세요.');
                                    }*/
                                }}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#2196F3',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                선택 완료
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FileManagementSystem;
