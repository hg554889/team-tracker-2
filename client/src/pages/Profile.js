import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { updateMe, changeMyPassword } from '../api/users';
import { createRoleRequest, getMyRoleRequests } from '../api/roleRequests';
import { createInquiry, getMyInquiries } from '../api/inquiries';

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

  // Inquiry states
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryTitle, setInquiryTitle] = useState('');
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquiryCategory, setInquiryCategory] = useState('general');
  const [inquiryPriority, setInquiryPriority] = useState('normal');
  const [inquiryLoading, setInquiryLoading] = useState(false);
  const [myInquiries, setMyInquiries] = useState([]);

  useEffect(()=>{ 
    (async()=>{ 
      try{ 
        const { data } = await client.get('/clubs'); 
        setClubs(data); 
      }catch{} 
    })(); 
    loadMyRoleRequests();
    loadMyInquiries();
  },[]);

  const loadMyRoleRequests = async () => {
    try {
      const { data } = await getMyRoleRequests();
      setMyRoleRequests(data.requests);
    } catch (err) {
      console.error('Failed to load role requests:', err);
    }
  };

  const loadMyInquiries = async () => {
    try {
      const { data } = await getMyInquiries();
      setMyInquiries(data.items);
    } catch (err) {
      console.error('Failed to load inquiries:', err);
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

  async function submitInquiry() {
    if (!inquiryTitle.trim() || !inquiryContent.trim()) {
      return window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '제목과 내용을 모두 입력해주세요.' } 
      }));
    }

    setInquiryLoading(true);
    try {
      await createInquiry({
        title: inquiryTitle.trim(),
        content: inquiryContent.trim(),
        category: inquiryCategory,
        priority: inquiryPriority
      });
      
      setInquiryOpen(false);
      setInquiryTitle('');
      setInquiryContent('');
      setInquiryCategory('general');
      setInquiryPriority('normal');
      loadMyInquiries();
      
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '문의가 성공적으로 제출되었습니다.' } 
      }));
    } catch (err) {
      const msg = err.response?.data?.message || '문의 제출에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg } 
      }));
    } finally {
      setInquiryLoading(false);
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

        <div style={{ display:'flex', gap:8, flexWrap: 'wrap' }}>
          <button className="btn primary" disabled={saving}>저장</button>
          <button type="button" className="btn" onClick={()=> setPwOpen(true)}>비밀번호 변경</button>
          <button type="button" className="btn" onClick={() => setInquiryOpen(true)}>문의</button>
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

      {inquiryOpen && (
        <div className="card" style={{ marginTop:16, display:'grid', gap:12 }}>
          <h3 style={{ margin:0 }}>문의하기</h3>
          <label>제목<br/>
            <input 
              className="input" 
              value={inquiryTitle} 
              onChange={e => setInquiryTitle(e.target.value)}
              placeholder="문의 제목을 입력해주세요..."
              required
            />
          </label>
          <label>카테고리<br/>
            <select className="input" value={inquiryCategory} onChange={e => setInquiryCategory(e.target.value)}>
              <option value="general">일반 문의</option>
              <option value="technical">기술 지원</option>
              <option value="account">계정 관련</option>
              <option value="feature">기능 요청</option>
              <option value="bug">버그 신고</option>
              <option value="other">기타</option>
            </select>
          </label>
          <label>우선순위<br/>
            <select className="input" value={inquiryPriority} onChange={e => setInquiryPriority(e.target.value)}>
              <option value="low">낮음</option>
              <option value="normal">보통</option>
              <option value="high">높음</option>
              <option value="urgent">긴급</option>
            </select>
          </label>
          <label>내용<br/>
            <textarea 
              className="input" 
              value={inquiryContent} 
              onChange={e => setInquiryContent(e.target.value)}
              placeholder="문의 내용을 자세히 작성해주세요..."
              rows={6}
              required
            />
          </label>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn" onClick={() => setInquiryOpen(false)} disabled={inquiryLoading}>
              취소
            </button>
            <button className="btn primary" onClick={submitInquiry} disabled={inquiryLoading}>
              {inquiryLoading ? '제출 중...' : '문의하기'}
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

      {myInquiries.length > 0 && (
        <div className="card" style={{ marginTop:16 }}>
          <h3 style={{ margin:'0 0 12px 0' }}>나의 문의 내역</h3>
          {myInquiries.map(inquiry => (
            <div key={inquiry._id} style={{ 
              padding: '12px', 
              border: '1px solid var(--border)', 
              borderRadius: 'var(--radius)', 
              marginBottom: '8px',
              background: 'var(--surface)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text)' }}>{inquiry.title}</strong>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: 'var(--radius)', 
                      fontSize: '11px',
                      background: 'var(--surface-hover)',
                      color: 'var(--text-muted)'
                    }}>
                      {inquiry.category === 'general' ? '일반' : 
                       inquiry.category === 'technical' ? '기술' :
                       inquiry.category === 'account' ? '계정' :
                       inquiry.category === 'feature' ? '기능' :
                       inquiry.category === 'bug' ? '버그' : '기타'}
                    </span>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: 'var(--radius)', 
                      fontSize: '11px',
                      background: inquiry.status === 'pending' ? 'var(--warning-light)' : 
                                 inquiry.status === 'resolved' ? 'var(--success-light)' : 
                                 inquiry.status === 'in_progress' ? 'var(--primary-light)' : 'var(--border)',
                      color: inquiry.status === 'pending' ? 'var(--warning)' : 
                             inquiry.status === 'resolved' ? 'var(--success)' : 
                             inquiry.status === 'in_progress' ? 'var(--primary)' : 'var(--text-muted)'
                    }}>
                      {inquiry.status === 'pending' ? '대기중' : 
                       inquiry.status === 'in_progress' ? '처리중' :
                       inquiry.status === 'resolved' ? '해결됨' : '종료'}
                    </span>
                    <span style={{ 
                      padding: '2px 6px', 
                      borderRadius: 'var(--radius)', 
                      fontSize: '11px',
                      background: inquiry.priority === 'urgent' ? '#fee2e2' : 
                                 inquiry.priority === 'high' ? '#fef3c7' : 'var(--surface-hover)',
                      color: inquiry.priority === 'urgent' ? '#dc2626' : 
                             inquiry.priority === 'high' ? '#d97706' : 'var(--text-muted)'
                    }}>
                      {inquiry.priority === 'urgent' ? '긴급' :
                       inquiry.priority === 'high' ? '높음' :
                       inquiry.priority === 'normal' ? '보통' : '낮음'}
                    </span>
                  </div>
                </div>
                <small style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
                  {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                </small>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '8px' }}>
                {inquiry.content.length > 100 ? inquiry.content.substring(0, 100) + '...' : inquiry.content}
              </div>
              {inquiry.response && (
                <div style={{ 
                  padding: '8px 12px', 
                  background: 'var(--primary-light)', 
                  borderRadius: 'var(--radius)',
                  borderLeft: '3px solid var(--primary)'
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px' }}>
                    관리자 답변:
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                    {inquiry.response}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
