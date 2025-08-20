import React from 'react';
import MyActivity from './MyActivity';
import ActionNeeded from './ActionNeeded';
import RecentActivityFeed from './RecentActivityFeed';
import AIHelper from './AIHelper';

export default function MemberDashboard({ user, summary, loading }) {
  if (loading) {
    return (
      <div style={{ 
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          멤버 대시보드를 불러오는 중...
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
          📊 내 워크스페이스
        </h1>
        <p style={{ 
          margin: 0, 
          fontSize: '16px', 
          color: '#636e72'
        }}>
          안녕하세요, {user?.username}님 · 멤버 · 내 활동
        </p>
      </div>

      {/* 내 활동 현황 + 액션 필요 목록 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <MyActivity summary={summary} />
        <ActionNeeded summary={summary} />
      </div>

      {/* 최근 활동 피드 + AI 도우미 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px'
      }}>
        <RecentActivityFeed summary={summary} user={user} />
        <AIHelper summary={summary} user={user} />
      </div>
    </div>
  );
}