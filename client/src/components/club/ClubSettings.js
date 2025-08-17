import React, { useState, useEffect } from 'react';
import { useClub } from '../../contexts/ClubContext';
import { useAuth } from '../../contexts/AuthContext';

export default function ClubSettings() {
  const { user } = useAuth();
  const { 
    currentClub, 
    clubSettings, 
    updateClubSettings, 
    hasClubPermission,
    getClubDisplayName 
  } = useClub();
  
  const [settings, setSettings] = useState(clubSettings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setSettings(clubSettings);
  }, [clubSettings]);

  if (!hasClubPermission('EDIT_CLUB_SETTINGS')) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#636e72'
      }}>
        동아리 설정을 변경할 권한이 없습니다.
      </div>
    );
  }

  const handleSave = async () => {
    if (!currentClub) return;
    
    setLoading(true);
    try {
      await updateClubSettings(currentClub, settings);
      setMessage('설정이 성공적으로 저장되었습니다.');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('설정 저장에 실패했습니다.');
      setTimeout(() => setMessage(''), 3000);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: 0, color: '#2d3436' }}>
          {getClubDisplayName(currentClub)} 설정
        </h2>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '8px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? '저장 중...' : '설정 저장'}
        </button>
      </div>

      {message && (
        <div style={{
          padding: '12px',
          marginBottom: '20px',
          backgroundColor: message.includes('실패') ? '#ffebee' : '#e8f5e8',
          color: message.includes('실패') ? '#c62828' : '#2e7d32',
          borderRadius: '4px',
          border: `1px solid ${message.includes('실패') ? '#ffcdd2' : '#c8e6c9'}`
        }}>
          {message}
        </div>
      )}

      {/* 보고서 설정 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>📊 보고서 설정</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              기본 제출 기한 (일)
            </label>
            <input
              type="number"
              min="1"
              max="30"
              value={settings.reportSettings?.defaultDueDays || 7}
              onChange={(e) => updateSetting('reportSettings', 'defaultDueDays', parseInt(e.target.value))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '100px'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.reportSettings?.allowLateSubmission || false}
                onChange={(e) => updateSetting('reportSettings', 'allowLateSubmission', e.target.checked)}
              />
              늦은 제출 허용
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.reportSettings?.requireWeeklyReports || false}
                onChange={(e) => updateSetting('reportSettings', 'requireWeeklyReports', e.target.checked)}
              />
              주간 보고서 필수
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              최대 팀 크기
            </label>
            <input
              type="number"
              min="2"
              max="50"
              value={settings.reportSettings?.maxTeamSize || 10}
              onChange={(e) => updateSetting('reportSettings', 'maxTeamSize', parseInt(e.target.value))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '100px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 팀 설정 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>👥 팀 설정</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.teamSettings?.allowMemberCreateTeam || false}
                onChange={(e) => updateSetting('teamSettings', 'allowMemberCreateTeam', e.target.checked)}
              />
              일반 멤버의 팀 생성 허용
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.teamSettings?.requireLeaderApproval || false}
                onChange={(e) => updateSetting('teamSettings', 'requireLeaderApproval', e.target.checked)}
              />
              팀 가입 시 리더 승인 필요
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              사용자당 최대 팀 수
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.teamSettings?.maxTeamsPerUser || 3}
              onChange={(e) => updateSetting('teamSettings', 'maxTeamsPerUser', parseInt(e.target.value))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '100px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>🔔 알림 설정</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.notificationSettings?.emailNotifications || false}
                onChange={(e) => updateSetting('notificationSettings', 'emailNotifications', e.target.checked)}
              />
              이메일 알림 활성화
            </label>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={settings.notificationSettings?.dueDateReminders || false}
                onChange={(e) => updateSetting('notificationSettings', 'dueDateReminders', e.target.checked)}
              />
              마감일 알림
            </label>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              알림 사전 일수
            </label>
            <input
              type="number"
              min="1"
              max="7"
              value={settings.notificationSettings?.reminderDaysBefore || 2}
              onChange={(e) => updateSetting('notificationSettings', 'reminderDaysBefore', parseInt(e.target.value))}
              style={{
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                width: '100px'
              }}
            />
          </div>
        </div>
      </div>

      {/* 테마 설정 */}
      <div>
        <h3 style={{ marginBottom: '15px', color: '#495057' }}>🎨 테마 설정</h3>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '20px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              주 색상
            </label>
            <input
              type="color"
              value={settings.theme?.primaryColor || '#007bff'}
              onChange={(e) => updateSetting('theme', 'primaryColor', e.target.value)}
              style={{
                width: '60px',
                height: '40px',
                padding: '2px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              보조 색상
            </label>
            <input
              type="color"
              value={settings.theme?.secondaryColor || '#6c757d'}
              onChange={(e) => updateSetting('theme', 'secondaryColor', e.target.value)}
              style={{
                width: '60px',
                height: '40px',
                padding: '2px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}