import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ActionNeeded({ summary }) {
  const navigate = useNavigate();
  const kpi = summary?.kpi || {};
  const dueSoon = summary?.dueSoon || [];

  // 실제 데이터 사용: 마감 임박 보고서를 내 작업으로 표시
  const myTasks = dueSoon.map(report => ({
    id: report._id,
    title: `보고서 작성: ${report.title || 'Untitled Report'}`,
    type: 'report',
    priority: getDuePriority(report.dueAt),
    dueAt: new Date(report.dueAt),
    teamName: report.team
  })).slice(0, 3);

  // 실제 데이터 사용: summary의 notifications를 알림으로 표시
  const recentNotifications = (summary?.notifications || []).map((notif, index) => ({
    id: index + 1,
    type: getNotificationType(notif.type),
    title: getNotificationTitle(notif.type),
    message: notif.message,
    timestamp: getRelativeTime(new Date()),
    isRead: false
  })).slice(0, 5);

  const getDuePriority = (dueDate) => {
    const now = new Date();
    const diffTime = new Date(dueDate) - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 1) return 'high';
    if (diffDays <= 3) return 'medium';
    return 'low';
  };

  const getNotificationType = (type) => {
    const typeMap = {
      'approval': 'team_update',
      'role_request': 'team_update',
      'overdue': 'deadline'
    };
    return typeMap[type] || 'mention';
  };

  const getNotificationTitle = (type) => {
    const titleMap = {
      'approval': '승인 요청 알림',
      'role_request': '권한 요청 알림',
      'overdue': '마감일 지연 알림'
    };
    return titleMap[type] || '새 알림';
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'report': return '📝';
      case 'review': return '👀';
      case 'task': return '📋';
      case 'mention': return '💬';
      case 'deadline': return '⏰';
      case 'team_update': return '👥';
      default: return '📌';
    }
  };

  const formatDueTime = (date) => {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays > 1) return `${diffDays}일 후`;
    return '지연됨';
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
        ⚡ 액션 필요 목록
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        height: 'fit-content'
      }}>
        {/* 내가 처리해야 할 작업 */}
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
            📋 처리해야 할 작업
          </h3>
          
          <div style={{ space: '12px' }}>
            {myTasks.slice(0, 3).map((task) => (
              <div key={task.id} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '12px',
                border: `1px solid ${getPriorityColor(task.priority)}30`,
                borderLeft: `4px solid ${getPriorityColor(task.priority)}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (task.type === 'report') navigate('/reports/create');
                else if (task.type === 'review') navigate('/reviews');
                else navigate('/tasks');
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#e8f4f8';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#f8f9fa';
                e.currentTarget.style.transform = 'translateX(0)';
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '8px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <span style={{ fontSize: '16px' }}>
                      {getTypeIcon(task.type)}
                    </span>
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        margin: '0 0 2px 0'
                      }}>
                        {task.title}
                      </h4>
                      <p style={{
                        fontSize: '12px',
                        color: '#636e72',
                        margin: 0
                      }}>
                        {task.teamName}
                      </p>
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: '4px'
                  }}>
                    <span style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: `${getPriorityColor(task.priority)}20`,
                      color: getPriorityColor(task.priority),
                      fontWeight: '600'
                    }}>
                      {task.priority}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      color: '#636e72'
                    }}>
                      {formatDueTime(task.dueAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {myTasks.length > 3 && (
              <div style={{
                textAlign: 'center',
                marginTop: '12px'
              }}>
                <button style={{
                  background: 'none',
                  border: 'none',
                  color: '#3498db',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
                onClick={() => navigate('/tasks')}>
                  {myTasks.length - 3}개 더 보기 →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 최근 알림 */}
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
            🔔 최근 알림
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            {recentNotifications.map((notification) => (
              <div key={notification.id} style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: '12px 0',
                borderBottom: '1px solid #dee2e6',
                cursor: 'pointer',
                opacity: notification.isRead ? 0.7 : 1
              }}
              onClick={() => {
                // 알림 읽음 처리 로직
                console.log('Mark as read:', notification.id);
              }}>
                <div style={{
                  fontSize: '16px',
                  marginRight: '12px',
                  marginTop: '2px'
                }}>
                  {getTypeIcon(notification.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#2c3e50',
                    margin: '0 0 4px 0'
                  }}>
                    {notification.title}
                  </h4>
                  
                  <p style={{
                    fontSize: '12px',
                    color: '#636e72',
                    margin: '0 0 4px 0',
                    lineHeight: 1.4
                  }}>
                    {notification.message}
                  </p>
                  
                  <div style={{
                    fontSize: '10px',
                    color: '#95a5a6'
                  }}>
                    {notification.timestamp}
                  </div>
                </div>
                
                {!notification.isRead && (
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: '#3498db',
                    marginTop: '8px'
                  }} />
                )}
              </div>
            ))}
            
            <div style={{
              textAlign: 'center',
              marginTop: '16px'
            }}>
              <button style={{
                background: 'none',
                border: 'none',
                color: '#3498db',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
              onClick={() => navigate('/notification-center')}>
                모든 알림 보기 →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}