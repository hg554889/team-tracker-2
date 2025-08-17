import React from 'react';

export default function RoleBasedKPI({ userRole, kpi = {}, additionalStats = {} }) {
  
  const getKPIConfig = () => {
    switch (userRole) {
      case 'ADMIN':
        return [
          { label: '전체 팀', value: kpi.teams || 0, icon: '🏢' },
          { label: '활성 팀', value: kpi.activeTeams || 0, icon: '✅' },
          { label: '전체 동아리', value: kpi.totalClubs || 0, icon: '🎯' },
          { label: '평균 진행률', value: `${kpi.avgProgress || 0}%`, icon: '📊' },
          { label: '이번 주 제출률', value: `${kpi.submitRateThisWeek || 0}%`, icon: '📝' }
        ];
      
      case 'EXECUTIVE':
        return [
          { label: '관리 팀 수', value: kpi.teams || 0, icon: '👥' },
          { label: '활성 팀', value: kpi.activeTeams || 0, icon: '✅' },
          { label: '총 사용자', value: kpi.totalUsers || 0, icon: '👤' },
          { label: '평균 진행률', value: `${kpi.avgProgress || 0}%`, icon: '📊' },
          { label: '이번 주 제출률', value: `${kpi.submitRateThisWeek || 0}%`, icon: '📝' }
        ];
      
      case 'LEADER':
        return [
          { label: '관리 팀', value: kpi.myTeams || 0, icon: '👥' },
          { label: '이번 주 보고서', value: kpi.myReportsThisWeek || 0, icon: '📄' },
          { label: '지연 항목', value: kpi.overdue || 0, icon: '⚠️', isAlert: kpi.overdue > 0 },
          { label: '팀 평균 진행률', value: `${kpi.avgProgress || 0}%`, icon: '📈' }
        ];
      
      default: // MEMBER
        return [
          { label: '소속 팀', value: kpi.myTeams || 0, icon: '🏠' },
          { label: '내 보고서', value: kpi.myReportsThisWeek || 0, icon: '📝' },
          { label: '지연 항목', value: kpi.overdue || 0, icon: '⚠️', isAlert: kpi.overdue > 0 },
          { label: '팀 평균 진행률', value: `${kpi.avgProgress || 0}%`, icon: '📊' }
        ];
    }
  };

  const kpiItems = getKPIConfig();

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', color: '#2c3e50' }}>
        📊 주요 지표
      </h3>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '16px' 
      }}>
        {kpiItems.map((item, index) => (
          <div
            key={index}
            style={{
              padding: '16px 12px',
              backgroundColor: item.isAlert ? '#ffeaa7' : '#f8f9fa',
              borderRadius: '8px',
              textAlign: 'center',
              border: item.isAlert ? '2px solid #fdcb6e' : '1px solid #e9ecef',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>
              {item.icon}
            </div>
            <div style={{ 
              fontSize: '24px', 
              fontWeight: 'bold', 
              color: item.isAlert ? '#d63031' : '#2c3e50',
              marginBottom: '4px' 
            }}>
              {item.value}
            </div>
            <div style={{ 
              fontSize: '12px', 
              color: '#636e72',
              fontWeight: '500'
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* 추가 통계 (관리자/임원용) */}
      {(userRole === 'ADMIN' || userRole === 'EXECUTIVE') && Object.keys(additionalStats).length > 0 && (
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ fontSize: '14px', color: '#636e72', marginBottom: '8px' }}>
            추가 정보
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {additionalStats.inactiveTeams > 0 && (
              <div style={{ fontSize: '12px', color: '#e17055' }}>
                📴 비활성 팀: {additionalStats.inactiveTeams}개
              </div>
            )}
            {additionalStats.pendingApprovals > 0 && (
              <div style={{ fontSize: '12px', color: '#f39c12' }}>
                ⏳ 승인 대기: {additionalStats.pendingApprovals}명
              </div>
            )}
            {additionalStats.pendingRoleRequests > 0 && (
              <div style={{ fontSize: '12px', color: '#74b9ff' }}>
                🔐 권한 요청: {additionalStats.pendingRoleRequests}건
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}