import React from 'react';
export default function KPIGroup({ items = [] }){
  return (
    <div className="grid cols-4">
      {items.map((k, i)=> (
        <div className="card kpi" key={i}>
          <div className="value">{k.value}</div>
          <div style={{ color:'var(--muted)' }}>{k.label}</div>
        </div>
      ))}
    </div>
  );
}