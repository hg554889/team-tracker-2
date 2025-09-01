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
  const [goals, setGoals] = useState('');
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
    if (template.goals) setGoals(template.goals);
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

  // AI 목표 제안 적용
  const handleGoalsSuggested = (suggestions) => {
    let suggestedGoals = '';
    
    if (suggestions.shortTermGoals) {
      suggestedGoals += '🎯 단기 목표:\n';
      suggestions.shortTermGoals.forEach((goal, index) => {
        suggestedGoals += `${index + 1}. ${goal}\n`;
      });
      suggestedGoals += '\n';
    }
    
    if (suggestions.keyMilestones) {
      suggestedGoals += '🏃 핵심 마일스톤:\n';
      suggestions.keyMilestones.forEach((milestone, index) => {
        suggestedGoals += `${index + 1}. ${milestone}\n`;
      });
    }
    
    setGoals(suggestedGoals);
    
    window.dispatchEvent(new CustomEvent('toast', {
      detail: { type: 'info', msg: 'AI 제안 목표가 적용되었습니다. 팀 상황에 맞게 수정해주세요.' }
    }));
  };

  async function submit(e){
    e.preventDefault();
    try{
      const payload = {
        teamId,
        weekOf: new Date().toISOString(), // 현재 시간으로 설정하여 고유성 보장
        progress: Number(progress),
        goals,
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

        <div className="collaboration-toggle">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={useCollaborative}
              onChange={(e) => setUseCollaborative(e.target.checked)}
            />
            <span className="checkmark"></span>
            <span className="label-text">
              <strong>실시간 협업 편집 사용</strong>
              <small>팀원들과 함께 보고서를 작성할 수 있습니다</small>
            </span>
          </label>
        </div>

        <div className="form-section">
          <h3>🎯 목표 및 계획</h3>
          <div className="form-group">
            <label>목표 *</label>
            {useCollaborative && reportId ? (
              <div>
                <CollaborativeEditor
                  reportId={reportId}
                  initialContent={goals}
                  onChange={setGoals}
                  disabled={false}
                />
                <div className="form-hint">
                  💡 팀원들과 실시간으로 협업하여 목표를 작성할 수 있습니다.
                </div>
              </div>
            ) : (
              <>
                <textarea 
                  className="form-textarea" 
                  value={goals} 
                  onChange={e => setGoals(e.target.value)}
                  placeholder="이번 주 목표를 구체적으로 입력해주세요...
Ex) 
• 사용자 인증 기능 개발 완료
• 데이터베이스 설계 및 구현
• UI/UX 디자인 시안 3개 제작"
                  required
                />
                <div className="form-hint">
                  💡 AI 어시스턴트를 활용하면 팀과 프로젝트에 맞는 목표를 제안받을 수 있습니다.
                  {!reportId && ' (보고서 저장 후 협업 편집 가능)'}
                </div>
              </>
            )}
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
                  initialContent={issues}
                  onChange={setIssues}
                  disabled={false}
                />
                <div className="form-hint">
                  💡 팀원들과 함께 이슈를 공유하고 해결방안을 논의할 수 있습니다.
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
                  {!reportId && '보고서 저장 후 협업 편집을 활용할 수 있습니다.'}
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
            disabled={!teamId || !goals.trim()}
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