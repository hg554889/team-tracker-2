import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import client from '../api/client';

export default function TeamJoin() {
  const navigate = useNavigate();
  const { inviteCode } = useParams();
  const [availableTeams, setAvailableTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [joinMessage, setJoinMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [inviteInfo, setInviteInfo] = useState(null);

  useEffect(() => {
    if (inviteCode) {
      // 초대 링크로 접근한 경우
      validateInviteCode();
    } else {
      // 일반 팀 참여 페이지
      loadAvailableTeams();
    }
  }, [inviteCode]);

  const validateInviteCode = async () => {
    try {
      setLoading(true);
      const { data } = await client.get(`/teams/invite/${inviteCode}`);
      setInviteInfo(data);
    } catch (error) {
      console.error('Failed to validate invite code:', error);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '유효하지 않거나 만료된 초대 링크입니다.' } 
      }));
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableTeams = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/teams/available');
      setAvailableTeams(data);
    } catch (error) {
      console.error('Failed to load available teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId, teamName) => {
    try {
      setJoining(true);
      
      if (inviteCode) {
        // 초대 링크를 통한 참여
        await client.post(`/teams/join-by-invite/${inviteCode}`, {
          message: joinMessage
        });
      } else {
        // 일반 참여 요청
        await client.post('/teams/join-request', {
          teamId: teamId || selectedTeam,
          message: joinMessage
        });
      }
      
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: `${teamName || '팀'} 참여 요청을 보냈습니다.` } 
      }));
      
      navigate('/teams');
    } catch (error) {
      console.error('Failed to join team:', error);
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          {inviteCode ? '초대 정보를 확인하는 중...' : '참여 가능한 팀을 불러오는 중...'}
        </div>
      </div>
    );
  }

  // 초대 링크로 접근한 경우
  if (inviteCode && inviteInfo) {
    return (
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '24px' }}>🎉</div>
          
          <h1 style={{ fontSize: '28px', color: '#2c3e50', marginBottom: '16px' }}>
            팀 초대장
          </h1>
          
          <p style={{ fontSize: '18px', color: '#636e72', marginBottom: '32px' }}>
            <strong>{inviteInfo.inviterName}</strong>님이 당신을<br/>
            <strong style={{ color: '#3498db' }}>{inviteInfo.teamName}</strong> 팀에 초대했습니다
          </p>

          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '32px',
            textAlign: 'left'
          }}>
            <h3 style={{ fontSize: '16px', color: '#2c3e50', marginBottom: '16px' }}>
              팀 정보
            </h3>
            <div style={{ marginBottom: '12px' }}>
              <strong>팀 이름:</strong> {inviteInfo.teamName}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>멤버 수:</strong> {inviteInfo.memberCount}명
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>팀 리더:</strong> {inviteInfo.leaderName}
            </div>
            {inviteInfo.description && (
              <div>
                <strong>팀 설명:</strong> {inviteInfo.description}
              </div>
            )}
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '8px',
              textAlign: 'left'
            }}>
              참여 메시지 (선택사항)
            </label>
            <textarea
              value={joinMessage}
              onChange={(e) => setJoinMessage(e.target.value)}
              placeholder="팀에 참여하는 이유나 자기소개를 간단히 작성해주세요"
              style={{
                width: '100%',
                minHeight: '80px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/teams')}
              style={{
                flex: 1,
                background: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              나중에
            </button>
            <button
              onClick={() => handleJoinTeam(inviteInfo.teamId, inviteInfo.teamName)}
              disabled={joining}
              style={{
                flex: 2,
                background: joining ? '#95a5a6' : '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: joining ? 'not-allowed' : 'pointer'
              }}
            >
              {joining ? '참여 중...' : '팀 참여하기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 일반 팀 참여 페이지
  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#2c3e50', fontWeight: '700' }}>
            👥 팀 참여하기
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#636e72' }}>
            관심있는 팀에 참여 요청을 보내보세요
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#95a5a6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ← 뒤로가기
        </button>
      </div>

      {availableTeams.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid #e9ecef',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h2 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '16px' }}>
            참여 가능한 팀이 없습니다
          </h2>
          <p style={{ fontSize: '14px', color: '#636e72' }}>
            현재 참여할 수 있는 팀이 없습니다. 새로운 팀을 생성하거나 초대를 기다려보세요.
          </p>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '32px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {availableTeams.map((team) => (
              <div
                key={team._id}
                style={{
                  border: '1px solid #e9ecef',
                  borderRadius: '8px',
                  padding: '20px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3498db';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '12px' }}>
                  {team.name}
                </h3>
                <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '16px', lineHeight: 1.5 }}>
                  {team.description || '팀 설명이 없습니다.'}
                </p>
                
                <div style={{ fontSize: '12px', color: '#95a5a6', marginBottom: '16px' }}>
                  <div>멤버: {team.memberCount || 0}명</div>
                  <div>리더: {team.leaderName}</div>
                </div>

                <button
                  onClick={() => handleJoinTeam(team._id, team.name)}
                  disabled={joining}
                  style={{
                    width: '100%',
                    background: joining ? '#95a5a6' : '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: joining ? 'not-allowed' : 'pointer'
                  }}
                >
                  {joining ? '요청 중...' : '참여 요청'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}