import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function TeamInvite() {
  const navigate = useNavigate();
  const [myTeams, setMyTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [inviteMethod, setInviteMethod] = useState('email');
  const [emailList, setEmailList] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadMyTeams();
  }, []);

  const loadMyTeams = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/teams/my-teams');
      setMyTeams(data);
      if (data.length > 0) {
        setSelectedTeam(data[0]._id);
        generateInviteLink(data[0]._id);
      }
    } catch (error) {
      console.error('Failed to load my teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = (teamId) => {
    // 실제로는 서버에서 생성된 초대 링크를 받아와야 함
    const inviteCode = `${teamId}_${Date.now().toString(36)}`;
    setInviteLink(`${window.location.origin}/teams/join/${inviteCode}`);
  };

  const handleTeamChange = (teamId) => {
    setSelectedTeam(teamId);
    generateInviteLink(teamId);
  };

  const handleSendInvites = async () => {
    if (!selectedTeam) return;

    try {
      setSending(true);
      
      if (inviteMethod === 'email') {
        const emails = emailList.split('\n').filter(email => email.trim());
        await client.post('/teams/send-invites', {
          teamId: selectedTeam,
          emails
        });
        window.dispatchEvent(new CustomEvent('toast', { 
          detail: { type: 'success', msg: `${emails.length}명에게 초대장을 발송했습니다.` } 
        }));
      }
      
      setEmailList('');
    } catch (error) {
      console.error('Failed to send invites:', error);
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    window.dispatchEvent(new CustomEvent('toast', { 
      detail: { type: 'success', msg: '초대 링크가 클립보드에 복사되었습니다.' } 
    }));
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          팀 정보를 불러오는 중...
        </div>
      </div>
    );
  }

  if (myTeams.length === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
        <h2 style={{ fontSize: '24px', color: '#2c3e50', marginBottom: '16px' }}>
          리더 권한이 있는 팀이 없습니다
        </h2>
        <p style={{ fontSize: '16px', color: '#636e72', marginBottom: '24px' }}>
          팀을 생성하거나 리더 권한을 받으면 멤버를 초대할 수 있습니다.
        </p>
        <button
          onClick={() => navigate('/teams')}
          style={{
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          팀 목록으로 이동
        </button>
      </div>
    );
  }

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
            👥 팀 멤버 초대
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#636e72' }}>
            새로운 팀원을 초대하여 함께 협업하세요
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

      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 팀 선택 */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '16px' }}>
            📋 초대할 팀 선택
          </h2>
          <select
            value={selectedTeam}
            onChange={(e) => handleTeamChange(e.target.value)}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontSize: '14px',
              background: 'white'
            }}
          >
            {myTeams.map((team) => (
              <option key={team._id} value={team._id}>
                {team.name} ({team.memberCount || 0}명)
              </option>
            ))}
          </select>
        </div>

        {/* 초대 방법 선택 */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', color: '#2c3e50', marginBottom: '16px' }}>
            📨 초대 방법 선택
          </h2>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
            <button
              onClick={() => setInviteMethod('email')}
              style={{
                flex: 1,
                padding: '16px',
                border: inviteMethod === 'email' ? '2px solid #3498db' : '2px solid #e9ecef',
                borderRadius: '8px',
                background: inviteMethod === 'email' ? '#f0f8ff' : 'white',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📧</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                이메일 초대
              </div>
              <div style={{ fontSize: '12px', color: '#636e72' }}>
                이메일로 직접 초대장 발송
              </div>
            </button>
            
            <button
              onClick={() => setInviteMethod('link')}
              style={{
                flex: 1,
                padding: '16px',
                border: inviteMethod === 'link' ? '2px solid #3498db' : '2px solid #e9ecef',
                borderRadius: '8px',
                background: inviteMethod === 'link' ? '#f0f8ff' : 'white',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔗</div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                초대 링크
              </div>
              <div style={{ fontSize: '12px', color: '#636e72' }}>
                링크를 공유하여 초대
              </div>
            </button>
          </div>
        </div>

        {/* 이메일 초대 */}
        {inviteMethod === 'email' && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', color: '#2c3e50', marginBottom: '12px' }}>
              📧 초대할 이메일 주소 입력
            </h3>
            <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '16px' }}>
              한 줄에 하나씩 이메일 주소를 입력하세요
            </p>
            <textarea
              value={emailList}
              onChange={(e) => setEmailList(e.target.value)}
              placeholder="user1@example.com&#10;user2@example.com&#10;user3@example.com"
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                resize: 'vertical',
                fontFamily: 'monospace'
              }}
            />
            <button
              onClick={handleSendInvites}
              disabled={!emailList.trim() || sending}
              style={{
                background: !emailList.trim() || sending ? '#95a5a6' : '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: !emailList.trim() || sending ? 'not-allowed' : 'pointer',
                marginTop: '16px'
              }}
            >
              {sending ? '발송 중...' : '초대장 발송'}
            </button>
          </div>
        )}

        {/* 링크 초대 */}
        {inviteMethod === 'link' && (
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '16px', color: '#2c3e50', marginBottom: '12px' }}>
              🔗 초대 링크 공유
            </h3>
            <p style={{ fontSize: '14px', color: '#636e72', marginBottom: '16px' }}>
              아래 링크를 복사하여 초대하고 싶은 사람에게 공유하세요
            </p>
            <div style={{
              background: '#f8f9fa',
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: 'white',
                    fontFamily: 'monospace'
                  }}
                />
                <button
                  onClick={copyInviteLink}
                  style={{
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  복사
                </button>
              </div>
            </div>
            
            <div style={{
              background: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '12px',
              color: '#856404'
            }}>
              ⚠️ 보안 안내: 이 링크는 7일 후 자동으로 만료됩니다. 신뢰할 수 있는 사람에게만 공유하세요.
            </div>
          </div>
        )}

        {/* 초대 현황 */}
        <div>
          <h3 style={{ fontSize: '16px', color: '#2c3e50', marginBottom: '12px' }}>
            📊 최근 초대 현황
          </h3>
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '14px', color: '#636e72' }}>
              초대 현황 정보가 여기에 표시됩니다
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}