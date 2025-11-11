// src/pages/working/FileManagementSystem.tsx

import React, { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../api/utils/apiClient';
import '../../styles/FileManagementSystem.css';
import * as XLSX from 'xlsx';

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

// 🔍 비교 결과 타입 (백엔드 응답과 일치 - LLM 기반)
interface ComparisonResult {
    cloudFile: CloudFile;
    matched: boolean; // LLM이 판단한 매칭 여부
    matchedMetadata: ExcelMetadata | null;
    explanation: string; // LLM의 매칭 설명
}

// ☁️ 고정 클라우드 URL
const CLOUD_URL = 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j';

const FileManagementSystem: React.FC = () => {
    // ✅ 상태 관리
    const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
    const [excelMetadata, setExcelMetadata] = useState<ExcelMetadata[]>([]);
    const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedEngine, setSelectedEngine] = useState<string>('chatgpt'); // LLM 엔진 선택
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 📥 페이지 로드 시 자동으로 데이터 로드 및 비교
    useEffect(() => {
        loadDemoData();
    }, []);

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
                        : 'No matching metadata found in Excel file'
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

            const response = await apiClient.post('/fms/compare-with-llm', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            console.log('✅ LLM 비교 응답 (엑셀 업로드):', response.data);

            // 응답 데이터 처리
            const { results, matchedCount, notFoundCount, totalMetadataRecords } = response.data;

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

                {/* 에러 표시 */}
                {error && (
                    <div style={{ padding: '20px', color: 'red', backgroundColor: '#ffebee', margin: '20px', borderRadius: '4px' }}>
                        <p>⚠️ {error}</p>
                    </div>
                )}

                {/* 비교 결과 섹션 */}
                {comparisonResults.length > 0 && (
                    <div className="file-management-system-section">
                        <h3 className="section-header">■ 3. 클라우드 파일과 엑셀 메타데이터 비교 결과</h3>
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
                                        <th style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'left', width: '300px' }}>
                                            내용 요약
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
                                                                🤖 {result.explanation}
                                                            </div>
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
        </div>
    );
};

export default FileManagementSystem;
