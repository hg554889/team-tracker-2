import React from 'react';
import { useAuth } from '../contexts/AuthContext';
export default function RoleGuard({ roles, children }){
  const { user } = useAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) return <div className="container">권한이 없습니다.</div>;
  return children;
}