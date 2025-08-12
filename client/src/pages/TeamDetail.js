import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { getTeam, updateTeam, addMember, removeMember } from '../api/teams';
import { useAuth } from '../contexts/AuthContext';
import client from '../api/client';
import { getReportsByTeam } from '../api/reports';
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

  const [newUserId, setNewUserId] = useState('');
  const [reports, setReports] = useState([]);

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
        week: new Date(r.weekOf).toLocaleDateString(),
        progress: r.progress,
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
    await addMember(team._id, { userId: newUserId, role: 'MEMBER' });
    setNewUserId('');
    const { data } = await getTeam(id);
    setTeam(data || null);
  }

  async function promote(u) {
    await addMember(team._id, { userId: u, role: 'LEADER' });
    const { data } = await getTeam(id);
    setTeam(data || null);
  }

  async function demote(u) {
    await addMember(team._id, { userId: u, role: 'MEMBER' });
    const { data } = await getTeam(id);
    setTeam(data || null);
  }

  async function remove(u) {
    await removeMember(team._id, u);
    const { data } = await getTeam(id);
    setTeam(data || null);
  }

  if (team === undefined) return <div className="container">로딩...</div>;
  if (team === null) return <div className="container"><div className="card">팀을 찾을 수 없습니다.</div></div>;

  return (
    <div className="container">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>{team.name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {isMember && (
            <button
              className="btn"
              onClick={() => nav('/reports/new', { state: { teamId: team._id, teamName: team.name } })}
            >
              보고서 작성
            </button>
          )}
          {isLeader && <button className="btn" onClick={inviteLink}>초대 링크</button>}
        </div>
      </div>

      {/* 탭 */}
      <div className="card" style={{ display: 'flex', gap: 8, padding: '8px 12px', marginBottom: 16 }}>
        {['overview', 'members', 'reports'].map((t) => (
          <button key={t} className={`btn ${tab === t ? 'primary' : ''}`} onClick={() => setTab(t)}>
            {t === 'overview' ? '개요' : t === 'members' ? '멤버' : '보고서'}
          </button>
        ))}
      </div>

      {/* 개요 */}
      {tab === 'overview' && (
        <Section
          title="팀 정보"
          right={
            canEdit && !editMode ? (
              <button className="btn" onClick={() => setEditMode(true)}>수정</button>
            ) : null
          }
        >
          {!editMode ? (
            <div>
              <p><strong>팀명:</strong> {team.name}</p>
              <p><strong>유형:</strong> {team.type}</p>
              <p><strong>목표:</strong> {team.goal}</p>
              <p><strong>설명:</strong> {team.description}</p>
              <p><strong>상태:</strong> {team.status}</p>
              <p><strong>시작일:</strong> {team.startAt ? new Date(team.startAt).toLocaleDateString() : '-'}</p>
              <p><strong>종료일:</strong> {team.endAt ? new Date(team.endAt).toLocaleDateString() : '-'}</p>
            </div>
          ) : (
            <form onSubmit={saveOverview} style={{ display: 'grid', gap: 12 }}>
              <div className="grid cols-2">
                <label>팀명<br /><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label>
                <label>유형<br />
                  <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="STUDY">STUDY</option>
                    <option value="PROJECT">PROJECT</option>
                  </select>
                </label>
              </div>
              <label>목표<br /><input className="input" value={goal} onChange={(e) => setGoal(e.target.value)} /></label>
              <label>설명<br /><textarea className="input" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
              <div className="grid cols-3">
                <label>상태<br />
                  <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </label>
                <label>시작일<br /><input className="input" type="date" value={startAt} onChange={(e) => setStartAt(e.target.value)} /></label>
                <label>종료일<br /><input className="input" type="date" value={endAt} onChange={(e) => setEndAt(e.target.value)} /></label>
              </div>
              <div>
                <button className="btn primary" type="submit">저장</button>
                <button
                  className="btn"
                  type="button"
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
                  style={{ marginLeft: 8 }}
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </Section>
      )}

      {/* 멤버 */}
      {tab === 'members' && (
        <Section title="멤버 관리" right={isLeader ? <span style={{ color: 'var(--muted)' }}>리더 전용</span> : null}>
          {isLeader && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                className="input"
                placeholder="추가할 사용자 ID(ObjectId)"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
              <button className="btn" onClick={add} disabled={!newUserId}>추가</button>
              <button className="btn" onClick={inviteLink}>초대 링크</button>
            </div>
          )}
          <table className="table">
            <thead>
              <tr>
                <th>이름</th>
                <th>역할</th>
                <th style={{ width: 200 }}></th>
              </tr>
            </thead>
            <tbody>
              {memberList.map((m) => (
                <tr key={m.id}>
                  <td>{m.name}</td>
                  <td>{m.role}</td>
                  <td>
                    {isLeader && m.id !== user?._id && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        {m.role !== 'LEADER' && <button className="btn" onClick={() => promote(m.id)}>리더로</button>}
                        {m.role !== 'MEMBER' && <button className="btn" onClick={() => demote(m.id)}>멤버로</button>}
                        <button className="btn" onClick={() => remove(m.id)}>제거</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>
      )}

      {/* 보고서 */}
      {tab === 'reports' && (
        <Section title="최근 보고서" right={<Link className="btn" to={`/reports?teamId=${team._id}`}>전체 보기</Link>}>
          {reports.length === 0 ? (
            <div>아직 보고서가 없습니다.</div>
          ) : (
            <>
              <table className="table">
                <thead>
                  <tr>
                    <th>주차</th>
                    <th>진행률</th>
                    <th>목표</th>
                    <th>이슈</th>
                    <th>마감일</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r._id}>
                      <td>{new Date(r.weekOf).toLocaleDateString()}</td>
                      <td>{r.progress}%</td>
                      <td>{r.goals}</td>
                      <td>{r.issues}</td>
                      <td>{r.dueAt ? new Date(r.dueAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 24 }}>
                <h4>진행률 추이</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={reportsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="progress" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </Section>
      )}
    </div>
  );
}
