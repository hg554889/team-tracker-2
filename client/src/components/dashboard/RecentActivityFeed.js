import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function RecentActivityFeed({ summary, user }) {
  const navigate = useNavigate();

  // 최근 활동 피드 데이터 (임시)
  const activities = [
    {
      id: 1,
      type: 'report_submitted',
      actor: '김개발',
      action: '보고서를 제출했습니다',
      target: '주간 프로젝트 보고서',
      team: '프론트엔드팀',
      timestamp: '30분 전',
      icon: '📝',
      color: '#2ecc71'
    },
    {
      id: 2,
      type: 'team_joined',
      actor: '박신입',
      action: '팀에 합류했습니다',
      target: null,
      team: '백엔드팀',
      timestamp: '1시간 전',
      icon: '👋',
      color: '#3498db'
    },
    {
      id: 3,
      type: 'comment_added',
      actor: '이리더',
      action: '댓글을 남겼습니다',
      target: '월간 성과 보고서',
      team: '기획팀',
      timestamp: '2시간 전',
      icon: '💬',
      color: '#9b59b6'
    },
    {
      id: 4,
      type: 'task_completed',
      actor: '최개발',
      action: '작업을 완료했습니다',
      target: 'API 개발',
      team: '백엔드팀',
      timestamp: '3시간 전',
      icon: '✅',
      color: '#2ecc71'
    },
    {
      id: 5,
      type: 'meeting_scheduled',
      actor: '김팀장',
      action: '회의를 예약했습니다',
      target: '스프린트 계획 회의',
      team: '전체',
      timestamp: '4시간 전',
      icon: '📅',
      color: '#f39c12'
    },
    {
      id: 6,
      type: 'goal_achieved',
      actor: 'UI팀',
      action: '목표를 달성했습니다',
      target: '90% 진행률 달성',
      team: 'UI팀',
      timestamp: '6시간 전',
      icon: '🎯',
      color: '#e67e22'
    },
    {
      id: 7,
      type: 'review_requested',
      actor: '박개발',
      action: '리뷰를 요청했습니다',
      target: '사용자 인증 모듈',
      team: '보안팀',
      timestamp: '8시간 전',
      icon: '👀',
      color: '#34495e'
    },
    {
      id: 8,
      type: 'milestone_reached',
      actor: '프로젝트 A',
      action: '마일스톤에 도달했습니다',
      target: 'Alpha 버전 완료',
      team: '개발팀',
      timestamp: '12시간 전',
      icon: '🚀',
      color: '#e74c3c'
    }
  ];

  // 활동 타입별 그룹화
  const activityGroups = {
    today: activities.filter(a => ['30분 전', '1시간 전', '2시간 전', '3시간 전', '4시간 전', '6시간 전', '8시간 전'].includes(a.timestamp)),
    yesterday: activities.filter(a => a.timestamp === '12시간 전')
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