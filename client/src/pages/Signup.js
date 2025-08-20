import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

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
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <h1>Team Tracker</h1>
            </div>
            <h2>회원가입</h2>
            <p>새 계정을 만들어 Team Tracker를 시작하세요</p>
          </div>
          
          <form onSubmit={submit} className="auth-form">
            <div className="form-group">
              <label>이메일</label>
              <input 
                className="auth-input" 
                type="email"
                value={email} 
                onChange={e=>setEmail(e.target.value)}
                placeholder="이메일을 입력하세요"
                required
              />
            </div>
            
            <div className="form-group">
              <label>사용자명</label>
              <input 
                className="auth-input" 
                type="text"
                value={username} 
                onChange={e=>setUsername(e.target.value)}
                placeholder="사용자명을 입력하세요"
                required
              />
            </div>
            
            <div className="form-group">
              <label>학번</label>
              <input 
                className="auth-input" 
                type="number"
                value={studentId} 
                onChange={e=>setStudentId(e.target.value)}
                placeholder="예: 20241234"
                required
              />
            </div>
            
            <div className="form-group">
              <label>비밀번호</label>
              <input 
                className="auth-input" 
                type="password" 
                value={password} 
                onChange={e=>setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>
            
            <button className="auth-button" type="submit">
              가입하기
            </button>
            
            <div className="auth-footer">
              <p>이미 계정이 있나요? <Link to="/login" className="auth-link">로그인</Link></p>
              <p><Link to="/" className="auth-link">← 홈으로 돌아가기</Link></p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}