import React from 'react';

export default function AdminStatsDashboard({ summary }) {
  const kpi = summary?.kpi || {};
  const myTeamsProgress = summary?.myTeamsProgress || [];

  return (
    <div>
      <h2 style={{ 
        fontSize: '20px', 
        color: '#2c3e50', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📈 전체 통계 대시보드
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 동아리별 KPI 비교 차트 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            🏛️ 동아리별 성과 비교
          </h3>
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px',
            border: '1px dashed #dee2e6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <div>
                <div style={{ fontSize: '14px', color: '#636e72', marginBottom: '4px' }}>
                  전체 팀 제출률
                </div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#3498db' }}>
                  {kpi.submitRateThisWeek || 0}%
                </div>
              </div>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(#3498db 0deg ${(kpi.submitRateThisWeek || 0) * 3.6}deg, #e9ecef ${(kpi.submitRateThisWeek || 0) * 3.6}deg 360deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                {kpi.activeTeams || 0}/{kpi.teams || 0}
              </div>
            </div>
            <div style={{
              fontSize: '13px',
              color: '#636e72'
            }}>
              💡 더 자세한 분석을 위해서는 별도의 분석 도구를 사용하세요
            </div>
          </div>
        </div>

        {/* 월별 사용량 트렌드 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            📊 최근 활동 트렌드
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '12px'
          }}>
            {[
              { label: '평균 진행률', value: `${kpi.avgProgress || 0}%`, color: '#2ecc71' },
              { label: '활성 팀', value: kpi.activeTeams || 0, color: '#3498db' },
              { label: '총 팀 수', value: kpi.teams || 0, color: '#9b59b6' },
              { label: '이번 주 제출', value: `${kpi.submitRateThisWeek || 0}%`, color: '#e67e22' }
            ].map((item, index) => (
              <div key={index} style={{
                background: '#ffffff',
                border: `1px solid ${item.color}30`,
                borderRadius: '8px',
                padding: '16px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: item.color,
                  marginBottom: '4px'
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#636e72'
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 보고서 제출률 히트맵 */}
        <div>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            🔥 팀별 활동도 히트맵
          </h3>
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {myTeamsProgress.length > 0 ? (
              myTeamsProgress.map((team, index) => {
                const avgProgress = team.history?.length > 0 
                  ? Math.round(team.history.reduce((a, b) => a + b, 0) / team.history.length) 
                  : 0;
                const intensity = Math.max(0.1, avgProgress / 100);
                
                return (
                  <div key={team.teamId} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    marginBottom: '4px',
                    borderRadius: '6px',
                    background: `rgba(52, 152, 219, ${intensity})`,
                    color: intensity > 0.5 ? 'white' : '#2c3e50'
                  }}>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>
                      {team.teamName}
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: '600' }}>
                      {avgProgress}%
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#95a5a6',
                padding: '20px'
              }}>
                표시할 팀 데이터가 없습니다
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}