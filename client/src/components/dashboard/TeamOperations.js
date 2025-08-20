import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function TeamOperations({ summary }) {
  const navigate = useNavigate();

  // 팀원 활동 현황 (임시 데이터)
  const teamMembers = [
    {
      id: 1,
      name: '김개발',
      role: 'DEVELOPER',
      status: 'active',
      lastActivity: '30분 전',
      tasksCompleted: 5,
      tasksTotal: 7,
      avatar: '👨‍💻'
    },
    {
      id: 2,
      name: '박기획',
      role: 'PLANNER',
      status: 'active',
      lastActivity: '2시간 전',
      tasksCompleted: 3,
      tasksTotal: 4,
      avatar: '👨‍💼'
    },
    {
      id: 3,
      name: '이디자인',
      role: 'DESIGNER',
      status: 'inactive',
      lastActivity: '1일 전',
      tasksCompleted: 2,
      tasksTotal: 5,
      avatar: '👩‍🎨'
    },
    {
      id: 4,
      name: '최테스터',
      role: 'TESTER',
      status: 'active',
      lastActivity: '1시간 전',
      tasksCompleted: 4,
      tasksTotal: 4,
      avatar: '👨‍🔬'
    }
  ];

  // 최근 팀 활동 타임라인 (임시 데이터)
  const recentActivities = [
    {
      id: 1,
      type: 'report_submitted',
      message: '김개발님이 주간 보고서를 제출했습니다.',
      timestamp: '2시간 전',
      icon: '📝',
      color: '#2ecc71'
    },
    {
      id: 2,
      type: 'member_joined',
      message: '최테스터님이 팀에 합류했습니다.',
      timestamp: '1일 전',
      icon: '👋',
      color: '#3498db'
    },
    {
      id: 3,
      type: 'task_completed',
      message: '박기획님이 요구사항 분석을 완료했습니다.',
      timestamp: '2일 전',
      icon: '✅',
      color: '#9b59b6'
    },
    {
      id: 4,
      type: 'meeting_scheduled',
      message: '다음 주 화요일 팀 회의가 예정되어 있습니다.',
      timestamp: '3일 전',
      icon: '📅',
      color: '#f39c12'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return '#2ecc71';
      case 'inactive': return '#95a5a6';
      case 'busy': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
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
        👨‍💼 팀 운영
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 팀원 활동 현황 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👥 팀원 활동 현황
          </h3>
          
          <div style={{ space: '12px' }}>
            {teamMembers.map((member) => {
              const progressPercentage = getProgressPercentage(member.tasksCompleted, member.tasksTotal);
              
              return (
                <div key={member.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => navigate(`/users/${member.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e8f4f8';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div style={{
                      fontSize: '24px',
                      marginRight: '12px'
                    }}>
                      {member.avatar}
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '4px'
                      }}>
                        <h4 style={{
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          margin: 0
                        }}>
                          {member.name}
                        </h4>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <div style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: getStatusColor(member.status)
                          }} />
                          <span style={{
                            fontSize: '10px',
                            color: getStatusColor(member.status),
                            fontWeight: '600'
                          }}>
                            {member.status === 'active' ? '활성' : '비활성'}
                          </span>
                        </div>
                      </div>
                      
                      <div style={{
                        fontSize: '12px',
                        color: '#636e72',
                        marginBottom: '8px'
                      }}>
                        {member.role} · 최근 활동: {member.lastActivity}
                      </div>
                      
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        <div style={{
                          flex: 1,
                          height: '6px',
                          background: '#e9ecef',
                          borderRadius: '3px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${progressPercentage}%`,
                            height: '100%',
                            background: progressPercentage === 100 ? '#2ecc71' : progressPercentage >= 70 ? '#3498db' : '#f39c12',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease'
                          }} />
                        </div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: '600',
                          color: '#636e72',
                          minWidth: '45px'
                        }}>
                          {member.tasksCompleted}/{member.tasksTotal}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 팀 활동 타임라인 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📝 최근 팀 활동 타임라인
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            maxHeight: '200px',
            overflowY: 'auto'
          }}>
            {recentActivities.map((activity, index) => (
              <div key={activity.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                marginBottom: index < recentActivities.length - 1 ? '16px' : 0,
                position: 'relative'
              }}>
                {/* 타임라인 라인 */}
                {index < recentActivities.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '12px',
                    top: '24px',
                    bottom: '-16px',
                    width: '1px',
                    background: '#dee2e6'
                  }} />
                )}
                
                <div style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: activity.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10px',
                  marginRight: '12px',
                  zIndex: 1,
                  position: 'relative'
                }}>
                  {activity.icon}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '12px',
                    color: '#2c3e50',
                    marginBottom: '2px',
                    lineHeight: 1.4
                  }}>
                    {activity.message}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#95a5a6'
                  }}>
                    {activity.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 팀 초대 링크 관리 */}
        <div>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔗 팀 초대 링크 관리
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            border: '1px dashed #dee2e6'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px'
            }}>
              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '2px'
                }}>
                  팀 초대 링크
                </div>
                <div style={{
                  fontSize: '10px',
                  color: '#636e72'
                }}>
                  새로운 팀원을 초대할 수 있습니다
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                gap: '8px'
              }}>
                <button style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => {
                  // 초대 링크 복사 로직
                  navigator.clipboard.writeText('https://team-tracker.com/invite/abc123');
                  alert('초대 링크가 클립보드에 복사되었습니다!');
                }}>
                  링크 복사
                </button>
                
                <button style={{
                  background: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/teams/invite')}>
                  멤버 초대
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}