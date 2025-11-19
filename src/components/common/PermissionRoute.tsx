// src/components/common/PermissionRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface PermissionRouteProps {
  children: JSX.Element;
  requiredPermission: string;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({ children, requiredPermission }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // 로딩 중에는 아무것도 렌더링하지 않거나 로딩 스피너를 보여줄 수 있습니다.
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // 로그인하지 않은 사용자는 로그인 페이지로 리디렉션합니다.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasPermission(requiredPermission)) {
    // 권한이 없는 경우, 접근 거부 페이지를 보여주거나 대시보드로 리디렉션할 수 있습니다.
    // 여기서는 간단한 메시지를 보여줍니다.
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h1>접근 거부</h1>
        <p>이 페이지에 접근할 권한이 없습니다.</p>
      </div>
    );
  }

  // 모든 검사를 통과하면 요청된 페이지를 렌더링합니다.
  return children;
};

export default PermissionRoute;
