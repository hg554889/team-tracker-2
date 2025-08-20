import React from 'react';

export default function SystemOverview({ summary }) {
  const kpi = summary?.kpi || {};
  const additionalStats = summary?.additionalStats || {};

  const statsCards = [
    {
      title: '전체 사용자',
      value: additionalStats.totalUsers || 0,
      icon: '👥',
      color: '#3498db',
      description: '승인된 사용자 수'
    },
    {
      title: '활성 팀',
      value: `${kpi.activeTeams || 0}/${kpi.teams || 0}`,
      icon: '🚀',
      color: '#2ecc71',
      description: '이번 주 보고서 제출'
    },
    {
      title: '전체 동아리',
      value: kpi.totalClubs || 0,
      icon: '🏛️',
      color: '#9b59b6',
      description: '등록된 동아리 수'
    },
    {
      title: '평균 진행률',
      value: `${kpi.avgProgress || 0}%`,
      icon: '📊',
      color: '#e67e22',
      description: '전체 팀 평균'
    }
  ];

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
        📊 시스템 현황 Overview
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '16px'
      }}>
        {statsCards.map((stat, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            border: `2px solid ${stat.color}20`,
            borderLeft: `4px solid ${stat.color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '12px'
            }}>
              <div>
                <h3 style={{
                  fontSize: '14px',
                  color: '#636e72',
                  margin: '0 0 4px 0',
                  fontWeight: '500'
                }}>
                  {stat.title}
                </h3>
                <div style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: stat.color,
                  margin: 0
                }}>
                  {stat.value}
                </div>
              </div>
              <div style={{
                fontSize: '24px',
                opacity: 0.8
              }}>
                {stat.icon}
              </div>
            </div>
            <p style={{
              fontSize: '12px',
              color: '#95a5a6',
              margin: 0
            }}>
              {stat.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}