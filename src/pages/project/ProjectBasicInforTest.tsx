// src/pages/test/ProjectBasicInfoTest.tsx
import React, { useState } from 'react';
import ProjectBasicInfoForm from '../../components/common/ProjectBasicInfoForm';
import {ExtendedProjectData, ProjectBasicInfo} from '../../types/project';
import '../../styles/ProjectProfile.css';

const ProjectBasicInforTest: React.FC = () => {
    const [formData, setFormData] = useState<ExtendedProjectData>({
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
        // ExtendedProjectData에 포함된 추가 필드들
        purposeBackground: '',
        mainContent: '',
        coreRequirements: '',
        comparison: '',
        writerName: '',
        writerDepartment: ''
    });

    const handleBasicInfoChange = (name: keyof ExtendedProjectData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // const handleProjectSearch = () => {
    //     alert('프로젝트 검색 기능 호출');
    // };
    //
    // const handleCompanySearch = () => {
    //     alert('발주처 검색 기능 호출');
    // };
    //
    // const handleContactSearch = () => {
    //     alert('담당자 검색 기능 호출');
    // };

    const handleSubmit = () => {
        console.log('테스트 데이터:', formData);
        alert('테스트 저장 완료');
    };

    const handleProjectSearch = () => {};
    const handleCompanySearch = () => {};
    const handleContactSearch = () => {};

    return (
        <div className="project-profile-container">
            {/* 헤더 */}
            <div className="profile-header">
                <div>
                    <h1 className="profile-title">
                        ProjectBasicInfoForm 컴포넌트 테스트
                    </h1>
                </div>
                <div className="profile-logo">
                    TEST
                </div>
            </div>

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

                {/* 버튼 영역 */}
                <div className="button-section">
                    <button onClick={handleSubmit} className="submit-btn">
                        테스트 저장
                    </button>
                </div>

                {/* 현재 데이터 표시 */}
                <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
                    <h4>현재 입력된 데이터:</h4>
                    <pre style={{ fontSize: '12px', backgroundColor: 'white', padding: '10px', borderRadius: '4px' }}>
                        {JSON.stringify(formData, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default ProjectBasicInforTest;