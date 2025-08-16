import React, { useEffect, useState } from 'react';
import { listTeams } from '../api/teams';
import { createOrUpdateReport } from '../api/reports';
import { useLocation, useNavigate } from 'react-router-dom';
import AIAssistant from '../components/AIAssistant';

export default function ReportForm(){
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [teamId, setTeamId] = useState('');
  const [weekOf, setWeekOf] = useState('');
  const [progress, setProgress] = useState(0);
  const [goals, setGoals] = useState('');
  const [issues, setIssues] = useState('');
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
        weekOf: new Date(weekOf).toISOString(),
        progress: Number(progress),
        goals,
        issues,
        dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
      };
      await createOrUpdateReport(payload);
      setDone(true);
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'보고서 저장 완료'} }));
      window.dispatchEvent(new CustomEvent('report:saved', { detail: { teamId } }));
      nav(`/teams/${teamId}`, { replace:true });
    }catch(err){
      console.log('server says:', err.response?.data);
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'저장 실패'} }));
    }
  }

  if (done) return <div className="container"><div className="card">보고서가 저장되었습니다.</div></div>

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
    <div className="container" style={{ maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h1>보고서 작성</h1>
        <button
          onClick={() => setShowAI(!showAI)}
          className="btn"
          style={{
            background: showAI ? '#667eea' : '#f0f0f0',
            color: showAI ? 'white' : '#666',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          🤖 AI 어시스턴트 {showAI ? '숨기기' : '보기'}
        </button>
      </div>

      {/* AI 어시스턴트 */}
      {showAI && selectedTeam && (
        <AIAssistant
          teamId={teamId}
          currentProgress={progress}
          teamType={getTeamType(selectedTeam.name, selectedTeam.description)}
          projectCategory={getProjectCategory(selectedTeam.name, selectedTeam.description)}
          onTemplateGenerated={handleTemplateGenerated}
          onProgressPredicted={handleProgressPredicted}
          onGoalsSuggested={handleGoalsSuggested}
        />
      )}

      <form onSubmit={submit} className="card" style={{ display:'grid', gap:16 }}>
        <label>
          팀 *
          <br/>
          <select 
            className="input" 
            value={teamId} 
            onChange={handleTeamChange} 
            required
            style={{ marginTop: '4px' }}
          >
            <option value="">선택</option>
            {teams.map(t => (
              <option key={t._id} value={t._id}>
                {t.name}
                {t.description && ` - ${t.description.substring(0, 30)}${t.description.length > 30 ? '...' : ''}`}
              </option>
            ))}
          </select>
        </label>

        <label>
          주차 시작일 *
          <br/>
          <input 
            className="input" 
            type="date" 
            value={weekOf} 
            onChange={e => setWeekOf(e.target.value)} 
            required 
            style={{ marginTop: '4px' }}
          />
        </label>

        <label>
          완료율(%) *
          <br/>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <input 
              className="input" 
              type="number" 
              min={0} 
              max={100} 
              value={progress} 
              onChange={e => setProgress(e.target.value)}
              style={{ flex: 1 }}
            />
            <div style={{ 
              minWidth: '120px', 
              height: '8px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${progress}%`, 
                height: '100%', 
                backgroundColor: progress >= 80 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444',
                transition: 'all 0.3s ease'
              }} />
            </div>
            <span style={{ 
              fontSize: '14px', 
              fontWeight: '600',
              color: progress >= 80 ? '#10b981' : progress >= 50 ? '#f59e0b' : '#ef4444'
            }}>
              {progress}%
            </span>
          </div>
        </label>

        <label>
          목표 *
          <br/>
          <textarea 
            className="input" 
            value={goals} 
            onChange={e => setGoals(e.target.value)}
            placeholder="이번 주 목표를 구체적으로 입력해주세요..."
            style={{ 
              marginTop: '4px', 
              minHeight: '100px', 
              resize: 'vertical' 
            }}
            required
          />
          <small style={{ color: '#666', fontSize: '12px' }}>
            💡 AI 어시스턴트를 활용하면 팀과 프로젝트에 맞는 목표를 제안받을 수 있습니다.
          </small>
        </label>

        <label>
          이슈 및 고민사항
          <br/>
          <textarea 
            className="input" 
            value={issues} 
            onChange={e => setIssues(e.target.value)}
            placeholder="현재 겪고 있는 이슈나 고민사항을 입력해주세요..."
            style={{ 
              marginTop: '4px', 
              minHeight: '80px', 
              resize: 'vertical' 
            }}
          />
        </label>

        <label>
          마감일
          <br/>
          <input 
            className="input" 
            type="datetime-local" 
            value={dueAt} 
            onChange={e => setDueAt(e.target.value)}
            style={{ marginTop: '4px' }}
          />
        </label>

        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginTop: '8px' 
        }}>
          <button 
            type="button"
            onClick={() => nav('/teams')}
            className="btn"
            style={{ flex: 1 }}
          >
            취소
          </button>
          <button 
            className="btn primary" 
            style={{ flex: 2 }}
            disabled={!teamId || !goals.trim()}
          >
            💾 보고서 저장
          </button>
        </div>
      </form>

      {!selectedTeam && teamId && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          backgroundColor: '#fef3c7', 
          border: '1px solid #f59e0b',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          ⚠️ 팀을 선택하면 AI 어시스턴트를 사용할 수 있습니다.
        </div>
      )}
    </div>
  );
}