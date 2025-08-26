import React, { useState, useEffect } from 'react';
import { useClub } from '../../contexts/ClubContext';
import { useAuth } from '../../contexts/AuthContext';
import client from '../../api/client';

export default function ClubStats() {
  const { currentClub, getClubDisplayName, isAdmin } = useClub();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [allStats, setAllStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log('ClubStats useEffect triggered, currentClub:', currentClub, 'isAdmin:', isAdmin);
    if (isAdmin) {
      // ADMIN인 경우 모든 동아리 통계 로드
      loadAllStats();
    } else if (currentClub) {
      // 특정 동아리 통계 로드
      loadStats();
    } else {
      setLoading(false);
      setError('선택된 동아리가 없습니다.');
    }
  }, [currentClub, isAdmin]);

  const loadAllStats = async () => {
    console.log('Loading all stats for ADMIN');
    setLoading(true);
    setError('');
    
    try {
      const response = await client.get('/club-settings/stats/all');
      console.log('All stats response:', response.data);
      setAllStats(response.data);
    } catch (error) {
      console.error('Failed to load all stats:', error);
      const errorMsg = error.response?.data?.error || error.message || '전체 통계를 불러오는데 실패했습니다.';
      setError(`오류: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!currentClub) {
      console.log('No currentClub available');
      return;
    }
    
    console.log('Loading stats for club:', currentClub);
    setLoading(true);
    setError('');
    
    try {
      const response = await client.get(`/club-settings/${currentClub}/stats`);
      console.log('Stats response:', response.data);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load club stats:', error);
      const errorMsg = error.response?.data?.error || error.message || '통계를 불러오는데 실패했습니다.';
      setError(`오류: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        color: '#636e72'
      }}>
        통계를 불러오는 중...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#dc3545'
      }}>
        {error}
      </div>
    );
  }

  // ADMIN인 경우 전체 통계 표시
  if (isAdmin && allStats) {
    return renderAdminStats();
  }

  // 특정 동아리 통계 표시
  if (!stats) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        color: '#636e72'
      }}>
        통계 데이터가 없습니다.
      </div>
    );
  }

  return renderSingleClubStats();

  // ADMIN 전체 통계 렌더링
  function renderAdminStats() {
    const totalStatCards = [
      {
        title: '총 동아리 수',
        value: allStats.totalStats.totalClubs,
        icon: '🏛️',
        color: '#6f42c1'
      },
      {
        title: '총 팀 수',
        value: allStats.totalStats.totalTeams,
        icon: '👥',
        color: '#007bff'
      },
      {
        title: '총 보고서',
        value: allStats.totalStats.totalReports,
        icon: '📊',
        color: '#28a745'
      },
      {
        title: '총 사용자',
        value: allStats.totalStats.totalUsers,
        icon: '👤',
        color: '#17a2b8'
      },
      {
        title: '전체 평균 진행률',
        value: `${allStats.totalStats.avgProgress}%`,
        icon: '📈',
        color: '#ffc107'
      }
    ];

    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#2d3436' }}>
          🌟 전체 동아리 통계 (ADMIN)
        </h2>

        {/* 전체 통계 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {totalStatCards.map((card, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>{card.icon}</span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: card.color
                }}>
                  {card.value}
                </span>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#636e72',
                fontWeight: '500'
              }}>
                {card.title}
              </div>
            </div>
          ))}
        </div>

        {/* 동아리별 상세 통계 */}
        <h3 style={{ marginBottom: '20px', color: '#495057' }}>
          📊 동아리별 상세 통계
        </h3>
        
        <div style={{
          display: 'grid',
          gap: '20px'
        }}>
          {allStats.clubStats.map((clubStat, index) => (
            <div
              key={clubStat.clubId}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <h4 style={{ marginBottom: '15px', color: '#2d3436' }}>
                🏛️ {clubStat.clubName} ({clubStat.clubId})
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
                    {clubStat.totalTeams}
                  </div>
                  <div style={{ fontSize: '12px', color: '#636e72' }}>팀</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                    {clubStat.totalReports}
                  </div>
                  <div style={{ fontSize: '12px', color: '#636e72' }}>보고서</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#17a2b8' }}>
                    {clubStat.totalUsers}
                  </div>
                  <div style={{ fontSize: '12px', color: '#636e72' }}>사용자</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffc107' }}>
                    {clubStat.avgProgress}%
                  </div>
                  <div style={{ fontSize: '12px', color: '#636e72' }}>평균 진행률</div>
                </div>
                <div style={{ textAlign: 'center', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '6px' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#6f42c1' }}>
                    {clubStat.activeTeamsThisWeek}
                  </div>
                  <div style={{ fontSize: '12px', color: '#636e72' }}>이번 주 활성 팀</div>
                </div>
              </div>

              {/* 최근 활동 */}
              {clubStat.recentActivity && clubStat.recentActivity.length > 0 && (
                <div>
                  <h5 style={{ marginBottom: '10px', color: '#495057', fontSize: '14px' }}>
                    📋 최근 활동
                  </h5>
                  <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {clubStat.recentActivity.map((activity, actIndex) => (
                      <div
                        key={actIndex}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 0',
                          borderBottom: actIndex < clubStat.recentActivity.length - 1 ? '1px solid #f1f3f4' : 'none'
                        }}
                      >
                        <div style={{ fontSize: '12px' }}>
                          {activity.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: '#636e72'
                        }}>
                          {new Date(activity.createdAt).toLocaleDateString('ko-KR', {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 단일 동아리 통계 렌더링
  function renderSingleClubStats() {
    const statCards = [
      {
        title: '총 팀 수',
        value: stats.totalTeams,
        icon: '👥',
        color: '#007bff'
      },
      {
        title: '총 보고서',
        value: stats.totalReports,
        icon: '📊',
        color: '#28a745'
      },
      {
        title: '총 사용자',
        value: stats.totalUsers,
        icon: '👤',
        color: '#17a2b8'
      },
      {
        title: '평균 진행률',
        value: `${stats.avgProgress}%`,
        icon: '📈',
        color: '#ffc107'
      }
    ];

    return (
      <div style={{ padding: '20px' }}>
        <h2 style={{ marginBottom: '20px', color: '#2d3436' }}>
          {getClubDisplayName(currentClub)} 통계
        </h2>

        {/* 통계 카드 */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '30px'
        }}>
          {statCards.map((card, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'white',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>{card.icon}</span>
                <span style={{
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: card.color
                }}>
                  {card.value}
                </span>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#636e72',
                fontWeight: '500'
              }}>
                {card.title}
              </div>
            </div>
          ))}
        </div>

        {/* 최근 활동 */}
        <div style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '15px', color: '#495057' }}>
            📋 최근 활동
          </h3>

          {stats.recentActivity && stats.recentActivity.length > 0 ? (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {stats.recentActivity.map((activity, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: index < stats.recentActivity.length - 1 ? '1px solid #f1f3f4' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>📊</span>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '500' }}>
                        {activity.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#636e72' }}>
                        {new Date(activity.createdAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </div>
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: activity.progress >= 80 ? '#d4edda' : activity.progress >= 50 ? '#fff3cd' : '#f8d7da',
                    color: activity.progress >= 80 ? '#155724' : activity.progress >= 50 ? '#856404' : '#721c24',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}>
                    {activity.progress}%
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              color: '#636e72',
              padding: '20px',
              fontStyle: 'italic'
            }}>
              최근 활동이 없습니다.
            </div>
          )}
        </div>
      </div>
    );
  }
}