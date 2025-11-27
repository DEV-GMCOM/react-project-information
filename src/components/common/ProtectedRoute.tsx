import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactElement;
    requiredPermission?: string; // 선택적 권한 체크
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredPermission }) => {
    const { isAuthenticated, isLoading, hasPermission } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="route-loading-spinner" role="status" aria-label="로딩 중">
                    <span className="sr-only">로딩 중</span>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 권한 체크 (requiredPermission이 설정된 경우)
    if (requiredPermission && !hasPermission(requiredPermission)) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <h2>접근 권한이 없습니다</h2>
                <p>이 페이지에 접근할 권한이 없습니다.</p>
                <p style={{ color: '#999', marginTop: '1rem' }}>
                    필요한 권한: <code>{requiredPermission}</code>
                </p>
                <button
                    onClick={() => window.history.back()}
                    style={{
                        marginTop: '1rem',
                        padding: '0.5rem 1rem',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                    }}
                >
                    돌아가기
                </button>
            </div>
        );
    }

    return children;
};

export default ProtectedRoute;
