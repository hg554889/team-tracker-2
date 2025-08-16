import React, { useState } from 'react';
import { generateReportTemplate, predictProgress, suggestGoals } from '../api/ai';

export default function AIAssistant({ 
  teamId, 
  onTemplateGenerated, 
  onProgressPredicted, 
  onGoalsSuggested,
  currentProgress = 0,
  teamType: initialTeamType = '', // 이름 변경
  projectCategory: initialProjectCategory = '' // 이름 변경
}) {
  const [activeTab, setActiveTab] = useState('template');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [teamType, setTeamType] = useState(initialTeamType); // 추가
  const [projectCategory, setProjectCategory] = useState(initialProjectCategory); // 추가

  // 템플릿 생성
  const handleGenerateTemplate = async () => {
    if (!teamId || !teamType || !projectCategory) {
      alert('팀, 팀 유형, 프로젝트 카테고리를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await generateReportTemplate({
        teamId,
        teamType,
        projectCategory,
        projectDescription: document.getElementById('projectDescription')?.value || ''
      });

      const template = response.data.template;
      setResults(prev => ({ ...prev, template }));
      
      if (onTemplateGenerated) {
        onTemplateGenerated(template);
      }

      // 성공 메시지
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: '보고서 템플릿이 생성되었습니다!' }
      }));

    } catch (error) {
      console.error('Template generation error:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: '템플릿 생성 중 오류가 발생했습니다.' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 진행률 예측
  const handlePredictProgress = async () => {
    if (!teamId) {
      alert('팀을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await predictProgress({
        teamId,
        currentProgress,
        currentGoals: document.getElementById('currentGoals')?.value || '',
        currentIssues: document.getElementById('currentIssues')?.value || ''
      });

      const prediction = response.data.prediction;
      setResults(prev => ({ ...prev, prediction }));
      
      if (onProgressPredicted) {
        onProgressPredicted(prediction);
      }

      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: '진행률 예측이 완료되었습니다!' }
      }));

    } catch (error) {
      console.error('Progress prediction error:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: '진행률 예측 중 오류가 발생했습니다.' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 목표 제안
  const handleSuggestGoals = async () => {
    if (!teamId) {
      alert('팀을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const response = await suggestGoals({
        teamId,
        currentProgress,
        timeRemaining: document.getElementById('timeRemaining')?.value || '4주',
        projectCategory: projectCategory || '일반',
        customPrompt: document.getElementById('customPrompt')?.value || '' // 추가된 부분
      });

      const suggestions = response.data.suggestions;
      setResults(prev => ({ ...prev, suggestions }));
      
      if (onGoalsSuggested) {
        onGoalsSuggested(suggestions);
      }

      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: '목표 제안이 완료되었습니다!' }
      }));

    } catch (error) {
      console.error('Goals suggestion error:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: '목표 제안 중 오류가 발생했습니다.' }
      }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: '12px'
        }}>
          <span style={{ color: 'white', fontSize: '16px' }}>🤖</span>
        </div>
        <h3 style={{ margin: 0, color: '#333' }}>스마트 보고서 어시스턴트</h3>
      </div>

      {/* 탭 네비게이션 */}
      <div style={{ 
        display: 'flex', 
        borderBottom: '1px solid #eee', 
        marginBottom: '20px' 
      }}>
        {[
          { id: 'template', label: '템플릿 생성' },
          { id: 'predict', label: '진행률 예측' },
          { id: 'goals', label: '목표 제안' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 16px',
              border: 'none',
              background: activeTab === tab.id ? '#f0f0f0' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
              color: activeTab === tab.id ? '#667eea' : '#666',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab.id ? '600' : 'normal'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 템플릿 생성 탭 */}
      {activeTab === 'template' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              팀 유형 *
            </label>
            <select 
              value={teamType}
              onChange={(e) => setTeamType(e.target.value)} // 추가
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                backgroundColor: '#ffffff' // 배경색 변경
              }}
            >
              <option value="">선택해주세요</option>
              <option value="개발팀">개발팀</option>
              <option value="디자인팀">디자인팀</option>
              <option value="마케팅팀">마케팅팀</option>
              <option value="기획팀">기획팀</option>
              <option value="운영팀">운영팀</option>
              <option value="연구팀">연구팀</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              프로젝트 카테고리 *
            </label>
            <select 
              value={projectCategory}
              onChange={(e) => setProjectCategory(e.target.value)} // 추가
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                backgroundColor: '#ffffff' // 배경색 변경
              }}
            >
              <option value="">선택해주세요</option>
              <option value="웹 개발">웹 개발</option>
              <option value="모바일 앱">모바일 앱</option>
              <option value="데이터 분석">데이터 분석</option>
              <option value="UI/UX 디자인">UI/UX 디자인</option>
              <option value="마케팅 캠페인">마케팅 캠페인</option>
              <option value="제품 기획">제품 기획</option>
              <option value="연구 개발">연구 개발</option>
            </select>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              프로젝트 설명 (선택사항)
            </label>
            <textarea
              id="projectDescription"
              placeholder="프로젝트에 대한 간단한 설명을 입력해주세요..."
              style={{ 
                width: '100%', 
                minHeight: '80px', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                resize: 'vertical'
              }}
            />
          </div>

          <button
            onClick={handleGenerateTemplate}
            disabled={loading || !teamType || !projectCategory}
            className="btn primary"
            style={{ width: '100%' }}
          >
            {loading ? '생성 중...' : '🎯 템플릿 생성하기'}
          </button>

          {results.template && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: '#f8f9ff', 
              borderRadius: '8px',
              border: '1px solid #e1e5f0'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>생성된 템플릿</h4>
              <div style={{ marginBottom: '12px' }}>
                <strong>목표:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{results.template.goals}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>예상 이슈:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{results.template.issues}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>권장 진행률:</strong>
                <span style={{ color: '#667eea', fontWeight: '600' }}> {results.template.suggestedProgress}%</span>
              </div>
              {results.template.tips && (
                <div>
                  <strong>진행 팁:</strong>
                  <p style={{ margin: '4px 0', color: '#666' }}>{results.template.tips}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 진행률 예측 탭 */}
      {activeTab === 'predict' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              현재 진행률: {currentProgress}%
            </label>
            <div style={{ 
              width: '100%', 
              height: '8px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${currentProgress}%`, 
                height: '100%', 
                backgroundColor: '#667eea',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              현재 목표
            </label>
            <textarea
              id="currentGoals"
              placeholder="현재 진행 중인 목표를 입력해주세요..."
              style={{ 
                width: '100%', 
                minHeight: '60px', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              현재 이슈
            </label>
            <textarea
              id="currentIssues"
              placeholder="현재 겪고 있는 이슈가 있다면 입력해주세요..."
              style={{ 
                width: '100%', 
                minHeight: '60px', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px'
              }}
            />
          </div>

          <button
            onClick={handlePredictProgress}
            disabled={loading}
            className="btn primary"
            style={{ width: '100%' }}
          >
            {loading ? '예측 중...' : '📈 진행률 예측하기'}
          </button>

          {results.prediction && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: '#f0f8ff', 
              borderRadius: '8px',
              border: '1px solid #b3d9ff'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>예측 결과</h4>
              <div style={{ marginBottom: '12px' }}>
                <strong>다음 주 예상 진행률:</strong>
                <span style={{ color: '#2b6cb0', fontWeight: '600', fontSize: '18px' }}>
                  {' '}{results.prediction.predictedProgress}%
                </span>
                <span style={{ 
                  marginLeft: '8px', 
                  padding: '2px 8px', 
                  backgroundColor: results.prediction.confidence === '높음' ? '#c6f6d5' : 
                                  results.prediction.confidence === '보통' ? '#fed7d7' : '#fbb6ce',
                  color: results.prediction.confidence === '높음' ? '#2f855a' : 
                         results.prediction.confidence === '보통' ? '#c53030' : '#b83280',
                  borderRadius: '12px',
                  fontSize: '12px'
                }}>
                  신뢰도: {results.prediction.confidence}
                </span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>예측 근거:</strong>
                <p style={{ margin: '4px 0', color: '#666' }}>{results.prediction.reasoning}</p>
              </div>
              {results.prediction.recommendations && results.prediction.recommendations.length > 0 && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>권장사항:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.prediction.recommendations.map((rec, index) => (
                      <li key={index} style={{ color: '#666', marginBottom: '4px' }}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
              {results.prediction.riskFactors && results.prediction.riskFactors.length > 0 && (
                <div>
                  <strong>리스크 요인:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.prediction.riskFactors.map((risk, index) => (
                      <li key={index} style={{ color: '#e53e3e', marginBottom: '4px' }}>{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 목표 제안 탭 */}
      {activeTab === 'goals' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              요청 사항
            </label>
            <textarea
              id="customPrompt"
              placeholder="AI에게 전달할 특별한 지시사항이나 고려사항을 입력해주세요..."
              style={{ 
                width: '100%', 
                minHeight: '60px', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px',
                marginBottom: '16px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              프로젝트 남은 기간
            </label>
            <select
              id="timeRemaining"
              style={{ 
                width: '100%', 
                padding: '8px 12px', 
                border: '1px solid #ddd', 
                borderRadius: '4px'
              }}
            >
              <option value="1주">1주</option>
              <option value="2주">2주</option>
              <option value="4주" selected>4주</option>
              <option value="8주">8주</option>
              <option value="12주">12주</option>
              <option value="6개월">6개월</option>
            </select>
          </div>

          <button
            onClick={handleSuggestGoals}
            disabled={loading}
            className="btn primary"
            style={{ width: '100%' }}
          >
            {loading ? '분석 중...' : '🎯 목표 제안받기'}
          </button>

          {results.suggestions && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: '#f0fff4', 
              borderRadius: '8px',
              border: '1px solid #9ae6b4'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>목표 제안</h4>
              
              {results.suggestions.shortTermGoals && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>단기 목표 (1주):</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.suggestions.shortTermGoals.map((goal, index) => (
                      <li key={index} style={{ color: '#666', marginBottom: '4px' }}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.suggestions.mediumTermGoals && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>중기 목표 (1개월):</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.suggestions.mediumTermGoals.map((goal, index) => (
                      <li key={index} style={{ color: '#666', marginBottom: '4px' }}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.suggestions.keyMilestones && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>핵심 마일스톤:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.suggestions.keyMilestones.map((milestone, index) => (
                      <li key={index} style={{ color: '#666', marginBottom: '4px' }}>{milestone}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.suggestions.successMetrics && (
                <div>
                  <strong>성공 지표:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.suggestions.successMetrics.map((metric, index) => (
                      <li key={index} style={{ color: '#666', marginBottom: '4px' }}>{metric}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}