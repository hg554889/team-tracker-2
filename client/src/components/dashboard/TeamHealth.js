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

export default function TeamHealth({ data = [] }){
  return (
    <div className="card">
      <h3 style={{ marginTop:0 }}>팀 건강도 (평균 완료율)</h3>
      {!data.length ? (
        <div>집계된 팀이 없습니다.</div>
      ) : (
        <div style={{ display:'grid', gap:12 }}>
          {data.map((t,i)=> (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 2fr', alignItems:'center', gap:12 }}>
              <div>팀 #{String(t._id).slice(-4)}</div>
              <Spark value={t.avgProgress} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}