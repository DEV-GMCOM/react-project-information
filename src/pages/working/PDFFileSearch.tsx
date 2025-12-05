// src/pages/working/PDFFileSearch.tsx
/**
 * PDF File Search 페이지
 * - FileSearchStore 관리 (Gemini 관리형)
 * - GCS 버킷 파일 → FileSearchStore 등록
 * - PDF 파일 업로드
 * - RAG 기반 검색
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    fileSearchService,
    FileSearchStore,
    FileSearchFile,
    SearchResponse,
    GCSBucketFile,
    GCSToStoreResponse
} from '../../api/services/fileSearchService';
import '../../styles/FormPage.css';

type TabType = 'fileSearchStore' | 'gcsBucketRegister';

const PDFFileSearch: React.FC = () => {
    // ============ 공통 State ============
    const [activeTab, setActiveTab] = useState<TabType>('fileSearchStore');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searching, setSearching] = useState(false);

    // ============ FileSearchStore State ============
    const [stores, setStores] = useState<FileSearchStore[]>([]);
    const [selectedStore, setSelectedStore] = useState<string>('');
    const [files, setFiles] = useState<FileSearchFile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
    const [selectedStoresForSearch, setSelectedStoresForSearch] = useState<string[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newStoreName, setNewStoreName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // ============ GCS Bucket → FileSearchStore 등록 State ============
    const [gcsBucketFiles, setGcsBucketFiles] = useState<GCSBucketFile[]>([]);
    const [gcsBucketName, setGcsBucketName] = useState('');
    const [registeringFile, setRegisteringFile] = useState<string | null>(null);
    const [registeredFiles, setRegisteredFiles] = useState<Record<string, GCSToStoreResponse>>({});
    const [targetStoreName, setTargetStoreName] = useState('');

    // ============ Effects ============
    useEffect(() => {
        if (activeTab === 'fileSearchStore') {
            loadStores();
        } else if (activeTab === 'gcsBucketRegister') {
            loadStores();  // Store 목록 로드 (등록 대상 선택용)
        }
    }, [activeTab]);

    useEffect(() => {
        if (selectedStore) {
            loadFiles(selectedStore);
        } else {
            setFiles([]);
        }
    }, [selectedStore]);

    // ============ FileSearchStore API Calls ============
    const loadStores = async () => {
        setLoading(true);
        try {
            const data = await fileSearchService.listStores();
            setStores(data);
        } catch (error) {
            console.error('Store 목록 조회 실패:', error);
            alert('Store 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const loadFiles = async (storeName: string) => {
        setLoading(true);
        try {
            const data = await fileSearchService.listFiles(storeName);
            setFiles(data);
        } catch (error) {
            console.error('파일 목록 조회 실패:', error);
            setFiles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateStore = async () => {
        if (!newStoreName.trim()) {
            alert('Store 이름을 입력하세요.');
            return;
        }

        setLoading(true);
        try {
            await fileSearchService.createStore(newStoreName);
            alert('Store가 생성되었습니다.');
            setShowCreateModal(false);
            setNewStoreName('');
            loadStores();
        } catch (error) {
            console.error('Store 생성 실패:', error);
            alert('Store 생성에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteStore = async (storeName: string) => {
        if (!confirm(`정말로 "${storeName}" Store를 삭제하시겠습니까?\n\n포함된 모든 파일도 함께 삭제됩니다.`)) {
            return;
        }

        setLoading(true);
        try {
            await fileSearchService.deleteStore(storeName);
            alert('Store가 삭제되었습니다.');
            if (selectedStore === storeName) {
                setSelectedStore('');
            }
            loadStores();
        } catch (error) {
            console.error('Store 삭제 실패:', error);
            alert('Store 삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!selectedStore) {
            alert('먼저 Store를 선택하세요.');
            return;
        }

        if (!file.name.toLowerCase().endsWith('.pdf')) {
            alert('PDF 파일만 업로드 가능합니다.');
            return;
        }

        setUploading(true);
        try {
            await fileSearchService.uploadFile(selectedStore, file);
            alert('파일이 업로드되었습니다.');
            loadFiles(selectedStore);
        } catch (error) {
            console.error('파일 업로드 실패:', error);
            alert('파일 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleDeleteFile = async (fileName: string) => {
        if (!confirm(`정말로 "${fileName}" 파일을 삭제하시겠습니까?`)) {
            return;
        }

        setLoading(true);
        try {
            await fileSearchService.deleteFile(selectedStore, fileName);
            alert('파일이 삭제되었습니다.');
            loadFiles(selectedStore);
        } catch (error) {
            console.error('파일 삭제 실패:', error);
            alert('파일 삭제에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            alert('검색어를 입력하세요.');
            return;
        }

        if (selectedStoresForSearch.length === 0) {
            alert('검색할 Store를 선택하세요.');
            return;
        }

        setSearching(true);
        setSearchResult(null);

        try {
            const result = await fileSearchService.search({
                query: searchQuery,
                store_names: selectedStoresForSearch
            });
            setSearchResult(result);
        } catch (error) {
            console.error('검색 실패:', error);
            alert('검색에 실패했습니다.');
        } finally {
            setSearching(false);
        }
    };

    const toggleStoreForSearch = (storeName: string) => {
        setSelectedStoresForSearch(prev =>
            prev.includes(storeName)
                ? prev.filter(s => s !== storeName)
                : [...prev, storeName]
        );
    };

    // ============ GCS Bucket → FileSearchStore 등록 API Calls ============
    const loadGcsBucketFiles = async () => {
        setLoading(true);
        try {
            const data = await fileSearchService.listGCSBucketFiles();
            setGcsBucketFiles(data.files);
            setGcsBucketName(data.bucket);
        } catch (error) {
            console.error('GCS 버킷 파일 목록 조회 실패:', error);
            alert('GCS 버킷 파일 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterToStore = async (fileName: string) => {
        if (!targetStoreName) {
            alert('등록할 FileSearchStore를 선택하세요.');
            return;
        }

        setRegisteringFile(fileName);
        try {
            const result = await fileSearchService.registerGCSToStore({
                file_name: fileName,
                store_name: targetStoreName
            });
            setRegisteredFiles(prev => ({
                ...prev,
                [fileName]: result
            }));
            alert(`파일이 FileSearchStore에 등록되었습니다!\n\nStore: ${result.store_name}`);
        } catch (error) {
            console.error('FileSearchStore 등록 실패:', error);
            alert('FileSearchStore 등록에 실패했습니다.');
        } finally {
            setRegisteringFile(null);
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    // ============ Render ============
    return (
        <div className="form-page">
            <div className="page-header">
                <h1>PDF 파일 서치 (RAG)</h1>
                <p>PDF 문서를 업로드하고 AI 기반 검색을 수행합니다.</p>
            </div>

            {/* 탭 선택 */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button
                    className={`btn ${activeTab === 'fileSearchStore' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('fileSearchStore')}
                >
                    Store 관리 & 검색
                </button>
                <button
                    className={`btn ${activeTab === 'gcsBucketRegister' ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => setActiveTab('gcsBucketRegister')}
                >
                    GCS 파일 등록
                </button>
            </div>

            {/* FileSearchStore 탭 */}
            {activeTab === 'fileSearchStore' && (
                <div className="content-layout" style={{ display: 'flex', gap: '20px' }}>
                    {/* 좌측: Store 및 파일 관리 */}
                    <div style={{ flex: '0 0 400px' }}>
                        <div className="form-section">
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>Store 관리</h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    + 새 Store
                                </button>
                            </div>

                            {loading && <div className="loading">로딩 중...</div>}

                            <div className="store-list" style={{ marginTop: '10px' }}>
                                {stores.length === 0 ? (
                                    <p style={{ color: '#888' }}>Store가 없습니다. 새 Store를 생성하세요.</p>
                                ) : (
                                    stores.map(store => (
                                        <div
                                            key={store.name}
                                            className={`store-item ${selectedStore === store.name ? 'selected' : ''}`}
                                            style={{
                                                padding: '10px',
                                                border: '1px solid #ddd',
                                                borderRadius: '4px',
                                                marginBottom: '8px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedStore === store.name ? '#e3f2fd' : '#fff'
                                            }}
                                            onClick={() => setSelectedStore(store.name)}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <strong>{store.display_name}</strong>
                                                    <div style={{ fontSize: '12px', color: '#888' }}>{store.name}</div>
                                                </div>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteStore(store.name);
                                                    }}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {selectedStore && (
                            <div className="form-section" style={{ marginTop: '20px' }}>
                                <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3>파일 목록</h3>
                                    <div>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept=".pdf"
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? '업로드 중...' : '+ PDF 업로드'}
                                        </button>
                                    </div>
                                </div>

                                <div className="file-list" style={{ marginTop: '10px' }}>
                                    {files.length === 0 ? (
                                        <p style={{ color: '#888' }}>파일이 없습니다. PDF를 업로드하세요.</p>
                                    ) : (
                                        files.map(file => (
                                            <div
                                                key={file.name}
                                                style={{
                                                    padding: '8px',
                                                    border: '1px solid #eee',
                                                    borderRadius: '4px',
                                                    marginBottom: '6px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}
                                            >
                                                <div>
                                                    <span style={{ marginRight: '8px' }}>📄</span>
                                                    {file.display_name}
                                                </div>
                                                <button
                                                    className="btn btn-danger btn-sm"
                                                    onClick={() => handleDeleteFile(file.name)}
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 우측: 검색 */}
                    <div style={{ flex: 1 }}>
                        <div className="form-section">
                            <h3>RAG 검색</h3>

                            <div style={{ marginBottom: '15px' }}>
                                <label><strong>검색할 Store 선택:</strong></label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '8px' }}>
                                    {stores.map(store => (
                                        <label
                                            key={store.name}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                padding: '6px 12px',
                                                border: '1px solid #ddd',
                                                borderRadius: '20px',
                                                cursor: 'pointer',
                                                backgroundColor: selectedStoresForSearch.includes(store.name) ? '#e3f2fd' : '#fff'
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedStoresForSearch.includes(store.name)}
                                                onChange={() => toggleStoreForSearch(store.name)}
                                                style={{ marginRight: '6px' }}
                                            />
                                            {store.display_name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: '15px' }}>
                                <label><strong>질문:</strong></label>
                                <textarea
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="PDF 문서에서 찾고 싶은 내용을 자연어로 질문하세요..."
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '10px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd',
                                        marginTop: '8px',
                                        fontSize: '14px'
                                    }}
                                />
                            </div>

                            <button
                                className="btn btn-primary"
                                onClick={handleSearch}
                                disabled={searching}
                                style={{ width: '100%', padding: '12px' }}
                            >
                                {searching ? '검색 중...' : '검색'}
                            </button>

                            {searchResult && (
                                <div style={{ marginTop: '20px' }}>
                                    <h4>검색 결과</h4>
                                    <div
                                        style={{
                                            padding: '15px',
                                            backgroundColor: '#f5f5f5',
                                            borderRadius: '8px',
                                            whiteSpace: 'pre-wrap',
                                            lineHeight: '1.6'
                                        }}
                                    >
                                        {searchResult.answer}
                                    </div>

                                    {searchResult.sources.length > 0 && (
                                        <div style={{ marginTop: '15px' }}>
                                            <h5>출처:</h5>
                                            <ul>
                                                {searchResult.sources.map((source, idx) => (
                                                    <li key={idx}>{source.title}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#888' }}>
                                        모델: {searchResult.model}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* GCS 버킷 파일 등록 탭 */}
            {activeTab === 'gcsBucketRegister' && (
                <div className="content-layout" style={{ display: 'flex', gap: '20px' }}>
                    {/* 좌측: GCS 버킷 파일 목록 */}
                    <div style={{ flex: '0 0 500px' }}>
                        <div className="form-section">
                            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3>GCS 버킷 파일</h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={loadGcsBucketFiles}
                                    disabled={loading}
                                >
                                    {loading ? '로딩 중...' : '파일 목록 조회'}
                                </button>
                            </div>

                            {gcsBucketName && (
                                <p style={{ fontSize: '12px', color: '#888', marginTop: '10px' }}>
                                    버킷: {gcsBucketName}
                                </p>
                            )}

                            <div style={{ marginTop: '15px' }}>
                                <label><strong>등록 대상 FileSearchStore:</strong></label>
                                <select
                                    value={targetStoreName}
                                    onChange={(e) => setTargetStoreName(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '8px',
                                        marginTop: '8px',
                                        borderRadius: '4px',
                                        border: '1px solid #ddd'
                                    }}
                                >
                                    <option value="">-- Store 선택 --</option>
                                    {stores.map(store => (
                                        <option key={store.name} value={store.name}>
                                            {store.display_name} ({store.name})
                                        </option>
                                    ))}
                                </select>
                                {stores.length === 0 && (
                                    <p style={{ fontSize: '12px', color: '#f44336', marginTop: '4px' }}>
                                        FileSearchStore가 없습니다. 먼저 "FileSearchStore (Gemini)" 탭에서 Store를 생성하세요.
                                    </p>
                                )}
                            </div>

                            {loading && <div className="loading" style={{ marginTop: '15px' }}>로딩 중...</div>}

                            <div className="file-list" style={{ marginTop: '20px', maxHeight: '500px', overflowY: 'auto' }}>
                                {gcsBucketFiles.length === 0 ? (
                                    <p style={{ color: '#888' }}>
                                        "파일 목록 조회" 버튼을 눌러 GCS 버킷의 파일을 조회하세요.
                                    </p>
                                ) : (
                                    gcsBucketFiles.map((file, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                padding: '12px',
                                                border: '1px solid #eee',
                                                borderRadius: '4px',
                                                marginBottom: '8px',
                                                backgroundColor: registeredFiles[file.name] ? '#e8f5e9' : '#fff'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span style={{ marginRight: '8px' }}>
                                                            {file.name.endsWith('.pdf') ? '📄' : '📁'}
                                                        </span>
                                                        <strong style={{ wordBreak: 'break-all' }}>{file.name}</strong>
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                                                        {formatFileSize(file.size)} | {file.content_type}
                                                    </div>
                                                    {registeredFiles[file.name] && (
                                                        <div style={{ fontSize: '12px', color: '#4caf50', marginTop: '4px' }}>
                                                            ✅ 등록됨: {registeredFiles[file.name].store_name}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-primary btn-sm"
                                                    onClick={() => handleRegisterToStore(file.name)}
                                                    disabled={registeringFile === file.name || !targetStoreName || !file.name.endsWith('.pdf')}
                                                    style={{ marginLeft: '10px', whiteSpace: 'nowrap' }}
                                                >
                                                    {registeringFile === file.name ? '등록 중...' : '등록'}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 우측: 안내 및 등록 결과 */}
                    <div style={{ flex: 1 }}>
                        <div className="form-section">
                            <h3>GCS 파일 → FileSearchStore 등록</h3>

                            <div style={{ padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '8px', marginTop: '15px' }}>
                                <h4 style={{ marginBottom: '10px' }}>사용 방법</h4>
                                <ol style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                                    <li>먼저 "Store 관리 & 검색" 탭에서 Store를 생성하세요.</li>
                                    <li>"파일 목록 조회" 버튼을 클릭하여 GCS 버킷 파일을 조회하세요.</li>
                                    <li>"등록 대상 FileSearchStore"에서 Store를 선택하세요.</li>
                                    <li>등록하려는 PDF 파일의 "등록" 버튼을 클릭하세요.</li>
                                    <li>등록이 완료되면 해당 Store에서 RAG 검색이 가능합니다.</li>
                                </ol>
                            </div>

                            <div style={{ padding: '15px', backgroundColor: '#fff3e0', borderRadius: '8px', marginTop: '15px' }}>
                                <h4 style={{ marginBottom: '10px' }}>주의사항</h4>
                                <ul style={{ paddingLeft: '20px', lineHeight: '1.8' }}>
                                    <li>PDF 파일만 FileSearchStore에 등록할 수 있습니다.</li>
                                    <li>파일 등록은 몇 분 정도 소요될 수 있습니다.</li>
                                    <li>동일한 파일을 중복 등록하면 Store에 여러 개의 파일이 생성됩니다.</li>
                                </ul>
                            </div>

                            {Object.keys(registeredFiles).length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <h4>등록 완료된 파일 ({Object.keys(registeredFiles).length}개)</h4>
                                    <div style={{ marginTop: '10px' }}>
                                        {Object.entries(registeredFiles).map(([fileName, result]) => (
                                            <div
                                                key={fileName}
                                                style={{
                                                    padding: '10px',
                                                    backgroundColor: '#e8f5e9',
                                                    borderRadius: '4px',
                                                    marginBottom: '8px'
                                                }}
                                            >
                                                <div><strong>{fileName}</strong></div>
                                                <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                    Store: {result.store_name}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* FileSearchStore 생성 모달 */}
            {showCreateModal && (
                <div
                    className="modal-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowCreateModal(false)}
                >
                    <div
                        className="modal-content"
                        style={{
                            backgroundColor: '#fff',
                            padding: '20px',
                            borderRadius: '8px',
                            minWidth: '400px'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3>새 Store 생성</h3>
                        <div style={{ marginTop: '15px' }}>
                            <label>Store 이름:</label>
                            <input
                                type="text"
                                value={newStoreName}
                                onChange={(e) => setNewStoreName(e.target.value)}
                                placeholder="예: 마케팅자료, 기획서, 우수사례"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginTop: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd'
                                }}
                            />
                        </div>
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setShowCreateModal(false)}
                            >
                                취소
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleCreateStore}
                                disabled={loading}
                            >
                                {loading ? '생성 중...' : '생성'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default PDFFileSearch;
