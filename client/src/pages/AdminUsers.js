import React, { useEffect, useState } from 'react';
import { listClubs } from '../api/clubs';
import { listUsers, adminUpdateUser } from '../api/users';

export default function AdminUsers(){
  const [clubs,setClubs]=useState([]);
  const [clubId,setClubId]=useState('');
  const [users,setUsers]=useState([]);
  const [q,setQ]=useState('');

  useEffect(()=>{ (async()=>{ const { data } = await listClubs(); setClubs(data); setClubId(data[0]?.key||''); })(); },[]);
  useEffect(()=>{ (async()=>{ if (clubId) { const { data } = await listUsers({ clubId, q }); setUsers(data); } })(); },[clubId, q]);

  async function save(u, idx){
    const role = document.getElementById(`role-${idx}`).value;
    const club = document.getElementById(`club-${idx}`).value;
    const { data } = await adminUpdateUser(u._id, { role, clubId: club });
    setUsers(prev=> prev.map(x=> x._id===u._id? data: x));
  }

  return (
    <div className="container">
      <h1>ADMIN · 사용자 관리</h1>
      <div className="card" style={{ display:'grid', gap:12 }}>
        <div style={{ display:'flex', gap:12 }}>
          <span>동아리</span>
          <select className="input" style={{ maxWidth:240 }} value={clubId} onChange={e=>setClubId(e.target.value)}>
            {clubs.map(c=> <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>
          <input className="input" placeholder="이름/이메일 검색" value={q} onChange={e=>setQ(e.target.value)} />
        </div>
      </div>

      <div className="card" style={{ marginTop:16 }}>
        <table className="table">
          <thead><tr><th>이름</th><th>이메일</th><th>소속 동아리</th><th>권한</th><th></th></tr></thead>
          <tbody>
            {users.map((u, idx)=> (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>
                  <select id={`club-${idx}`} defaultValue={u.clubId||''} className="input">
                    {clubs.map(c=> <option key={c.key} value={c.key}>{c.name}</option>)}
                  </select>
                </td>
                <td>
                  <select id={`role-${idx}`} defaultValue={u.role} className="input">
                    {['ADMIN','EXECUTIVE','LEADER','MEMBER'].map(r=> <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td><button className="btn" onClick={()=>save(u, idx)}>저장</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}