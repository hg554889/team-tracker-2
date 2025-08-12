import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions({ role }){
  const nav = useNavigate();
  const actions = [
    { label:'보고서 작성', onClick: ()=> nav('/reports/new') },
    { label:'팀 만들기', onClick: ()=> nav('/teams') },
  ];
  if (role === 'ADMIN') actions.push({ label:'사용자 관리', onClick: ()=> nav('/admin/users') });
  if (role === 'EXECUTIVE') actions.push({ label:'구성원 보기', onClick: ()=> nav('/executive/users') });

  return (
    <div className="card">
      <h3 style={{ marginTop:0 }}>빠른 실행</h3>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        {actions.map((a,i)=> <button key={i} className="btn" onClick={a.onClick}>{a.label}</button>)}
      </div>
    </div>
  );
}