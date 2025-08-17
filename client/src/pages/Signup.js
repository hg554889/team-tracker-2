import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';

export default function Signup(){
  const [email,setEmail] = useState('');
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [studentId,setStudentId] = useState('');
  const { setUser } = useAuth();
  const nav = useNavigate();

  async function submit(e){
    e.preventDefault();
    try {
      const res = await signup({ email, username, password, studentId: parseInt(studentId) });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      
      if (res.data.user.approvalStatus === 'pending') {
        nav('/approval-pending');
        window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'info', msg:'가입 요청이 전송되었습니다. 관리자 승인을 기다려주세요.'} }));
      } else {
        nav('/select-club');
        window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'가입 성공'} }));
      }
    } catch (err) {
      if (err.response?.status === 409) nav('/login');
    }
  }

  return (
    <div className="container" style={{ maxWidth:420 }}>
      <h1>회원가입</h1>
      <form onSubmit={submit} className="card" style={{ display:'grid', gap:12 }}>
        <label>이메일<br/><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label>사용자명<br/><input className="input" value={username} onChange={e=>setUsername(e.target.value)} /></label>
        <label>학번<br/><input className="input" type="number" value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="예: 20241234" /></label>
        <label>비밀번호<br/><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} /></label>
        <button className="btn primary">가입</button>
        <div>이미 계정이 있나요? <Link to="/login">로그인</Link></div>
      </form>
    </div>
  );
}