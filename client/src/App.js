import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SelectClub from './pages/SelectClub';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers';
import ExecutiveUsers from './pages/ExecutiveUsers';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import ReportForm from './pages/ReportForm';
import Profile from './pages/Profile';
import ProtectedRoute from './components/ProtectedRoute';
import RoleGuard from './components/RoleGuard';
import { Roles } from './constants';
import Toast from './components/Toast';
import AcceptInvite from './pages/AcceptInvite';
import ReportsList from './pages/ReportsList';
import ReportDetail from './pages/ReportDetail';

export default function App(){
  const { pathname } = useLocation();
  const hideNav = pathname === '/login' || pathname === '/signup';
  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/select-club" element={<ProtectedRoute><SelectClub /></ProtectedRoute>} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><RoleGuard roles={[Roles.ADMIN]}><AdminUsers /></RoleGuard></ProtectedRoute>} />
        <Route path="/executive/users" element={<ProtectedRoute><RoleGuard roles={[Roles.EXECUTIVE]}><ExecutiveUsers /></RoleGuard></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
        <Route path="/reports/new" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/invite/:code" element={<ProtectedRoute><AcceptInvite /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
      </Routes>
      <Toast />
    </>
  );
}