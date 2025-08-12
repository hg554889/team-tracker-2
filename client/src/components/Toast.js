import React from 'react';
export default function Toast(){
  const [msg,setMsg] = React.useState(null);
  React.useEffect(()=>{
    const h = (e)=>{ setMsg(e.detail.msg); const t=setTimeout(()=>setMsg(null),2500); return ()=>clearTimeout(t); };
    window.addEventListener('toast', h);
    return ()=>window.removeEventListener('toast', h);
  },[]);
  if (!msg) return null;
  return <div className="toast">{msg}</div>;
}