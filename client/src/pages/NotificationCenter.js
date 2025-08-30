import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/notifications');
      setNotifications(data);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await client.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      ));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await client.put('/notifications/mark-all-read');
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '모든 알림을 읽음으로 표시했습니다.' } 
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await client.delete(`/notifications/${notificationId}`);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'team_invite': return '👥';
      case 'report_due': return '📝';
      case 'task_assigned': return '📋';
      case 'mention': return '💬';
      case 'approval': return '✅';
      case 'deadline': return '⏰';
      case 'team_update': return '📢';
      case 'system': return '🔧';
      default: return '📌';
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'team_invite': return '#3498db';
      case 'report_due': return '#e74c3c';
      case 'task_assigned': return '#2ecc71';
      case 'mention': return '#9b59b6';
      case 'approval': return '#f39c12';
      case 'deadline': return '#e67e22';
      case 'team_update': return '#1abc9c';
      case 'system': return '#34495e';
      default: return '#95a5a6';
    }
  };

  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - new Date(date);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return new Date(date).toLocaleDateString();
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread': return !notification.isRead;
      case 'team': return ['team_invite', 'team_update'].includes(notification.type);
      case 'task': return ['task_assigned', 'report_due', 'deadline'].includes(notification.type);
      default: return true;
    }
  });

  const filters = [
    { id: 'all', label: '전체', count: notifications.length },
    { id: 'unread', label: '읽지 않음', count: notifications.filter(n => !n.isRead).length },
    { id: 'team', label: '팀', count: notifications.filter(n => ['team_invite', 'team_update'].includes(n.type)).length },
    { id: 'task', label: '작업', count: notifications.filter(n => ['task_assigned', 'report_due', 'deadline'].includes(n.type)).length }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          알림을 불러오는 중...
        </div>
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
            🔔 알림 센터
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#636e72' }}>
            중요한 알림과 업데이트를 확인하세요
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleMarkAllAsRead}
            style={{
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            모두 읽음
          </button>
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
      </div>

      {/* 필터 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        marginBottom: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filters.map((filterItem) => (
            <button
              key={filterItem.id}
              onClick={() => setFilter(filterItem.id)}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: filter === filterItem.id ? '#3498db' : 'transparent',
                color: filter === filterItem.id ? 'white' : '#636e72',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {filterItem.label}
              <span style={{
                background: filter === filterItem.id ? 'rgba(255,255,255,0.3)' : '#e9ecef',
                padding: '2px 6px',
                borderRadius: '10px',
                fontSize: '12px'
              }}>
                {filterItem.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 알림 목록 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {filteredNotifications.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔕</div>
            <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '8px' }}>
              {filter === 'all' ? '알림이 없습니다' : '해당하는 알림이 없습니다'}
            </h3>
            <p style={{ fontSize: '14px', color: '#636e72' }}>
              새로운 알림이 오면 여기에 표시됩니다
            </p>
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification, index) => (
              <div
                key={notification._id}
                style={{
                  padding: '20px',
                  borderBottom: index < filteredNotifications.length - 1 ? '1px solid #f8f9fa' : 'none',
                  background: notification.isRead ? 'transparent' : '#f8f9ff',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
                onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = notification.isRead ? '#f8f9fa' : '#f0f0ff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = notification.isRead ? 'transparent' : '#f8f9ff';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* 타입 아이콘 */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: `${getTypeColor(notification.type)}20`,
                    border: `2px solid ${getTypeColor(notification.type)}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    flexShrink: 0
                  }}>
                    {getTypeIcon(notification.type)}
                  </div>

                  {/* 내용 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '8px'
                    }}>
                      <h3 style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        margin: 0
                      }}>
                        {notification.title}
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!notification.isRead && (
                          <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#3498db'
                          }} />
                        )}
                        <span style={{
                          fontSize: '12px',
                          color: '#95a5a6'
                        }}>
                          {getRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p style={{
                      fontSize: '14px',
                      color: '#636e72',
                      margin: '0 0 12px 0',
                      lineHeight: 1.5
                    }}>
                      {notification.message}
                    </p>

                    {notification.actionUrl && (
                      <a
                        href={notification.actionUrl}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(notification.actionUrl);
                        }}
                        style={{
                          fontSize: '12px',
                          color: '#3498db',
                          textDecoration: 'none',
                          fontWeight: '600'
                        }}
                      >
                        자세히 보기 →
                      </a>
                    )}
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(notification._id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#95a5a6',
                      cursor: 'pointer',
                      padding: '4px',
                      fontSize: '16px',
                      borderRadius: '4px',
                      opacity: 0.6,
                      transition: 'opacity 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.opacity = '1';
                      e.target.style.color = '#e74c3c';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.opacity = '0.6';
                      e.target.style.color = '#95a5a6';
                    }}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 설정 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '16px' }}>
          ⚙️ 알림 설정
        </h3>
        <div style={{ display: 'grid', gap: '12px' }}>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#2c3e50',
            cursor: 'pointer'
          }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
            팀 초대 알림 받기
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#2c3e50',
            cursor: 'pointer'
          }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
            보고서 마감일 알림 받기
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#2c3e50',
            cursor: 'pointer'
          }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
            작업 할당 알림 받기
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            fontSize: '14px',
            color: '#2c3e50',
            cursor: 'pointer'
          }}>
            <input type="checkbox" defaultChecked style={{ marginRight: '8px' }} />
            이메일 알림 받기
          </label>
        </div>
      </div>
    </div>
  );
}