import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateUserInfo } from '../api/approvals';

export default function ApprovalPending() {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdateInfo = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await updateUserInfo({ 
        username: username.trim(), 
        studentId: parseInt(studentId) 
      });
      
      setUser(res.data.user);
      setIsEditing(false);
      
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '정보가 업데이트되었습니다.' } 
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.error === 'StudentIdInUse' 
        ? '이미 사용 중인 학번입니다.' 
        : '정보 업데이트에 실패했습니다.';
      
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: errorMsg } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  };

  const cancelEdit = () => {
    setUsername(user?.username || '');
    setStudentId(user?.studentId || '');
    setIsEditing(false);
  };

  return (
    <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
      <div className="card">
        <h1>🕐 승인 대기 중</h1>
        <p style={{ color: '#666', marginBottom: '24px' }}>
          관리자의 승인을 기다리고 있습니다.<br/>
          승인이 완료되면 애플리케이션을 이용할 수 있습니다.
        </p>
        
        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '24px' }}>
          <h3>제출된 정보</h3>
          {!isEditing ? (
            <div style={{ textAlign: 'left' }}>
              <p><strong>이메일:</strong> {user?.email}</p>
              <p><strong>사용자명:</strong> {user?.username}</p>
              <p><strong>학번:</strong> {user?.studentId}</p>
              <button 
                className="btn secondary" 
                onClick={() => setIsEditing(true)}
                style={{ marginTop: '12px' }}
              >
                정보 수정
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdateInfo} style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '12px' }}>
                <label>이메일 (변경 불가)</label>
                <input 
                  className="input" 
                  value={user?.email} 
                  disabled 
                  style={{ backgroundColor: '#f5f5f5' }}
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label>사용자명</label>
                <input 
                  className="input" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)}
                  required
                />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label>학번</label>
                <input 
                  className="input" 
                  type="number" 
                  value={studentId} 
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="예: 20241234"
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button 
                  type="submit" 
                  className="btn primary" 
                  disabled={loading}
                >
                  {loading ? '저장 중...' : '저장'}
                </button>
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={cancelEdit}
                  disabled={loading}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
            다른 계정으로 로그인하시겠습니까?
          </p>
          <button 
            className="btn secondary" 
            onClick={handleLogout}
            style={{ fontSize: '14px' }}
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}