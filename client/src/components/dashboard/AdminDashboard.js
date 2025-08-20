import React from 'react';
import SystemOverview from './SystemOverview';
import UrgentActions from './UrgentActions';
import AdminStatsDashboard from './AdminStatsDashboard';
import AdminManagementTools from './AdminManagementTools';

export default function AdminDashboard({ user, summary, loading }) {
  if (loading) {
    return (
      <div style={{ 
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          관리자 대시보드를 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* 헤더 */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '32px', 
          color: '#2c3e50',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          🛡️ 시스템 관리 센터
        </h1>
        <p style={{ 
          margin: 0, 
          fontSize: '16px', 
          color: '#636e72'
        }}>
          안녕하세요, {user?.username}님 · 관리자 · {summary?.scope === 'GLOBAL' ? '전체 시스템' : '선택된 동아리'}
        </p>
      </div>

      {/* 시스템 현황 Overview */}
      <div style={{ marginBottom: '24px' }}>
        <SystemOverview summary={summary} />
      </div>

      {/* 긴급 액션 필요 */}
      <div style={{ marginBottom: '24px' }}>
        <UrgentActions summary={summary} />
      </div>

      {/* 전체 통계 대시보드 + 관리 도구 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <AdminStatsDashboard summary={summary} />
        <AdminManagementTools />
      </div>
    </div>
  );
}