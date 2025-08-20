import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getReport, updateReport, addComment } from '../api/reports';
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

  if (loading) return (
    <div className="report-detail-container">
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>보고서를 불러오는 중...</p>
      </div>
    </div>
  );
  
  if (report === null) return (
    <div className="report-detail-container">
      <div className="error-state">
        <div className="error-icon">📝</div>
        <h2>보고서를 찾을 수 없습니다</h2>
        <p>요청한 보고서가 존재하지 않거나 접근 권한이 없습니다.</p>
        <button className="btn-back" onClick={() => nav(-1)}>뒤로 가기</button>
      </div>
    </div>
  );

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
    <div className="report-detail-container">
      <div className="report-header">
        <div className="header-content">
          <div className="report-meta">
            <h1>📊 보고서 상세</h1>
            <div className="report-info">
              <span className="team-badge">{report.team?.name || '알 수 없는 팀'}</span>
              <span className="date-info">{new Date(report.weekOf).toLocaleDateString()} 주차</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-secondary" onClick={()=> nav(-1)}>
              ← 뒤로
            </button>
            <Link className="btn-secondary" to={`/teams/${report.team?._id}`}>
              팀 보기
            </Link>
            {canEdit && !edit && (
              <button className="btn-primary" onClick={()=> setEdit(true)}>
                ✏️ 수정
              </button>
            )}
            {canEdit && edit && (
              <>
                <button className="btn-secondary" onClick={()=> setEdit(false)}>
                  취소
                </button>
                <button className="btn-primary" onClick={save}>
                  💾 저장
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
                <h3>📈 진행 현황</h3>
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
                <h3>🎯 목표</h3>
                <div className="content-display">
                  {report.goals ? (
                    <pre className="content-text">{report.goals}</pre>
                  ) : (
                    <div className="empty-content">설정된 목표가 없습니다.</div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>⚠️ 이슈 및 고민사항</h3>
                <div className="content-display">
                  {report.issues ? (
                    <pre className="content-text">{report.issues}</pre>
                  ) : (
                    <div className="empty-content">등록된 이슈가 없습니다.</div>
                  )}
                </div>
              </div>

              <div className="info-section">
                <h3>⏰ 마감일</h3>
                <div className="content-display">
                  {report.dueAt ? (
                    <div className="due-date">{new Date(report.dueAt).toLocaleString()}</div>
                  ) : (
                    <div className="empty-content">마감일이 설정되지 않음</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="edit-form">
              <div className="form-group">
                <label>진행률 (%)</label>
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
                  placeholder="목표를 입력하세요..."
                />
              </div>
              
              <div className="form-group">
                <label>이슈 및 고민사항</label>
                <textarea 
                  className="form-textarea" 
                  value={issues} 
                  onChange={e=>setIssues(e.target.value)}
                  placeholder="이슈나 고민사항을 입력하세요..."
                />
              </div>
              
              <div className="form-group">
                <label>마감일</label>
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
              <h3>📎 첨부파일</h3>
              <div className="attachments-list">
                {report.attachments.map((f,i)=> (
                  <a key={i} href={f.url} target="_blank" rel="noreferrer" className="attachment-item">
                    📄 {f.name||f.url}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="comments-section">
        <div className="comments-header">
          <h3>💬 코멘트</h3>
          <span className="comments-count">{report.comments?.length || 0}개</span>
        </div>
        
        <div className="comments-list">
          {report.comments?.length ? (
            report.comments.map(c=> (
              <div key={c._id} className="comment-item">
                <div className="comment-header">
                  <span className="comment-author">{c.author?.username||'익명'}</span>
                  <span className="comment-date">{new Date(c.createdAt||c.updatedAt).toLocaleString()}</span>
                </div>
                <div className="comment-text">{c.text}</div>
              </div>
            ))
          ) : (
            <div className="no-comments">
              💭 아직 코멘트가 없습니다. 첫 번째 코멘트를 남겨보세요!
            </div>
          )}
        </div>

        <div className="comment-form">
          <textarea 
            className="comment-input" 
            placeholder="코멘트를 입력하세요..."
            value={comment} 
            onChange={e=>setComment(e.target.value)}
          />
          <div className="comment-actions">
            <button 
              className="btn-submit-comment" 
              disabled={!comment.trim() || posting} 
              onClick={postComment}
            >
              {posting ? '등록 중...' : '📝 코멘트 등록'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}