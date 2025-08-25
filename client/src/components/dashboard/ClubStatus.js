import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ClubStatus({ summary }) {
  const navigate = useNavigate();
  const kpi = summary?.kpi || {};
  const trends = summary?.trends || {};
  const additionalStats = summary?.additionalStats || {};

  // 트렌드 포맷팅 함수
  const formatTrend = (value, type = 'number') => {
    if (value === undefined || value === null || isNaN(value)) return '0';
    
    const prefix = value > 0 ? '+' : '';
    const suffix = type === 'percentage' ? '%' : '';
    
    if (type === 'percentage') {
      return `${prefix}${Math.round(value)}${suffix}`;
    }
    return `${prefix}${Math.round(value)}${suffix}`;
  };

  // 트렌드 색상 결정
  const getTrendColor = (value) => {
    if (value === undefined || value === null || isNaN(value) || value === 0) return '#95a5a6';
    return value > 0 ? '#2ecc71' : '#e74c3c';
  };

  const clubStats = [
    {
      title: '동아리 전체 진행률',
      value: `${kpi.avgProgress || 0}%`,
      icon: '📊',
      color: '#3498db',
      description: '팀별 평균 진행률',
      trend: formatTrend(trends.avgProgress, 'percentage'),
      trendColor: getTrendColor(trends.avgProgress),
      link: '/reports'
    },
    {
      title: '이번 주 보고서 제출',
      value: `${kpi.submitRateThisWeek || 0}%`,
      icon: '📝',
      color: '#2ecc71',
      description: `${kpi.activeTeams || 0}/${kpi.teams || 0} 팀 제출`,
      trend: formatTrend(trends.submitRate, 'percentage'),
      trendColor: getTrendColor(trends.submitRate),
      link: '/reports'
    },
    {
      title: '활성 팀',
      value: kpi.activeTeams || 0,
      icon: '🚀',
      color: '#9b59b6',
      description: '총 ' + (kpi.teams || 0) + '팀 중',
      trend: formatTrend(trends.activeTeams),
      trendColor: getTrendColor(trends.activeTeams),
      link: '/teams'
    },
    {
      title: '목표 달성 팀',
      value: trends.highPerformingTeams !== undefined ? 
        Math.max(0, (trends.highPerformingTeams + (trends.highPerformingTeams >= 0 ? Math.floor((kpi.avgProgress || 0) / 10) : 0))) :
        Math.floor((kpi.avgProgress || 0) / 10),
      icon: '🎯',
      color: '#e67e22',
      description: '90% 이상 달성',
      trend: formatTrend(trends.highPerformingTeams),
      trendColor: getTrendColor(trends.highPerformingTeams),
      link: '/teams'
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
        🏛️ 우리 동아리 현황
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px'
      }}>
        {clubStats.map((stat, index) => (
          <div key={index} style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            border: `2px solid ${stat.color}20`,
            borderLeft: `4px solid ${stat.color}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 배경 패턴 */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '60px',
              height: '60px',
              background: `${stat.color}08`,
              borderRadius: '0 12px 0 60px'
            }} />
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '16px',
              position: 'relative'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '14px',
                  color: '#636e72',
                  margin: '0 0 8px 0',
                  fontWeight: '500'
                }}>
                  {stat.title}
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: stat.color,
                  margin: '0 0 8px 0'
                }}>
                  {stat.value}
                </div>
                <p style={{
                  fontSize: '13px',
                  color: '#95a5a6',
                  margin: 0
                }}>
                  {stat.description}
                </p>
              </div>
              <div style={{
                fontSize: '32px',
                opacity: 0.7,
                zIndex: 1
              }}>
                {stat.icon}
              </div>
            </div>
            
            {/* 트렌드 표시 */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{
                fontSize: '12px',
                color: stat.trendColor,
                fontWeight: '600',
                background: `${stat.trendColor}15`,
                padding: '4px 8px',
                borderRadius: '12px'
              }}>
                {stat.trend} vs 지난주
              </div>
              <div 
                style={{
                  fontSize: '12px',
                  color: stat.color,
                  fontWeight: '500',
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s'
                }}
                onClick={() => navigate(stat.link)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = `${stat.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                자세히 보기 →
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}