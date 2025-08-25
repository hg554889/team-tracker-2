import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ActionRequired({ summary }) {
  const navigate = useNavigate();
  const dueSoon = summary?.dueSoon || [];
  
  // 승인 대기 중인 팀원 (실제 데이터 기반)
  const pendingMembers = summary?.additionalStats?.pendingJoinRequests || [];

  // 마감 임박 보고서
  const urgentReports = dueSoon.filter(report => {
    const dueDate = new Date(report.dueAt);
    const now = new Date();
    const diffHours = (dueDate - now) / (1000 * 60 * 60);
    return diffHours <= 48; // 48시간 이내
  });

  // 팀 내 이슈 알림 (실제 데이터 기반)
  const teamIssues = summary?.additionalStats?.teamIssues || [];

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const formatDueTime = (dueAt) => {
    const now = new Date();
    const due = new Date(dueAt);
    const diffHours = Math.ceil((due - now) / (1000 * 60 * 60));
    
    if (diffHours <= 0) return '지연됨';
    if (diffHours <= 24) return `${diffHours}시간 후`;
    const diffDays = Math.ceil(diffHours / 24);
    return `${diffDays}일 후`;
  };

  const actionItems = [
    {
      id: 'pending-members',
      title: '승인 대기 중인 팀원',
      count: pendingMembers.length,
      icon: '👤',
      color: '#f39c12',
      items: pendingMembers
    },
    {
      id: 'urgent-reports',
      title: '마감 임박 보고서',
      count: urgentReports.length,
      icon: '📝',
      color: '#e74c3c',
      items: urgentReports
    },
    {
      id: 'team-issues',
      title: '팀 내 이슈 알림',
      count: teamIssues.length,
      icon: '⚠️',
      color: '#9b59b6',
      items: teamIssues
    }
  ];

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
        ⚠️ 액션 필요
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {actionItems.map((action) => (
          action.count > 0 && (
            <div key={action.id} style={{ marginBottom: '24px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '16px',
                  marginRight: '8px'
                }}>
                  {action.icon}
                </span>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  margin: 0,
                  flex: 1
                }}>
                  {action.title}
                </h3>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: action.color,
                  background: `${action.color}15`,
                  padding: '4px 8px',
                  borderRadius: '12px'
                }}>
                  {action.count}건
                </span>
              </div>

              {/* 승인 대기 중인 팀원 */}
              {action.id === 'pending-members' && (
                <div style={{
                  background: '#fff8dc',
                  border: '1px solid #f39c12',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  {pendingMembers.map((member) => (
                    <div key={member._id || member.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #f1c40f30'
                    }}>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '2px'
                        }}>
                          {member.userId?.username || member.name || 'Unknown'}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#636e72'
                        }}>
                          {member.userId?.email || member.email || ''} · {new Date(member.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{
                        display: 'flex',
                        gap: '6px'
                      }}>
                        <button style={{
                          background: '#2ecc71',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}>
                          승인
                        </button>
                        <button style={{
                          background: '#e74c3c',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          fontSize: '10px',
                          cursor: 'pointer'
                        }}>
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 마감 임박 보고서 */}
              {action.id === 'urgent-reports' && urgentReports.length > 0 && (
                <div style={{
                  background: '#fff5f5',
                  border: '1px solid #e74c3c',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  {urgentReports.map((report) => (
                    <div key={report._id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: '1px solid #e74c3c30',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/reports/${report._id}`)}>
                      <div>
                        <div style={{
                          fontSize: '13px',
                          fontWeight: '600',
                          color: '#2c3e50',
                          marginBottom: '2px'
                        }}>
                          {report.title || 'Untitled Report'}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#636e72'
                        }}>
                          {report.team} · {report.progress}% 완료
                        </div>
                      </div>
                      <div style={{
                        fontSize: '12px',
                        fontWeight: '600',
                        color: '#e74c3c'
                      }}>
                        {formatDueTime(report.dueAt)}
                      </div>
                    </div>
                  ))}
                  <div style={{
                    textAlign: 'right',
                    marginTop: '12px'
                  }}>
                    <button style={{
                      background: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '6px 12px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/reports')}>
                      모두 보기
                    </button>
                  </div>
                </div>
              )}

              {/* 팀 내 이슈 알림 */}
              {action.id === 'team-issues' && (
                <div style={{
                  background: '#f8f5ff',
                  border: '1px solid #9b59b6',
                  borderRadius: '8px',
                  padding: '16px'
                }}>
                  {teamIssues.map((issue) => (
                    <div key={issue.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      padding: '12px 0',
                      borderBottom: '1px solid #9b59b630'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <h4 style={{
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#2c3e50',
                            margin: '0 8px 0 0'
                          }}>
                            {issue.title}
                          </h4>
                          <span style={{
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '10px',
                            background: `${getSeverityColor(issue.severity)}20`,
                            color: getSeverityColor(issue.severity),
                            fontWeight: '600'
                          }}>
                            {issue.severity}
                          </span>
                        </div>
                        <p style={{
                          fontSize: '11px',
                          color: '#636e72',
                          margin: '0 0 4px 0',
                          lineHeight: 1.4
                        }}>
                          {issue.description}
                        </p>
                        <div style={{
                          fontSize: '10px',
                          color: '#95a5a6'
                        }}>
                          {new Date(issue.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <button style={{
                        background: '#9b59b6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer',
                        marginLeft: '12px'
                      }}>
                        처리하기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        ))}

        {/* 모든 액션이 완료된 경우 */}
        {actionItems.every(action => action.count === 0) && (
          <div style={{
            textAlign: 'center',
            padding: '40px 20px',
            color: '#2ecc71'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '16px'
            }}>
              ✨
            </div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#2ecc71',
              margin: '0 0 8px 0'
            }}>
              모든 작업 완료!
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#636e72',
              margin: 0
            }}>
              현재 처리할 긴급한 작업이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}