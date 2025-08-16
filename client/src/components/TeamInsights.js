import React, { useState, useEffect } from 'react';
import { getTeamInsights } from '../api/ai';

export default function TeamInsights({ teamId, teamName }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const fetchInsights = async () => {
    if (!teamId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await getTeamInsights(teamId);
      setInsights(response.data.insights);
    } catch (err) {
      setError(err.response?.data?.error || '인사이트를 불러오는데 실패했습니다.');
      console.error('Team insights error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (teamId && expanded) {
      fetchInsights();
    }
  }, [teamId, expanded]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'declining': return '📉';
      case 'stable': return '📊';
      case 'insufficient_data': return '📋';
      default: return '📊';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'improving': return '#10b981';
      case 'declining': return '#ef4444';
      case 'stable': return '#6b7280';
      case 'insufficient_data': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  const getTrendText = (trend) => {
    switch (trend) {
      case 'improving': return '상승 추세';
      case 'declining': return '하락 추세';
      case 'stable': return '안정적';
      case 'insufficient_data': return '데이터 부족';
      default: return '알 수 없음';
    }
  };

  const getConsistencyColor = (consistency) => {
    switch (consistency) {
      case 'consistent': return '#10b981';
      case 'moderate': return '#f59e0b';
      case 'inconsistent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConsistencyText = (consistency) => {
    switch (consistency) {
      case 'consistent': return '일관성 높음';
      case 'moderate': return '보통';
      case 'inconsistent': return '일관성 낮음';
      default: return '알 수 없음';
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          cursor: 'pointer',
          padding: expanded ? '0 0 16px 0' : '0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: '20px', marginRight: '8px' }}>🧠</span>
          <h3 style={{ margin: 0, color: '#374151' }}>AI 팀 분석</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!expanded && insights && (
            <div style={{ display: 'flex', gap: '8px' }}>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: getTrendColor(insights.trend) + '20', 
                color: getTrendColor(insights.trend),
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {getTrendIcon(insights.trend)} {getTrendText(insights.trend)}
              </span>
              <span style={{ 
                padding: '4px 8px', 
                backgroundColor: '#f3f4f6', 
                color: '#374151',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                평균 {insights.averageProgress}%
              </span>
            </div>
          )}
          <span style={{ 
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            fontSize: '12px'
          }}>
            ▼
          </span>
        </div>
      </div>

      {expanded && (
        <div>
          {loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#6b7280' 
            }}>
              <div style={{ marginBottom: '8px' }}>🤖</div>
              AI가 팀 데이터를 분석 중입니다...
            </div>
          )}

          {error && (
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#dc2626'
            }}>
              ❌ {error}
              <button 
                onClick={fetchInsights}
                style={{ 
                  marginLeft: '12px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  backgroundColor: 'transparent',
                  border: '1px solid #dc2626',
                  borderRadius: '4px',
                  color: '#dc2626',
                  cursor: 'pointer'
                }}
              >
                다시 시도
              </button>
            </div>
          )}

          {insights && !loading && (
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* 핵심 지표 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                gap: '12px' 
              }}>
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                    진행률 추세
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    fontSize: '18px', 
                    fontWeight: '600',
                    color: getTrendColor(insights.trend)
                  }}>
                    {getTrendIcon(insights.trend)} {getTrendText(insights.trend)}
                  </div>
                </div>

                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                    평균 완료율
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: '700',
                    color: insights.averageProgress >= 70 ? '#10b981' : 
                           insights.averageProgress >= 50 ? '#f59e0b' : '#ef4444'
                  }}>
                    {insights.averageProgress}%
                  </div>
                </div>

                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                    진행 일관성
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: getConsistencyColor(insights.consistency)
                  }}>
                    {getConsistencyText(insights.consistency)}
                  </div>
                </div>

                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f8fafc', 
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                    분석 데이터
                  </div>
                  <div style={{ 
                    fontSize: '16px', 
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    {insights.reportCount}주 보고서
                  </div>
                </div>
              </div>

              {/* 권장사항 */}
              {insights.recommendations && insights.recommendations.length > 0 && (
                <div style={{ 
                  padding: '16px', 
                  backgroundColor: '#f0f9ff', 
                  borderRadius: '8px',
                  border: '1px solid #bae6fd'
                }}>
                  <h4 style={{ 
                    margin: '0 0 12px 0', 
                    color: '#0369a1',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <span style={{ marginRight: '8px' }}>💡</span>
                    AI 권장사항
                  </h4>
                  <ul style={{ 
                    margin: '0', 
                    paddingLeft: '20px',
                    color: '#1e40af'
                  }}>
                    {insights.recommendations.map((rec, index) => (
                      <li key={index} style={{ marginBottom: '8px', lineHeight: '1.5' }}>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 마지막 업데이트 */}
              {insights.lastReportDate && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#64748b', 
                  textAlign: 'center',
                  paddingTop: '8px',
                  borderTop: '1px solid #e2e8f0'
                }}>
                  마지막 보고서: {new Date(insights.lastReportDate).toLocaleDateString('ko-KR')}
                  {' • '}
                  분석 시간: {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}

              {/* 새로고침 버튼 */}
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={fetchInsights}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    fontSize: '14px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    margin: '0 auto'
                  }}
                >
                  <span>🔄</span>
                  {loading ? '분석 중...' : '다시 분석'}
                </button>
              </div>
            </div>
          )}

          {!insights && !loading && !error && (
            <div style={{ 
              textAlign: 'center', 
              padding: '20px', 
              color: '#6b7280' 
            }}>
              <div style={{ marginBottom: '8px' }}>📊</div>
              팀 인사이트를 확인하려면 위의 버튼을 클릭하세요.
            </div>
          )}
        </div>
      )}
    </div>
  );
}