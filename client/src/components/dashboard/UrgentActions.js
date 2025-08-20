import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function UrgentActions({ summary }) {
  const navigate = useNavigate();
  const notifications = summary?.notifications || [];
  const additionalStats = summary?.additionalStats || {};

  const urgentItems = [
    {
      id: 'pending-users',
      title: '사용자 승인 대기',
      count: additionalStats.pendingApprovals || 0,
      icon: '👤',
      color: '#e74c3c',
      description: '승인이 필요한 사용자',
      action: () => navigate('/admin/users?filter=pending')
    },
    {
      id: 'role-requests',
      title: '권한 변경 요청',
      count: additionalStats.pendingRoleRequests || 0,
      icon: '🔐',
      color: '#f39c12',
      description: '처리가 필요한 권한 요청',
      action: () => navigate('/admin/role-requests')
    },
    {
      id: 'inactive-teams',
      title: '비활성 팀',
      count: additionalStats.inactiveTeams || 0,
      icon: '⚠️',
      color: '#95a5a6',
      description: '이번 주 보고서 미제출',
      action: () => navigate('/teams?filter=inactive')
    }
  ];

  const hasUrgentActions = urgentItems.some(item => item.count > 0);

  if (!hasUrgentActions) {
    return (
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '2px solid #2ecc7120',
        borderLeft: '4px solid #2ecc71'
      }}>
        <h2 style={{ 
          fontSize: '20px', 
          color: '#2c3e50', 
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          ✅ 긴급 액션
        </h2>
        <div style={{
          textAlign: 'center',
          color: '#2ecc71',
          padding: '20px'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>✨</div>
          <p style={{ margin: 0, fontSize: '16px', fontWeight: '500' }}>
            모든 항목이 정상입니다!
          </p>
        </div>
      </div>
    );
  }

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
        ⚡ 긴급 액션 필요
      </h2>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '16px'
      }}>
        {urgentItems.map((item) => (
          item.count > 0 && (
            <div 
              key={item.id} 
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                border: `2px solid ${item.color}20`,
                borderLeft: `4px solid ${item.color}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}
              onClick={item.action}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    color: '#2c3e50',
                    margin: '0 0 4px 0',
                    fontWeight: '600'
                  }}>
                    {item.title}
                  </h3>
                  <div style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: item.color,
                    margin: '0 0 8px 0'
                  }}>
                    {item.count}
                  </div>
                  <p style={{
                    fontSize: '14px',
                    color: '#636e72',
                    margin: 0
                  }}>
                    {item.description}
                  </p>
                </div>
                <div style={{
                  fontSize: '32px',
                  opacity: 0.8
                }}>
                  {item.icon}
                </div>
              </div>
              <div style={{
                fontSize: '12px',
                color: item.color,
                fontWeight: '600',
                textAlign: 'right'
              }}>
                클릭하여 처리하기 →
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}