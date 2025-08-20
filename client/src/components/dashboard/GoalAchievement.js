import React from 'react';

export default function GoalAchievement({ summary }) {
  const kpi = summary?.kpi || {};
  const myTeamsProgress = summary?.myTeamsProgress || [];

  // 목표 달성 현황 계산
  const totalProgress = kpi.avgProgress || 0;
  const targetProgress = 80; // 목표 진행률
  const achievementRate = Math.min(Math.round((totalProgress / targetProgress) * 100), 100);

  // 팀 유형별 성과 분석 (임시 데이터)
  const teamTypeAnalysis = [
    {
      type: '개발 팀',
      count: Math.floor(myTeamsProgress.length * 0.4),
      avgProgress: Math.round(totalProgress * 1.1),
      color: '#3498db'
    },
    {
      type: '기획 팀',
      count: Math.floor(myTeamsProgress.length * 0.3),
      avgProgress: Math.round(totalProgress * 0.9),
      color: '#9b59b6'
    },
    {
      type: '디자인 팀',
      count: Math.floor(myTeamsProgress.length * 0.3),
      avgProgress: Math.round(totalProgress * 1.05),
      color: '#e67e22'
    }
  ].filter(team => team.count > 0);

  // 월별 성과 트렌드 (임시 데이터)
  const monthlyTrend = [
    { month: '1월', progress: Math.max(20, totalProgress - 30) },
    { month: '2월', progress: Math.max(30, totalProgress - 20) },
    { month: '3월', progress: Math.max(40, totalProgress - 10) },
    { month: '현재', progress: totalProgress }
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
        🎯 목표 달성 현황
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px'
        }}>
          {/* 동아리 전체 목표 vs 실제 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              📊 전체 목표 달성률
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(#2ecc71 0deg ${achievementRate * 3.6}deg, #e9ecef ${achievementRate * 3.6}deg 360deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                position: 'relative'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#2ecc71'
                  }}>
                    {achievementRate}%
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#636e72'
                  }}>
                    달성률
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#636e72'
              }}>
                <span>목표: {targetProgress}%</span>
                <span>현재: {totalProgress}%</span>
              </div>
            </div>
          </div>

          {/* 팀 유형별 성과 분석 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              🔍 팀 유형별 성과
            </h3>
            
            <div style={{ space: '12px' }}>
              {teamTypeAnalysis.map((team, index) => (
                <div key={index} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${team.color}20`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2c3e50'
                    }}>
                      {team.type}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: '#636e72'
                    }}>
                      {team.count}팀
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(team.avgProgress, 100)}%`,
                        height: '100%',
                        background: team.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: team.color,
                      minWidth: '35px'
                    }}>
                      {team.avgProgress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 월별 성과 트렌드 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              📈 월별 성과 트렌드
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {monthlyTrend.map((month, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < monthlyTrend.length - 1 ? '1px solid #dee2e6' : 'none'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#636e72',
                    fontWeight: month.month === '현재' ? '600' : '400'
                  }}>
                    {month.month}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '6px',
                      background: '#e9ecef',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${month.progress}%`,
                        height: '100%',
                        background: month.month === '현재' ? '#2ecc71' : '#3498db',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: month.month === '현재' ? '#2ecc71' : '#3498db',
                      minWidth: '30px'
                    }}>
                      {month.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}