import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MemberStatus({ summary }) {
  const navigate = useNavigate();
  const additionalStats = summary?.additionalStats || {};
  const kpi = summary?.kpi || {};

  // 멤버 현황 데이터
  const leaderCount = additionalStats.roleDistribution?.find(r => r._id === 'LEADER')?.count || 0;
  
  const memberData = [
    {
      label: '전체 멤버',
      value: additionalStats.totalUsers || 0,
      icon: '👥',
      color: '#3498db'
    },
    {
      label: '승인 대기',
      value: additionalStats.pendingApprovals || 0,
      icon: '⏳',
      color: '#f39c12'
    },
    {
      label: '활성 팀장',
      value: leaderCount,
      icon: '👑',
      color: '#9b59b6'
    },
    {
      label: '이번 주 활동',
      value: kpi.activeTeams || 0,
      icon: '🔥',
      color: '#2ecc71'
    }
  ];

  // 권한별 분포 (실제 데이터)
  const roleDistribution = additionalStats.roleDistribution ? 
    additionalStats.roleDistribution.map(r => ({
      role: r._id,
      count: r.count,
      color: r._id === 'LEADER' ? '#e74c3c' : 
             r._id === 'EXECUTIVE' ? '#9b59b6' :
             r._id === 'ADMIN' ? '#f39c12' : '#3498db'
    })) : [];

  const totalMembers = roleDistribution.reduce((sum, item) => sum + item.count, 0);

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
        👥 멤버 현황
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 동아리 멤버 활동도 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            📊 멤버 활동도
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '16px'
          }}>
            {memberData.map((item, index) => (
              <div key={index} style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                border: `1px solid ${item.color}20`,
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '24px',
                  marginBottom: '8px'
                }}>
                  {item.icon}
                </div>
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: item.color,
                  marginBottom: '4px'
                }}>
                  {item.value}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#636e72'
                }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 권한별 분포 차트 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            🔐 권한별 분포
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px'
          }}>
            {roleDistribution.map((item, index) => {
              const percentage = totalMembers > 0 ? Math.round((item.count / totalMembers) * 100) : 0;
              
              return (
                <div key={index} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: index < roleDistribution.length - 1 ? '12px' : 0
                }}>
                  <div style={{
                    width: '60px',
                    fontSize: '12px',
                    fontWeight: '500',
                    color: '#2c3e50'
                  }}>
                    {item.role === 'LEADER' ? '팀장' : 
                     item.role === 'EXECUTIVE' ? '임원' :
                     item.role === 'ADMIN' ? '관리자' : '멤버'}
                  </div>
                  <div style={{
                    flex: 1,
                    height: '20px',
                    background: '#e9ecef',
                    borderRadius: '10px',
                    marginRight: '8px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: item.color,
                      borderRadius: '10px',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: item.color,
                    minWidth: '40px',
                    textAlign: 'right'
                  }}>
                    {item.count}명
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 최근 가입자 목록 */}
        <div>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            🆕 최근 가입자
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            border: '1px dashed #dee2e6'
          }}>
            {additionalStats.recentUsers && additionalStats.recentUsers.length > 0 ? (
              <div style={{ marginBottom: '16px' }}>
                {additionalStats.recentUsers.map((user, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px',
                    background: 'white',
                    borderRadius: '6px',
                    marginBottom: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: '#3498db',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginRight: '12px'
                    }}>
                      {user.username[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#2c3e50'
                      }}>
                        {user.username}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        color: '#636e72'
                      }}>
                        {user.role === 'LEADER' ? '팀장' : 
                         user.role === 'EXECUTIVE' ? '임원' :
                         user.role === 'ADMIN' ? '관리자' : '멤버'} • {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                color: '#636e72',
                fontSize: '14px',
                marginBottom: '12px'
              }}>
                💡 최근 7일간 새로 가입한 멤버가 없습니다
              </div>
            )}
            
            {additionalStats.pendingApprovals > 0 && (
              <div style={{
                background: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                padding: '12px',
                marginBottom: '12px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '14px',
                  color: '#856404',
                  fontWeight: '600'
                }}>
                  {additionalStats.pendingApprovals}명의 승인 대기 중
                </div>
              </div>
            )}
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <button 
                style={{
                  flex: 1,
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/executive/users')}
              >
                멤버 관리
              </button>
              
              {additionalStats.pendingApprovals > 0 && (
                <button 
                  style={{
                    flex: 1,
                    background: '#f39c12',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate('/executive/users?filter=pending')}
                >
                  승인 처리
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}