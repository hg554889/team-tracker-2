import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children }){
  const { user, loading } = useAuth();
  const loc = useLocation();
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  if (loading) return <div className="container">로딩...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.clubId && loc.pathname !== '/select-club') return <Navigate to="/select-club" replace />;
  return children;
}