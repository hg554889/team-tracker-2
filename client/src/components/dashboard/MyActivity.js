import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MyActivity({ summary }) {
  const navigate = useNavigate();
  const kpi = summary?.kpi || {};
  const myTeamsProgress = summary?.myTeamsProgress || [];

  // 내 진행률 계산 (이번 주 vs 지난 주)
  const currentWeekProgress = kpi.avgProgress || 0;
  const lastWeekProgress = Math.max(0, currentWeekProgress - 12); // 임시 데이터
  const progressDiff = currentWeekProgress - lastWeekProgress;

  // 완료한 작업 vs 목표 (임시 데이터)
  const completedTasks = 8;
  const targetTasks = 12;
  const completionRate = Math.round((completedTasks / targetTasks) * 100);

  // 주간 활동 데이터
  const weeklyData = [
    { day: '월', completed: 2, target: 2 },
    { day: '화', completed: 1, target: 2 },
    { day: '수', completed: 2, target: 2 },
    { day: '목', completed: 3, target: 2 },
    { day: '금', completed: 0, target: 2 },
    { day: '토', completed: 0, target: 0 },
    { day: '일', completed: 0, target: 0 }
  ];

  // 내가 참여한 팀들의 성과
  const myTeams = myTeamsProgress.map(team => ({
    ...team,
    avgProgress: team.history?.length > 0 
      ? Math.round(team.history.reduce((a, b) => a + b, 0) / team.history.length) 
      : 0
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
        📊 내 활동 현황
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 내 진행률 섹션 */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px',
          marginBottom: '32px'
        }}>
          {/* 이번 주 vs 지난 주 */}
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#636e72',
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              📈 진행률 비교
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: progressDiff >= 0 ? '#2ecc71' : '#e74c3c',
                marginBottom: '8px'
              }}>
                {currentWeekProgress}%
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#636e72',
                marginBottom: '8px'
              }}>
                이번 주 진행률
              </div>
              
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: '600',
                color: progressDiff >= 0 ? '#2ecc71' : '#e74c3c'
              }}>
                <span>{progressDiff >= 0 ? '↗' : '↘'}</span>
                <span>{Math.abs(progressDiff)}% vs 지난주</span>
              </div>
            </div>
          </div>

          {/* 완료한 작업 vs 목표 */}
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#636e72',
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              🎯 작업 달성률
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: completionRate >= 100 ? '#2ecc71' : completionRate >= 70 ? '#3498db' : '#f39c12',
                marginBottom: '8px'
              }}>
                {completedTasks}/{targetTasks}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#636e72',
                marginBottom: '8px'
              }}>
                완료한 작업
              </div>
              
              <div style={{
                width: '100%',
                height: '6px',
                background: '#e9ecef',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${completionRate}%`,
                  height: '100%',
                  background: completionRate >= 100 ? '#2ecc71' : completionRate >= 70 ? '#3498db' : '#f39c12',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>
          </div>

          {/* 내 팀 순위 */}
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#636e72',
              marginBottom: '12px',
              fontWeight: '600'
            }}>
              🏆 내 팀 순위
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#9b59b6',
                marginBottom: '8px'
              }}>
                #{Math.floor(Math.random() * 5) + 1}
              </div>
              
              <div style={{
                fontSize: '12px',
                color: '#636e72',
                marginBottom: '8px'
              }}>
                전체 팀 중 순위
              </div>
              
              <div style={{
                fontSize: '11px',
                fontWeight: '600',
                color: '#9b59b6'
              }}>
                상위 20% 달성!
              </div>
            </div>
          </div>
        </div>

        {/* 주간 활동 차트 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📅 이번 주 활동 현황
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
              height: '100px',
              marginBottom: '12px',
              borderBottom: '1px solid #dee2e6',
              paddingBottom: '8px'
            }}>
              {weeklyData.map((day, index) => (
                <div key={index} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flex: 1
                }}>
                  <div style={{ position: 'relative', height: '80px', display: 'flex', alignItems: 'end' }}>
                    {/* 목표 바 (배경) */}
                    {day.target > 0 && (
                      <div style={{
                        width: '20px',
                        height: `${(day.target / 3) * 60}px`,
                        background: '#e9ecef',
                        borderRadius: '4px',
                        position: 'absolute'
                      }} />
                    )}
                    
                    {/* 완료 바 */}
                    {day.completed > 0 && (
                      <div style={{
                        width: '20px',
                        height: `${(day.completed / 3) * 60}px`,
                        background: day.completed >= day.target ? '#2ecc71' : '#3498db',
                        borderRadius: '4px',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: '10px',
                          fontWeight: '600',
                          color: day.completed >= day.target ? '#2ecc71' : '#3498db'
                        }}>
                          {day.completed}
                        </div>
                      </div>
                    )}
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
              {weeklyData.map((day, index) => (
                <span key={index} style={{
                  flex: 1,
                  textAlign: 'center',
                  fontWeight: index === new Date().getDay() - 1 ? '600' : '400',
                  color: index === new Date().getDay() - 1 ? '#3498db' : '#636e72'
                }}>
                  {day.day}
                </span>
              ))}
            </div>
            
            {/* 범례 */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '12px',
              fontSize: '11px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', background: '#e9ecef', borderRadius: '2px' }} />
                <span style={{ color: '#636e72' }}>목표</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '8px', height: '8px', background: '#3498db', borderRadius: '2px' }} />
                <span style={{ color: '#636e72' }}>완료</span>
              </div>
            </div>
          </div>
        </div>

        {/* 내가 참여한 팀들 */}
        <div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              margin: 0,
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              👥 내가 참여한 팀들
            </h3>
            <button style={{
              background: 'none',
              border: 'none',
              color: '#3498db',
              fontSize: '12px',
              cursor: 'pointer',
              fontWeight: '500'
            }}
            onClick={() => navigate('/teams')}>
              전체 보기 →
            </button>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '12px'
          }}>
            {myTeams.slice(0, 4).map((team) => (
              <div key={team.teamId} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #e9ecef',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => navigate(`/teams/${team.teamId}`)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e8f4f8';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: '0 0 8px 0'
                }}>
                  {team.teamName}
                </h4>
                
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#636e72'
                  }}>
                    진행률
                  </span>
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: team.avgProgress >= 80 ? '#2ecc71' : team.avgProgress >= 50 ? '#3498db' : '#f39c12'
                  }}>
                    {team.avgProgress}%
                  </span>
                </div>
                
                <div style={{
                  height: '4px',
                  background: '#e9ecef',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${team.avgProgress}%`,
                    height: '100%',
                    background: team.avgProgress >= 80 ? '#2ecc71' : team.avgProgress >= 50 ? '#3498db' : '#f39c12',
                    borderRadius: '2px',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            ))}

            {/* 팀 참여 버튼 */}
            <div style={{
              background: '#f0f8ff',
              border: '2px dashed #3498db',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => navigate('/teams/join')}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e8f4f8';
              e.currentTarget.style.borderColor = '#2980b9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f0f8ff';
              e.currentTarget.style.borderColor = '#3498db';
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>➕</div>
              <div style={{
                fontSize: '12px',
                color: '#3498db',
                fontWeight: '600'
              }}>
                새 팀 참여하기
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}