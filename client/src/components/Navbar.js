import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar(){
  const { user, logout } = useAuth();
  const nav = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    nav('/login');
  };

  return (
    <header className="appbar">
      <div className="appbar-inner">
        <Link to="/" className="brand">
          <span className="brand-dot" />
          <span>Team Tracker</span>
        </Link>
        <div className="actions">
          <button className="btn ghost" onClick={()=>nav('/teams')}>팀</button>
          {user?.role === 'ADMIN' && (<button className="btn ghost" onClick={()=>nav('/admin/users')}>ADMIN</button>)}
          {user?.role === 'EXECUTIVE' && (<button className="btn ghost" onClick={()=>nav('/executive/users')}>EXECUTIVE</button>)}
          {(user?.role === 'ADMIN' || user?.role === 'EXECUTIVE') && (
            <button className="btn ghost" onClick={()=>nav('/admin/approvals')}>승인 관리</button>
          )}
          {(user?.role === 'ADMIN' || user?.role === 'EXECUTIVE') && (
            <button className="btn ghost" onClick={()=>nav('/admin/inquiries')}>문의 관리</button>
          )}
          <button className="btn ghost" onClick={()=>nav('/reports/new')}>보고서 작성</button>
          <button className="btn ghost" onClick={()=>nav('/profile')}>프로필</button>
          {user ? <button className="btn primary" onClick={handleLogout}>로그아웃</button> : <button className="btn primary" onClick={()=>nav('/login')}>로그인</button>}
        </div>
      </div>
    </header>
  );
}