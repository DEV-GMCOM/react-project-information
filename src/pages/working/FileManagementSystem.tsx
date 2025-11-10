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

// 🔍 비교 결과 타입
interface ComparisonResult {
    cloudFile: CloudFile;
    excelData: ExcelMetadata | null;
    status: 'found' | 'not_found';
}

// ☁️ 고정 클라우드 URL
const CLOUD_URL = 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j';

// 📁 데모 클라우드 파일 목록
const DEMO_CLOUD_FILES: CloudFile[] = [
    {
        name: '제안서_최종.pdf',
        size: 2048000,
        url: 'https://drive.google.com/file/d/abc123',
        title: '스마트시티 솔루션 제안서',
        content: '본 제안서는 ABC 시티의 스마트시티 구축을 위한 통합 플랫폼 솔루션을 제안합니다. 주요 내용으로는 IoT 센서 네트워크 구축, 빅데이터 분석 시스템, AI 기반 교통관제 시스템, 시민 참여형 앱 개발 등이 포함됩니다. 총 사업비는 50억원이며, 구축 기간은 12개월입니다.'
    },
    {
        name: '계약서_드래프트.docx',
        size: 1024000,
        url: 'https://drive.google.com/file/d/def456',
        title: '2024년 시스템 유지보수 계약서',
        content: '갑(발주처)과 을(수행사) 간의 시스템 유지보수 계약서입니다. 계약기간은 2024년 1월 1일부터 12월 31일까지이며, 월 정기점검 1회, 장애대응 24/7 지원, SLA 99.9% 보장을 포함합니다. 계약금액은 연 2억원입니다.'
    },
    {
        name: '디자인_시안.psd',
        size: 5120000,
        url: 'https://drive.google.com/file/d/ghi789',
        title: '모바일 앱 UI/UX 디자인 시안',
        content: '고객 관리 모바일 앱의 전체 화면 디자인 시안입니다. 메인 대시보드, 고객 목록, 상세정보, 통계 차트, 설정 화면 등 총 25개 화면으로 구성되어 있습니다. Material Design 가이드를 따르며, 다크모드도 지원합니다.'
    },
    {
        name: '회의록_20231115.hwp',
        size: 512000,
        url: 'https://drive.google.com/file/d/jkl012',
        title: '11월 정기 프로젝트 회의록',
        content: '일시: 2023년 11월 15일 14:00-16:00, 참석자: 김철수(PM), 이영희(개발팀장), 박민수(디자이너), 최지영(기획자). 주요 안건: 프로젝트 진행상황 점검, 2차 개발 일정 협의, 고객 피드백 반영 계획. 결정사항: 베타 테스트 12월 1일 시작, UI 수정사항 11월 말까지 완료.'
    },
    {
        name: '프로젝트_계획서.xlsx',
        size: 768000,
        url: 'https://drive.google.com/file/d/mno345',
        title: '2024년 프로젝트 마스터 플랜',
        content: '2024년 진행 예정인 전체 프로젝트 목록과 일정, 예산, 인력 배정 계획입니다. 총 12개 프로젝트, 예산 150억원, 참여 인원 80명. 주요 프로젝트로는 AI 챗봇 구축, 블록체인 기반 인증 시스템, 클라우드 마이그레이션 등이 있습니다.'
    },
    {
        name: '참고자료.zip',
        size: 10240000,
        url: 'https://drive.google.com/file/d/pqr678',
        title: '프로젝트 참고자료 모음',
        content: '프로젝트 수행에 필요한 각종 참고자료를 압축한 파일입니다. 포함 내용: 시장조사 보고서 5건, 경쟁사 분석 자료, 기술 스펙 문서, API 문서, 샘플 코드, 디자인 에셋 등 총 150개 파일이 포함되어 있습니다.'
    },
];

// 📊 데모 엑셀 메타데이터
const DEMO_EXCEL_METADATA: ExcelMetadata[] = [
    {
        fileName: '제안서_최종.pdf',
        fileSize: '2 MB',
        uploadDate: '2024-01-15',
        category: '제안문서',
        description: '고객사 제안서 최종본',
        uploader: '김철수',
        status: '승인완료'
    },
    {
        fileName: '계약서_드래프트.docx',
        fileSize: '1 MB',
        uploadDate: '2024-01-20',
        category: '계약서',
        description: '계약서 초안',
        uploader: '이영희',
        status: '검토중'
    },
    {
        fileName: '회의록_20231115.hwp',
        fileSize: '500 KB',
        uploadDate: '2023-11-15',
        category: '회의록',
        description: '11월 정기회의 회의록',
        uploader: '박민수',
        status: '완료'
    },
    {
        fileName: '프로젝트_계획서.xlsx',
        fileSize: '750 KB',
        uploadDate: '2024-02-01',
        category: '기획문서',
        description: '2024년 프로젝트 마스터 플랜',
        uploader: '최지영',
        status: '승인완료'
    },
];

const FileManagementSystem: React.FC = () => {
    // ✅ 상태 관리
    const [cloudFiles, setCloudFiles] = useState<CloudFile[]>([]);
    const [excelMetadata, setExcelMetadata] = useState<ExcelMetadata[]>([]);
    const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 📥 페이지 로드 시 자동으로 데이터 로드 및 비교
    useEffect(() => {
        loadDemoData();
    }, []);

    // 🔗 데모 데이터 로드 및 자동 비교
    const loadDemoData = () => {
        setLoading(true);
        setTimeout(() => {
            setCloudFiles(DEMO_CLOUD_FILES);
            setExcelMetadata(DEMO_EXCEL_METADATA);

            // 자동으로 비교 실행
            const results: ComparisonResult[] = DEMO_CLOUD_FILES.map(cloudFile => {
                const excelDataItem = DEMO_EXCEL_METADATA.find(
                    meta => meta.fileName?.toLowerCase() === cloudFile.name.toLowerCase()
                );

                return {
                    cloudFile,
                    excelData: excelDataItem || null,
                    status: excelDataItem ? 'found' : 'not_found'
                };
            });

            setComparisonResults(results);
            setLoading(false);
            console.log('☁️ 클라우드 파일 로드 완료:', DEMO_CLOUD_FILES);
            console.log('📊 엑셀 메타데이터 로드 완료:', DEMO_EXCEL_METADATA);
            console.log('🔍 비교 결과:', results);
        }, 500);
    };

    // 🔗 클라우드 파일 다시 불러오기
    const loadCloudFiles = () => {
        loadDemoData();
    };

    // 📥 엑셀 파일 업로드 및 파싱
    const handleExcelUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelMetadata[];

                console.log('📊 엑셀 데이터 파싱 완료:', jsonData);
                setExcelMetadata(jsonData);
                setError(null);

                // 자동으로 비교 실행
                compareFilesAuto(jsonData);
            } catch (err) {
                console.error('❌ 엑셀 파일 파싱 실패:', err);
                setError('엑셀 파일을 읽는데 실패했습니다.');
            }
        };
        reader.readAsBinaryString(file);
    };

    // 🔍 클라우드 파일과 엑셀 메타데이터 비교 (자동)
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
                                        // 내용 요약 생성
                                        const cloudSummary = result.cloudFile.content
                                            ? result.cloudFile.content.substring(0, 100) + (result.cloudFile.content.length > 100 ? '...' : '')
                                            : '내용 없음';

                                        const excelSummary = result.excelData?.description || '설명 없음';

                                        const combinedSummary = result.excelData
                                            ? `클라우드: ${cloudSummary}\n\n엑셀 메타: ${excelSummary}`
                                            : `클라우드만 존재: ${cloudSummary}`;

                                        return (
                                            <tr key={index} style={{
                                                backgroundColor: result.status === 'found' ? '#e8f5e9' : '#ffebee'
                                            }}>
                                                <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                                                    {result.status === 'found' ? (
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
                                                    {result.excelData ? (
                                                        <div style={{ fontSize: '0.85em' }}>
                                                            {Object.entries(result.excelData).map(([key, value]) => (
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
                                                            {combinedSummary}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                <h4 style={{ margin: '0 0 10px 0' }}>📊 요약</h4>
                                <p>
                                    전체 클라우드 파일: <strong>{comparisonResults.length}개</strong> |
                                    메타데이터 발견: <strong style={{ color: '#4CAF50' }}>
                                        {comparisonResults.filter(r => r.status === 'found').length}개
                                    </strong> |
                                    메타데이터 미발견: <strong style={{ color: '#f44336' }}>
                                        {comparisonResults.filter(r => r.status === 'not_found').length}개
                                    </strong>
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
