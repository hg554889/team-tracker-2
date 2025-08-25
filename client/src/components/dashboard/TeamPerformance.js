import React from 'react';

export default function TeamPerformance({ summary }) {
  const kpi = summary?.kpi || {};
  const myTeamsProgress = summary?.myTeamsProgress || [];

  // 팀 전체 진행률 계산
  const teamProgress = kpi.avgProgress || 0;
  const targetProgress = 85; // 목표 진행률
  
  // 팀원별 기여도 분석 (실제 데이터 기반)
  const memberContributions = (summary?.additionalStats?.teamMemberContributions || [])
    .slice(0, 8) // 최대 8명까지만 표시
    .map((member, index) => ({
      name: member.name,
      contribution: member.contribution,
      role: member.role,
      reportsCount: member.reportsCount,
      color: ['#3498db', '#9b59b6', '#e67e22', '#2ecc71', '#f39c12', '#e74c3c', '#1abc9c', '#34495e'][index % 8]
    }));

  // 주차별 트렌드 데이터
  const weeklyTrend = myTeamsProgress[0]?.history || [60, 65, 72, 78];
  const trendData = weeklyTrend.map((progress, index) => ({
    week: `${index + 1}주차`,
    progress: progress,
    isCurrentWeek: index === weeklyTrend.length - 1
  }));

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
        🚀 내 팀 성과 대시보드
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
          {/* 팀 전체 진행률 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              📊 팀 전체 진행률
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: `conic-gradient(#2ecc71 0deg ${teamProgress * 3.6}deg, #e9ecef ${teamProgress * 3.6}deg 360deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: teamProgress >= targetProgress ? '#2ecc71' : teamProgress >= 70 ? '#f39c12' : '#e74c3c'
                  }}>
                    {teamProgress}%
                  </div>
                </div>
              </div>
              
              <div style={{ fontSize: '12px', color: '#636e72', marginBottom: '8px' }}>
                목표: {targetProgress}%
              </div>
              
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: teamProgress >= targetProgress ? '#2ecc71' : '#f39c12'
              }}>
                {teamProgress >= targetProgress ? '🎯 목표 달성!' : `목표까지 ${targetProgress - teamProgress}%`}
              </div>
            </div>
          </div>

          {/* 목표 달성률 vs 계획 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              🎯 목표 vs 계획
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {[
                { label: '이번 주 목표', planned: 80, actual: teamProgress, color: '#3498db' },
                { label: '월말 목표', planned: 90, actual: Math.min(teamProgress + 10, 95), color: '#9b59b6' },
                { label: '최종 목표', planned: 100, actual: Math.min(teamProgress + 15, 100), color: '#2ecc71' }
              ].map((goal, index) => (
                <div key={index} style={{
                  marginBottom: '16px',
                  '&:lastChild': {
                    marginBottom: 0
                  }
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px'
                  }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#636e72',
                      fontWeight: '500'
                    }}>
                      {goal.label}
                    </span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: goal.color
                    }}>
                      {goal.actual}% / {goal.planned}%
                    </span>
                  </div>
                  
                  <div style={{
                    height: '8px',
                    background: '#e9ecef',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    {/* 계획선 */}
                    <div style={{
                      position: 'absolute',
                      left: `${goal.planned}%`,
                      top: 0,
                      bottom: 0,
                      width: '2px',
                      background: '#2c3e50',
                      zIndex: 2
                    }} />
                    
                    {/* 실제 진행률 */}
                    <div style={{
                      width: `${goal.actual}%`,
                      height: '100%',
                      background: goal.actual >= goal.planned ? '#2ecc71' : goal.color,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 팀원별 기여도 분석 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              👥 팀원별 기여도
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {memberContributions.map((member, index) => (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < memberContributions.length - 1 ? '1px solid #dee2e6' : 'none'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: member.color,
                    marginRight: '8px'
                  }} />
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '2px'
                    }}>
                      {member.name}
                    </div>
                    
                    <div style={{
                      height: '4px',
                      background: '#e9ecef',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${member.contribution}%`,
                        height: '100%',
                        background: member.color,
                        borderRadius: '2px'
                      }} />
                    </div>
                  </div>
                  
                  <span style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: member.color,
                    marginLeft: '8px',
                    minWidth: '30px',
                    textAlign: 'right'
                  }}>
                    {member.contribution}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 주차별 트렌드 차트 */}
        <div style={{ marginTop: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            📈 주차별 트렌드
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              height: '120px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '8px',
              marginBottom: '8px'
            }}>
              {trendData.map((week, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{
                    width: '100%',
                    maxWidth: '40px',
                    height: `${week.progress}px`,
                    background: week.isCurrentWeek ? '#2ecc71' : '#3498db',
                    borderRadius: '4px 4px 0 0',
                    marginBottom: '4px',
                    position: 'relative',
                    transition: 'height 0.3s ease'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '-20px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      fontSize: '10px',
                      fontWeight: '600',
                      color: week.isCurrentWeek ? '#2ecc71' : '#3498db'
                    }}>
                      {week.progress}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#636e72'
            }}>
              {trendData.map((week, index) => (
                <span key={index} style={{
                  flex: 1,
                  textAlign: 'center',
                  fontWeight: week.isCurrentWeek ? '600' : '400',
                  color: week.isCurrentWeek ? '#2ecc71' : '#636e72'
                }}>
                  {week.week}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}