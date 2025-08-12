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
    try { const { data } = await acceptInvite(code); setStatus('DONE'); nav(`/teams/${data.teamId}`); }
    catch { setStatus('INVALID'); }
  }

  return (
    <div className="container" style={{ maxWidth:520 }}>
      <h1>팀 초대</h1>
      <div className="card">
        {status==='LOADING' && '확인 중...'}
        {status==='INVALID' && '초대가 유효하지 않거나 만료되었습니다.'}
        {status==='READY' && (
          <>
            <p>이 팀에 참여하시겠어요?</p>
            <p>역할: <b>{info.role}</b></p>
            <button className="btn primary" onClick={accept}>참여하기</button>
          </>
        )}
        {status==='DONE' && '참여 완료'}
      </div>
    </div>
  );
}