import React from 'react';
import TeamPerformance from './TeamPerformance';
import ReportManagement from './ReportManagement';
import TeamOperations from './TeamOperations';
import AIInsights from './AIInsights';
import ActionRequired from './ActionRequired';

export default function LeaderDashboard({ user, summary, loading }) {
  if (loading) {
    return (
      <div style={{ 
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          팀장 대시보드를 불러오는 중...
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
          🚀 팀 리더십 센터
        </h1>
        <p style={{ 
          margin: 0, 
          fontSize: '16px', 
          color: '#636e72'
        }}>
          안녕하세요, {user?.username}님 · 팀장 · 내 팀 관리
        </p>
      </div>

      {/* 내 팀 성과 대시보드 */}
      <div style={{ marginBottom: '24px' }}>
        <TeamPerformance summary={summary} />
      </div>

      {/* 보고서 관리 + AI 인사이트 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        marginBottom: '24px'
      }}>
        <ReportManagement summary={summary} />
        <AIInsights summary={summary} user={user} />
      </div>

      {/* 팀 운영 + 액션 필요 */}
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '24px'
      }}>
        <TeamOperations summary={summary} />
        <ActionRequired summary={summary} />
      </div>
    </div>
  );
}