import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvite, acceptInvite } from '../api/invites';

export default function AcceptInvite(){
  const { code } = useParams();
  const [info,setInfo] = useState(null);
  const [status,setStatus] = useState('LOADING');
  const nav = useNavigate();

  useEffect(()=>{ (async()=>{
    try { const { data } = await getInvite(code); setInfo(data); setStatus('READY'); }
    catch { setStatus('INVALID'); }
  })(); },[code]);

  async function accept(){
    try { 
      const { data } = await acceptInvite(code); 
      setStatus('DONE'); 
      
      // 토스트 메시지 표시
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '팀에 성공적으로 가입되었습니다!' } 
      }));
      
      // 약간의 지연 후 팀 목록 페이지로 이동 (캐시된 데이터 업데이트를 위해)
      setTimeout(() => {
        nav('/teams');
      }, 1500);
    }
    catch (error) { 
      console.error('Failed to accept invite:', error);
      setStatus('INVALID'); 
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '초대 수락에 실패했습니다.' } 
      }));
    }
  }

  return (
    <div className="container" style={{ maxWidth:520 }}>
      <h1>팀 초대</h1>
      <div className="card">
        {status==='LOADING' && '확인 중...'}
        {status==='INVALID' && '초대가 유효하지 않거나 만료되었습니다.'}
        {status==='READY' && (
          <>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h3>팀 초대장</h3>
              <div style={{ backgroundColor: '#f8f9fa', padding: '16px', borderRadius: '8px', marginBottom: '16px' }}>
                <p><strong>팀 이름:</strong> {info.teamName}</p>
                <p><strong>팀 유형:</strong> {info.teamType}</p>
                <p><strong>역할:</strong> <span style={{ color: '#007bff', fontWeight: 'bold' }}>{info.role}</span></p>
              </div>
            </div>
            <p style={{ textAlign: 'center', marginBottom: '20px' }}>이 팀에 참여하시겠어요?</p>
            <button 
              className="btn primary" 
              onClick={accept}
              style={{ width: '100%', fontSize: '16px', padding: '12px' }}
            >
              참여하기
            </button>
          </>
        )}
        {status==='DONE' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h3>팀 가입 완료!</h3>
            <p>잠시 후 팀 목록 페이지로 이동합니다...</p>
          </div>
        )}
      </div>
    </div>
  );
}