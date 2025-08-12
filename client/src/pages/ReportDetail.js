import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReport, updateReport, addComment } from '../api/reports';
import { useAuth } from '../contexts/AuthContext';

export default function ReportDetail(){
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState();
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [progress, setProgress] = useState(0);
  const [goals, setGoals] = useState('');
  const [issues, setIssues] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  async function load(){
    setLoading(true);
    try{
      const { data } = await getReport(id);
      setReport(data);
      setProgress(data.progress ?? 0);
      setGoals(data.goals ?? '');
      setIssues(data.issues ?? '');
      setDueAt(data.dueAt ? new Date(data.dueAt).toISOString().slice(0,16) : '');
    }catch{ setReport(null); } finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); },[id]);

  if (loading) return <div className="container">로딩...</div>;
  if (report === null) return <div className="container"><div className="card">보고서를 찾을 수 없습니다.</div></div>;

  const canEdit = user?.role==='ADMIN' || user?._id===report?.author;

  async function save(){
    await updateReport(report._id, {
      progress: Number(progress),
      goals,
      issues,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined
    });
    setEdit(false);
    await load();
    window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'수정되었습니다.'} }));
  }
  async function postComment(){
    if (!comment.trim()) return;
    setPosting(true);
    try{ await addComment(report._id, comment.trim()); setComment(''); await load(); }
    finally{ setPosting(false); }
  }

  return (
    <div className="container" style={{ maxWidth:760 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1>보고서 상세</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={()=> nav(-1)}>뒤로</button>
          <Link className="btn" to={`/teams/${report.team?._id}`}>팀으로 이동</Link>
          {canEdit && !edit && <button className="btn" onClick={()=> setEdit(true)}>수정</button>}
          {canEdit && edit && (<><button className="btn" onClick={()=> setEdit(false)}>취소</button><button className="btn primary" onClick={save}>저장</button></>)}
        </div>
      </div>

      <div className="card" style={{ display:'grid', gap:12 }}>
        <div><b>팀</b><br/>{report.team?.name || '알 수 없는 팀'}</div>
        <div><b>주차</b><br/>{new Date(report.weekOf).toLocaleString()}</div>
        {!edit ? (
          <>
            <div><b>진행률</b><br/>{report.progress}%</div>
            <div><b>목표</b><br/>{report.goals || '-'}</div>
            <div><b>이슈</b><br/>{report.issues || '-'}</div>
            <div><b>마감일</b><br/>{report.dueAt ? new Date(report.dueAt).toLocaleString() : '-'}</div>
          </>
        ) : (
          <>
            <label><b>진행률</b><br/><input className="input" type="number" min={0} max={100} value={progress} onChange={e=>setProgress(e.target.value)} /></label>
            <label><b>목표</b><br/><textarea className="input" value={goals} onChange={e=>setGoals(e.target.value)} /></label>
            <label><b>이슈</b><br/><textarea className="input" value={issues} onChange={e=>setIssues(e.target.value)} /></label>
            <label><b>마감일</b><br/><input className="input" type="datetime-local" value={dueAt} onChange={e=>setDueAt(e.target.value)} /></label>
          </>
        )}
        {!!(report.attachments?.length) && (
          <div><b>첨부</b>
            <ul style={{ marginTop:8 }}>
              {report.attachments.map((f,i)=> <li key={i}><a href={f.url} target="_blank" rel="noreferrer">{f.name||f.url}</a></li>)}
            </ul>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop:16 }}>
        <h3 style={{ margin:0 }}>코멘트</h3>
        {report.comments?.length ? (
          <ul style={{ marginTop:8 }}>
            {report.comments.map(c=> (
              <li key={c._id} style={{ padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:13, color:'var(--muted)' }}>{c.author?.username||'익명'} · {new Date(c.createdAt||c.updatedAt).toLocaleString()}</div>
                <div style={{ whiteSpace:'pre-wrap' }}>{c.text}</div>
              </li>
            ))}
          </ul>
        ) : <div>아직 코멘트가 없습니다.</div>}

        <div style={{ display:'grid', gap:8, marginTop:12 }}>
          <textarea className="input" placeholder="코멘트를 입력하세요" value={comment} onChange={e=>setComment(e.target.value)} />
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn primary" disabled={!comment.trim() || posting} onClick={postComment}>
              {posting ? '등록 중...' : '등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
