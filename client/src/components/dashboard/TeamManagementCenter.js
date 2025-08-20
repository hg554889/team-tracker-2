import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeamManagementCenter({ summary }) {
  const navigate = useNavigate();
  const myTeamsProgress = summary?.myTeamsProgress || [];
  const kpi = summary?.kpi || {};
  const additionalStats = summary?.additionalStats || {};

  // 팀별 성과 랭킹 (진행률 기준)
  const teamRankings = myTeamsProgress
    .map(team => ({
      ...team,
      avgProgress: team.history?.length > 0 
        ? Math.round(team.history.reduce((a, b) => a + b, 0) / team.history.length) 
        : 0
    }))
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 5);

  // 지연 위험 팀 (진행률 50% 미만)
  const riskTeams = teamRankings.filter(team => team.avgProgress < 50);

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
        📋 팀 관리 센터
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 팀별 성과 랭킹 */}
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
            🏆 팀별 성과 랭킹
          </h3>
          
          {teamRankings.length > 0 ? (
            <div style={{ space: '8px' }}>
              {teamRankings.map((team, index) => (
                <div key={team.teamId} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 16px',
                  marginBottom: '8px',
                  borderRadius: '8px',
                  background: index < 3 ? '#f8f9fa' : '#ffffff',
                  border: index < 3 ? '1px solid #e9ecef' : '1px solid #f1f2f6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => navigate(`/teams/${team.teamId}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e8f4f8';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = index < 3 ? '#f8f9fa' : '#ffffff';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: index === 0 ? '#f39c12' : index === 1 ? '#95a5a6' : index === 2 ? '#cd7f32' : '#bdc3c7',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      marginBottom: '2px'
                    }}>
                      {team.teamName}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#636e72'
                    }}>
                      평균 진행률 {team.avgProgress}%
                    </div>
                  </div>
                  <div style={{
                    width: '60px',
                    height: '6px',
                    background: '#e9ecef',
                    borderRadius: '3px',
                    overflow: 'hidden',
                    marginRight: '12px'
                  }}>
                    <div style={{
                      width: `${team.avgProgress}%`,
                      height: '100%',
                      background: team.avgProgress >= 80 ? '#2ecc71' : team.avgProgress >= 50 ? '#f39c12' : '#e74c3c',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '16px', color: '#3498db' }}>→</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#95a5a6',
              padding: '20px'
            }}>
              표시할 팀이 없습니다
            </div>
          )}
        </div>

        {/* 지연 위험 팀 알림 */}
        {riskTeams.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{
              fontSize: '16px',
              color: '#e74c3c',
              marginBottom: '16px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ 지연 위험 팀 알림
            </h3>
            
            <div style={{
              background: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {riskTeams.map((team) => (
                <div key={team.teamId} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #fed7d7',
                  '&:lastChild': {
                    borderBottom: 'none'
                  }
                }}>
                  <span style={{ fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                    {team.teamName}
                  </span>
                  <span style={{ fontSize: '14px', color: '#e74c3c', fontWeight: '600' }}>
                    {team.avgProgress}%
                  </span>
                </div>
              ))}
              <div style={{
                textAlign: 'right',
                marginTop: '12px'
              }}>
                <button 
                  style={{
                    background: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/teams?filter=risk')}
                >
                  지원하기
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 새로 생성된 팀 목록 */}
        <div>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ✨ 새로 생성된 팀
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            border: '1px dashed #dee2e6'
          }}>
            <div style={{
              textAlign: 'center',
              color: '#636e72',
              fontSize: '14px'
            }}>
              💡 최근 생성된 팀 정보를 표시합니다
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '12px'
            }}>
              <button 
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/teams?view=recent')}
              >
                전체 팀 보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}