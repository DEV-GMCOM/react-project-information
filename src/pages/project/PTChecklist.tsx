import React, { useState } from 'react';
import '../../styles/PTChecklist.css';
import { apiService } from '../../api';
import type { Project } from '../../api/types';

import apiClient from '../../api/utils/apiClient';  // 이 줄 추가

// import {ptChecklistService} from "@/api/services/ptChecklistService.ts";
import {ptChecklistService} from "../../api/services/ptChecklistService.ts";

// ... (기존 PTChecklistData 인터페이스는 그대로 유지) ...

interface PTChecklistData {
    // 프로젝트 기본 정보
    projectName: string;
    department: string;
    presenter: string;

    // ... (나머지 체크리스트 항목들은 생략) ...
    professionalUnderstanding: {
        checked: boolean;
        opinion: string;
    };
    conceptStrategy: {
        checked: boolean;
        opinion: string;
    };
    feasibility: {
        checked: boolean;
        opinion: string;
    };
    proposalCompleteness: {
        checked: boolean;
        opinion: string;
    };

    // 수행능력 체크리스트
    safetyManagement: {
        checked: boolean;
        opinion: string;
    };
    eventPlan: {
        checked: boolean;
        opinion: string;
    };
    organizationStructure: {
        checked: boolean;
        opinion: string;
    };
    performanceRecord: {
        checked: boolean;
        opinion: string;
    };

    // 비용 체크리스트
    pricingAdequacy: {
        checked: boolean;
        opinion: string;
    };
    additionalProposals: {
        checked: boolean;
        opinion: string;
    };

    // 발표 체크리스트
    presentationPersuasiveness: {
        checked: boolean;
        opinion: string;
    };
    strategicPerformance: {
        checked: boolean;
        opinion: string;
    };
    qaPreparation: {
        checked: boolean;
        opinion: string;
    };
    presenterAttitude: {
        checked: boolean;
        opinion: string;
    };

    // 메타데이터
    writerName: string;
    writerDepartment: string;
}


const PTChecklistForm: React.FC = () => {
    const [formData, setFormData] = useState<PTChecklistData>({
        projectName: '',
        department: '',
        presenter: '',
        professionalUnderstanding: { checked: false, opinion: '' },
        conceptStrategy: { checked: false, opinion: '' },
        feasibility: { checked: false, opinion: '' },
        proposalCompleteness: { checked: false, opinion: '' },
        safetyManagement: { checked: false, opinion: '' },
        eventPlan: { checked: false, opinion: '' },
        organizationStructure: { checked: false, opinion: '' },
        performanceRecord: { checked: false, opinion: '' },
        pricingAdequacy: { checked: false, opinion: '' },
        additionalProposals: { checked: false, opinion: '' },
        presentationPersuasiveness: { checked: false, opinion: '' },
        strategicPerformance: { checked: false, opinion: '' },
        qaPreparation: { checked: false, opinion: '' },
        presenterAttitude: { checked: false, opinion: '' },
        writerName: '',
        writerDepartment: ''
    });

    // --- 프로젝트 검색 관련 상태 추가 ---
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [searchResults, setSearchResults] = useState<Project[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');  // 검색용 독립 상태 추가


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleCheckboxChange = (category: keyof Omit<PTChecklistData, 'projectName' | 'department' | 'presenter' | 'writerName' | 'writerDepartment'>) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...(prev[category] as any),
                checked: !(prev[category] as any).checked
            }
        }));
    };

    const handleOpinionChange = (category: keyof Omit<PTChecklistData, 'projectName' | 'department' | 'presenter' | 'writerName' | 'writerDepartment'>, opinion: string) => {
        setFormData(prev => ({
            ...prev,
            [category]: {
                ...(prev[category] as any),
                opinion: opinion
            }
        }));
    };

    // --- 프로젝트 검색 관련 함수 추가 ---
    // const handleProjectSearch = async (page = 1) => {
    //     setSearchLoading(true);
    //     try {
    //         const projects = await apiService.getProjects({
    //             search: formData.projectName,
    //             skip: (page - 1) * 10,
    //             limit: 10,
    //         });
    //         setSearchResults(projects);
    //         // 전체 페이지 수 계산 로직 (백엔드 API가 전체 카운트를 제공해야 함)
    //         // setTotalPages(Math.ceil(projects.totalCount / 10));
    //     } catch (error) {
    //         console.error("Project search error:", error);
    //         alert("프로젝트 검색 중 오류가 발생했습니다.");
    //     } finally {
    //         setSearchLoading(false);
    //     }
    // };
    const handleProjectSearch = async (page = 1) => {
        setSearchLoading(true);
        try {
            const projects = await apiService.getProjects({
                search: searchQuery,  // ← formData.projectName 대신 searchQuery 사용
                skip: (page - 1) * 10,
                limit: 10,
            });
            setSearchResults(projects);
        } catch (error) {
            console.error("Project search error:", error);
            alert("프로젝트 검색 중 오류가 발생했습니다.");
        } finally {
            setSearchLoading(false);
        }
    };

    // 프로젝트 선택 시 기존 데이터 로딩
    const selectProject = async (project: Project) => {
        // project_id 필드 사용 (콘솔에서 확인된 필드명)
        const projectId = (project as any).project_id;

        if (!projectId) {
            console.error('프로젝트 ID가 없습니다:', project);
            alert('프로젝트 ID를 찾을 수 없습니다.');
            return;
        }

        setSelectedProjectId(projectId);

        // Project Kickoff에서 담당부서, PT발표자 가져오기
        let kickoffData = null;
        try {
            const kickoffResponse = await apiClient.get(`/projects/${projectId}/kickoff`);
            kickoffData = kickoffResponse.data;
        } catch (kickoffError) {
            console.log('착수보고 데이터 없음');
        }

        // 기존 체크리스트 데이터 로딩
        try {
            const existingData = await ptChecklistService.getPTChecklist(projectId);

            // API 응답 데이터를 폼 데이터로 매핑
            setFormData({
                projectName: project.project_name,
                // department: existingData.department || project.company_name || '',
                // presenter: existingData.presenter || project.manager_name || '',
                department: kickoffData?.department || '',  // 표시용, 저장 안함
                presenter: kickoffData?.presenter || '',    // 표시용, 저장 안함

                // 체크리스트 항목들 - 백엔드 JSON 형태를 프론트 형태로 변환
                professionalUnderstanding: existingData.professional_understanding || { checked: false, opinion: '' },
                conceptStrategy: existingData.concept_strategy || { checked: false, opinion: '' },
                feasibility: existingData.feasibility || { checked: false, opinion: '' },
                proposalCompleteness: existingData.proposal_completeness || { checked: false, opinion: '' },
                safetyManagement: existingData.safety_management || { checked: false, opinion: '' },
                eventPlan: existingData.event_plan || { checked: false, opinion: '' },
                organizationStructure: existingData.organization_structure || { checked: false, opinion: '' },
                performanceRecord: existingData.performance_record || { checked: false, opinion: '' },
                pricingAdequacy: existingData.pricing_adequacy || { checked: false, opinion: '' },
                additionalProposals: existingData.additional_proposals || { checked: false, opinion: '' },
                presentationPersuasiveness: existingData.persuasiveness || { checked: false, opinion: '' },
                strategicPerformance: existingData.strategic_performance || { checked: false, opinion: '' },
                qaPreparation: existingData.qa_preparation || { checked: false, opinion: '' },
                presenterAttitude: existingData.presenter_attitude || { checked: false, opinion: '' },

                writerName: existingData.writer_name || '',
                writerDepartment: existingData.writer_department || ''
            });

            console.log('기존 체크리스트 데이터 로딩 완료:', existingData);

        } catch (error: any) {
            if (error.status === 404) {
                // 2. 응답값이 없을 경우 기본값으로 리셋
                console.log('신규 프로젝트 - 기존 데이터 없음');
                setFormData({
                    projectName: project.project_name,
                    // department: project.company_name || '',
                    // presenter: project.manager_name || '',
                    department: kickoffData?.department || '',  // 표시용, 저장 안함
                    presenter: kickoffData?.presenter || '',    // 표시용, 저장 안함

                    // 모든 체크리스트 항목을 기본값으로 초기화
                    professionalUnderstanding: { checked: false, opinion: '' },
                    conceptStrategy: { checked: false, opinion: '' },
                    feasibility: { checked: false, opinion: '' },
                    proposalCompleteness: { checked: false, opinion: '' },
                    safetyManagement: { checked: false, opinion: '' },
                    eventPlan: { checked: false, opinion: '' },
                    organizationStructure: { checked: false, opinion: '' },
                    performanceRecord: { checked: false, opinion: '' },
                    pricingAdequacy: { checked: false, opinion: '' },
                    additionalProposals: { checked: false, opinion: '' },
                    presentationPersuasiveness: { checked: false, opinion: '' },
                    strategicPerformance: { checked: false, opinion: '' },
                    qaPreparation: { checked: false, opinion: '' },
                    presenterAttitude: { checked: false, opinion: '' },

                    writerName: '',
                    writerDepartment: ''
                });
            } else {
                console.error('체크리스트 로딩 오류:', error);
                alert('기존 데이터 로딩 중 오류가 발생했습니다.');
            }
        }

        setShowSearchModal(false);
    };

    const handleSubmit = async () => {
        if (!selectedProjectId) {
            alert('프로젝트를 먼저 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const apiData = {
                project_id: selectedProjectId,
                // department: formData.department,
                // presenter: formData.presenter,
                professional_understanding: formData.professionalUnderstanding,
                concept_strategy: formData.conceptStrategy,
                feasibility: formData.feasibility,
                proposal_completeness: formData.proposalCompleteness,
                safety_management: formData.safetyManagement,
                event_plan: formData.eventPlan,
                organization_structure: formData.organizationStructure,
                performance_record: formData.performanceRecord,
                pricing_adequacy: formData.pricingAdequacy,
                additional_proposals: formData.additionalProposals,
                persuasiveness: formData.presentationPersuasiveness,
                strategic_performance: formData.strategicPerformance,
                qa_preparation: formData.qaPreparation,
                presenter_attitude: formData.presenterAttitude,
                writer_name: formData.writerName,
                writer_department: formData.writerDepartment
            };

            await ptChecklistService.createOrUpdatePTChecklist(apiData);
            alert('PT 체크리스트가 저장되었습니다.');
        } catch (error) {
            console.error('저장 오류:', error);
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    // 2. renderSearchResults 함수 추가 (ProjectInformation 스타일 참조)
    const renderSearchResults = () => {
        if (searchLoading) {
            return <div className="loading">검색 중...</div>;
        }

        if (searchResults.length === 0) {
            return <div className="no-results">검색 결과가 없습니다.</div>;
        }

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>프로젝트명</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>고객사</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>상태</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>생성일</th>
                    <th style={{ padding: '8px', border: '1px solid #ddd' }}>선택</th>
                </tr>
                </thead>
                <tbody>
                {searchResults.map((project: Project) => (
                    // <tr key={project.id}>
                    <tr key={project.project_id || project.id}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.project_name}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.company_name || '-'}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.status}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>{project.created_at}</td>
                        <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                            <button className="select-btn" onClick={() => selectProject(project)}>선택</button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>
        );
    };


    return (
        <div className="pt-checklist-container">
            {/* ... (기존 헤더 및 타이틀 섹션은 그대로 유지) ... */}
            <div className="checklist-header">
                <div>
                    <h1 className="checklist-title">
                        PT 준비 체크리스트 양식
                    </h1>
                </div>
                <div className="checklist-logo">
                    GMCOM
                </div>
            </div>

            <div className="checklist-main">
                <div className="checklist-title-section">
                    <h2 className="checklist-subtitle">
                        PT 준비 체크리스트
                    </h2>
                    <div className="profile-writer">
                        <div className="writer-form">
                            <div>
                                최종 작성자 :
                            </div>
                        </div>
                    </div>
                </div>

                <div className="checklist-section">
                    <h3 className="section-header">
                        ■ 프로젝트 체크사항
                    </h3>

                    <table className="checklist-table">
                        <tbody>
                        <tr>
                            <td className="table-header">타이틀 구분</td>
                            <td className="table-header">타이틀 내용</td>
                        </tr>
                        {/* --- 프로젝트명 Row 수정 --- */}
                        <tr>
                            <td className="table-cell table-cell-label">프로젝트명</td>
                            <td className="table-cell-input">
                                <div className="input-with-search">
                                    <input
                                        type="text"
                                        name="projectName"
                                        value={formData.projectName}
                                        onChange={handleInputChange}
                                        className="checklist-input"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                setShowSearchModal(true);
                                                handleProjectSearch(1);
                                            }
                                        }}
                                    />
                                    <button
                                        type="button"
                                        className="search-btn"
                                        onClick={() => {
                                            setShowSearchModal(true);
                                            handleProjectSearch(1);
                                        }}
                                    >
                                        🔍
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {/* --- 담당부서 및 PT 발표자 Row 는 그대로 유지 --- */}
                        <tr>
                            <td className="table-cell table-cell-label">담당부서</td>
                            <td className="table-cell-input">
                                <input
                                    type="text"
                                    value={formData.department}
                                    className="checklist-input readonly-field"
                                    readOnly
                                    placeholder="착수보고서에서 설정된 담당부서가 표시됩니다"
                                />
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell table-cell-label">PT 발표자</td>
                            <td className="table-cell-input">
                                {/*<input*/}
                                {/*    type="text"*/}
                                {/*    name="presenter"*/}
                                {/*    value={formData.presenter}*/}
                                {/*    onChange={handleInputChange}*/}
                                {/*    className="checklist-input"*/}
                                {/*/>*/}
                                <input
                                    type="text"
                                    value={formData.presenter}
                                    className="checklist-input readonly-field"
                                    readOnly
                                    placeholder="착수보고서에서 설정된 PT 발표자가 표시됩니다"
                                />
                            </td>
                        </tr>

                        {/* ... (나머지 체크리스트 항목 테이블 구조는 그대로 유지) ... */}
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={4}>내용</td>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.professionalUnderstanding.checked}
                                            onChange={() => handleCheckboxChange('professionalUnderstanding')}
                                            className="checklist-checkbox"
                                        />
                                        과업의 전문적 이해도, 목적과 방향성 부합여부
                                    </label>
                                    <textarea
                                        value={formData.professionalUnderstanding.opinion}
                                        onChange={(e) => handleOpinionChange('professionalUnderstanding', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.conceptStrategy.checked}
                                            onChange={() => handleCheckboxChange('conceptStrategy')}
                                            className="checklist-checkbox"
                                        />
                                        컨셉 및 전략 수립의 타당성 및 차별성, 독창성
                                    </label>
                                    <textarea
                                        value={formData.conceptStrategy.opinion}
                                        onChange={(e) => handleOpinionChange('conceptStrategy', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.feasibility.checked}
                                            onChange={() => handleCheckboxChange('feasibility')}
                                            className="checklist-checkbox"
                                        />
                                        제안 내용의 구체적 실현 가능성
                                    </label>
                                    <textarea
                                        value={formData.feasibility.opinion}
                                        onChange={(e) => handleOpinionChange('feasibility', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.proposalCompleteness.checked}
                                            onChange={() => handleCheckboxChange('proposalCompleteness')}
                                            className="checklist-checkbox"
                                        />
                                        RFP(광고주 요청사항, PT배점) 만족하는 제안서 완성도
                                    </label>
                                    <textarea
                                        value={formData.proposalCompleteness.opinion}
                                        onChange={(e) => handleOpinionChange('proposalCompleteness', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>

                        {/* 수행능력 섹션 */}
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={4}>수행능력</td>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.safetyManagement.checked}
                                            onChange={() => handleCheckboxChange('safetyManagement')}
                                            className="checklist-checkbox"
                                        />
                                        안전관리, 비상상황 등의 대책 수립여부 및 운영의 안전성
                                    </label>
                                    <textarea
                                        value={formData.safetyManagement.opinion}
                                        onChange={(e) => handleOpinionChange('safetyManagement', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.eventPlan.checked}
                                            onChange={() => handleCheckboxChange('eventPlan')}
                                            className="checklist-checkbox"
                                        />
                                        행사진행 계획의 적정성 ( 무대 및 공간디자인, 인력, 홍보 등)
                                    </label>
                                    <textarea
                                        value={formData.eventPlan.opinion}
                                        onChange={(e) => handleOpinionChange('eventPlan', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.organizationStructure.checked}
                                            onChange={() => handleCheckboxChange('organizationStructure')}
                                            className="checklist-checkbox"
                                        />
                                        조직 구성의 적절성, 필요 인력의 보유현황
                                    </label>
                                    <textarea
                                        value={formData.organizationStructure.opinion}
                                        onChange={(e) => handleOpinionChange('organizationStructure', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.performanceRecord.checked}
                                            onChange={() => handleCheckboxChange('performanceRecord')}
                                            className="checklist-checkbox"
                                        />
                                        유사 사업수행 실적
                                    </label>
                                    <textarea
                                        value={formData.performanceRecord.opinion}
                                        onChange={(e) => handleOpinionChange('performanceRecord', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>

                        {/* 비용 섹션 */}
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={2}>비용</td>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.pricingAdequacy.checked}
                                            onChange={() => handleCheckboxChange('pricingAdequacy')}
                                            className="checklist-checkbox"
                                        />
                                        제안가의 적정성
                                    </label>
                                    <textarea
                                        value={formData.pricingAdequacy.opinion}
                                        onChange={(e) => handleOpinionChange('pricingAdequacy', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.additionalProposals.checked}
                                            onChange={() => handleCheckboxChange('additionalProposals')}
                                            className="checklist-checkbox"
                                        />
                                        제안사 추가제안, 협찬등의 여부
                                    </label>
                                    <textarea
                                        value={formData.additionalProposals.opinion}
                                        onChange={(e) => handleOpinionChange('additionalProposals', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>

                        {/* 발표 섹션 */}
                        <tr>
                            <td className="table-cell table-cell-rowspan" rowSpan={4}>발표</td>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.presentationPersuasiveness.checked}
                                            onChange={() => handleCheckboxChange('presentationPersuasiveness')}
                                            className="checklist-checkbox"
                                        />
                                        PT 발표자가 설득력 있게 전달하고 있는가?<br/>
                                        - 내용을 이해하고 자신감 있게 설명하고 있는지<br/>
                                        - 주어진 시간 내의, 내용 안배를 적절히 했는지
                                    </label>
                                    <textarea
                                        value={formData.presentationPersuasiveness.opinion}
                                        onChange={(e) => handleOpinionChange('presentationPersuasiveness', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.strategicPerformance.checked}
                                            onChange={() => handleCheckboxChange('strategicPerformance')}
                                            className="checklist-checkbox"
                                        />
                                        전략적 PT를 위한 쇼 퍼포먼스는 적정한가<br/>
                                        - 디자인 애니메이션, 연출 영상 상영, 3D 렌더링 등
                                    </label>
                                    <textarea
                                        value={formData.strategicPerformance.opinion}
                                        onChange={(e) => handleOpinionChange('strategicPerformance', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.qaPreparation.checked}
                                            onChange={() => handleCheckboxChange('qaPreparation')}
                                            className="checklist-checkbox"
                                        />
                                        예상 질의 응답 (Q&A)에 대한 사전 대비가 완료 되었는가?
                                    </label>
                                    <textarea
                                        value={formData.qaPreparation.opinion}
                                        onChange={(e) => handleOpinionChange('qaPreparation', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        <tr>
                            <td className="table-cell-input checklist-item-cell">
                                <div className="checklist-item">
                                    <label className="checklist-label">
                                        <input
                                            type="checkbox"
                                            checked={formData.presenterAttitude.checked}
                                            onChange={() => handleCheckboxChange('presenterAttitude')}
                                            className="checklist-checkbox"
                                        />
                                        PT 발표자의 Attitude는 적합한가<br/>
                                        - 프로젝트의 톤앤매너와 광고주 스타일에 적합한지<br/>
                                        - 발표자의 액션, 말투는 과하지 않은지<br/>
                                        - 발표자의 PT스타일 (화법, 복장)은 그에 부합한지
                                    </label>
                                    <textarea
                                        value={formData.presenterAttitude.opinion}
                                        onChange={(e) => handleOpinionChange('presenterAttitude', e.target.value)}
                                        placeholder="의견"
                                        className="checklist-textarea"
                                    />
                                </div>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </div>

                {/* 버튼 영역 */}
                <div className="checklist-actions">
                    <button onClick={handleSubmit} className="btn-primary">저장</button>
                    {/*<button onClick={handlePrint} className="btn-secondary">인쇄</button>*/}
                </div>
            </div>

            {/* --- 프로젝트 검색 모달 추가 --- */}
            {/*// 1. 검색 모달을 ProjectInformation.tsx와 동일한 구조로 변경*/}
            {showSearchModal && (
                <div className="modal-overlay" onClick={() => setShowSearchModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>프로젝트 검색</h3>
                            <button className="modal-close-btn" onClick={() => setShowSearchModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            <div className="input-with-search" style={{ marginBottom: '20px' }}>
                                <input
                                    type="text"
                                    value={searchQuery}  // ← 독립된 검색 상태 사용
                                    onChange={(e) => setSearchQuery(e.target.value)}  // ← 독립 상태 업데이트
                                    placeholder="프로젝트명을 입력하세요"
                                    className="checklist-input"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleProjectSearch(1);
                                        }
                                    }}
                                />
                                {/*<button*/}
                                {/*    onClick={() => handleProjectSearch(1)}*/}
                                {/*    className="search-btn"*/}
                                {/*    type="button"*/}
                                {/*>*/}
                                {/*    🔍*/}
                                {/*</button>*/}
                                <button
                                    type="button"
                                    className="search-btn"
                                    onClick={() => {
                                        setSearchQuery(formData.projectName);  // 현재 프로젝트명을 검색어로 초기 설정
                                        setShowSearchModal(true);
                                        if (formData.projectName) {
                                            handleProjectSearch(1);  // 기존 프로젝트명이 있으면 바로 검색
                                        }
                                    }}
                                >
                                    🔍
                                </button>
                            </div>
                            {renderSearchResults()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PTChecklistForm;