import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }){
  const { user, loading } = useAuth();
  const loc = useLocation();
  const token = localStorage.getItem('token');
  
  if (!token) return <Navigate to="/" replace />;
  if (loading) return <div className="container">로딩...</div>;
  if (!user) return <Navigate to="/" replace />;
  
  // Check approval status
  if (user.approvalStatus === 'pending' && loc.pathname !== '/approval-pending') {
    return <Navigate to="/approval-pending" replace />;
  }
  
  if (user.approvalStatus === 'rejected') {
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
  
  // Only check clubId for approved users
  if (user.approvalStatus === 'approved' && !user.clubId && loc.pathname !== '/select-club') {
    return <Navigate to="/select-club" replace />;
  }
  
  return children;
}