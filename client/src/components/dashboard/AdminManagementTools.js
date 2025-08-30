import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminManagementTools() {
  const navigate = useNavigate();

  const managementTools = [
    {
      id: 'users',
      title: '사용자 관리',
      description: '사용자 승인, 권한 관리',
      icon: '👥',
      color: '#3498db',
      action: () => navigate('/admin/users')
    },
    {
      id: 'clubs',
      title: '동아리 관리',
      description: '동아리 생성, 설정 관리',
      icon: '🏛️',
      color: '#9b59b6',
      action: () => navigate('/admin/clubs')
    },
    {
      id: 'teams',
      title: '팀 관리',
      description: '전체 팀 현황 및 관리',
      icon: '🚀',
      color: '#2ecc71',
      action: () => navigate('/teams')
    },
    {
      id: 'reports',
      title: '보고서 관리',
      description: '전체 보고서 현황 조회',
      icon: '📊',
      color: '#e67e22',
      action: () => navigate('/reports')
    },
    {
      id: 'system',
      title: '시스템 설정',
      description: '시스템 환경 설정',
      icon: '⚙️',
      color: '#95a5a6',
      action: () => navigate('/admin/settings')
    },
    {
      id: 'analytics',
      title: '분석 도구',
      description: '상세 통계 및 분석',
      icon: '📈',
      color: '#f39c12',
      action: () => navigate('/admin/analytics')
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
        🔧 관리 도구 바로가기
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'grid',
          gap: '12px'
        }}>
          {managementTools.map((tool) => (
            <div 
              key={tool.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '16px',
                borderRadius: '8px',
                border: `1px solid ${tool.color}20`,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: '#ffffff'
              }}
              onClick={tool.action}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `${tool.color}08`;
                e.currentTarget.style.borderColor = `${tool.color}40`;
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = `${tool.color}20`;
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              <div style={{
                fontSize: '24px',
                marginRight: '12px',
                width: '32px',
                textAlign: 'center'
              }}>
                {tool.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '2px'
                }}>
                  {tool.title}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#636e72'
                }}>
                  {tool.description}
                </div>
              </div>
              <div style={{
                fontSize: '16px',
                color: tool.color,
                opacity: 0.7
              }}>
                →
              </div>
            </div>
          ))}
        </div>

        {/* AI 도우미 섹션 */}
        <div style={{
          marginTop: '20px',
          padding: '16px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px'
          }}>
            <span style={{ fontSize: '20px', marginRight: '8px' }}>🤖</span>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>AI 관리 도우미</span>
          </div>
          <p style={{
            fontSize: '12px',
            margin: '0 0 12px 0',
            opacity: 0.9
          }}>
            시스템 상태를 분석하고 최적화 제안을 받아보세요
          </p>
          <button 
            onClick={() => navigate('/admin/analytics')}
            style={{
            background: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '6px',
            color: 'white',
            padding: '6px 12px',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255,255,255,0.2)';
          }}>
            AI 분석 시작하기
          </button>
        </div>
      </div>
    </div>
  );
}