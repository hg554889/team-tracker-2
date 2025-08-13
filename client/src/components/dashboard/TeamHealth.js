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

export default function TeamHealth({ data, loading }){
  if (loading) return <div className="card skeleton" style={{ height:240 }} />;
  
  return (
    <div className="card">
      <h3>팀 건강도</h3>
      <div style={{ marginTop:12 }}>
        {data.map(row => (
          <div key={row._id} style={{ display:'flex', marginBottom:8 }}>
            <div style={{ flex:1 }}>{row.team}</div> {/* team._id 대신 team 사용 */}
            <div>{row.avgProgress}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}