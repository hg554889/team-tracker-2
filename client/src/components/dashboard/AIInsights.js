import React, { useState } from 'react';

export default function AIInsights({ summary, user }) {
  const [activeTab, setActiveTab] = useState('prediction');
  const kpi = summary?.kpi || {};
  const myTeamsProgress = summary?.myTeamsProgress || [];
  
  // 실제 데이터 기반 AI 예측 생성
  const currentProgress = kpi.avgProgress || 0;
  const trends = summary?.trends || {};
  const predictions = {
    nextWeekProgress: Math.min(95, Math.max(0, currentProgress + (trends.avgProgress || 5))),
    completionDate: getEstimatedCompletionDate(currentProgress, trends.avgProgress),
    successProbability: getSuccessProbability(currentProgress, trends)
  };

  // 실제 데이터 기반 개선 제안 생성
  const improvements = generateImprovements(kpi, summary);

  // 실제 데이터 기반 리스크 분석
  const riskFactors = generateRiskFactors(kpi, trends, summary);

  // 완료일 추정 함수
  function getEstimatedCompletionDate(currentProgress, weeklyTrend) {
    const remainingProgress = 100 - currentProgress;
    const weeklyRate = weeklyTrend || (currentProgress > 0 ? currentProgress / 4 : 5); // 기본 주당 5% 증가
    const weeksRemaining = Math.ceil(remainingProgress / Math.max(1, weeklyRate));
    return new Date(Date.now() + weeksRemaining * 7 * 24 * 60 * 60 * 1000);
  }

  // 성공 확률 계산 함수
  function getSuccessProbability(currentProgress, trends) {
    let probability = 50; // 기본 확률
    
    if (currentProgress >= 80) probability += 30;
    else if (currentProgress >= 60) probability += 20;
    else if (currentProgress >= 40) probability += 10;
    
    if ((trends.avgProgress || 0) > 0) probability += 15;
    if ((trends.submitRate || 0) > 0) probability += 10;
    if ((trends.activeTeams || 0) >= 0) probability += 5;
    
    return Math.min(95, Math.max(20, probability));
  }

  // 개선 제안 생성 함수
  function generateImprovements(kpi, summary) {
    const suggestions = [];
    const trends = summary?.trends || {};
    
    if ((kpi.submitRateThisWeek || 0) < 80) {
      suggestions.push({
        type: 'performance',
        title: '보고서 제출률 개선',
        suggestion: '보고서 제출률을 높이기 위해 미리 알림 시스템을 강화하세요.',
        impact: 'high',
        effort: 'low'
      });
    }
    
    if ((trends.avgProgress || 0) < 0) {
      suggestions.push({
        type: 'process',
        title: '진행률 개선',
        suggestion: '팀 회의 주기를 늘리고 중간 점검을 강화하여 진행률을 개선하세요.',
        impact: 'high',
        effort: 'medium'
      });
    }
    
    if ((kpi.avgProgress || 0) > 90) {
      suggestions.push({
        type: 'team',
        title: '우수 성과 유지',
        suggestion: '현재 높은 성과를 유지하며 팀원들의 동기부여를 지속하세요.',
        impact: 'medium',
        effort: 'low'
      });
    } else {
      suggestions.push({
        type: 'team',
        title: '팀 협업 강화',
        suggestion: '팀원 간 소통을 늘리고 업무 분배를 최적화하여 효율성을 높이세요.',
        impact: 'medium',
        effort: 'medium'
      });
    }
    
    return suggestions;
  }

  // 리스크 요인 생성 함수
  function generateRiskFactors(kpi, trends, summary) {
    const risks = [];
    const currentProgress = kpi.avgProgress || 0;
    const weeklyTrend = trends.avgProgress || 0;
    
    // 일정 지연 위험
    let delayRisk = 10;
    if (currentProgress < 40) delayRisk += 30;
    else if (currentProgress < 70) delayRisk += 15;
    if (weeklyTrend < 0) delayRisk += 20;
    
    risks.push({
      factor: '일정 지연 위험',
      probability: Math.min(80, delayRisk),
      severity: delayRisk > 50 ? 'high' : delayRisk > 25 ? 'medium' : 'low',
      description: `현재 진행률 ${currentProgress.toFixed(1)}%를 고려한 지연 가능성 분석입니다.`
    });
    
    // 팀 활동성 위험
    const submitRate = kpi.submitRateThisWeek || 0;
    let activityRisk = submitRate < 50 ? 40 : submitRate < 80 ? 20 : 10;
    
    risks.push({
      factor: '팀 활동성 저하',
      probability: activityRisk,
      severity: activityRisk > 35 ? 'high' : activityRisk > 20 ? 'medium' : 'low',
      description: `보고서 제출률 ${submitRate}% 기준으로 분석한 팀 활동성입니다.`
    });
    
    // 성과 품질 위험
    let qualityRisk = 15;
    if (currentProgress < 30) qualityRisk += 25;
    else if (currentProgress > 90 && weeklyTrend > 10) qualityRisk += 15; // 너무 빨라도 품질 위험
    
    risks.push({
      factor: '성과 품질 관리',
      probability: qualityRisk,
      severity: qualityRisk > 30 ? 'medium' : 'low',
      description: '현재 진행 속도와 품질 관리 균형을 분석한 결과입니다.'
    });
    
    return risks;
  }

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