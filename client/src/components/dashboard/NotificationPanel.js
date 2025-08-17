import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function NotificationPanel({ notifications = [] }) {
  const navigate = useNavigate();

  if (notifications.length === 0) {
    return null;
  }

  const getNotificationStyle = (type) => {
    switch (type) {
      case 'approval':
        return { backgroundColor: '#fff3cd', color: '#856404', borderColor: '#ffeaa7' };
      case 'role_request':
        return { backgroundColor: '#d1ecf1', color: '#0c5460', borderColor: '#bee5eb' };
      case 'overdue':
        return { backgroundColor: '#f8d7da', color: '#721c24', borderColor: '#f5c6cb' };
      default:
        return { backgroundColor: '#e2e3e5', color: '#383d41', borderColor: '#d6d8db' };
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'approval': return '👤';
      case 'role_request': return '🔐';
      case 'overdue': return '⚠️';
      default: return '📢';
    }
  };

  return (
    <div className="card" style={{ marginBottom: '24px' }}>
      <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', color: '#2c3e50' }}>
        🔔 알림
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {notifications.map((notification, index) => (
          <div
            key={index}
            style={{
              ...getNotificationStyle(notification.type),
              padding: '12px 16px',
              borderRadius: '6px',
              border: '1px solid',
              cursor: notification.link ? 'pointer' : 'default',
              transition: 'opacity 0.2s ease'
            }}
            onClick={() => notification.link && navigate(notification.link)}
            onMouseEnter={(e) => {
              if (notification.link) {
                e.target.style.opacity = '0.8';
              }
            }}
            onMouseLeave={(e) => {
              if (notification.link) {
                e.target.style.opacity = '1';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>{getIcon(notification.type)}</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>
                {notification.message}
              </span>
              {notification.count && (
                <span style={{
                  backgroundColor: 'rgba(0,0,0,0.1)',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  {notification.count}
                </span>
              )}
              {notification.link && (
                <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
                  클릭하여 확인 →
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}