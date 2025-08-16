import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listTeams } from '../../api/teams';
import { getTeamInsights } from '../../api/ai';

export default function AIWidget({ user }) {
  const nav = useNavigate();
  const [myTeams, setMyTeams] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // 내 팀 목록 가져오기
  useEffect(() => {
    (async () => {
      try {
        const { data } = await listTeams({ scope: 'mine' });
        setMyTeams(data.items || []);
      } catch (error) {
        console.error('Failed to load teams:', error);
      }
    })();
  }, []);

  // 팀 인사이트 요약 가져오기
  const fetchTeamInsights = async () => {
    if (myTeams.length === 0) return;
    
    setLoading(true);
    try {
      const insightPromises = myTeams.slice(0, 3).map(async (team) => {
        try {
          const response = await getTeamInsights(team._id);
          return {
            teamId: team._id,
            teamName: team.name,
            insights: response.data.insights
          };
        } catch {
          return {
            teamId: team._id,
            teamName: team.name,
            insights: null
          };
        }
      });
      
      const results = await Promise.all(insightPromises);
      setInsights(results.filter(r => r.insights));
    } catch (error) {
      console.error('Failed to fetch insights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (expanded && myTeams.length > 0) {
      fetchTeamInsights();
    }
  }, [expanded, myTeams]);

  // AI 기능 바로가기
  const quickActions = [
    {
      icon: '📝',
      title: '스마트 보고서 작성',
      description: 'AI 어시스턴트와 함께 보고서 작성',
      onClick: () => nav('/reports/new'),
      color: '#667eea'
    },
    {
      icon: '📈',
      title: '진행률 예측',
      description: '팀 진행률 트렌드 분석',
      onClick: () => {
        if (myTeams.length > 0) {
          nav(`/teams/${myTeams[0]._id}`);
        } else {
          nav('/teams');
        }
      },
      color: '#10b981'
    },
    {
      icon: '🎯',
      title: '목표 설정 가이드',
      description: '현실적인 목표 제안 받기',
      onClick: () => nav('/reports/new'),
      color: '#f59e0b'
    }
  ];

  return (
    <div className="card">
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          marginBottom: expanded ? '16px' : '0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '12px'
          }}>
            <span style={{ color: 'white', fontSize: '20px' }}>🤖</span>
          </div>
          <div>
            <h3 style={{ margin: 0, color: '#374151' }}>AI 어시스턴트</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>
              스마트 보고서 작성 및 팀 분석
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!expanded && insights.length > 0 && (
            <span style={{ 
              padding: '4px 8px', 
              backgroundColor: '#e0e7ff', 
              color: '#4338ca',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {insights.length}개 팀 분석됨
            </span>
          )}
          <span style={{ 
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: '14px',
            color: '#6b7280'
          }}>
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div>
          {/* AI 기능 바로가기 */}
          <div style={{ marginBottom: '20px' }}>
            <h4 style={{ 
              margin: '0 0 12px 0', 
              fontSize: '16px', 
              color: '#374151',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>⚡</span>
              빠른 실행
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '12px' 
            }}>
              {quickActions.map((action, index) => (
                <div
                  key={index}
                  onClick={action.onClick}
                  style={{
                    padding: '16px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    ':hover': {
                      backgroundColor: '#f1f5f9',
                      borderColor: action.color
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f1f5f9';
                    e.target.style.borderColor = action.color;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.borderColor = '#e2e8f0';
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    marginBottom: '8px' 
                  }}>
                    <span style={{ 
                      fontSize: '20px', 
                      marginRight: '8px' 
                    }}>
                      {action.icon}
                    </span>
                    <span style={{ 
                      fontWeight: '600', 
                      fontSize: '14px', 
                      color: '#374151' 
                    }}>
                      {action.title}
                    </span>
                  </div>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '12px', 
                    color: '#6b7280',
                    lineHeight: '1.4'
                  }}>
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 팀 인사이트 요약 */}
          {myTeams.length > 0 && (
            <div>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px' 
              }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  color: '#374151',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <span style={{ marginRight: '8px' }}>📊</span>
                  팀 인사이트 요약
                </h4>
                <button
                  onClick={fetchTeamInsights}
                  disabled={loading}
                  style={{
                    padding: '4px 8px',
                    fontSize: '12px',
                    backgroundColor: 'transparent',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    color: '#6b7280',
                    cursor: 'pointer'
                  }}
                >
                  {loading ? '분석 중...' : '🔄 새로고침'}
                </button>
              </div>

              {loading && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  color: '#6b7280' 
                }}>
                  AI가 팀 데이터를 분석하고 있습니다...
                </div>
              )}

              {!loading && insights.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '20px', 
                  backgroundColor: '#fef3c7',
                  borderRadius: '6px',
                  border: '1px solid #fbbf24'
                }}>
                  <p style={{ margin: 0, color: '#92400e', fontSize: '14px' }}>
                    📋 분석할 팀 데이터가 부족합니다.
                  </p>
                  <p style={{ margin: '4px 0 0 0', color: '#92400e', fontSize: '12px' }}>
                    보고서를 작성하시면 AI 분석이 가능합니다.
                  </p>
                </div>
              )}

              {!loading && insights.length > 0 && (
                <div style={{ 
                  display: 'grid', 
                  gap: '12px' 
                }}>
                  {insights.map((item) => (
                    <div
                      key={item.teamId}
                      onClick={() => nav(`/teams/${item.teamId}`)}
                      style={{
                        padding: '12px',
                        backgroundColor: '#f0f9ff',
                        border: '1px solid #bae6fd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e0f2fe';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f0f9ff';
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                      }}>
                        <span style={{ 
                          fontWeight: '600', 
                          fontSize: '14px', 
                          color: '#1e40af' 
                        }}>
                          {item.teamName}
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <span style={{ 
                            padding: '2px 6px',
                            backgroundColor: item.insights.trend === 'improving' ? '#dcfce7' : 
                                           item.insights.trend === 'declining' ? '#fee2e2' : '#f3f4f6',
                            color: item.insights.trend === 'improving' ? '#166534' : 
                                   item.insights.trend === 'declining' ? '#dc2626' : '#374151',
                            borderRadius: '10px',
                            fontSize: '10px',
                            fontWeight: '500'
                          }}>
                            {item.insights.trend === 'improving' ? '📈 상승' : 
                             item.insights.trend === 'declining' ? '📉 하락' : 
                             item.insights.trend === 'stable' ? '📊 안정' : '📋 분석중'}
                          </span>
                          <span style={{ 
                            fontSize: '12px', 
                            fontWeight: '600',
                            color: '#1e40af'
                          }}>
                            {item.insights.averageProgress}%
                          </span>
                        </div>
                      </div>
                      
                      {item.insights.recommendations && item.insights.recommendations.length > 0 && (
                        <p style={{ 
                          margin: 0, 
                          fontSize: '12px', 
                          color: '#1e40af',
                          lineHeight: '1.4'
                        }}>
                          💡 {item.insights.recommendations[0]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {myTeams.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px',
              backgroundColor: '#f9fafb',
              borderRadius: '6px',
              border: '1px solid #d1d5db'
            }}>
              <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>
                👥 팀에 가입하면 AI 분석을 받을 수 있습니다.
              </p>
              <button
                onClick={() => nav('/teams')}
                style={{
                  marginTop: '8px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                팀 둘러보기
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}