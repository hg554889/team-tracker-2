import React from 'react';
import ClubStatus from './ClubStatus';
import TeamManagementCenter from './TeamManagementCenter';
import MemberStatus from './MemberStatus';
import GoalAchievement from './GoalAchievement';

export default function ExecutiveDashboard({ user, summary, loading }) {
  if (loading) {
    return (
      <div style={{ 
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          임원 대시보드를 불러오는 중...
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
          🏛️ 동아리 운영 센터
        </h1>
        <p style={{ 
          margin: 0, 
          fontSize: '16px', 
          color: '#636e72'
        }}>
          안녕하세요, {user?.username}님 · 임원 · 우리 동아리
        </p>
      </div>

      {/* 우리 동아리 현황 */}
      <div style={{ marginBottom: '24px' }}>
        <ClubStatus summary={summary} />
      </div>

      {/* 팀 관리 센터 + 멤버 현황 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <TeamManagementCenter summary={summary} />
        <MemberStatus summary={summary} />
      </div>

      {/* 목표 달성 현황 */}
      <div>
        <GoalAchievement summary={summary} />
      </div>
    </div>
  );
}