import React, { useEffect, useState } from 'react';
import { listTeams, createTeam } from '../api/teams';
import { createJoinRequest } from '../api/teamJoinRequests';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';

export default function Teams(){
  const { user } = useAuth();
  const { currentClub } = useClub();

  // 목록 상태
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 상태 (기본 비노출)
  const [showFilters, setShowFilters] = useState(false);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');

  // 생성 폼 상태 (기본 비노출)
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [cType, setCType] = useState('STUDY');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  // 권한
  const canCreate = ['ADMIN', 'EXECUTIVE', 'LEADER'].includes(user?.role);

  async function fetchTeams(params = {}){
    setLoading(true);
    try{
      const requestParams = {
        q: (params.q ?? q) || undefined,
        type: (params.type ?? type) || undefined,
        status: (params.status ?? status) || undefined,
        scope: params.scope || undefined,  // scope 파라미터 추가
        include: 'leader'  // 리더 정보를 포함하도록 요청
      };
      
      // ADMIN인 경우에만 currentClub을 사용 (null이면 전체 보기)
      if (user?.role === 'ADMIN' && currentClub) {
        requestParams.clubId = currentClub;
      }
      // 다른 역할은 서버에서 자동으로 본인 동아리 필터링
      
      const { data } = await listTeams(requestParams);
      setTeams(data.items || []);
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      const errorMsg = error?.response?.data?.message || '팀 목록을 불러오는데 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: errorMsg } 
      }));
      
      // 403 에러(동아리 미할당)인 경우 특별 처리
      if (error?.response?.status === 403) {
        window.dispatchEvent(new CustomEvent('toast', { 
          detail: { type: 'warning', msg: '프로필에서 동아리를 선택해주세요.' } 
        }));
      }
    } finally{
      setLoading(false);
    }
  }

  useEffect(()=>{ fetchTeams(); /* eslint-disable-next-line */ },[currentClub]);

  async function onSearch(e){
    e.preventDefault();
    await fetchTeams({ q, type, status });
  }

  async function onCreate(e){
    e.preventDefault();
    
    // ADMIN인 경우 currentClub 또는 본인 clubId 사용, 다른 역할은 본인 clubId만
    const clubId = (user?.role === 'ADMIN' && currentClub) ? currentClub : user?.clubId;
    
    if (!clubId){
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg:'먼저 프로필에서 동아리를 선택하세요.' } }));
      return;
    }
    try{
      await createTeam({
        name,
        type: cType,
        description,
        goal,
        clubId: clubId,
        startAt: startAt ? new Date(startAt).toISOString() : undefined,
        endAt: endAt ? new Date(endAt).toISOString() : undefined
      });
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'success', msg:'팀이 생성되었습니다.' } }));
      // 목록 새로고침
      await fetchTeams();
      // 폼 리셋 + 접기
      setName(''); setCType('STUDY'); setDescription(''); setGoal(''); setStartAt(''); setEndAt('');
      setShowCreate(false);
    } catch (e){
      const msg = e?.response?.data?.message || '팀 생성에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast',{ detail:{ type:'error', msg } }));
    }
  }

  async function requestToJoinTeam(teamId) {
    try {
      await createJoinRequest(teamId, '가입을 신청합니다.');
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: '팀 가입 신청이 전송되었습니다.' }
      }));
      // 목록 새로고침하여 상태 업데이트
      await fetchTeams();
    } catch (error) {
      const errorMessage = error?.response?.data?.error || '가입 신청에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: errorMessage }
      }));
    }
  }

  return (
    <div className="container">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
        <h1 style={{ margin:0 }}>팀</h1>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn" onClick={()=> setShowFilters(v=>!v)}>
            {showFilters ? '필터 닫기' : '필터 열기'}
          </button>
          {['LEADER', 'MEMBER'].includes(user?.role) && (
            <>
              <button 
                className="btn" 
                onClick={()=> fetchTeams({ scope: 'mine' })}
                style={{ backgroundColor: '#28a745', color: 'white' }}
              >
                내 팀만 보기
              </button>
              <button 
                className="btn" 
                onClick={()=> fetchTeams()}
                style={{ backgroundColor: '#6c757d', color: 'white' }}
              >
                전체 보기
              </button>
            </>
          )}
          {canCreate && (
            <button className="btn" onClick={()=> setShowCreate(v=>!v)}>
              {showCreate ? '생성 폼 닫기' : '팀 생성'}
            </button>
          )}
        </div>
      </div>

      {/* 필터: 버튼 클릭 시에만 노출 */}
      {showFilters && (
        <form onSubmit={onSearch} className="card" style={{ display:'grid', gap:8, marginBottom:12 }}>
          <div className="grid cols-3">
            <label>검색<br/><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="팀명/설명" /></label>
            <label>유형<br/>
              <select className="input" value={type} onChange={e=>setType(e.target.value)}>
                <option value="">전체</option>
                <option value="STUDY">STUDY</option>
                <option value="PROJECT">PROJECT</option>
              </select>
            </label>
            <label>상태<br/>
              <select className="input" value={status} onChange={e=>setStatus(e.target.value)}>
                <option value="">전체</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </select>
            </label>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn" type="button" onClick={()=>{ setQ(''); setType(''); setStatus(''); fetchTeams({ q:'', type:'', status:'' }); }}>초기화</button>
            <button className="btn primary">검색</button>
          </div>
        </form>
      )}

      {/* 팀 생성: 버튼 클릭 시에만 노출 (권한 필요) */}
      {showCreate && canCreate && (
        <form onSubmit={onCreate} className="card" style={{ display:'grid', gap:8, marginBottom:12 }}>
          <div className="grid cols-2">
            <label>팀명<br/><input className="input" value={name} onChange={e=>setName(e.target.value)} required /></label>
            <label>유형<br/>
              <select className="input" value={cType} onChange={e=>setCType(e.target.value)}>
                <option value="STUDY">STUDY</option>
                <option value="PROJECT">PROJECT</option>
              </select>
            </label>
          </div>
          <label>목표<br/><input className="input" value={goal} onChange={e=>setGoal(e.target.value)} /></label>
          <label>설명<br/><textarea className="input" value={description} onChange={e=>setDescription(e.target.value)} /></label>
          <div className="grid cols-2">
            <label>시작일<br/><input className="input" type="date" value={startAt} onChange={e=>setStartAt(e.target.value)} /></label>
            <label>종료일<br/><input className="input" type="date" value={endAt} onChange={e=>setEndAt(e.target.value)} /></label>
          </div>
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end' }}>
            <button className="btn" type="button" onClick={()=> setShowCreate(false)}>취소</button>
            <button className="btn primary" type="submit">생성</button>
          </div>
        </form>
      )}

      {/* 목록 */}
      <div className="card">
        {loading ? (
          <div className="skeleton" style={{ height:160 }} />
        ) : teams.length === 0 ? (
          <div>팀이 없습니다.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>이름</th>
                <th>유형</th>
                <th>상태</th>
                <th>리더</th>
                <th>기간</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {teams.map(t => (
                <tr key={t._id} style={{
                  backgroundColor: t.userMembership?.isMember ? '#f8f9ff' : 'transparent'
                }}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {t.name}
                      {t.userMembership?.isMember && (
                        <span style={{
                          backgroundColor: t.userMembership.isLeader ? '#28a745' : '#007bff',
                          color: 'white',
                          fontSize: '10px',
                          padding: '2px 6px',
                          borderRadius: '12px',
                          fontWeight: '500'
                        }}>
                          {t.userMembership.isLeader ? '팀장' : '소속됨'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{t.type}</td>
                  <td>{t.status}</td>
                  <td>{t.leader?.username || '-'}</td>
                  <td>
                    {(t.startAt ? new Date(t.startAt).toLocaleDateString() : '-') + ' ~ ' +
                     (t.endAt ? new Date(t.endAt).toLocaleDateString() : '-')}
                  </td>
                  <td style={{ textAlign:'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      {!t.userMembership?.isMember && (
                        <button 
                          className="btn" 
                          onClick={() => requestToJoinTeam(t._id)}
                          style={{ 
                            backgroundColor: '#007bff', 
                            color: 'white', 
                            fontSize: '12px',
                            padding: '4px 8px'
                          }}
                        >
                          가입 신청
                        </button>
                      )}
                      <Link className="btn" to={`/teams/${t._id}`}>자세히</Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
