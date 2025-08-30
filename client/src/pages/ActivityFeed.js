import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function ActivityFeed() {
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [dateRange, setDateRange] = useState('week');

  useEffect(() => {
    loadActivities();
  }, [filter, dateRange]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const { data } = await client.get('/activities', {
        params: { filter, dateRange }
      });
      setActivities(data);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'report_submitted': return '📝';
      case 'team_joined': return '👋';
      case 'team_left': return '👋';
      case 'task_completed': return '✅';
      case 'task_assigned': return '📋';
      case 'comment_added': return '💬';
      case 'file_uploaded': return '📎';
      case 'meeting_scheduled': return '📅';
      case 'goal_achieved': return '🎯';
      case 'milestone_reached': return '🚀';
      case 'review_requested': return '👀';
      case 'approval_granted': return '✅';
      case 'user_mentioned': return '@';
      default: return '📌';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'report_submitted': return '#2ecc71';
      case 'team_joined': return '#3498db';
      case 'team_left': return '#95a5a6';
      case 'task_completed': return '#27ae60';
      case 'task_assigned': return '#f39c12';
      case 'comment_added': return '#9b59b6';
      case 'file_uploaded': return '#34495e';
      case 'meeting_scheduled': return '#e67e22';
      case 'goal_achieved': return '#e74c3c';
      case 'milestone_reached': return '#c0392b';
      case 'review_requested': return '#8e44ad';
      case 'approval_granted': return '#16a085';
      case 'user_mentioned': return '#f1c40f';
      default: return '#95a5a6';
    }
  };

  const formatActivityTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return activityTime.toLocaleDateString();
  };

  const groupActivitiesByDate = (activities) => {
    const groups = {};
    activities.forEach(activity => {
      const date = new Date(activity.timestamp).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(activity);
    });
    return groups;
  };

  const groupedActivities = groupActivitiesByDate(activities);

  const filters = [
    { id: 'all', label: '전체 활동' },
    { id: 'my_teams', label: '내 팀' },
    { id: 'my_activity', label: '내 활동' },
    { id: 'reports', label: '보고서' },
    { id: 'tasks', label: '작업' },
    { id: 'meetings', label: '회의' }
  ];

  const dateRanges = [
    { id: 'today', label: '오늘' },
    { id: 'week', label: '이번 주' },
    { id: 'month', label: '이번 달' },
    { id: 'all', label: '전체' }
  ];

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <div style={{ fontSize: '18px', color: '#636e72' }}>
          활동 내역을 불러오는 중...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '900px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px', color: '#2c3e50', fontWeight: '700' }}>
            📱 활동 피드
          </h1>
          <p style={{ margin: 0, fontSize: '16px', color: '#636e72' }}>
            팀과 나의 모든 활동을 한눈에 확인하세요
          </p>
        </div>
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

      {/* 필터 컨트롤 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '20px',
          alignItems: 'end'
        }}>
          <div>
            <h3 style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '12px' }}>
              활동 유형
            </h3>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filters.map((filterItem) => (
                <button
                  key={filterItem.id}
                  onClick={() => setFilter(filterItem.id)}
                  style={{
                    padding: '8px 16px',
                    border: 'none',
                    background: filter === filterItem.id ? '#3498db' : '#f8f9fa',
                    color: filter === filterItem.id ? 'white' : '#636e72',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  {filterItem.label}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <h3 style={{ fontSize: '14px', color: '#2c3e50', marginBottom: '12px' }}>
              기간
            </h3>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{
                padding: '8px 12px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                background: 'white'
              }}
            >
              {dateRanges.map((range) => (
                <option key={range.id} value={range.id}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 활동 타임라인 */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden'
      }}>
        {Object.keys(groupedActivities).length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            <h3 style={{ fontSize: '18px', color: '#2c3e50', marginBottom: '8px' }}>
              활동이 없습니다
            </h3>
            <p style={{ fontSize: '14px', color: '#636e72' }}>
              선택한 기간 동안 활동이 없거나 필터 조건에 맞는 활동이 없습니다
            </p>
          </div>
        ) : (
          Object.entries(groupedActivities).map(([date, dateActivities], dateIndex) => (
            <div key={date}>
              {/* 날짜 헤더 */}
              <div style={{
                padding: '16px 24px',
                background: '#f8f9fa',
                borderBottom: '1px solid #e9ecef',
                fontSize: '14px',
                fontWeight: '600',
                color: '#2c3e50'
              }}>
                📅 {new Date(date).toLocaleDateString('ko-KR', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  weekday: 'short'
                })}
                <span style={{ 
                  marginLeft: '8px', 
                  fontSize: '12px', 
                  color: '#636e72',
                  fontWeight: '400'
                }}>
                  ({dateActivities.length}개 활동)
                </span>
              </div>

              {/* 날짜별 활동 목록 */}
              <div style={{ padding: '16px 24px' }}>
                <div style={{ position: 'relative' }}>
                  {/* 타임라인 선 */}
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '0',
                    bottom: '0',
                    width: '2px',
                    background: '#e9ecef'
                  }} />

                  {dateActivities.map((activity, activityIndex) => (
                    <div
                      key={activity._id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        paddingBottom: activityIndex < dateActivities.length - 1 ? '24px' : '0',
                        position: 'relative'
                      }}
                    >
                      {/* 아이콘 */}
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        background: `${getActivityColor(activity.type)}20`,
                        border: `3px solid ${getActivityColor(activity.type)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        marginRight: '20px',
                        position: 'relative',
                        zIndex: 1
                      }}>
                        {getActivityIcon(activity.type)}
                      </div>

                      {/* 내용 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginBottom: '8px'
                        }}>
                          <div>
                            <h4 style={{
                              fontSize: '16px',
                              fontWeight: '600',
                              color: '#2c3e50',
                              margin: '0 0 4px 0'
                            }}>
                              {activity.title}
                            </h4>
                            <p style={{
                              fontSize: '14px',
                              color: '#636e72',
                              margin: 0,
                              lineHeight: 1.5
                            }}>
                              {activity.description}
                            </p>
                          </div>
                          <span style={{
                            fontSize: '12px',
                            color: '#95a5a6',
                            whiteSpace: 'nowrap',
                            marginLeft: '16px'
                          }}>
                            {formatActivityTime(activity.timestamp)}
                          </span>
                        </div>

                        {/* 메타데이터 */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          fontSize: '12px',
                          color: '#95a5a6'
                        }}>
                          <span>👤 {activity.actorName}</span>
                          {activity.teamName && <span>🏢 {activity.teamName}</span>}
                          {activity.tags && activity.tags.map((tag, tagIndex) => (
                            <span
                              key={tagIndex}
                              style={{
                                background: '#e9ecef',
                                padding: '2px 6px',
                                borderRadius: '10px',
                                fontSize: '11px'
                              }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* 액션 버튼 */}
                        {activity.actionUrl && (
                          <button
                            onClick={() => navigate(activity.actionUrl)}
                            style={{
                              marginTop: '12px',
                              background: 'none',
                              border: `1px solid ${getActivityColor(activity.type)}`,
                              color: getActivityColor(activity.type),
                              borderRadius: '16px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              cursor: 'pointer'
                            }}
                          >
                            자세히 보기
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {dateIndex < Object.keys(groupedActivities).length - 1 && (
                <div style={{ height: '1px', background: '#f8f9fa' }} />
              )}
            </div>
          ))
        )}
      </div>

      {/* 더 보기 버튼 */}
      {activities.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button
            onClick={loadActivities}
            style={{
              background: 'white',
              border: '1px solid #3498db',
              color: '#3498db',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            더 많은 활동 불러오기
          </button>
        </div>
      )}
    </div>
  );
}