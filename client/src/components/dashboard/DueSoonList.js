import React from 'react';
export default function DueSoonList({ items = [] }){
  return (
    <div className="card">
      <h3 style={{ marginTop:0 }}>임박 마감</h3>
      {!items.length ? (
        <div>임박 마감이 없습니다.</div>
      ) : (
        <table className="table">
          <thead>
            <tr><th>팀</th><th>마감일</th><th>완료율</th></tr>
          </thead>
          <tbody>
            {items.map(r=> (
              <tr key={r._id}>
                <td>{String(r.team)}</td>
                <td>{new Date(r.dueAt).toLocaleString()}</td>
                <td>{r.progress}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}