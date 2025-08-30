import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecentActivityFeed({ summary, user }) {
  const navigate = useNavigate();

  // 실제 데이터에서 최근 활동 생성
  const generateActivitiesFromSummary = (summary) => {
    const activities = [];
    const now = new Date();

    // summary에서 실제 데이터 추출
    const myTeamsProgress = summary?.myTeamsProgress || [];
    const additionalStats = summary?.additionalStats || {};
    const recentTeamActivities = additionalStats.recentTeamActivities || [];
    const kpi = summary?.kpi || {};

    // 실제 팀 활동들을 기반으로 활동 피드 생성
    if (recentTeamActivities.length > 0) {
      recentTeamActivities.slice(0, 5).forEach((activity, index) => {
        activities.push({
          id: `real_${index}`,
          type: activity.type,
          actor: activity.message.includes('님이') ? activity.message.split('님이')[0] : user?.username || '사용자',
          action: activity.type === 'report_submitted' ? '보고서를 제출했습니다' : '활동했습니다',
          target: activity.teamName || '프로젝트',
          team: activity.teamName || '팀',
          timestamp: getTimeAgo(new Date(activity.timestamp)),
          icon: getActivityIcon(activity.type),
          color: getActivityColor(activity.type)
        });
      });
    }

    // 내가 참여한 팀들의 가상 최근 활동 생성
    myTeamsProgress.forEach((team, index) => {
      if (index < 3) { // 최대 3개 팀의 활동만
        const progress = team.history?.[team.history.length - 1] || 0;
        const timeOffset = Math.random() * 24; // 24시간 내 랜덤
        
        activities.push({
          id: `team_${team.teamId}`,
          type: 'progress_update',
          actor: user?.username || '사용자',
          action: progress >= 80 ? '우수한 성과를 달성했습니다' : '진행률을 업데이트했습니다',
          target: `${progress}% 달성`,
          team: team.teamName,
          timestamp: getTimeAgo(new Date(now.getTime() - timeOffset * 60 * 60 * 1000)),
          icon: progress >= 80 ? '🎯' : '📊',
          color: progress >= 80 ? '#2ecc71' : '#3498db'
        });
      }
    });

    // 개인 활동 기반 활동 생성
    if (kpi.myReportsThisWeek > 0) {
      activities.push({
        id: 'my_reports',
        type: 'report_submitted',
        actor: user?.username || '나',
        action: '이번 주 보고서를 제출했습니다',
        target: `${kpi.myReportsThisWeek}건의 보고서`,
        team: '내 활동',
        timestamp: getTimeAgo(new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)),
        icon: '📝',
        color: '#2ecc71'
      });
    }

    // 기본 활동이 없으면 환영 메시지
    if (activities.length === 0) {
      activities.push({
        id: 'welcome',
        type: 'welcome',
        actor: '시스템',
        action: '환영합니다!',
        target: '첫 활동을 시작해보세요',
        team: '전체',
        timestamp: '방금 전',
        icon: '👋',
        color: '#3498db'
      });
    }

    return activities.sort((a, b) => getTimeValue(a.timestamp) - getTimeValue(b.timestamp));
  };

  // 시간 차이 계산
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return `${Math.floor(diffInDays / 7)}주 전`;
  };

  // 활동 타입별 아이콘
  const getActivityIcon = (type) => {
    const icons = {
      report_submitted: '📝',
      progress_update: '📊',
      team_joined: '👋',
      welcome: '👋',
      task_completed: '✅',
      goal_achieved: '🎯'
    };
    return icons[type] || '📱';
  };

  // 활동 타입별 색상
  const getActivityColor = (type) => {
    const colors = {
      report_submitted: '#2ecc71',
      progress_update: '#3498db',
      team_joined: '#9b59b6',
      welcome: '#3498db',
      task_completed: '#2ecc71',
      goal_achieved: '#e67e22'
    };
    return colors[type] || '#636e72';
  };

  // 시간 값으로 변환 (정렬용)
  const getTimeValue = (timeStr) => {
    if (timeStr.includes('방금')) return 0;
    if (timeStr.includes('분 전')) return parseInt(timeStr);
    if (timeStr.includes('시간 전')) return parseInt(timeStr) * 60;
    if (timeStr.includes('일 전')) return parseInt(timeStr) * 60 * 24;
    if (timeStr.includes('주 전')) return parseInt(timeStr) * 60 * 24 * 7;
    return 9999;
  };

  // 실제 데이터에서 활동 생성
  const activities = generateActivitiesFromSummary(summary);

  // 활동 타입별 그룹화
  const activityGroups = {
    today: activities.filter(a => {
      const timeValue = getTimeValue(a.timestamp);
      return timeValue < 24 * 60; // 24시간 내
    }),
    yesterday: activities.filter(a => {
      const timeValue = getTimeValue(a.timestamp);
      return timeValue >= 24 * 60 && timeValue < 48 * 60; // 24-48시간 전
    })
  };

  const getActivityDescription = (activity) => {
    const parts = [];
    
    if (activity.actor) {
      parts.push(
        <strong key="actor" style={{ color: activity.color }}>
          {activity.actor}
        </strong>
      );
    }
    
    parts.push(<span key="action"> {activity.action}</span>);
    
    if (activity.target) {
      parts.push(
        <span key="target" style={{ fontWeight: '500', color: '#2c3e50' }}>
          {' '}{activity.target}
        </span>
      );
    }
    
    if (activity.team) {
      parts.push(
        <span key="team" style={{ color: '#636e72', fontSize: '12px' }}>
          {' in '}{activity.team}
        </span>
      );
    }
    
    return parts;
  };

  return (
    <div>
      <h2 style={{ 
        fontSize: '20px', 
        color: '#2c3e50', 
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        📱 최근 활동 피드
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 필터 옵션 */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          padding: '4px',
          background: '#f8f9fa',
          borderRadius: '8px'
        }}>
          {['전체', '내 팀', '내 활동'].map((filter, index) => (
            <button key={index} style={{
              flex: 1,
              padding: '8px 12px',
              border: 'none',
              background: index === 0 ? '#3498db' : 'transparent',
              color: index === 0 ? 'white' : '#636e72',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}>
              {filter}
            </button>
          ))}
        </div>

        {/* 오늘 활동 */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '14px',
            color: '#2c3e50',
            marginBottom: '12px',
            fontWeight: '600',
            padding: '8px 0',
            borderBottom: '1px solid #e9ecef'
          }}>
            📅 오늘
          </h3>
          
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto'
          }}>
            {activityGroups.today.map((activity, index) => (
              <div key={activity.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: index < activityGroups.today.length - 1 ? '1px solid #f8f9fa' : 'none',
                position: 'relative',
                cursor: 'pointer'
              }}
              onClick={() => {
                // 활동별 상세 페이지로 이동
                if (activity.type === 'report_submitted') navigate('/reports');
                else if (activity.type === 'team_joined') navigate('/teams');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}>
                {/* 타임라인 라인 */}
                {index < activityGroups.today.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '36px',
                    bottom: '-12px',
                    width: '1px',
                    background: '#e9ecef'
                  }} />
                )}
                
                {/* 아이콘 */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: `${activity.color}15`,
                  border: `2px solid ${activity.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  marginRight: '16px',
                  position: 'relative',
                  zIndex: 1
                }}>
                  {activity.icon}
                </div>
                
                {/* 내용 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: '14px',
                    lineHeight: 1.4,
                    marginBottom: '4px'
                  }}>
                    {getActivityDescription(activity)}
                  </div>
                  
                  <div style={{
                    fontSize: '12px',
                    color: '#95a5a6'
                  }}>
                    {activity.timestamp}
                  </div>
                </div>
                
                {/* 액션 버튼 */}
                <div style={{
                  opacity: 0,
                  transition: 'opacity 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.parentElement.querySelector('[data-action]').style.opacity = '1';
                }}>
                  <button data-action style={{
                    background: 'none',
                    border: `1px solid ${activity.color}`,
                    color: activity.color,
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    cursor: 'pointer'
                  }}>
                    자세히
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 어제 활동 */}
        {activityGroups.yesterday.length > 0 && (
          <div>
            <h3 style={{
              fontSize: '14px',
              color: '#2c3e50',
              marginBottom: '12px',
              fontWeight: '600',
              padding: '8px 0',
              borderBottom: '1px solid #e9ecef'
            }}>
              📅 어제
            </h3>
            
            <div>
              {activityGroups.yesterday.map((activity) => (
                <div key={activity.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 0',
                  opacity: 0.8
                }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: `${activity.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    marginRight: '12px'
                  }}>
                    {activity.icon}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '13px',
                      lineHeight: 1.4
                    }}>
                      {getActivityDescription(activity)}
                    </div>
                  </div>
                  
                  <div style={{
                    fontSize: '11px',
                    color: '#95a5a6'
                  }}>
                    {activity.timestamp}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 더보기 버튼 */}
        <div style={{
          textAlign: 'center',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e9ecef'
        }}>
          <button style={{
            background: 'none',
            border: '1px solid #3498db',
            color: '#3498db',
            borderRadius: '20px',
            padding: '8px 16px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => navigate('/activity')}
          onMouseEnter={(e) => {
            e.target.style.background = '#3498db';
            e.target.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
            e.target.style.color = '#3498db';
          }}>
            더 많은 활동 보기
          </button>
        </div>
      </div>
    </div>
  );
}