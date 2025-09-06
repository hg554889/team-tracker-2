import React, { useEffect, useState } from 'react';
import { listTeams } from '../api/teams';
import { createOrUpdateReport } from '../api/reports';
import { useLocation, useNavigate } from 'react-router-dom';
import AIAssistant from '../components/AIAssistant';
import CollaborativeEditor from '../components/CollaborativeEditor';
import './ReportForm.css';

export default function ReportForm(){
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [weekOf, setWeekOf] = useState('');
  const [progress, setProgress] = useState(0);
  const [shortTermGoals, setShortTermGoals] = useState('');
  const [longTermGoals, setLongTermGoals] = useState('');
  const [actionPlans, setActionPlans] = useState('');
  const [milestones, setMilestones] = useState('');
  const [issues, setIssues] = useState('');
  const [reportId, setReportId] = useState(null);
  const [useCollaborative, setUseCollaborative] = useState(false);
  const [dueAt, setDueAt] = useState('');
  const [done, setDone] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(() => { 
    (async () => {
      const { data } = await listTeams({ scope: 'mine' });
      setTeams(data.items);
      const preset = loc.state?.teamId; 
      if (preset) {
        setTeamId(preset);
        const team = data.items.find(t => t._id === preset);
        setSelectedTeam(team);
      }
      if (!weekOf) setWeekOf(new Date().toISOString().slice(0,10));
    })(); 
  }, [loc.state]); // eslint-disable-line

  const handleTeamChange = (e) => {
    const newTeamId = e.target.value;
    setTeamId(newTeamId);
    const team = teams.find(t => t._id === newTeamId);
    setSelectedTeam(team);
  };

  // AI 템플릿 적용
  const handleTemplateGenerated = (template) => {
    if (template.shortTermGoals) setShortTermGoals(template.shortTermGoals);
    if (template.longTermGoals) setLongTermGoals(template.longTermGoals);
    if (template.actionPlans) setActionPlans(template.actionPlans);
    if (template.milestones) setMilestones(template.milestones);
    if (template.issues) setIssues(template.issues);
    if (template.suggestedProgress) setProgress(template.suggestedProgress);
    
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', msg: 'AI 템플릿이 폼에 적용되었습니다. 필요시 수정해주세요.' }
    }));
  };

  // AI 진행률 예측 적용
  const handleProgressPredicted = (prediction) => {
    if (prediction.predictedProgress) {
      setProgress(prediction.predictedProgress);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'info', msg: `예측된 진행률 ${prediction.predictedProgress}%가 적용되었습니다.` }
      }));
    }
  };

  // AI 목표 제안 적용 (개선됨)
  const handleGoalsSuggested = (suggestions) => {
    if (suggestions.shortTermGoals) {
      let shortTermText = '';
      suggestions.shortTermGoals.forEach((goal, index) => {
        shortTermText += `${index + 1}. ${goal}\n`;
      });
      setShortTermGoals(shortTermText);
    }
    
    if (suggestions.mediumTermGoals || suggestions.longTermGoals) {
      let longTermText = '';
      const longTerm = suggestions.mediumTermGoals || suggestions.longTermGoals || [];
      longTerm.forEach((goal, index) => {
        longTermText += `${index + 1}. ${goal}\n`;
      });
      setLongTermGoals(longTermText);
    }
    
    if (suggestions.keyMilestones) {
      let milestonesText = '';
      suggestions.keyMilestones.forEach((milestone, index) => {
        milestonesText += `${index + 1}. ${milestone}\n`;
      });
      setMilestones(milestonesText);
    }
    
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', msg: 'AI 제안 목표가 적용되었습니다. 팀 상황에 맞게 수정해주세요.' }
    }));
  };

  // AI 실행계획 제안 적용
  const handleActionPlanSuggested = (actionPlan) => {
    if (actionPlan.timeline) {
      let planText = '📅 단계별 일정:\n';
      actionPlan.timeline.forEach((step, index) => {
        planText += `${index + 1}. ${step.task} (${step.duration}, 담당: ${step.assignee})\n`;
      });
      planText += '\n';
      
      if (actionPlan.checkpoints) {
        planText += '✓ 체크포인트:\n';
        actionPlan.checkpoints.forEach((checkpoint, index) => {
          planText += `- ${checkpoint}\n`;
        });
      }
      
      setActionPlans(planText);
    }
    
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', msg: 'AI 실행계획이 적용되었습니다.' }
    }));
  };

  // AI 스마트 분석 결과 처리
  const handleSmartAnalysis = (analysis) => {
    let analysisText = `🤖 AI 분석 결과 (전체 점수: ${analysis.score}/100)\n\n`;
    
    if (analysis.strengths) {
      analysisText += '👍 강점:\n';
      analysis.strengths.forEach(strength => {
        analysisText += `- ${strength}\n`;
      });
      analysisText += '\n';
    }
    
    if (analysis.improvements) {
      analysisText += '💡 개선점:\n';
      analysis.improvements.forEach(improvement => {
        analysisText += `- ${improvement}\n`;
      });
    }
  };

  // AI 단기 목표 직접 적용
  const handleApplyToShortTermGoals = (content) => {
    setShortTermGoals(content);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', msg: '단기 목표가 적용되었습니다.' }
    }));
  };

  // AI 장기 목표 직접 적용
  const handleApplyToLongTermGoals = (content) => {
    setLongTermGoals(content);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', msg: '장기 목표가 적용되었습니다.' }
    }));
  };

  // AI 실행 계획 직접 적용
  const handleApplyToActionPlans = (content) => {
    setActionPlans(content);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', msg: '실행 계획이 적용되었습니다.' }
    }));
  };

  // AI 마일스톤 직접 적용
  const handleApplyToMilestones = (content) => {
    setMilestones(content);
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'success', msg: '마일스톤이 적용되었습니다.' }
    }));
  };

  async function submit(e){
    e.preventDefault();
    try{
      const payload = {
        teamId,
        weekOf: new Date().toISOString(), // 현재 시간으로 설정하여 고유성 보장
        progress: Number(progress),
        shortTermGoals,
        longTermGoals,
        actionPlans,
        milestones,
        issues,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      };
      const response = await createOrUpdateReport(payload);
      setReportId(response.data._id);
      setDone(true);
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'보고서 저장 완료'} }));
      window.dispatchEvent(new CustomEvent('report:saved', { detail: { teamId } }));
      nav(`/teams/${teamId}#reports`, { replace:true });
    }catch(err){
      console.log('server says:', err.response?.data);
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'저장 실패'} }));
    }
  }

  if (done) return (
    <div className="report-container">
      <div className="report-success">
        <div className="success-icon">✅</div>
        <h2>보고서가 저장되었습니다!</h2>
        <p>팀 페이지로 이동하여 결과를 확인하세요.</p>
      </div>
    </div>
  );

  // 팀 타입과 프로젝트 카테고리 추론
  const getTeamType = (teamName, teamDescription) => {
    const name = (teamName || '').toLowerCase();
    const desc = (teamDescription || '').toLowerCase();
    
    if (name.includes('개발') || desc.includes('개발') || desc.includes('코딩')) return '개발팀';
    if (name.includes('디자인') || desc.includes('디자인') || desc.includes('ui')) return '디자인팀';
    if (name.includes('마케팅') || desc.includes('마케팅') || desc.includes('홍보')) return '마케팅팀';
    if (name.includes('기획') || desc.includes('기획') || desc.includes('pm')) return '기획팀';
    if (name.includes('운영') || desc.includes('운영') || desc.includes('관리')) return '운영팀';
    if (name.includes('연구') || desc.includes('연구') || desc.includes('r&d')) return '연구팀';
    
    return '개발팀'; // 기본값
  };

  const getProjectCategory = (teamName, teamDescription) => {
    const name = (teamName || '').toLowerCase();
    const desc = (teamDescription || '').toLowerCase();
    
    if (name.includes('웹') || desc.includes('웹') || desc.includes('web')) return '웹 개발';
    if (name.includes('앱') || desc.includes('앱') || desc.includes('모바일')) return '모바일 앱';
    if (name.includes('데이터') || desc.includes('데이터') || desc.includes('분석')) return '데이터 분석';
    if (name.includes('디자인') || desc.includes('ui') || desc.includes('ux')) return 'UI/UX 디자인';
    if (name.includes('마케팅') || desc.includes('캠페인') || desc.includes('광고')) return '마케팅 캠페인';
    if (name.includes('제품') || desc.includes('제품') || desc.includes('기획')) return '제품 기획';
    if (name.includes('연구') || desc.includes('연구') || desc.includes('r&d')) return '연구 개발';
    
    return '웹 개발'; // 기본값
  };

  return (
    <div className="report-container">
      <div className="report-header">
        <div className="report-title">
          <h1>📊 보고서 작성</h1>
          <p>팀의 진행상황과 목표를 체계적으로 기록하세요</p>
        </div>
        <button
          onClick={() => setShowAI(!showAI)}
          className={`ai-toggle-btn ${showAI ? 'active' : ''}`}
        >
          <span className="ai-icon">🤖</span>
          AI 어시스턴트 {showAI ? '숨기기' : '보기'}
        </button>
      </div>

      {/* AI 어시스턴트 */}
      {showAI && selectedTeam && (
        <div className="ai-assistant-container">
          <AIAssistant
            teamId={teamId}
            currentProgress={progress}
            teamType={getTeamType(selectedTeam.name, selectedTeam.description)}
            projectCategory={getProjectCategory(selectedTeam.name, selectedTeam.description)}
            onTemplateGenerated={handleTemplateGenerated}
            onProgressPredicted={handleProgressPredicted}
            onGoalsSuggested={handleGoalsSuggested}
            onActionPlanSuggested={handleActionPlanSuggested}
            onSmartAnalysis={handleSmartAnalysis}
            onApplyToShortTermGoals={handleApplyToShortTermGoals}
            onApplyToLongTermGoals={handleApplyToLongTermGoals}
            onApplyToActionPlans={handleApplyToActionPlans}
            onApplyToMilestones={handleApplyToMilestones}
            currentGoals={{ shortTermGoals, longTermGoals }}
            currentPlans={{ actionPlans, milestones }}
          />
        </div>
      )}

      <form onSubmit={submit} className="report-form">
        <div className="form-section">
          <h3>📋 기본 정보</h3>
          <div className="form-group">
            <label>팀 선택 *</label>
            <select 
              className="form-input" 
              value={teamId} 
              onChange={handleTeamChange} 
              required
            >
              <option value="">팀을 선택하세요</option>
              {teams.map(t => (
                <option key={t._id} value={t._id}>
                  {t.name}
                  {t.description && ` - ${t.description.substring(0, 30)}${t.description.length > 30 ? '...' : ''}`}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>주차 시작일 *</label>
            <input 
              className="form-input" 
              type="date" 
              value={weekOf} 
              onChange={e => setWeekOf(e.target.value)} 
              required
            />
          </div>
        </div>

        <div className="form-section">
          <h3>📈 진행 현황</h3>
          <div className="form-group">
            <label>완료율 (%) *</label>
            <div className="progress-input-container">
              <input 
                className="form-input progress-input" 
                type="number" 
                min={0} 
                max={100} 
                value={progress} 
                onChange={e => setProgress(e.target.value)}
                placeholder="0-100"
              />
              <div className="progress-bar">
                <div 
                  className={`progress-fill ${progress >= 80 ? 'high' : progress >= 50 ? 'medium' : 'low'}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className={`progress-text ${progress >= 80 ? 'high' : progress >= 50 ? 'medium' : 'low'}`}>
                {progress}%
              </span>
            </div>
          </div>
        </div>

        {/* 협업 편집 토글 */}
        <div className="collaboration-toggle">
          <div className="collaboration-header">
            <h3>🤝 팀 협업 모드</h3>
            <p className="collaboration-subtitle">팀원들과 실시간으로 보고서를 함께 작성하세요</p>
          </div>
          
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useCollaborative}
              onChange={(e) => setUseCollaborative(e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="label-text">
              <strong>🚀 실시간 협업 편집 활성화</strong>
              <small>모든 팀원이 동시에 편집할 수 있는 실시간 협업 기능입니다</small>
            </span>
          </label>

          {/* 협업 안내 상자 */}
          <div className="collaboration-guide">
            <div className="guide-section">
              <h4>🎯 효과적인 협업 방법</h4>
              <div className="guide-grid">
                <div className="guide-item">
                  <span className="guide-icon">📝</span>
                  <div className="guide-content">
                    <strong>역할 분담</strong>
                    <p>각자 다른 섹션 담당 (단기목표/장기목표/계획/마일스톤)</p>
                  </div>
                </div>
                <div className="guide-item">
                  <span className="guide-icon">⏰</span>
                  <div className="guide-content">
                    <strong>동시 편집 주의</strong>
                    <p>같은 섹션을 동시 작업 시 커서 위치 확인 후 작업</p>
                  </div>
                </div>
                <div className="guide-item">
                  <span className="guide-icon">💬</span>
                  <div className="guide-content">
                    <strong>소통</strong>
                    <p>중요한 수정 전 팀원에게 미리 알림 전달</p>
                  </div>
                </div>
                <div className="guide-item">
                  <span className="guide-icon">🔄</span>
                  <div className="guide-content">
                    <strong>매끄럽게 저장</strong>
                    <p>작업 완료 후 저장 버튼을 눌러 모든 변경사항 저장</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="guide-section">
              <h4>✅ 협업이 유용한 상황</h4>
              <ul className="best-practices">
                <li><strong>브레인스토밍:</strong> 팀원들과 함께 아이디어를 도출할 때</li>
                <li><strong>복잡한 이슈 분석:</strong> 여러 관점의 의견이 필요한 문제일 때</li>
                <li><strong>실시간 피드백:</strong> 진행 상황을 즉시 공유하고 싶을 때</li>
                <li><strong>지식 공유:</strong> 경험이 많은 팀원의 노하우를 공유받을 때</li>
              </ul>
            </div>

            <div className="guide-section">
              <h4>⚠️ 주의사항</h4>
              <ul className="warnings">
                <li>보고서를 저장한 후에 협업 기능을 사용할 수 있습니다</li>
                <li>네트워크 연결이 불안정한 경우 일반 모드를 사용하세요</li>
                <li>중요한 내용은 별도로 백업해 두는 것을 권장합니다</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 목표 및 계획 4개 섹션으로 분리 */}
        <div className="goals-plans-container">
          <div className="section-header">
            <h3>🎯 목표 및 실행 계획</h3>
            <p className="section-description">목표를 명확히 설정하고 구체적인 실행 계획을 수립하세요</p>
          </div>

          <div className="goals-grid">
            {/* 단기 목표 */}
            <div className="form-section goals-section">
              <h4>🏁 단기 목표 (1주)</h4>
              <div className="form-group">
                <label>이번 주 달성할 구체적 목표</label>
                {useCollaborative && reportId ? (
                  <div>
                    <CollaborativeEditor
                      reportId={reportId}
                      field="shortTermGoals"
                      initialContent={shortTermGoals}
                      onChange={setShortTermGoals}
                      disabled={false}
                    />
                    <div className="collaboration-status">
                      🚀 실시간 협업 모드: 팀원들과 함께 작성 중
                    </div>
                  </div>
                ) : (
                  <textarea 
                    className="form-textarea short-goals" 
                    value={shortTermGoals} 
                    onChange={e => setShortTermGoals(e.target.value)}
                    placeholder="이번 주 안에 달성할 구체적인 목표를 입력하세요

Ex)
• 로그인 API 개발 완료
• 메인 페이지 UI 마크업 완성
• 데이터베이스 스키마 설계 완료"
                    required
                  />
                )}
              </div>
            </div>

            {/* 중장기 목표 */}
            <div className="form-section goals-section">
              <h4>🎯 중장기 목표 (1개월)</h4>
              <div className="form-group">
                <label>프로젝트의 전체적 목표</label>
                {useCollaborative && reportId ? (
                  <div>
                    <CollaborativeEditor
                      reportId={reportId}
                      field="longTermGoals"
                      initialContent={longTermGoals}
                      onChange={setLongTermGoals}
                      disabled={false}
                    />
                    <div className="collaboration-status">
                      🚀 실시간 협업 모드 활성
                    </div>
                  </div>
                ) : (
                  <textarea 
                    className="form-textarea long-goals" 
                    value={longTermGoals} 
                    onChange={e => setLongTermGoals(e.target.value)}
                    placeholder="프로젝트의 전반적인 목표를 입력하세요

Ex)
• 사용자 관리 시스템 구축
• 보안 인증 체계 도입
• 대시보드 및 보고서 기능 완성"
                  />
                )}
              </div>
            </div>

            {/* 실행 계획 */}
            <div className="form-section plans-section">
              <h4>📅 실행 계획</h4>
              <div className="form-group">
                <label>목표 달성을 위한 구체적 실행 방닥</label>
                {useCollaborative && reportId ? (
                  <div>
                    <CollaborativeEditor
                      reportId={reportId}
                      field="actionPlans"
                      initialContent={actionPlans}
                      onChange={setActionPlans}
                      disabled={false}
                    />
                    <div className="collaboration-status">
                      🚀 실시간 협업 모드 활성
                    </div>
                  </div>
                ) : (
                  <textarea 
                    className="form-textarea action-plans" 
                    value={actionPlans} 
                    onChange={e => setActionPlans(e.target.value)}
                    placeholder="목표를 달성하기 위한 구체적인 실행 방법을 작성하세요

Ex)
1. 월요일: 사용자 요구사항 분석 및 정리
2. 화요일: API 설계 및 개발 시작
3. 수요일-목요일: 쿨드 구현 및 테스트
4. 금요일: UI 컨포넌트 개발"
                  />
                )}
              </div>
            </div>

            {/* 주요 마일스톤 */}
            <div className="form-section milestones-section">
              <h4>🏃 주요 마일스톤</h4>
              <div className="form-group">
                <label>중요한 중간 목표 및 검증 지점</label>
                {useCollaborative && reportId ? (
                  <div>
                    <CollaborativeEditor
                      reportId={reportId}
                      field="milestones"
                      initialContent={milestones}
                      onChange={setMilestones}
                      disabled={false}
                    />
                    <div className="collaboration-status">
                      🚀 실시간 협업 모드 활성
                    </div>
                  </div>
                ) : (
                  <textarea 
                    className="form-textarea milestones" 
                    value={milestones} 
                    onChange={e => setMilestones(e.target.value)}
                    placeholder="주요 마일스톤과 검증 기준을 작성하세요

Ex)
• 1주차: 기본 인증 로직 완성 (80%)
• 2주차: UI/UX 시안 검토 완료 (90%)
• 3주차: 통합 테스트 통과 (95%)
• 4주차: 배포 및 모니터링 체계 구축 (100%)"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="form-hint goals-hint">
            💡 <strong>AI 어시스턴트 활용 팩:</strong> 위 버튼의 AI 어시스턴트를 사용하면 팀 유형과 프로젝트 맥락에 맞는 체계적인 목표와 계획을 제안받을 수 있습니다.
            {useCollaborative && !reportId && ' 협업 모드를 사용하려면 먼저 보고서를 저장해주세요.'}
          </div>
        </div>

        <div className="form-section">
          <h3>⚠️ 이슈 및 고민사항</h3>
          <div className="form-group">
            <label>이슈 및 고민사항</label>
            {useCollaborative && reportId ? (
              <div>
                <CollaborativeEditor
                  reportId={reportId}
                  field="issues"
                  initialContent={issues}
                  onChange={setIssues}
                  disabled={false}
                />
                <div className="collaboration-status">
                  🚀 실시간 협업 모드: 이슈 및 해결방안을 팀원들과 함께 논의
                </div>
              </div>
            ) : (
              <>
                <textarea 
                  className="form-textarea issues-textarea" 
                  value={issues} 
                  onChange={e => setIssues(e.target.value)}
                  placeholder="현재 겪고 있는 이슈나 고민사항을 입력해주세요...
Ex)
• API 응답 속도 개선 필요
• 팀원 간 커뮤니케이션 이슈
• 기술적 난이도로 인한 일정 지연 우려"
                />
                <div className="form-hint">
                  {useCollaborative && !reportId ? '⚠️ 협업 모드를 사용하려면 먼저 보고서를 저장해주세요.' : '이슈와 고민사항을 어려워하지 말고 손등하게 작성해주세요. 팀의 성장에 도움이 됩니다.'}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="form-section">
          <h3>⏰ 일정 관리</h3>
          <div className="form-group">
            <label>마감일</label>
            <input 
              className="form-input" 
              type="datetime-local" 
              value={dueAt} 
              onChange={e => setDueAt(e.target.value)}
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button"
            onClick={() => teamId ? nav(`/teams/${teamId}#reports`) : nav('/teams')}
            className="btn-cancel"
          >
            취소
          </button>
          <button 
            className="btn-submit"
            disabled={!teamId || (!shortTermGoals.trim() && !longTermGoals.trim() && !actionPlans.trim())}
          >
            💾 보고서 저장
          </button>
        </div>
      </form>

      {!selectedTeam && teamId && (
        <div className="warning-message">
          ⚠️ 팀을 선택하면 AI 어시스턴트를 사용할 수 있습니다.
        </div>
      )}
    </div>
  );
}