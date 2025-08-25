import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTeam, updateTeam, addMember, removeMember, changeRole } from '../api/teams';
import { getTeamJoinRequests, processJoinRequest } from '../api/teamJoinRequests';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { getReportsByTeam } from '../api/reports';
import TeamInsights from '../components/TeamInsights';
import TeamChat from '../components/TeamChat';
import ProjectPrediction from '../components/ProjectPrediction';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function Section({ title, children, right }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <h3 style={{ margin: 0 }}>{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

export default function TeamDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { user } = useAuth();

  // 상태
  const [team, setTeam] = useState(undefined);
  const [tab, setTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);

  // 폼 상태
  const [name, setName] = useState('');
  const [type, setType] = useState('STUDY');
  const [goal, setGoal] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');

  const [newUserEmail, setNewUserEmail] = useState('');
  const [reports, setReports] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);

  // 팀 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await getTeam(id);
        if (mounted) {
          setTeam(data || null);
          if (data) {
            setName(data.name || '');
            setType(data.type || 'STUDY');
            setGoal(data.goal || '');
            setDescription(data.description || '');
            setStatus(data.status || 'ACTIVE');
            setStartAt(data.startAt ? data.startAt.split('T')[0] : '');
            setEndAt(data.endAt ? data.endAt.split('T')[0] : '');
          }
        }
      } catch {
        if (mounted) setTeam(null);
      }
    })();
    return () => (mounted = false);
  }, [id]);

  // 보고서 로드
  useEffect(() => {
    if (!team?._id) return;
    (async () => {
      try {
        const { data } = await getReportsByTeam(team._id);
        setReports(data || []);
      } catch {
        setReports([]);
      }
    })();
  }, [team]);

  // 가입 신청 로드 (리더만)
  useEffect(() => {
    if (!team?._id || !isLeader) return;
    (async () => {
      try {
        const { data } = await getTeamJoinRequests(team._id, { status: 'pending' });
        setJoinRequests(data.items || []);
      } catch {
        setJoinRequests([]);
      }
    })();
  }, [team, isLeader]);

  // 권한
  const isMember = useMemo(
    () => (team?.members || []).some((m) => m?.user?._id === user?._id),
    [team, user]
  );
  const isLeader = useMemo(
    () =>
      team?.leader?._id === user?._id ||
      (team?.members || []).some((m) => m?.user?._id === user?._id && m.role === 'LEADER'),
    [team, user]
  );
  const canEdit = isLeader || user?.role === 'ADMIN';
  const canUseExclusiveFeatures = isMember || isLeader || user?.role === 'ADMIN' || user?.role === 'EXECUTIVE';

  const memberList = useMemo(
    () =>
      (team?.members || []).map((m) => ({
        id: m?.user?._id,
        name: m?.user?.username || '(알 수 없음)',
        role: m?.role || 'MEMBER',
      })),
    [team]
  );

  const reportsChartData = useMemo(() => {
    return reports
      .slice()
      .sort((a, b) => new Date(a.weekOf) - new Date(b.weekOf))
      .map((r) => ({
        week: new Date(r.weekOf).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
        progress: r.progress,
        goals: r.goals.length > 20 ? r.goals.substring(0, 20) + '...' : r.goals
      }));
  }, [reports]);

  // 액션
  async function saveOverview(e) {
    e.preventDefault();
    await updateTeam(team._id, {
      name,
      type,
      goal,
      description,
      status,
      startAt: startAt ? new Date(startAt).toISOString() : undefined,
      endAt: endAt ? new Date(endAt).toISOString() : undefined,
    });
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', msg: '팀 정보가 저장되었습니다.' } }));
    const { data } = await getTeam(id);
    setTeam(data || null);
    setEditMode(false);
  }

  async function inviteLink() {
    const { data } = await client.post('/invites/create', {
      teamId: team._id,
      role: 'MEMBER',
      expiresInMinutes: 120,
    });
    const url = `${window.location.origin}/invite/${data.code}`;
    await navigator.clipboard.writeText(url);
    window.dispatchEvent(new CustomEvent('toast', { detail: { type: 'success', msg: '초대 링크가 복사되었습니다.' } }));
  }

  async function add() {
    if (!newUserEmail.trim()) {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '이메일을 입력해주세요.' } 
      }));
      return;
    }

    try {
      await addMember(team._id, { email: newUserEmail.trim(), role: 'MEMBER' });
      setNewUserEmail('');
      const { data } = await getTeam(id);
      setTeam(data || null);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '멤버가 성공적으로 추가되었습니다.' } 
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || '멤버 추가에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: errorMessage } 
      }));
    }
  }

  async function changeUserRole(targetUserId, newRole) {
    try {
      const { data } = await changeRole(team._id, { 
        targetUserId, 
        newRole 
      });
      
      setTeam(data.team);
      
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { 
          type: 'success', 
          msg: newRole === 'LEADER' ? '리더로 승격되었습니다.' : '멤버로 변경되었습니다.'
        }
      }));
    } catch (error) {
      const errorMessage = error?.response?.data?.error || '역할 변경에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: errorMessage }
      }));
    }
  }


  async function remove(u) {
    await removeMember(team._id, u);
    const { data } = await getTeam(id);
    setTeam(data || null);
  }

  async function handleJoinRequest(requestId, action) {
    try {
      await processJoinRequest(requestId, action);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { 
          type: 'success', 
          msg: action === 'approve' ? '가입 신청을 승인했습니다.' : '가입 신청을 거절했습니다.'
        }
      }));
      
      // 팀 정보와 가입 신청 목록 새로고침
      const [teamData, joinRequestsData] = await Promise.all([
        getTeam(id),
        getTeamJoinRequests(team._id, { status: 'pending' })
      ]);
      
      setTeam(teamData.data || null);
      setJoinRequests(joinRequestsData.data.items || []);
    } catch (error) {
      const errorMessage = error?.response?.data?.error || '처리에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: errorMessage }
      }));
    }
  }

  async function leaveTeam() {
    // 확인 대화상자
    if (!window.confirm('정말로 이 팀을 떠나시겠습니까?')) {
      return;
    }

    // 리더인 경우 추가 확인
    if (isLeader) {
      const otherLeaders = (team.members || []).filter(m => 
        m.role === 'LEADER' && String(m.user._id) !== String(user._id)
      );
      
      if (otherLeaders.length === 0) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { 
            type: 'error', 
            msg: '다른 리더가 없어 팀을 떠날 수 없습니다. 먼저 다른 멤버를 리더로 승격시켜주세요.' 
          }
        }));
        return;
      }

      if (!window.confirm('팀장입니다. 떠나면 다른 리더가 팀을 관리하게 됩니다. 계속하시겠습니까?')) {
        return;
      }
    }

    try {
      await removeMember(team._id, user._id);
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'success', msg: '팀에서 성공적으로 탈퇴했습니다.' }
      }));
      // 팀 목록 페이지로 이동
      nav('/teams');
    } catch (error) {
      const errorMessage = error?.response?.data?.message || '팀 탈퇴에 실패했습니다.';
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { type: 'error', msg: errorMessage }
      }));
    }
  }

  if (team === undefined) return <div className="container">로딩...</div>;
  if (team === null) return <div className="container"><div className="card">팀을 찾을 수 없습니다.</div></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h1>{team.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px' }}>
            <span style={{ 
              padding: '4px 8px', 
              backgroundColor: '#f0f0f0', 
              borderRadius: '12px', 
              fontSize: '12px',
              color: '#666'
            }}>
              {team.type}
            </span>
            <span style={{ 
              padding: '4px 8px', 
              backgroundColor: team.status === 'ACTIVE' ? '#dcfce7' : '#fee2e2', 
              color: team.status === 'ACTIVE' ? '#166534' : '#dc2626',
              borderRadius: '12px', 
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {team.status === 'ACTIVE' ? '활성' : '비활성'}
            </span>
            <span style={{ fontSize: '14px', color: '#666' }}>
              멤버 {memberList.length}명
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canUseExclusiveFeatures && (
            <button
              className="btn"
              onClick={() => nav('/reports/new', { state: { teamId: team._id, teamName: team.name } })}
            >
              📝 보고서 작성
            </button>
          )}
          {canEdit && <button className="btn" onClick={inviteLink}>👥 초대 링크</button>}
          {isMember && (
            <button 
              className="btn" 
              onClick={leaveTeam}
              style={{ 
                backgroundColor: '#dc3545', 
                color: 'white',
                border: '1px solid #dc3545'
              }}
            >
              🚪 팀 탈퇴
            </button>
          )}
        </div>
      </div>

      {/* AI 인사이트 - 상단에 표시 */}
      {canUseExclusiveFeatures && (
        <TeamInsights teamId={team._id} teamName={team.name} />
      )}

      {/* 탭 */}
      <div className="card" style={{ display: 'flex', gap: 8, padding: '8px 12px', marginBottom: 16 }}>
        {['overview', 'progress', 'members', 'reports', 'prediction'].concat(isLeader && joinRequests.length > 0 ? ['requests'] : []).map((t) => (
          <button 
            key={t} 
            className={`btn ${tab === t ? 'primary' : ''}`} 
            onClick={() => setTab(t)}
            style={{ fontSize: '14px', position: 'relative' }}
          >
            {t === 'overview' ? '📋 개요' : 
             t === 'progress' ? '📈 진행률' :
             t === 'members' ? '👥 멤버' : 
             t === 'reports' ? '📊 보고서' :
             t === 'prediction' ? '🤖 AI 예측' : '🔔 가입 신청'}
            {t === 'requests' && joinRequests.length > 0 && (
              <span style={{
                position: 'absolute',
                top: '-8px',
                right: '-8px',
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {joinRequests.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 개요 탭 */}
      {tab === 'overview' && (
        <Section
          title="팀 정보"
          right={
            canEdit && !editMode ? (
              <button className="btn" onClick={() => setEditMode(true)}>✏️ 수정</button>
            ) : null
          }
        >
          {!editMode ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>팀명</label>
                  <p style={{ margin: 0, padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>{team.name}</p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>유형</label>
                  <p style={{ margin: 0, padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>{team.type}</p>
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>목표</label>
                <p style={{ margin: 0, padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', lineHeight: '1.5' }}>
                  {team.goal || '목표가 설정되지 않았습니다.'}
                </p>
              </div>
              
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>설명</label>
                <p style={{ margin: 0, padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', lineHeight: '1.5' }}>
                  {team.description || '설명이 없습니다.'}
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>시작일</label>
                  <p style={{ margin: 0, padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    {team.startAt ? new Date(team.startAt).toLocaleDateString('ko-KR') : '설정되지 않음'}
                  </p>
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px', color: '#374151' }}>종료일</label>
                  <p style={{ margin: 0, padding: '8px 12px', backgroundColor: '#f9fafb', borderRadius: '6px' }}>
                    {team.endAt ? new Date(team.endAt).toLocaleDateString('ko-KR') : '설정되지 않음'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={saveOverview} style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                <label>
                  팀명 *
                  <input 
                    className="input" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                    style={{ marginTop: '4px' }}
                  />
                </label>
                <label>
                  유형 *
                  <select 
                    className="input" 
                    value={type} 
                    onChange={(e) => setType(e.target.value)}
                    style={{ marginTop: '4px' }}
                  >
                    <option value="STUDY">스터디</option>
                    <option value="PROJECT">프로젝트</option>
                    <option value="CLUB">동아리</option>
                    <option value="TEAM">팀</option>
                  </select>
                </label>
              </div>
              
              <label>
                목표
                <textarea 
                  className="input" 
                  value={goal} 
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="팀의 목표를 입력해주세요..."
                  style={{ marginTop: '4px', minHeight: '80px', resize: 'vertical' }}
                />
              </label>
              
              <label>
                설명
                <textarea 
                  className="input" 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="팀에 대한 설명을 입력해주세요..."
                  style={{ marginTop: '4px', minHeight: '100px', resize: 'vertical' }}
                />
              </label>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <label>
                  상태
                  <select 
                    className="input" 
                    value={status} 
                    onChange={(e) => setStatus(e.target.value)}
                    style={{ marginTop: '4px' }}
                  >
                    <option value="ACTIVE">활성</option>
                    <option value="INACTIVE">비활성</option>
                    <option value="COMPLETED">완료</option>
                  </select>
                </label>
                <label>
                  시작일
                  <input 
                    className="input" 
                    type="date" 
                    value={startAt} 
                    onChange={(e) => setStartAt(e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </label>
                <label>
                  종료일
                  <input 
                    className="input" 
                    type="date" 
                    value={endAt} 
                    onChange={(e) => setEndAt(e.target.value)}
                    style={{ marginTop: '4px' }}
                  />
                </label>
              </div>
              
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn"
                  onClick={() => {
                    setEditMode(false);
                    setName(team.name || '');
                    setType(team.type || 'STUDY');
                    setGoal(team.goal || '');
                    setDescription(team.description || '');
                    setStatus(team.status || 'ACTIVE');
                    setStartAt(team.startAt ? team.startAt.split('T')[0] : '');
                    setEndAt(team.endAt ? team.endAt.split('T')[0] : '');
                  }}
                >
                  취소
                </button>
                <button type="submit" className="btn primary">
                  💾 저장
                </button>
              </div>
            </form>
          )}
        </Section>
      )}

      {/* 진행률 탭 */}
      {tab === 'progress' && (
        <Section title="진행률 추이" right={<span style={{ color: '#666', fontSize: '14px' }}>최근 보고서 기준</span>}>
          {reportsChartData.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#666' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <p>아직 보고서가 없어 진행률을 표시할 수 없습니다.</p>
              <p style={{ fontSize: '14px', color: '#999' }}>첫 번째 보고서를 작성해보세요!</p>
            </div>
          ) : (
            <>
              <div style={{ height: '300px', marginBottom: '20px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={reportsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, '진행률']}
                      labelFormatter={(label) => `주차: ${label}`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="progress" 
                      stroke="#667eea" 
                      strokeWidth={3}
                      dot={{ fill: '#667eea', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#667eea', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              
              {/* 통계 요약 */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '16px',
                padding: '16px',
                backgroundColor: '#f8fafc',
                borderRadius: '8px'
              }}>
                {(() => {
                  const progressValues = reportsChartData.map(d => d.progress);
                  const avg = Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length);
                  const max = Math.max(...progressValues);
                  const min = Math.min(...progressValues);
                  const latest = progressValues[progressValues.length - 1];
                  
                  return [
                    { label: '평균 진행률', value: `${avg}%`, color: '#374151' },
                    { label: '최고 진행률', value: `${max}%`, color: '#10b981' },
                    { label: '최저 진행률', value: `${min}%`, color: '#ef4444' },
                    { label: '최근 진행률', value: `${latest}%`, color: '#667eea' }
                  ].map((stat, index) => (
                    <div key={index} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>
                        {stat.label}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: stat.color }}>
                        {stat.value}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </>
          )}
        </Section>
      )}

      {/* 멤버 탭 */}
      {tab === 'members' && (
        <Section title="멤버 관리" right={canEdit ? <span style={{ color: '#666', fontSize: '14px' }}>리더 전용</span> : null}>
          {canEdit && (
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              marginBottom: 16,
              padding: '12px',
              backgroundColor: '#f0f9ff',
              borderRadius: '8px',
              border: '1px solid #bae6fd'
            }}>
              <input
                className="input"
                type="email"
                placeholder="추가할 사용자의 이메일 주소"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                style={{ flex: 1 }}
                onKeyPress={(e) => e.key === 'Enter' && add()}
              />
              <button className="btn" onClick={add} disabled={!newUserEmail.trim()}>👤 추가</button>
              <button className="btn" onClick={inviteLink}>🔗 초대 링크</button>
            </div>
          )}
          
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>역할</th>
                  <th>가입일</th>
                  {canEdit && <th style={{ width: 200 }}>관리</th>}
                </tr>
              </thead>
              <tbody>
                {memberList.map((m) => (
                  <tr key={m.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ 
                          width: '32px', 
                          height: '32px', 
                          borderRadius: '50%', 
                          backgroundColor: '#667eea',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: '8px',
                          fontSize: '14px',
                          fontWeight: '600'
                        }}>
                          {m.name.charAt(0).toUpperCase()}
                        </div>
                        {m.name}
                        {m.id === user?._id && (
                          <span style={{ 
                            marginLeft: '8px',
                            padding: '2px 6px',
                            backgroundColor: '#e0e7ff',
                            color: '#4338ca',
                            borderRadius: '10px',
                            fontSize: '10px'
                          }}>
                            나
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span style={{ 
                        padding: '4px 8px',
                        backgroundColor: m.role === 'LEADER' ? '#fef3c7' : '#f3f4f6',
                        color: m.role === 'LEADER' ? '#92400e' : '#374151',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {m.role === 'LEADER' ? '👑 리더' : '👤 멤버'}
                      </span>
                    </td>
                    <td style={{ color: '#6b7280', fontSize: '14px' }}>
                      {/* TODO: 실제 가입일 데이터가 있다면 표시 */}
                      -
                    </td>
                    {canEdit && (
                      <td>
                        {m.id !== user?._id && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            {m.role !== 'LEADER' && (
                              <button 
                                className="btn" 
                                onClick={() => changeUserRole(m.id, 'LEADER')}
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px 8px',
                                  backgroundColor: '#fef3c7',
                                  color: '#92400e',
                                  border: '1px solid #fed7aa'
                                }}
                              >
                                👑 리더로
                              </button>
                            )}
                            {m.role !== 'MEMBER' && (
                              <button 
                                className="btn" 
                                onClick={() => changeUserRole(m.id, 'MEMBER')}
                                style={{ 
                                  fontSize: '12px', 
                                  padding: '4px 8px',
                                  backgroundColor: '#f3f4f6',
                                  color: '#374151',
                                  border: '1px solid #d1d5db'
                                }}
                              >
                                👤 멤버로
                              </button>
                            )}
                            <button 
                              className="btn" 
                              onClick={() => remove(m.id)}
                              style={{ 
                                fontSize: '12px', 
                                padding: '4px 8px',
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fecaca'
                              }}
                            >
                              🗑️제거
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* 보고서 탭 */}
      {tab === 'reports' && (
        <Section 
          title={`최근 보고서 (${reports.length}개)`} 
          right={
            <div style={{ display: 'flex', gap: '8px' }}>
              <Link className="btn" to={`/reports?teamId=${team._id}`}>
                📊 전체 보기
              </Link>
              {canUseExclusiveFeatures && (
                <Link 
                  className="btn primary" 
                  to="/reports/new" 
                  state={{ teamId: team._id, teamName: team.name }}
                >
                  ✏️ 새 보고서
                </Link>
              )}
            </div>
          }
        >
          {reports.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px 20px', 
              color: '#666' 
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
              <p>아직 작성된 보고서가 없습니다.</p>
              {canUseExclusiveFeatures && (
                <Link 
                  className="btn primary" 
                  to="/reports/new" 
                  state={{ teamId: team._id, teamName: team.name }}
                  style={{ marginTop: '12px' }}
                >
                  첫 번째 보고서 작성하기
                </Link>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>주차</th>
                    <th>진행률</th>
                    <th>목표</th>
                    <th>이슈</th>
                    <th>마감일</th>
                    <th>작성자</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.slice(0, 10).map((r) => (
                    <tr key={r._id} style={{ cursor: 'pointer' }} onClick={() => nav(`/reports/${r._id}`)}>
                      <td style={{ fontWeight: '500' }}>
                        {new Date(r.weekOf).toLocaleDateString('ko-KR', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{
                            width: '40px',
                            height: '6px',
                            backgroundColor: '#f0f0f0',
                            borderRadius: '3px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${r.progress}%`,
                              height: '100%',
                              backgroundColor: r.progress >= 80 ? '#10b981' : r.progress >= 50 ? '#f59e0b' : '#ef4444'
                            }} />
                          </div>
                          <span style={{ 
                            fontSize: '14px', 
                            fontWeight: '600',
                            color: r.progress >= 80 ? '#10b981' : r.progress >= 50 ? '#f59e0b' : '#ef4444'
                          }}>
                            {r.progress}%
                          </span>
                        </div>
                      </td>
                      <td style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontSize: '14px'
                      }}>
                        {r.goals || '목표 없음'}
                      </td>
                      <td style={{ 
                        maxWidth: '150px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontSize: '14px',
                        color: r.issues ? '#ef4444' : '#6b7280'
                      }}>
                        {r.issues || '이슈 없음'}
                      </td>
                      <td style={{ fontSize: '14px', color: '#6b7280' }}>
                        {r.dueAt ? new Date(r.dueAt).toLocaleDateString('ko-KR') : '-'}
                      </td>
                      <td style={{ fontSize: '14px', color: '#6b7280' }}>
                        {r.author?.username || '알 수 없음'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {reports.length > 10 && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <Link className="btn" to={`/reports?teamId=${team._id}`}>
                    {reports.length - 10}개 더 보기
                  </Link>
                </div>
              )}
            </div>
          )}
        </Section>
      )}

      {/* AI 예측 탭 */}
      {tab === 'prediction' && (
        <ProjectPrediction teamId={id} />
      )}

      {/* 가입 신청 탭 (리더만) */}
      {tab === 'requests' && isLeader && (
        <Section title={`가입 신청 관리 (${joinRequests.length}개)`}>
          {joinRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
              <p>현재 대기 중인 가입 신청이 없습니다.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>신청자</th>
                    <th>이메일</th>
                    <th>메시지</th>
                    <th>신청일</th>
                    <th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {joinRequests.map((request) => (
                    <tr key={request._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ 
                            width: '32px', 
                            height: '32px', 
                            borderRadius: '50%', 
                            backgroundColor: '#667eea',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '8px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}>
                            {request.userId?.username?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          {request.userId?.username || '알 수 없음'}
                        </div>
                      </td>
                      <td style={{ fontSize: '14px', color: '#6b7280' }}>
                        {request.userId?.email || '-'}
                      </td>
                      <td style={{ 
                        maxWidth: '200px', 
                        overflow: 'hidden', 
                        textOverflow: 'ellipsis', 
                        whiteSpace: 'nowrap',
                        fontSize: '14px'
                      }}>
                        {request.message || '메시지 없음'}
                      </td>
                      <td style={{ fontSize: '14px', color: '#6b7280' }}>
                        {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button 
                            className="btn"
                            onClick={() => handleJoinRequest(request._id, 'approve')}
                            style={{ 
                              backgroundColor: '#28a745',
                              color: 'white',
                              fontSize: '12px',
                              padding: '4px 8px'
                            }}
                          >
                            ✅ 승인
                          </button>
                          <button 
                            className="btn"
                            onClick={() => handleJoinRequest(request._id, 'reject')}
                            style={{ 
                              backgroundColor: '#dc3545',
                              color: 'white',
                              fontSize: '12px',
                              padding: '4px 8px'
                            }}
                          >
                            ❌ 거절
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}
      
      {canUseExclusiveFeatures && (
        <TeamChat 
          teamId={id} 
          isOpen={isChatOpen} 
          onToggle={() => setIsChatOpen(!isChatOpen)} 
        />
      )}
    </div>
  );
}