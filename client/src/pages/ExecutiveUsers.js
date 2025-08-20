import React, { useEffect, useState } from 'react';
import { listUsers, adminUpdateUser } from '../api/users';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';
import ClubSwitcher from '../components/ClubSwitcher';
import ClubSettings from '../components/club/ClubSettings';
import ClubStats from '../components/club/ClubStats';
import ApprovalManagement from '../components/executive/ApprovalManagement';

export default function ExecutiveUsers(){
  const { user } = useAuth();
  const { getClubDisplayName, currentClub } = useClub();
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [q, user?.clubId]);

  const loadUsers = async () => {
    if (!user?.clubId) {
      setError('동아리가 설정되지 않았습니다.');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      
      // EXECUTIVE는 항상 본인의 clubId 사용
      if (user?.clubId) {
        params.clubId = user.clubId;
      }
      
      const { data } = await listUsers(params);
      setUsers(data);
      setError('');
    } catch (error) {
      console.error('Failed to load users:', error);
      setError('사용자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId, role) => {
    try {
      const { data } = await adminUpdateUser(userId, { role, clubId: user.clubId });
      setUsers(prev => prev.map(u => u._id === userId ? data : u));
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '권한이 업데이트되었습니다.' } 
      }));
    } catch (error) {
      console.error('Failed to update user:', error);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '권한 업데이트에 실패했습니다.' } 
      }));
    }
  };

  const tabs = [
    { id: 'users', label: '👥 구성원 관리', component: renderUserManagement },
    { id: 'approvals', label: '✅ 승인 관리', component: () => <ApprovalManagement /> },
    { id: 'settings', label: '⚙️ 동아리 설정', component: () => <ClubSettings /> },
    { id: 'stats', label: '📊 통계', component: () => <ClubStats /> }
  ];

  function renderUserManagement() {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#636e72'
        }}>
          사용자 목록을 불러오는 중...
        </div>
      );
    }

    if (error) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          color: '#dc3545'
        }}>
          {error}
        </div>
      );
    }

    return (
      <>
        <div className="card" style={{ display:'grid', gap:12, marginBottom: '16px' }}>
          <div style={{ display:'flex', gap:12, alignItems: 'center' }}>
            <span>검색:</span>
            <input 
              className="input" 
              placeholder="이름/이메일 검색" 
              value={q} 
              onChange={e => setQ(e.target.value)} 
              style={{ maxWidth: '300px' }}
            />
            <span style={{ color: '#636e72', fontSize: '14px' }}>
              총 {users.length}명
            </span>
          </div>
        </div>

        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>이름</th>
                <th>이메일</th>
                <th>학번</th>
                <th>가입일</th>
                <th>권한</th>
                <th>작업</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#636e72', padding: '20px' }}>
                    {q ? '검색 결과가 없습니다.' : '구성원이 없습니다.'}
                  </td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u._id}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.studentId || '-'}</td>
                    <td>{new Date(u.createdAt).toLocaleDateString('ko-KR')}</td>
                    <td>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: 
                          u.role === 'LEADER' ? '#e3f2fd' : 
                          u.role === 'MEMBER' ? '#f3e5f5' : '#f5f5f5',
                        color: 
                          u.role === 'LEADER' ? '#1565c0' : 
                          u.role === 'MEMBER' ? '#7b1fa2' : '#666'
                      }}>
                        {u.role === 'HIDDEN' ? '—' : u.role}
                      </span>
                    </td>
                    <td>
                      {u.role !== 'HIDDEN' && u.role !== 'EXECUTIVE' && u.role !== 'ADMIN' && (
                        <select
                          defaultValue={u.role}
                          onChange={(e) => updateUser(u._id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                        >
                          <option value="MEMBER">MEMBER</option>
                          <option value="LEADER">LEADER</option>
                        </select>
                      )}
                      {(u.role === 'EXECUTIVE' || u.role === 'ADMIN' || u.role === 'HIDDEN') && (
                        <span style={{ color: '#636e72', fontSize: '12px' }}>
                          권한 없음
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1>EXECUTIVE · {getClubDisplayName(user?.clubId)} 관리</h1>
      </div>

      {/* 탭 메뉴 */}
      <div style={{
        display: 'flex',
        borderBottom: '2px solid #e9ecef',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: `3px solid ${activeTab === tab.id ? '#007bff' : 'transparent'}`,
              color: activeTab === tab.id ? '#007bff' : '#636e72',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 탭 내용 */}
      <div>
        {tabs.find(tab => tab.id === activeTab)?.component()}
      </div>
    </div>
  );
}