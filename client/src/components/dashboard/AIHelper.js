import React, { useState } from 'react';

export default function AIHelper({ summary, user }) {
  const [activeMode, setActiveMode] = useState('tips');
  const kpi = summary?.kpi || {};

  // AI 맞춤 팁 (역할별)
  const personalizedTips = [
    {
      id: 1,
      category: '생산성',
      title: '작업 효율성 향상',
      tip: '오전 시간대에 집중도가 높은 작업을 배치하면 30% 더 효율적입니다.',
      icon: '⚡',
      color: '#3498db'
    },
    {
      id: 2,
      category: '협업',
      title: '팀 커뮤니케이션',
      tip: '주간 체크인 미팅을 15분으로 제한하면 팀 생산성이 향상됩니다.',
      icon: '💬',
      color: '#2ecc71'
    },
    {
      id: 3,
      category: '성장',
      title: '개인 발전',
      tip: '새로운 기술 학습을 위해 주 2시간씩 투자하면 좋은 결과를 얻을 수 있습니다.',
      icon: '📚',
      color: '#9b59b6'
    }
  ];

  // 스마트 제안 (사용자별 맞춤)
  const smartSuggestions = [
    {
      id: 1,
      type: 'schedule',
      title: '시간 관리 개선',
      suggestion: '오후 2-4시가 가장 생산적인 시간대입니다. 중요한 작업을 이 시간에 배치해보세요.',
      confidence: 85,
      action: '일정 최적화',
      icon: '🕒'
    },
    {
      id: 2,
      type: 'teamwork',
      title: '팀워크 강화',
      suggestion: '동료들과의 협업 빈도를 20% 늘리면 프로젝트 성공률이 향상될 것으로 예상됩니다.',
      confidence: 72,
      action: '협업 계획',
      icon: '🤝'
    },
    {
      id: 3,
      type: 'skill',
      title: '스킬 개발',
      suggestion: 'React 관련 스킬을 더 개발하면 현재 프로젝트에 도움이 될 것 같습니다.',
      confidence: 90,
      action: '학습 계획',
      icon: '🎯'
    }
  ];

  // 퀵 액션 메뉴
  const quickActions = [
    {
      id: 1,
      title: '보고서 자동 생성',
      description: 'AI가 이번 주 활동을 분석해서 보고서 초안을 만들어줍니다',
      icon: '📝',
      color: '#3498db',
      action: 'generate_report'
    },
    {
      id: 2,
      title: '팀 성과 분석',
      description: '팀의 성과를 분석하고 개선점을 제안합니다',
      icon: '📊',
      color: '#2ecc71',
      action: 'analyze_performance'
    },
    {
      id: 3,
      title: '일정 최적화',
      description: '개인 작업 패턴을 분석해서 최적의 일정을 제안합니다',
      icon: '📅',
      color: '#9b59b6',
      action: 'optimize_schedule'
    },
    {
      id: 4,
      title: '학습 추천',
      description: '현재 프로젝트와 관련된 학습 콘텐츠를 추천합니다',
      icon: '🎓',
      color: '#f39c12',
      action: 'recommend_learning'
    }
  ];

  const modes = [
    { id: 'tips', label: '팁', icon: '💡' },
    { id: 'suggestions', label: '제안', icon: '🎯' },
    { id: 'actions', label: '액션', icon: '⚡' }
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
        🤖 AI 도우미
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: 'fit-content'
      }}>
        {/* 모드 선택 */}
        <div style={{
          display: 'flex',
          background: '#f8f9fa',
          borderRadius: '8px',
          padding: '4px',
          marginBottom: '20px'
        }}>
          {modes.map((mode) => (
            <button key={mode.id} style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              background: activeMode === mode.id ? '#3498db' : 'transparent',
              color: activeMode === mode.id ? 'white' : '#636e72',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
            onClick={() => setActiveMode(mode.id)}>
              <span>{mode.icon}</span>
              <span>{mode.label}</span>
            </button>
          ))}
        </div>

        {/* AI 맞춤 팁 */}
        {activeMode === 'tips' && (
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              💡 {user?.username}님을 위한 맞춤 팁
            </h3>
            
            <div style={{ space: '12px' }}>
              {personalizedTips.map((tip) => (
                <div key={tip.id} style={{
                  background: `${tip.color}08`,
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${tip.color}20`
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      marginRight: '8px'
                    }}>
                      {tip.icon}
                    </span>
                    <h4 style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: 0,
                      flex: 1
                    }}>
                      {tip.title}
                    </h4>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: `${tip.color}20`,
                      color: tip.color,
                      fontWeight: '600'
                    }}>
                      {tip.category}
                    </span>
                  </div>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#636e72',
                    margin: 0,
                    lineHeight: 1.5
                  }}>
                    {tip.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 스마트 제안 */}
        {activeMode === 'suggestions' && (
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              🎯 AI 스마트 제안
            </h3>
            
            <div style={{ space: '12px' }}>
              {smartSuggestions.map((suggestion) => (
                <div key={suggestion.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid #e9ecef'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '16px',
                      marginRight: '8px'
                    }}>
                      {suggestion.icon}
                    </span>
                    <h4 style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: 0,
                      flex: 1
                    }}>
                      {suggestion.title}
                    </h4>
                    <div style={{
                      fontSize: '10px',
                      color: '#2ecc71',
                      fontWeight: '600'
                    }}>
                      {suggestion.confidence}% 확신
                    </div>
                  </div>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#636e72',
                    margin: '0 0 12px 0',
                    lineHeight: 1.5
                  }}>
                    {suggestion.suggestion}
                  </p>
                  
                  <button style={{
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}>
                    {suggestion.action}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 퀵 액션 */}
        {activeMode === 'actions' && (
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              ⚡ AI 퀵 액션
            </h3>
            
            <div style={{
              display: 'grid',
              gap: '12px'
            }}>
              {quickActions.map((action) => (
                <div key={action.id} style={{
                  background: `${action.color}08`,
                  borderRadius: '8px',
                  padding: '16px',
                  border: `1px solid ${action.color}20`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => {
                  // AI 액션 실행 로직
                  console.log('AI Action:', action.action);
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `${action.color}15`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = `${action.color}08`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '20px',
                      marginRight: '12px'
                    }}>
                      {action.icon}
                    </span>
                    <h4 style={{
                      fontSize: '13px',
                      fontWeight: '600',
                      color: '#2c3e50',
                      margin: 0
                    }}>
                      {action.title}
                    </h4>
                  </div>
                  
                  <p style={{
                    fontSize: '11px',
                    color: '#636e72',
                    margin: 0,
                    lineHeight: 1.4
                  }}>
                    {action.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI 채팅 버튼 */}
        <div style={{
          marginTop: '20px',
          textAlign: 'center'
        }}>
          <button style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '10px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            margin: '0 auto'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}>
            <span>💬</span>
            <span>AI와 직접 대화하기</span>
          </button>
        </div>

        {/* AI 학습 상태 */}
        <div style={{
          marginTop: '16px',
          padding: '12px',
          background: '#f8f9fa',
          borderRadius: '8px',
          fontSize: '11px',
          color: '#636e72',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '4px' }}>
            🧠 AI가 {user?.username}님의 패턴을 학습 중입니다
          </div>
          <div style={{
            height: '3px',
            background: '#e9ecef',
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: '65%',
              height: '100%',
              background: 'linear-gradient(90deg, #3498db, #2ecc71)',
              borderRadius: '2px',
              transition: 'width 0.3s ease'
            }} />
          </div>
          <div style={{ marginTop: '4px', fontSize: '10px' }}>
            65% 완료 - 더 정확한 제안을 위해 계속 학습 중입니다
          </div>
        </div>
      </div>
    </div>
  );
}