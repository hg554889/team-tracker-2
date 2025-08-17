import React, { useState, useEffect } from 'react';
import { useClub } from '../../contexts/ClubContext';
import client from '../../api/client';

export default function ClubStats() {
  const { currentClub, getClubDisplayName } = useClub();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentClub) {
      loadStats();
    }
  }, [currentClub]);

  const loadStats = async () => {
    if (!currentClub) return;
    
    setLoading(true);
    try {
      const response = await client.get(`/club-settings/${currentClub}/stats`);
      setStats(response.data);
    } catch (error) {
      setError('통계를 불러오는데 실패했습니다.');
      console.error('Failed to load club stats:', error);
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