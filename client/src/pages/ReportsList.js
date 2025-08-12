import React, { useEffect, useMemo, useState } from 'react';
import { listReports } from '../api/reports';
import { listTeams } from '../api/teams';
import { useSearchParams, Link } from 'react-router-dom';

export default function ReportsList(){
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const page = Number(params.get('page') || 1);
  const teamId = params.get('teamId') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const limit = 10;

  useEffect(()=>{ (async()=>{
    const [tRes, rRes] = await Promise.all([
      listTeams({ scope: 'mine' }),                // 내가 볼 수 있는 팀
      listReports({ teamId: teamId || undefined, page, limit, from: from || undefined, to: to || undefined })
    ]);
    setTeams(tRes.data.items || []);
    setRows(rRes.data || { items:[], total:0, page:1, limit });
    setLoading(false);
  })(); }, [teamId, page, from, to]); // eslint-disable-line

  const teamMap = useMemo(()=> {
    const m = {}; (teams||[]).forEach(t => m[t._id] = t.name); return m;
  }, [teams]);

  function updateQuery(next){
    const q = new URLSearchParams(params.toString());
    Object.entries(next).forEach(([k,v])=>{
      if (v === '' || v === undefined || v === null) q.delete(k);
      else q.set(k, v);
    });
    setParams(q);
  }

  const total = rows.total || 0;
  const maxPage = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="container">
      <h1>보고서 목록</h1>

      {/* 필터 */}
      <div className="card" style={{ display:'grid', gap:12, marginBottom:16 }}>
        <div className="grid cols-3">
          <label>팀<br/>
            <select className="input" value={teamId} onChange={e=>updateQuery({ teamId: e.target.value || undefined, page: 1 })}>
              <option value="">전체</option>
              {teams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
            </select>
          </label>
          <label>시작일(이후)<br/><input className="input" type="date" value={from} onChange={e=>updateQuery({ from: e.target.value || undefined, page: 1 })} /></label>
          <label>종료일(이전)<br/><input className="input" type="date" value={to} onChange={e=>updateQuery({ to: e.target.value || undefined, page: 1 })} /></label>
        </div>
      </div>

      {/* 목록 */}
      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height: 160 }} />
        ) : (rows.items||[]).length === 0 ? (
          <div>보고서가 없습니다.</div>
        ) : (
          <table className="table">
             <thead>
                <tr>
                  <th>보고서</th>
                  <th>팀</th>
                  <th>주차</th>
                  <th>진행률</th>
                  <th>마감일</th>
                </tr>
              </thead>
            <tbody>
               {rows.items.map(r => (
               <tr key={r._id}>
                <td>
                   {/* ✅ 보고서 상세로 이동 */}
                   <Link to={`/reports/${r._id}`}>{new Date(r.weekOf).toLocaleDateString()} 보고서</Link>
                </td>
                <td>{teamMap[r.team] || r.team}</td>
                <td>{new Date(r.weekOf).toLocaleDateString()}</td>
                <td>{r.progress}%</td>
                <td>{r.dueAt ? new Date(r.dueAt).toLocaleDateString() : '-'}</td>
               </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      <div style={{ display:'flex', gap:8, marginTop:12 }}>
        <button className="btn" disabled={page<=1} onClick={()=>updateQuery({ page: page-1 })}>이전</button>
        <div style={{ alignSelf:'center', color:'var(--muted)' }}>{page} / {maxPage}</div>
        <button className="btn" disabled={page>=maxPage} onClick={()=>updateQuery({ page: page+1 })}>다음</button>
      </div>
    </div>
  );
}
