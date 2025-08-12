import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { updateMe, changeMyPassword } from '../api/users';

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

  useEffect(()=>{ (async()=>{ try{ const { data } = await client.get('/clubs'); setClubs(data); }catch{} })(); },[]);
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

  const clubName = clubs.find(c => (c.key || c._id) === user?.clubId)?.name || user?.clubId || '-';

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>프로필</h1>
      <form onSubmit={save} className="card" style={{ display:'grid', gap:12 }}>
        <label>이메일<br/><input className="input" value={user?.email || ''} disabled /></label>
        <label>이름<br/><input className="input" value={username} onChange={e=>setUsername(e.target.value)} /></label>

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
    </div>
  );
}
