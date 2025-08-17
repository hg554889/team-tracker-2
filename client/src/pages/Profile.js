import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { updateMe, changeMyPassword } from '../api/users';
import { createRoleRequest, getMyRoleRequests } from '../api/roleRequests';

export default function Profile(){
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [clubId, setClubId] = useState(user?.clubId || '');
  const [clubs, setClubs] = useState([]);
  const [saving, setSaving] = useState(false);

  const [pwOpen, setPwOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const [roleRequestOpen, setRoleRequestOpen] = useState(false);
  const [requestedRole, setRequestedRole] = useState('');
  const [reason, setReason] = useState('');
  const [roleRequestLoading, setRoleRequestLoading] = useState(false);
  const [myRoleRequests, setMyRoleRequests] = useState([]);

  useEffect(()=>{ 
    (async()=>{ 
      try{ 
        const { data } = await client.get('/clubs'); 
        setClubs(data); 
      }catch{} 
    })(); 
    loadMyRoleRequests();
  },[]);

  const loadMyRoleRequests = async () => {
    try {
      const { data } = await getMyRoleRequests();
      setMyRoleRequests(data.requests);
    } catch (err) {
      console.error('Failed to load role requests:', err);
    }
  };
  const hasClub = !!user?.clubId;

  async function save(e){
    e.preventDefault(); setSaving(true);
    try{
      const payload = hasClub ? { username } : { username, clubId };
      const { data } = await updateMe(payload);
      setUser(data);
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'저장되었습니다.'} }));
    } finally { setSaving(false); }
  }

  async function submitPassword(){
    if (!currentPassword || !newPassword) return window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'현재/새 비밀번호를 입력하세요.'} }));
    if (newPassword.length < 8) return window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'새 비밀번호는 8자 이상이어야 합니다.'} }));
    if (newPassword !== newPassword2) return window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'새 비밀번호가 일치하지 않습니다.'} }));
    setPwLoading(true);
    try{
      await changeMyPassword(currentPassword, newPassword);
      setPwOpen(false); setCurrentPassword(''); setNewPassword(''); setNewPassword2('');
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'비밀번호가 변경되었습니다.'} }));
    } catch(e){
      const msg = e.response?.data?.message || '변경에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg} }));
    } finally { setPwLoading(false); }
  }

  async function submitRoleRequest() {
    if (!requestedRole || !reason.trim()) {
      return window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '요청할 권한과 사유를 입력하세요.' } 
      }));
    }

    setRoleRequestLoading(true);
    try {
      await createRoleRequest({ requestedRole, reason: reason.trim() });
      setRoleRequestOpen(false);
      setRequestedRole('');
      setReason('');
      loadMyRoleRequests();
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '권한 요청이 제출되었습니다.' } 
      }));
    } catch (err) {
      const msg = err.response?.data?.error === 'You already have a pending role request' 
        ? '이미 처리 중인 권한 요청이 있습니다.' 
        : '권한 요청에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg } 
      }));
    } finally {
      setRoleRequestLoading(false);
    }
  }

  const clubName = clubs.find(c => (c.key || c._id) === user?.clubId)?.name || user?.clubId || '-';
  const availableRoles = user?.role === 'MEMBER' ? ['LEADER', 'EXECUTIVE'] : 
                        user?.role === 'LEADER' ? ['EXECUTIVE'] : [];
  const hasPendingRequest = myRoleRequests.some(req => req.status === 'pending');

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>프로필</h1>
      <form onSubmit={save} className="card" style={{ display:'grid', gap:12 }}>
        <label>이메일<br/><input className="input" value={user?.email || ''} disabled /></label>
        <label>이름<br/><input className="input" value={username} onChange={e=>setUsername(e.target.value)} /></label>
        <label>학번<br/><input className="input" value={user?.studentId || ''} disabled /></label>
        <label>현재 권한<br/><input className="input" value={user?.role || ''} disabled /></label>

        {!hasClub ? (
          <label>동아리 선택(최초 1회)<br/>
            <select className="input" value={clubId} onChange={e=>setClubId(e.target.value)} required>
              <option value="">선택</option>
              {clubs.map(c=> <option key={c._id || c.key} value={c.key || c._id}>{c.name}</option>)}
            </select>
          </label>
        ) : (
          <label>동아리<br/>
            <input className="input" value={clubName} disabled />
            <small style={{ color:'var(--muted)' }}>동아리는 최초 1회만 선택 가능 (프로필에서 변경 불가)</small>
          </label>
        )}

        <div style={{ display:'flex', gap:8 }}>
          <button className="btn primary" disabled={saving}>저장</button>
          <button type="button" className="btn" onClick={()=> setPwOpen(true)}>비밀번호 변경</button>
          {availableRoles.length > 0 && !hasPendingRequest && (
            <button type="button" className="btn secondary" onClick={() => setRoleRequestOpen(true)}>
              권한 요청
            </button>
          )}
        </div>
      </form>

      {pwOpen && (
        <div className="card" style={{ marginTop:16, display:'grid', gap:12 }}>
          <h3 style={{ margin:0 }}>비밀번호 변경</h3>
          <label>현재 비밀번호<br/><input className="input" type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} /></label>
          <label>새 비밀번호<br/><input className="input" type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} /></label>
          <label>새 비밀번호 확인<br/><input className="input" type="password" value={newPassword2} onChange={e=>setNewPassword2(e.target.value)} /></label>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn" onClick={()=> setPwOpen(false)} disabled={pwLoading}>취소</button>
            <button className="btn primary" onClick={submitPassword} disabled={pwLoading}>
              {pwLoading ? '변경 중...' : '변경'}
            </button>
          </div>
        </div>
      )}

      {roleRequestOpen && (
        <div className="card" style={{ marginTop:16, display:'grid', gap:12 }}>
          <h3 style={{ margin:0 }}>권한 요청</h3>
          <label>요청할 권한<br/>
            <select className="input" value={requestedRole} onChange={e => setRequestedRole(e.target.value)} required>
              <option value="">선택하세요</option>
              {availableRoles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </label>
          <label>요청 사유<br/>
            <textarea 
              className="input" 
              value={reason} 
              onChange={e => setReason(e.target.value)}
              placeholder="권한이 필요한 이유를 자세히 설명해주세요..."
              rows={4}
              required
            />
          </label>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn" onClick={() => setRoleRequestOpen(false)} disabled={roleRequestLoading}>
              취소
            </button>
            <button className="btn primary" onClick={submitRoleRequest} disabled={roleRequestLoading}>
              {roleRequestLoading ? '요청 중...' : '요청하기'}
            </button>
          </div>
        </div>
      )}

      {myRoleRequests.length > 0 && (
        <div className="card" style={{ marginTop:16 }}>
          <h3 style={{ margin:'0 0 12px 0' }}>나의 권한 요청 내역</h3>
          {myRoleRequests.map(request => (
            <div key={request._id} style={{ 
              padding: '12px', 
              border: '1px solid #eee', 
              borderRadius: '4px', 
              marginBottom: '8px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{request.currentRole} → {request.requestedRole}</strong>
                  <span style={{ 
                    marginLeft: '8px', 
                    padding: '2px 6px', 
                    borderRadius: '3px', 
                    fontSize: '12px',
                    backgroundColor: request.status === 'pending' ? '#fff3cd' : 
                                   request.status === 'approved' ? '#d1edff' : '#f8d7da',
                    color: request.status === 'pending' ? '#856404' : 
                           request.status === 'approved' ? '#0c5460' : '#721c24'
                  }}>
                    {request.status === 'pending' ? '대기중' : 
                     request.status === 'approved' ? '승인됨' : '거절됨'}
                  </span>
                </div>
                <small style={{ color: '#666' }}>
                  {new Date(request.createdAt).toLocaleDateString()}
                </small>
              </div>
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                사유: {request.reason}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
