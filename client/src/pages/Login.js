import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Login(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const { setUser } = useAuth();
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    try {
      const res = await login({ email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      
      const user = res.data.user;
      if (user.approvalStatus === 'pending') {
        nav('/approval-pending');
      } else if (user.approvalStatus === 'rejected') {
        window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'계정이 거절되었습니다. 관리자에게 문의하세요.'} }));
        localStorage.removeItem('token');
        setUser(null);
        return;
      } else {
        nav(user.clubId ? '/' : '/select-club');
        window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'로그인 성공'} }));
      }
    } catch {}
  }

  return (
    <div className="container" style={{ maxWidth:420 }}>
      <h1>로그인</h1>
      <form onSubmit={submit} className="card" style={{ display:'grid', gap:12 }}>
        <label>이메일<br/><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>비밀번호<br/><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button className="btn primary">로그인</button>
        <div>계정이 없나요? <Link to="/signup">가입하기</Link></div>
      </form>
    </div>
  );
}