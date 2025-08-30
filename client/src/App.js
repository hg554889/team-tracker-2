import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SelectClub from './pages/SelectClub';
import Dashboard from './pages/Dashboard';
import AdminUsers from './pages/AdminUsers';
import AdminClubs from './pages/AdminClubs';
import AdminSettings from './pages/AdminSettings';
import AdminAnalytics from './pages/AdminAnalytics';
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
import ApprovalPending from './pages/ApprovalPending';
import ApprovalRequests from './pages/ApprovalRequests';
import InquiryManagement from './pages/InquiryManagement';
import UserProfile from './pages/UserProfile';
import TeamInvite from './pages/TeamInvite';
import TeamJoin from './pages/TeamJoin';
import TaskManagement from './pages/TaskManagement';
import ReviewManagement from './pages/ReviewManagement';
import NotificationCenter from './pages/NotificationCenter';
import ActivityFeed from './pages/ActivityFeed';
import { useAuth } from './contexts/AuthContext';

export default function App(){
  const { pathname } = useLocation();
  const { user, loading } = useAuth();
  const token = localStorage.getItem('token');
  
  // Show landing page for unauthenticated users
  const shouldShowLanding = !loading && !token && pathname === '/';
  
  const hideNav = pathname === '/login' || pathname === '/signup' || shouldShowLanding;
  
  return (
    <>
      {!hideNav && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/select-club" element={<ProtectedRoute><SelectClub /></ProtectedRoute>} />
        <Route path="/" element={shouldShowLanding ? <Landing /> : <ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><RoleGuard roles={[Roles.ADMIN]}><AdminUsers /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/clubs" element={<ProtectedRoute><RoleGuard roles={[Roles.ADMIN]}><AdminClubs /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute><RoleGuard roles={[Roles.ADMIN]}><AdminSettings /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute><RoleGuard roles={[Roles.ADMIN]}><AdminAnalytics /></RoleGuard></ProtectedRoute>} />
        <Route path="/executive/users" element={<ProtectedRoute><RoleGuard roles={[Roles.EXECUTIVE]}><ExecutiveUsers /></RoleGuard></ProtectedRoute>} />
        <Route path="/teams" element={<ProtectedRoute><Teams /></ProtectedRoute>} />
        <Route path="/teams/:id" element={<ProtectedRoute><TeamDetail /></ProtectedRoute>} />
        <Route path="/reports/new" element={<ProtectedRoute><ReportForm /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/invite/:code" element={<ProtectedRoute><AcceptInvite /></ProtectedRoute>} />
        <Route path="/approval-pending" element={<ProtectedRoute><ApprovalPending /></ProtectedRoute>} />
        <Route path="/admin/approvals" element={<ProtectedRoute><RoleGuard roles={[Roles.ADMIN, Roles.EXECUTIVE]}><ApprovalRequests /></RoleGuard></ProtectedRoute>} />
        <Route path="/admin/inquiries" element={<ProtectedRoute><RoleGuard roles={[Roles.ADMIN, Roles.EXECUTIVE]}><InquiryManagement /></RoleGuard></ProtectedRoute>} />
        <Route path="/users/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
        <Route path="/teams/invite" element={<ProtectedRoute><RoleGuard roles={[Roles.LEADER, Roles.EXECUTIVE, Roles.ADMIN]}><TeamInvite /></RoleGuard></ProtectedRoute>} />
        <Route path="/teams/join" element={<ProtectedRoute><TeamJoin /></ProtectedRoute>} />
        <Route path="/teams/join/:inviteCode" element={<ProtectedRoute><TeamJoin /></ProtectedRoute>} />
        <Route path="/tasks" element={<ProtectedRoute><TaskManagement /></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute><ReviewManagement /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><ActivityFeed /></ProtectedRoute>} />
        <Route path="/reports" element={<ReportsList />} />
        <Route path="/reports/:id" element={<ReportDetail />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toast />
    </>
  );
}