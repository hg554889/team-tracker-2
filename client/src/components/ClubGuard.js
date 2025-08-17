import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';

export default function ClubGuard({ children, requiredPermissions = [], fallbackPath = '/' }) {
  const { user } = useAuth();
  const { hasClubPermission, loading } = useClub();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#636e72' 
      }}>
        권한을 확인하는 중...
      </div>
    );
  }

  // 권한이 필요한 경우 확인
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(permission => 
      hasClubPermission(permission)
    );

    if (!hasAllPermissions) {
      // 권한이 없는 경우 대체 경로로 리다이렉트
      return <Navigate to={fallbackPath} state={{ from: location }} replace />;
    }
  }

  return children;
}

// 특정 역할을 위한 편의 컴포넌트들
export function AdminOnlyGuard({ children, fallbackPath = '/' }) {
  const { user } = useAuth();
  
  if (user?.role !== 'ADMIN') {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
}

export function ExecutiveOrAdminGuard({ children, fallbackPath = '/' }) {
  const { user } = useAuth();
  
  if (!['ADMIN', 'EXECUTIVE'].includes(user?.role)) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
}

export function LeaderOrAboveGuard({ children, fallbackPath = '/' }) {
  const { user } = useAuth();
  
  if (!['ADMIN', 'EXECUTIVE', 'LEADER'].includes(user?.role)) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
}

// 동아리 접근 권한 확인
export function ClubAccessGuard({ clubId, children, fallbackPath = '/' }) {
  const { isClubAccessible } = useClub();
  
  if (clubId && !isClubAccessible(clubId)) {
    return <Navigate to={fallbackPath} replace />;
  }
  
  return children;
}