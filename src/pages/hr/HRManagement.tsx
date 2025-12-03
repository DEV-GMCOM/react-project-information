// src/pages/hr/HRManagement.tsx
import React, { useState } from 'react';
import '../../styles/HRManagement.css';

// 탭 컴포넌트들
import OrganizationChart from './OrganizationChart';
import EmployeeManagementTab from './EmployeeManagementTab';
import DepartmentManagementTab from './DepartmentManagementTab';

type TabType = 'organization' | 'employees' | 'departments';

const HRManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('organization');

    const renderTabContent = () => {
        switch (activeTab) {
            case 'organization':
                return <OrganizationChart />;
            case 'employees':
                return <EmployeeManagementTab />;
            case 'departments':
                return <DepartmentManagementTab />;
            default:
                return null;
        }
    };

    return (
        <div className="hr-management-container">
            <div className="page-header">
                <h1>직원정보 관리</h1>
                <p className="subtitle">조직도, 직원 정보, 부서 관리</p>
            </div>

            {/* 탭 네비게이션 */}
            <div className="management-section">
                <div className="tab-navigation">
                    <button
                        className={`tab-button ${activeTab === 'organization' ? 'active' : ''}`}
                        onClick={() => setActiveTab('organization')}
                    >
                        <span className="tab-icon">🏢</span>
                        조직도
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'departments' ? 'active' : ''}`}
                        onClick={() => setActiveTab('departments')}
                    >
                        <span className="tab-icon">📊</span>
                        부서 관리
                    </button>
                    <button
                        className={`tab-button ${activeTab === 'employees' ? 'active' : ''}`}
                        onClick={() => setActiveTab('employees')}
                    >
                        <span className="tab-icon">👥</span>
                        직원 관리
                    </button>
                </div>

                {/* 탭 컨텐츠 */}
                <div className="tab-content">
                    {renderTabContent()}
                </div>
            </div>
        </div>
    );
};

export default HRManagement;
