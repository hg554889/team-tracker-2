import React from 'react';

// 간단한 클라이언트 로컬 피드(서버 연동 전)
export default function ActivityFeed(){
  const [items,setItems] = React.useState([]);

  React.useEffect(()=>{
    const push = (type, msg) => setItems(prev=> [{ id:Date.now()+Math.random(), ts:new Date(), type, msg }, ...prev].slice(0,10));
    const hToast = (e)=>{ push('notice', e.detail?.msg || '작업 완료'); };

    window.addEventListener('toast', hToast);
    return ()=>{
      window.removeEventListener('toast', hToast);
    };
  },[]);

  return (
    <div className="card">
      <h3 style={{ marginTop:0 }}>최근 활동</h3>
      {!items.length ? <div>최근 활동이 없습니다.</div> : (
        <ul style={{ paddingLeft:16, margin:0 }}>
          {items.map(it=> (
            <li key={it.id}>
              <span style={{ color:'var(--muted)' }}>{it.ts.toLocaleTimeString()} · </span>
              {it.msg}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}