import React, { useState } from 'react';

export default function AIInsights({ summary, user }) {
  const [activeTab, setActiveTab] = useState('prediction');
  const kpi = summary?.kpi || {};
  const myTeamsProgress = summary?.myTeamsProgress || [];
  
  // AI 예측 데이터 (임시)
  const predictions = {
    nextWeekProgress: Math.min(95, (kpi.avgProgress || 0) + 8),
    completionDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    successProbability: 87
  };

  // AI 개선 제안 (임시 데이터)
  const improvements = [
    {
      type: 'performance',
      title: '성과 개선',
      suggestion: '팀 회의 주기를 주 2회로 늘려 소통을 강화하세요.',
      impact: 'high',
      effort: 'low'
    },
    {
      type: 'process',
      title: '프로세스 개선',
      suggestion: '코드 리뷰 프로세스를 도입하여 품질을 향상시키세요.',
      impact: 'medium',
      effort: 'medium'
    },
    {
      type: 'team',
      title: '팀 운영',
      suggestion: '팀원들의 업무 분배를 재조정하여 효율성을 높이세요.',
      impact: 'high',
      effort: 'high'
    }
  ];

  // 리스크 요인 분석 (임시 데이터)
  const riskFactors = [
    {
      factor: '일정 지연 위험',
      probability: 35,
      severity: 'medium',
      description: '현재 진행률을 고려할 때 약간의 지연 가능성이 있습니다.'
    },
    {
      factor: '리소스 부족',
      probability: 20,
      severity: 'low',
      description: '현재 팀 규모로는 목표 달성에 문제없습니다.'
    },
    {
      factor: '품질 이슈',
      probability: 15,
      severity: 'low',
      description: '현재 품질 관리가 잘 되고 있습니다.'
    }
  ];

  const getRiskColor = (severity) => {
    switch (severity) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ko-KR', { 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const tabs = [
    { id: 'prediction', label: '예측', icon: '🔮' },
    { id: 'suggestions', label: '제안', icon: '💡' },
    { id: 'risks', label: '리스크', icon: '⚠️' }
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
        🔍 AI 인사이트
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 탭 네비게이션 */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #e9ecef',
          marginBottom: '20px'
        }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              style={{
                flex: 1,
                padding: '8px 4px',
                border: 'none',
                background: activeTab === tab.id ? '#3498db' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#636e72',
                borderRadius: '6px 6px 0 0',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                marginBottom: '-1px'
              }}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ marginRight: '4px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'prediction' && (
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              🔮 다음 주 진행률 예측
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '12px', color: '#636e72' }}>
                  예상 진행률
                </span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#2ecc71'
                }}>
                  {predictions.nextWeekProgress}%
                </span>
              </div>
              
              <div style={{
                height: '6px',
                background: '#e9ecef',
                borderRadius: '3px',
                overflow: 'hidden'
              }}>
                <div style={{
                  width: `${predictions.nextWeekProgress}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3498db, #2ecc71)',
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                background: '#f0f8ff',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #3498db30'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#636e72',
                  marginBottom: '4px'
                }}>
                  완료 예상일
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#3498db'
                }}>
                  {formatDate(predictions.completionDate)}
                </div>
              </div>
              
              <div style={{
                background: '#f0fff0',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid #2ecc7130'
              }}>
                <div style={{
                  fontSize: '10px',
                  color: '#636e72',
                  marginBottom: '4px'
                }}>
                  성공 확률
                </div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#2ecc71'
                }}>
                  {predictions.successProbability}%
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              💡 팀 성과 개선 제안
            </h3>
            
            <div style={{ space: '12px' }}>
              {improvements.map((item, index) => (
                <div key={index} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${getImpactColor(item.impact)}30`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: 0
                    }}>
                      {item.title}
                    </h4>
                    <div style={{
                      display: 'flex',
                      gap: '4px'
                    }}>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: `${getImpactColor(item.impact)}20`,
                        color: getImpactColor(item.impact),
                        fontWeight: '600'
                      }}>
                        {item.impact} 임팩트
                      </span>
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '10px',
                        background: '#95a5a620',
                        color: '#95a5a6',
                        fontWeight: '600'
                      }}>
                        {item.effort} 노력
                      </span>
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: '11px',
                    color: '#636e72',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {item.suggestion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              ⚠️ 리스크 요인 분석
            </h3>
            
            <div style={{ space: '12px' }}>
              {riskFactors.map((risk, index) => (
                <div key={index} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${getRiskColor(risk.severity)}30`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: 0
                    }}>
                      {risk.factor}
                    </h4>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: `${getRiskColor(risk.severity)}20`,
                      color: getRiskColor(risk.severity),
                      fontWeight: '600'
                    }}>
                      {risk.severity}
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '11px',
                      color: '#636e72',
                      marginRight: '8px'
                    }}>
                      발생 확률:
                    </span>
                    <div style={{
                      flex: 1,
                      height: '4px',
                      background: '#e9ecef',
                      borderRadius: '2px',
                      marginRight: '8px'
                    }}>
                      <div style={{
                        width: `${risk.probability}%`,
                        height: '100%',
                        background: getRiskColor(risk.severity),
                        borderRadius: '2px'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: getRiskColor(risk.severity)
                    }}>
                      {risk.probability}%
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '11px',
                    color: '#636e72',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {risk.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI 도우미 버튼 */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <button style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}>
            🤖 AI와 더 자세히 분석하기
          </button>
        </div>
      </div>
    </div>
  );
}