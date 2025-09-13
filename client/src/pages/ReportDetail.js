import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReport, updateReport, addComment, deleteReport } from '../api/reports';
import { useAuth } from '../contexts/AuthContext';
import './ReportDetail.css';

export default function ReportDetail(){
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  const [report, setReport] = useState();
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState(false);
  const [progress, setProgress] = useState(0);
  const [goals, setGoals] = useState('');
  const [shortTermGoals, setShortTermGoals] = useState('');
  const [actionPlans, setActionPlans] = useState('');
  const [milestones, setMilestones] = useState('');
  const [issues, setIssues] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function load(){
    setLoading(true);
    try{
      const { data } = await getReport(id);
      setReport(data);
      setProgress(data.progress ?? 0);
      setGoals(data.goals ?? '');
      setShortTermGoals(data.shortTermGoals ?? '');
      setActionPlans(data.actionPlans ?? '');
      setMilestones(data.milestones ?? '');
      setIssues(data.issues ?? '');
      setDueAt(data.dueAt ? new Date(data.dueAt).toISOString().slice(0,16) : '');
    }catch{ setReport(null); } finally{ setLoading(false); }
  }
  useEffect(()=>{ load(); },[id]);

  if (loading) return (
    <div className="report-detail-container">
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>보고?��? 불러?�는 �?..</p>
      </div>
    </div>
  );
  
  if (report === null) return (
    <div className="report-detail-container">
      <div className="error-state">
        <div className="error-icon">?��</div>
        <h2>보고?��? 찾을 ???�습?�다</h2>
        <p>?�청??보고?��? 존재?��? ?�거???�근 권한???�습?�다.</p>
        <button className="btn-back" onClick={() => nav(-1)}>?�로 가�?/button>
      </div>
    </div>
  );

  const canEdit = user?.role==='ADMIN' || user?._id===report?.author;

  async function save(){
    await updateReport(report._id, {
      progress: Number(progress),
      goals,
      shortTermGoals,
      actionPlans,
      milestones,
      issues,
      dueAt: dueAt ? new Date(dueAt).toISOString() : undefined
    });
    setEdit(false);
    await load();
    window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'?�정?�었?�니??'} }));
  }
  async function postComment(){
    if (!comment.trim()) return;
    setPosting(true);
    try{ await addComment(report._id, comment.trim()); setComment(''); await load(); }
    finally{ setPosting(false); }
  }
  async function handleDelete(){
    if (!window.confirm('?�말�???보고?��? ??��?�시겠습?�까?')) return;
    setDeleting(true);
    try{ 
      await deleteReport(report._id); 
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'보고?��? ??��?�었?�니??'} }));
      nav(-1);
    }
    catch(e){ 
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'??�� �??�류가 발생?�습?�다.'} }));
    }
    finally{ setDeleting(false); }
  }

  return (
    <div className="report-detail-container">
      <div className="report-header">
        <div className="header-content">
          <div className="report-meta">
            <h1>?�� 보고???�세</h1>
            <div className="report-info">
              <span className="team-badge">{report.team?.name || '?????�는 ?�'}</span>
              <span className="date-info">{new Date(report.weekOf).toLocaleDateString()} 주차</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={()=> nav(`/teams/${report.team?._id}#reports`)}>
              ???�로
            </button>
            {canEdit && !edit && (
              <>
                <button className="btn-primary" onClick={()=> setEdit(true)}>
                  ?�️ ?�정
                </button>
                <button className="btn-danger" onClick={handleDelete} disabled={deleting}>
                  {deleting ? '??�� �?..' : '?���???��'}
                </button>
              </>
            )}
            {canEdit && edit && (
              <>
                <button className="btn-secondary" onClick={()=> setEdit(false)}>
                  취소
                </button>
                <button className="btn-primary" onClick={save}>
                  ?�� ?�??
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="report-content">
        <div className="report-main">
          {!edit ? (
            <>
              <div className="info-section">
                <h3>?�� 진행 ?�황</h3>
                <div className="progress-display">
                  <div className="progress-bar-large">
                    <div 
                      className={`progress-fill-large ${report.progress >= 80 ? 'high' : report.progress >= 50 ? 'medium' : 'low'}`}
                      style={{ width: `${report.progress}%` }}
                    />
                  </div>
                  <span className={`progress-text-large ${report.progress >= 80 ? 'high' : report.progress >= 50 ? 'medium' : 'low'}`}>
                    {report.progress}%
                  </span>
                </div>
              </div>

              <div className="info-section">
                <h3>�̹� �� ��ǥ</h3>
                <div className="content-display">
                  {report.shortTermGoals ? (
                    <pre className="content-text">{report.shortTermGoals}</pre>
                  ) : (
                    <div className="empty-content">��ϵ� ��ǥ�� �����ϴ�.</div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>���� ��ȹ</h3>
                <div className="content-display">
                  {report.actionPlans ? (
                    <pre className="content-text">{report.actionPlans}</pre>
                  ) : (
                    <div className="empty-content">��ϵ� ���� ��ȹ�� �����ϴ�.</div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>�ֿ� ���Ͻ���</h3>
                <div className="content-display">
                  {report.milestones ? (
                    <pre className="content-text">{report.milestones}</pre>
                  ) : (
                    <div className="empty-content">��ϵ� ���Ͻ����� �����ϴ�.</div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>?�️ ?�슈 �?고�??�항</h3>
                <div className="content-display">
                  {report.issues ? (
                    <pre className="content-text">{report.issues}</pre>
                  ) : (
                    <div className="empty-content">?�록???�슈가 ?�습?�다.</div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>??마감??/h3>
                <div className="content-display">
                  {report.dueAt ? (
                    <div className="due-date">{new Date(report.dueAt).toLocaleString()}</div>
                  ) : (
                    <div className="empty-content">마감?�이 ?�정?��? ?�음</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="edit-form">
              <div className="form-group">
                <label>진행�?(%)</label>
                <div className="progress-input-container">
                  <input 
                    className="form-input progress-input" 
                    type="number" 
                    min={0} 
                    max={100} 
                    value={progress} 
                    onChange={e=>setProgress(e.target.value)}
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
              
              <div className="form-group">
                <label>목표</label>
                <textarea 
                  className="form-textarea" 
                  value={goals} 
                  onChange={e=>setGoals(e.target.value)}
                  placeholder="목표�??�력?�세??.."
                />
              </div>
              
              <div className="form-group">
                <label>?�슈 �?고�??�항</label>
                <textarea 
                  className="form-textarea" 
                  value={issues} 
                  onChange={e=>setIssues(e.target.value)}
                  placeholder="?�슈??고�??�항???�력?�세??.."
                />
              </div>
              
              <div className="form-group">
                <label>마감??/label>
                <input 
                  className="form-input" 
                  type="datetime-local" 
                  value={dueAt} 
                  onChange={e=>setDueAt(e.target.value)}
                />
              </div>
            </div>
          )}
          
          {!!(report.attachments?.length) && (
            <div className="info-section">
              <h3>?�� 첨�??�일</h3>
              <div className="attachments-list">
                {report.attachments.map((f,i)=> (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" className="attachment-item">
                    ?�� {f.name||f.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="comments-section">
        <div className="comments-header">
          <h3>?�� 코멘??/h3>
          <span className="comments-count">{report.comments?.length || 0}�?/span>
        </div>
        
        <div className="comments-list">
          {report.comments?.length ? (
            report.comments.map(c=> (
              <div key={c._id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{c.author?.username||'?�명'}</span>
                  <span className="comment-date">{new Date(c.createdAt||c.updatedAt).toLocaleString()}</span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            ))
          ) : (
            <div className="no-comments">
              ?�� ?�직 코멘?��? ?�습?�다. �?번째 코멘?��? ?�겨보세??
            </div>
          )}
        </div>

        <div className="comment-form">
          <textarea 
            className="comment-input" 
            placeholder="코멘?��? ?�력?�세??.."
            value={comment} 
            onChange={e=>setComment(e.target.value)}
          />
          <div className="comment-actions">
            <button 
              className="btn-submit-comment" 
              disabled={!comment.trim() || posting} 
              onClick={postComment}
            >
              {posting ? '?�록 �?..' : '?�� 코멘???�록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
