import React, { useEffect, useState } from 'react';
import { listTeams } from '../api/teams';
import { createOrUpdateReport } from '../api/reports';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ReportForm(){
  const [teams,setTeams]=useState([]);
  const [teamId,setTeamId]=useState('');
  const [weekOf,setWeekOf]=useState('');
  const [progress,setProgress]=useState(0);
  const [goals,setGoals]=useState('');
  const [issues,setIssues]=useState('');
  const [dueAt,setDueAt]=useState('');
  const [done,setDone]=useState(false);
  const loc = useLocation();
  const nav = useNavigate();

  useEffect(()=>{ (async()=>{
    const { data } = await listTeams({ scope: 'mine' });
    setTeams(data.items);
    const preset = loc.state?.teamId; 
    if (preset) setTeamId(preset);
    if (!weekOf) setWeekOf(new Date().toISOString().slice(0,10));
  })(); },[loc.state]); // eslint-disable-line

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

  return (
    <div className="container" style={{ maxWidth:720 }}>
      <h1>보고서 작성</h1>
      <form onSubmit={submit} className="card" style={{ display:'grid', gap:12 }}>
        <label>팀<br/>
          <select className="input" value={teamId} onChange={e=>setTeamId(e.target.value)} required>
            <option value="">선택</option>
            {teams.map(t=> <option key={t._id} value={t._id}>{t.name}</option>)}
          </select>
        </label>
        <label>주차 시작일<br/><input className="input" type="date" value={weekOf} onChange={e=>setWeekOf(e.target.value)} required /></label>
        <label>완료율(%)<br/><input className="input" type="number" min={0} max={100} value={progress} onChange={e=>setProgress(e.target.value)} /></label>
        <label>목표<br/><textarea className="input" value={goals} onChange={e=>setGoals(e.target.value)} /></label>
        <label>이슈<br/><textarea className="input" value={issues} onChange={e=>setIssues(e.target.value)} /></label>
        <label>마감일<br/><input className="input" type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} /></label>
        <button className="btn primary">저장</button>
      </form>
    </div>
  );
}
