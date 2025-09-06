import React, { useState } from 'react';
import { generateReportTemplate, predictProgress, suggestGoals } from '../api/ai';

export default function AIAssistant({ 
  teamId, 
  onTemplateGenerated, 
  onProgressPredicted, 
  onGoalsSuggested,
  onActionPlanSuggested,
  onSmartAnalysis,
  // 새로운 필드별 콜백들
  onApplyToShortTermGoals,
  onApplyToLongTermGoals,
  onApplyToActionPlans,
  onApplyToMilestones,
  currentProgress = 0,
  teamType: initialTeamType = '', // 이름 변경
  projectCategory: initialProjectCategory = '', // 이름 변경
  currentGoals = {},
  currentPlans = {}
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

  // 목표 제안 (개선됨)
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
        goalType: document.querySelector('select')?.value || 'specific', // 목표 유형
        priority: document.querySelectorAll('select')[1]?.value || 'balanced', // 우선순위
        customPrompt: document.getElementById('goalPrompt')?.value || ''
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

  // SMART 목표 검증
  const handleValidateGoals = async () => {
    setLoading(true);
    try {
      // 실제 API 호출 대신 모킹 데이터 사용
      const mockValidation = {
        overall: 85,
        specific: 90,
        measurable: 80,
        achievable: 85,
        relevant: 90,
        timeBound: 75,
        suggestions: [
          '측정 기준을 더 구체적으로 명시하세요',
          '시간 제약을 더 명확하게 설정하세요'
        ]
      };
      
      setResults(prev => ({ ...prev, validation: mockValidation }));
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: 'SMART 목표 검증이 완료되었습니다!' }
      }));
    } catch (error) {
      console.error('Goal validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 실행 계획 생성
  const handleGenerateActionPlan = async () => {
    if (!teamId) {
      alert('팀을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      // 실제 API 호출 대신 모킹 데이터 사용
      const mockActionPlan = {
        timeline: [
          {
            task: '사용자 요구사항 분석 및 정리',
            duration: '2일',
            assignee: '기획자'
          },
          {
            task: 'API 설계 및 기본 구조 개발',
            duration: '3일',
            assignee: '백엔드 개발자'
          },
          {
            task: 'UI/UX 컴포넌트 개발',
            duration: '3일',
            assignee: '프론트엔드 개발자'
          }
        ],
        checkpoints: [
          '1주차: API 설계 검토 및 승인',
          '2주차: 기본 기능 개발 완료',
          '3주차: 통합 테스트 실시'
        ],
        resources: [
          '개발 서버 및 데이터베이스 환경',
          'UI 디자인 도구 라이선스',
          '테스트 자동화 도구'
        ]
      };
      
      setResults(prev => ({ ...prev, actionPlan: mockActionPlan }));
      
      // ReportForm에 결과 전달
      if (onActionPlanSuggested) {
        onActionPlanSuggested(mockActionPlan);
      }
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: '실행 계획이 생성되었습니다!' }
      }));

    } catch (error) {
      console.error('Action plan generation error:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: '실행 계획 생성 중 오류가 발생했습니다.' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 계획 최적화
  const handleOptimizePlan = async () => {
    setLoading(true);
    try {
      // 모킹 최적화 데이터
      const optimizedPlan = {
        ...results.actionPlan,
        timeline: results.actionPlan?.timeline?.map(task => ({
          ...task,
          optimized: true,
          efficiency: '+20%'
        })) || [],
        suggestions: [
          '병렬 작업 가능한 태스크들을 동시 진행',
          '코드 리뷰 주기를 단축하여 개발 속도 향상'
        ]
      };
      
      setResults(prev => ({ ...prev, actionPlan: optimizedPlan }));
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'info', msg: '계획이 최적화되었습니다!' }
      }));
    } catch (error) {
      console.error('Plan optimization error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 스마트 분석 (현재 내용 반영)
  const handleSmartAnalysis = async () => {
    const analysisType = document.querySelector('input[name="analysisType"]:checked')?.value || 'alignment';
    
    setLoading(true);
    try {
      // 현재 내용 기반 분석 데이터 생성
      const hasGoals = currentGoals.shortTermGoals || currentGoals.longTermGoals;
      const hasPlans = currentPlans.actionPlans || currentPlans.milestones;
      
      let score = 50; // 기본 점수
      let strengths = [];
      let improvements = [];
      
      // 목표 존재 여부 평가
      if (hasGoals) {
        score += 20;
        strengths.push('목표가 설정되어 있습니다');
      } else {
        improvements.push('목표를 설정해주세요');
      }
      
      // 계획 존재 여부 평가
      if (hasPlans) {
        score += 20;
        strengths.push('실행 계획이 수립되어 있습니다');
      } else {
        improvements.push('구체적인 실행 계획을 작성해주세요');
      }
      
      // 목표-계획 일치성 평가
      if (hasGoals && hasPlans) {
        score += 10;
        strengths.push('목표와 계획이 백밸하게 연결되어 있습니다');
      }
      
      // 분석 유형에 따른 추가 평가
      if (analysisType === 'feasibility') {
        improvements.push('팀 역량 대비 적정 난이도인지 검토하세요');
        improvements.push('사용 가능한 자원과 제약사항을 고려하세요');
      } else if (analysisType === 'risk') {
        improvements.push('예상 리스크와 대응 방안을 추가하세요');
        improvements.push('비상 계획(Plan B)을 수립하세요');
      } else if (analysisType === 'optimization') {
        improvements.push('병렬 수행 가능한 작업을 식별하세요');
        improvements.push('자원 활용을 최적화하세요');
      }
      
      const mockAnalysis = {
        score: Math.min(score, 100),
        analysisType,
        strengths,
        improvements,
        recommendations: [
          '주간 진행 상황 점검 미팅 실시',
          '각 단계별 성공 기준 사전 정의',
          '팀 내 역할 분담 명확화'
        ]
      };
      
      setResults(prev => ({ ...prev, analysis: mockAnalysis }));
      
      // ReportForm에 결과 전달
      if (onSmartAnalysis) {
        onSmartAnalysis(mockAnalysis);
      }
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: '스마트 분석이 완료되었습니다!' }
      }));

    } catch (error) {
      console.error('Smart analysis error:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: '스마트 분석 중 오류가 발생했습니다.' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 목표를 특정 필드에 직접 적용
  const handleApplyGoalsToField = (fieldType) => {
    const goalsResult = results.goals;
    if (!goalsResult) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'warning', msg: '먼저 목표를 생성해주세요.' }
      }));
      return;
    }

    let content = '';
    if (fieldType === 'short' && goalsResult.shortTermGoals) {
      content = goalsResult.shortTermGoals.map((goal, index) => `${index + 1}. ${goal}`).join('\n');
      onApplyToShortTermGoals?.(content);
    } else if (fieldType === 'long' && (goalsResult.longTermGoals || goalsResult.mediumTermGoals)) {
      const longTerm = goalsResult.longTermGoals || goalsResult.mediumTermGoals || [];
      content = longTerm.map((goal, index) => `${index + 1}. ${goal}`).join('\n');
      onApplyToLongTermGoals?.(content);
    } else if (fieldType === 'milestones' && goalsResult.keyMilestones) {
      content = goalsResult.keyMilestones.map((milestone, index) => `${index + 1}. ${milestone}`).join('\n');
      onApplyToMilestones?.(content);
    }
  };

  // 목표를 기반으로 실행계획 생성 후 적용
  const handleGenerateActionPlanFromGoals = async () => {
    const goals = results.goals;
    if (!goals) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'warning', msg: '먼저 목표를 생성해주세요.' }
      }));
      return;
    }

    try {
      setLoading(true);
      
      // 현재 목표들을 기반으로 실행계획 생성
      const goalsText = [
        ...(goals.shortTermGoals || []),
        ...(goals.longTermGoals || goals.mediumTermGoals || [])
      ].join(', ');

      // 실행계획 생성 API 호출 (기존 handleGenerateActionPlan 로직 재사용)
      const response = await fetch('/api/ai/generate-action-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          teamId,
          currentProgress,
          goals: goalsText,
          teamType,
          projectCategory
        })
      });

      if (!response.ok) throw new Error('실행계획 생성 실패');
      
      const data = await response.json();
      
      if (data.timeline) {
        let planText = '📅 단계별 일정:\n';
        data.timeline.forEach((step, index) => {
          planText += `${index + 1}. ${step.task} (${step.duration}, 담당: ${step.assignee})\n`;
        });
        planText += '\n';
        
        if (data.checkpoints) {
          planText += '✓ 체크포인트:\n';
          data.checkpoints.forEach((checkpoint, index) => {
            planText += `- ${checkpoint}\n`;
          });
        }
        
        onApplyToActionPlans?.(planText);
      }

    } catch (error) {
      console.error('Action plan generation error:', error);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: '실행계획 생성 중 오류가 발생했습니다.' }
      }));
    } finally {
      setLoading(false);
    }
  };

  // 실행계획을 필드에 직접 적용
  const handleApplyActionPlanToField = () => {
    const plansResult = results.plans;
    if (!plansResult) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'warning', msg: '먼저 실행계획을 생성해주세요.' }
      }));
      return;
    }

    let planText = '';
    if (plansResult.timeline) {
      planText += '📅 단계별 일정:\n';
      plansResult.timeline.forEach((step, index) => {
        planText += `${index + 1}. ${step.task} (${step.duration}, 담당: ${step.assignee})\n`;
      });
      planText += '\n';
    }
    
    if (plansResult.checkpoints) {
      planText += '✓ 체크포인트:\n';
      plansResult.checkpoints.forEach((checkpoint, index) => {
        planText += `- ${checkpoint}\n`;
      });
    }
    
    onApplyToActionPlans?.(planText);
  };

  // 마일스톤 추출하여 적용
  const handleExtractMilestones = () => {
    const plansResult = results.plans;
    if (!plansResult) {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'warning', msg: '먼저 실행계획을 생성해주세요.' }
      }));
      return;
    }

    let milestonesText = '';
    if (plansResult.timeline) {
      // 타임라인에서 주요 마일스톤 추출
      const milestones = plansResult.timeline
        .filter((step, index) => index % 2 === 0 || step.task.includes('완료') || step.task.includes('검토'))
        .map(step => step.task);
      
      milestones.forEach((milestone, index) => {
        milestonesText += `${index + 1}. ${milestone}\n`;
      });
    }
    
    if (plansResult.checkpoints) {
      if (milestonesText) milestonesText += '\n📍 추가 체크포인트:\n';
      else milestonesText += '📍 체크포인트:\n';
      
      plansResult.checkpoints.forEach((checkpoint, index) => {
        milestonesText += `${milestonesText.includes('📍 추가') ? '' : (index + 1) + '. '}${checkpoint}\n`;
      });
    }
    
    onApplyToMilestones?.(milestonesText);
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
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '4px'
      }}>
        {[
          { id: 'template', label: '템플릿' },
          { id: 'goals', label: '목표 제안' },
          { id: 'plans', label: '실행 계획' },
          { id: 'analysis', label: '스마트 분석' },
          { id: 'predict', label: '진행률 예측' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '6px 12px',
              border: 'none',
              background: activeTab === tab.id ? '#f0f0f0' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #667eea' : '2px solid transparent',
              color: activeTab === tab.id ? '#667eea' : '#666',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === tab.id ? '600' : 'normal',
              borderRadius: '4px 4px 0 0',
              flex: '1 1 auto',
              minWidth: '80px'
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

      {/* 목표 제안 탭 (개선됨) */}
      {activeTab === 'goals' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  목표 유형
                </label>
                <select style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <option value="specific">구체적 목표</option>
                  <option value="measurable">측정 가능 목표</option>
                  <option value="achievable">달성 가능 목표</option>
                  <option value="smart">SMART 목표</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  우선순위
                </label>
                <select style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="balanced">균형</option>
                </select>
              </div>
            </div>
            
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              목표 설정 방향
            </label>
            <textarea
              id="goalPrompt"
              placeholder="어떤 목표를 원하시나요? 예: '사용자 경험 개선에 중점을 둔 목표', '기술적 도전을 포함한 목표' 등..."
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={handleSuggestGoals}
              disabled={loading}
              className="btn primary"
            >
              {loading ? '제안 중...' : '🎯 목표 제안'}
            </button>
            <button
              onClick={handleValidateGoals}
              disabled={loading}
              className="btn secondary"
              style={{ background: '#f59e0b', color: 'white' }}
            >
              ✅ SMART 검증
            </button>
          </div>
          
          {/* 직접 적용 버튼들 */}
          {results.suggestions && (
            <div style={{ 
              padding: '12px', 
              background: '#f0f9ff', 
              borderRadius: '8px', 
              border: '1px solid #0ea5e9',
              marginBottom: '16px'
            }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#0c4a6e', fontSize: '0.9rem' }}>🚀 목표를 직접 적용하기</h5>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <button
                  onClick={() => handleApplyGoalsToField('short')}
                  disabled={loading}
                  className="btn secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#10b981', color: 'white' }}
                >
                  📋 단기목표에 적용
                </button>
                <button
                  onClick={() => handleApplyGoalsToField('long')}
                  disabled={loading}
                  className="btn secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#3b82f6', color: 'white' }}
                >
                  🎯 장기목표에 적용
                </button>
                <button
                  onClick={() => handleApplyGoalsToField('milestones')}
                  disabled={loading}
                  className="btn secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#8b5cf6', color: 'white' }}
                >
                  🏃 마일스톤에 적용
                </button>
                <button
                  onClick={() => handleGenerateActionPlanFromGoals()}
                  disabled={loading}
                  className="btn secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#f59e0b', color: 'white' }}
                >
                  📅 실행계획 생성
                </button>
              </div>
            </div>
          )}

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

          {/* SMART 검증 결과 */}
          {results.validation && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px',
              border: '1px solid #f59e0b'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>SMART 목표 검증 결과</h4>
              
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
                gap: '8px',
                marginBottom: '16px'
              }}>
                {[
                  { key: 'specific', label: 'S-구체성' },
                  { key: 'measurable', label: 'M-측정성' },
                  { key: 'achievable', label: 'A-달성성' },
                  { key: 'relevant', label: 'R-관련성' },
                  { key: 'timeBound', label: 'T-시간성' }
                ].map(item => (
                  <div key={item.key} style={{
                    textAlign: 'center',
                    padding: '8px',
                    background: 'white',
                    borderRadius: '6px',
                    border: '1px solid #fbbf24'
                  }}>
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold' }}>{item.label}</div>
                    <div style={{
                      fontSize: '1.2rem',
                      fontWeight: 'bold',
                      color: results.validation[item.key] >= 80 ? '#10b981' : results.validation[item.key] >= 60 ? '#f59e0b' : '#ef4444'
                    }}>
                      {results.validation[item.key]}
                    </div>
                  </div>
                ))}
              </div>
              
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '1rem', fontWeight: 'bold' }}>전체 점수: </span>
                <span style={{
                  fontSize: '1.4rem',
                  fontWeight: 'bold',
                  color: results.validation.overall >= 80 ? '#10b981' : results.validation.overall >= 60 ? '#f59e0b' : '#ef4444'
                }}>
                  {results.validation.overall}/100
                </span>
              </div>
              
              {results.validation.suggestions && results.validation.suggestions.length > 0 && (
                <div>
                  <strong>개선 제안:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.validation.suggestions.map((suggestion, index) => (
                      <li key={index} style={{ color: '#d97706', marginBottom: '4px' }}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 실행 계획 탭 */}
      {activeTab === 'plans' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  계획 방법론
                </label>
                <select id="planMethodology" style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <option value="agile">애자일 방법론</option>
                  <option value="waterfall">워터폴</option>
                  <option value="lean">린 스타트업</option>
                  <option value="hybrid">하이브리드</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                  대상 기간
                </label>
                <select id="planDuration" style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}>
                  <option value="1week">1주</option>
                  <option value="2weeks">2주</option>
                  <option value="1month">1개월</option>
                  <option value="3months">3개월</option>
                </select>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
                현재 목표 (참고용)
              </label>
              <textarea
                id="currentGoalsForPlan"
                placeholder="현재 설정된 목표를 입력하면 이에 맞는 구체적 계획을 제안해드립니다..."
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
                팀 역량 및 제약사항
              </label>
              <textarea
                id="teamConstraints"
                placeholder="팀 규모, 기술 스택, 제약사항 등을 입력해주세요. 예: '3명의 개발자, React 전문, 주 40시간 작업'..."
                style={{ 
                  width: '100%', 
                  minHeight: '60px', 
                  padding: '8px 12px', 
                  border: '1px solid #ddd', 
                  borderRadius: '4px'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <button
              onClick={handleGenerateActionPlan}
              disabled={loading}
              className="btn primary"
            >
              {loading ? '생성 중...' : '📅 실행계획 생성'}
            </button>
            <button
              onClick={() => handleOptimizePlan()}
              disabled={loading}
              className="btn secondary"
              style={{ background: '#8b5cf6', color: 'white' }}
            >
              ⚙️ 계획 최적화
            </button>
          </div>
          
          {/* 직접 적용 버튼 */}
          {results.actionPlan && (
            <div style={{ 
              padding: '12px', 
              background: '#fef3c7', 
              borderRadius: '8px', 
              border: '1px solid #f59e0b',
              marginBottom: '16px'
            }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#92400e', fontSize: '0.9rem' }}>🚀 계획을 직접 적용하기</h5>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleApplyActionPlanToField()}
                  disabled={loading}
                  className="btn secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#f59e0b', color: 'white' }}
                >
                  📅 실행계획에 적용
                </button>
                <button
                  onClick={() => handleExtractMilestones()}
                  disabled={loading}
                  className="btn secondary"
                  style={{ fontSize: '0.8rem', padding: '6px 12px', background: '#8b5cf6', color: 'white' }}
                >
                  🏃 마일스톤 추출
                </button>
              </div>
            </div>
          )}

          {results.actionPlan && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '8px',
              border: '1px solid #f59e0b'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>실행 계획</h4>
              
              {results.actionPlan.timeline && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>단계별 일정:</strong>
                  <div style={{ marginTop: '8px' }}>
                    {results.actionPlan.timeline.map((step, index) => (
                      <div key={index} style={{ 
                        padding: '8px', 
                        margin: '4px 0',
                        background: 'white',
                        borderRadius: '4px',
                        border: '1px solid #fbbf24'
                      }}>
                        <strong>단계 {index + 1}:</strong> {step.task}
                        <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '4px' }}>
                          ⏰ {step.duration} | 👥 {step.assignee}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {results.actionPlan.checkpoints && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>체크포인트:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.actionPlan.checkpoints.map((checkpoint, index) => (
                      <li key={index} style={{ color: '#666', marginBottom: '4px' }}>{checkpoint}</li>
                    ))}
                  </ul>
                </div>
              )}

              {results.actionPlan.resources && (
                <div>
                  <strong>필요 자원:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.actionPlan.resources.map((resource, index) => (
                      <li key={index} style={{ color: '#666', marginBottom: '4px' }}>{resource}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 스마트 분석 탭 */}
      {activeTab === 'analysis' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>🤖 지능형 목표-계획 분석</h4>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '16px' }}>
              설정한 목표와 계획의 일치성을 분석하고 개선점을 제안합니다.
            </p>
            
            {/* 현재 내용 미리보기 */}
            <div style={{ 
              padding: '12px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              marginBottom: '16px'
            }}>
              <h5 style={{ margin: '0 0 8px 0', color: '#4a5568', fontSize: '0.9rem' }}>📋 내용 미리보기</h5>
              <div style={{ fontSize: '0.8rem', color: '#666' }}>
                <div><strong>단기 목표:</strong> {currentGoals.shortTermGoals ? '설정됨 (영역)' : '미설정'}</div>
                <div><strong>장기 목표:</strong> {currentGoals.longTermGoals ? '설정됨 (영역)' : '미설정'}</div>
                <div><strong>실행 계획:</strong> {currentPlans.actionPlans ? '작성됨 (영역)' : '미작성'}</div>
                <div><strong>마일스톤:</strong> {currentPlans.milestones ? '설정됨 (영역)' : '미설정'}</div>
              </div>
              {(!currentGoals.shortTermGoals && !currentGoals.longTermGoals && !currentPlans.actionPlans) && (
                <div style={{ 
                  marginTop: '8px', 
                  padding: '8px', 
                  background: '#fef3c7', 
                  borderRadius: '4px',
                  fontSize: '0.8rem',
                  color: '#d97706'
                }}>
                  ⚠️ 분석을 위해 먼저 목표와 계획을 작성해주세요.
                </div>
              )}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
              분석 유형
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="analysisType" value="alignment" defaultChecked />
                <span style={{ fontSize: '0.9rem' }}>목표-계획 일치성</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="analysisType" value="feasibility" />
                <span style={{ fontSize: '0.9rem' }}>실현 가능성</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="analysisType" value="risk" />
                <span style={{ fontSize: '0.9rem' }}>리스크 평가</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="radio" name="analysisType" value="optimization" />
                <span style={{ fontSize: '0.9rem' }}>최적화 제안</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleSmartAnalysis}
            disabled={loading}
            className="btn primary"
            style={{ width: '100%', marginBottom: '16px' }}
          >
            {loading ? '분석 중...' : '🤖 스마트 분석 시작'}
          </button>

          {results.analysis && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              backgroundColor: '#ede9fe', 
              borderRadius: '8px',
              border: '1px solid #8b5cf6'
            }}>
              <h4 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>분석 결과</h4>
              
              {results.analysis.score && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong>전체 점수:</strong>
                    <div style={{
                      padding: '4px 12px',
                      borderRadius: '20px',
                      background: results.analysis.score >= 80 ? '#10b981' : results.analysis.score >= 60 ? '#f59e0b' : '#ef4444',
                      color: 'white',
                      fontWeight: 'bold'
                    }}>
                      {results.analysis.score}/100
                    </div>
                  </div>
                </div>
              )}
              
              {results.analysis.strengths && (
                <div style={{ marginBottom: '16px' }}>
                  <strong>강점:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.analysis.strengths.map((strength, index) => (
                      <li key={index} style={{ color: '#059669', marginBottom: '4px' }}>{strength}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {results.analysis.improvements && (
                <div>
                  <strong>개선 제안:</strong>
                  <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                    {results.analysis.improvements.map((improvement, index) => (
                      <li key={index} style={{ color: '#dc2626', marginBottom: '4px' }}>{improvement}</li>
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