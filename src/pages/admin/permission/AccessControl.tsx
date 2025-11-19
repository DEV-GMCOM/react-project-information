
import React from 'react';
import { Link } from 'react-router-dom';
import '../../../styles/AccessControl.css';

const AccessControl: React.FC = () => {
    return (
        <div className="access-control-container">
            <div className="access-control-header">
                <h1>접근 제어 정책 관리</h1>
                <p>시스템의 접근 제어 모델을 선택하고 관리합니다.</p>
            </div>
            <div className="access-control-menu">
                <Link to="/admin/permission/rbac" className="menu-card">
                    <div className="menu-card-content">
                        <h2>RBAC 빌더</h2>
                        <p>역할(Role) 기반으로 권한을 설정하고 관리합니다.</p>
                    </div>
                </Link>
                <Link to="/admin/permission/abac" className="menu-card">
                    <div className="menu-card-content">
                        <h2>ABAC 빌더 (프로토타입)</h2>
                        <p>사용자, 리소스의 속성(Attribute)을 기반으로 복잡한 접근 규칙을 생성합니다.</p>
                    </div>
                </Link>
            </div>
        </div>
    );
};

export default AccessControl;