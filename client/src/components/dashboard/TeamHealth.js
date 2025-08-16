import React from 'react';

function Spark({ value = 0 }){
  // 단순 막대형 미니 스파크 (0~100)
  const v = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:8, borderRadius:8, background:'#eef1f4', overflow:'hidden' }}>
        <div style={{ width: v+'%', height:'100%', background:'var(--primary)', transition:'width .3s' }} />
      </div>
      <div style={{ width:42, textAlign:'right' }}>{v}%</div>
    </div>
  );
}

export default function TeamHealth({ userId, healthRows = [], loading = false }) {
  if (loading) {
    return (
      <div className="card">
        <h3>팀 건강도</h3>
        <div>로딩 중...</div>
      </div>
    );
  }

  if (!healthRows?.length) {
    return (
      <div className="card">
        <h3>팀 건강도</h3>
        <div>표시할 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>팀 건강도</h3>
      <div>
        {healthRows.map(row => (
          <div key={row._id}>
            <span>{row.team}</span>
            <span>{row.avgProgress}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}