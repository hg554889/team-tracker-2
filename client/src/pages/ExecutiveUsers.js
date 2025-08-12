import React, { useEffect, useState } from 'react';
import { listUsers } from '../api/users';

export default function ExecutiveUsers(){
  const [users,setUsers]=useState([]);
  useEffect(()=>{ (async()=>{ const { data } = await listUsers(); setUsers(data); })(); },[]);
  return (
    <div className="container">
      <h1>EXECUTIVE · 구성원</h1>
      <div className="card">
        <table className="table">
          <thead><tr><th>이름</th><th>이메일</th><th>소속 동아리</th><th>권한</th></tr></thead>
          <tbody>
            {users.map(u=> (
              <tr key={u._id}>
                <td>{u.username}</td>
                <td>{u.email}</td>
                <td>{u.clubId}</td>
                <td>{u.role === 'HIDDEN' ? '—' : u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}