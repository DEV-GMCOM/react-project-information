import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactElement;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner">로딩 중...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;