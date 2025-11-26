
import React, { useState } from 'react';
import '../../../styles/AccessControl.css';
import RbacBuilder from './RbacBuilder';
import AbacBuilder from './AbacBuilder';

const AccessControl: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'RBAC' | 'ABAC'>('RBAC');

    return (
        <div className="access-control-container">
            <div className="access-control-header">
                <h1>접근 제어 정책 관리</h1>
                <p>시스템의 접근 제어 모델을 선택하고 관리합니다.</p>
            </div>

            <div className="access-control-tabs">
                <button
                    className={`tab-button ${activeTab === 'RBAC' ? 'active' : ''}`}
                    onClick={() => setActiveTab('RBAC')}
                >
                    RBAC
                </button>
                <button
                    className={`tab-button ${activeTab === 'ABAC' ? 'active' : ''}`}
                    onClick={() => setActiveTab('ABAC')}
                >
                    ABAC
                </button>
            </div>

            <div className="access-control-content">
                {activeTab === 'RBAC' && <RbacBuilder />}
                {activeTab === 'ABAC' && <AbacBuilder />}
            </div>
        </div>
    );
};

export default AccessControl;