import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api/auth';
import { listClubs } from '../api/clubs';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Signup(){
  const [email,setEmail] = useState('');
  const [username,setUsername] = useState('');
  const [password,setPassword] = useState('');
  const [studentId,setStudentId] = useState('');
  const [clubId,setClubId] = useState('');
  const [clubs,setClubs] = useState([]);
  const { setUser } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const { data } = await listClubs();
        setClubs(data);
      } catch (error) {
        console.error('Failed to load clubs:', error);
      }
    })();
  }, []);

  async function submit(e){
    e.preventDefault();
    
    if (!clubId) {
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'동아리를 선택해주세요.'} }));
      return;
    }
    
    try {
      const res = await signup({ email, username, password, studentId: parseInt(studentId), clubId });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.user);
      
      nav('/approval-pending');
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'info', msg:'가입 요청이 전송되었습니다. 동아리 관리자의 승인을 기다려주세요.'} }));
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
              <label>동아리</label>
              <select 
                className="auth-input" 
                value={clubId}
                onChange={e=>setClubId(e.target.value)}
                required
              >
                <option value="">동아리를 선택하세요</option>
                {clubs.map(club => (
                  <option key={club.key} value={club.key}>
                    {club.name}
                  </option>
                ))}
              </select>
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