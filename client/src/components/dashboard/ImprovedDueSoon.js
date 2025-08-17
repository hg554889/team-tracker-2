import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ImprovedDueSoon({ dueSoon = [], userRole, loading = false }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="card">
        <h3 style={{ margin: '0 0 16px 0' }}>📅 마감 예정</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getUrgencyStyle = (daysLeft) => {
    if (daysLeft <= 0) {
      return { backgroundColor: '#ff7675', color: 'white', label: '지연' };
    }
    if (daysLeft <= 1) {
      return { backgroundColor: '#fd79a8', color: 'white', label: '오늘/내일' };
    }
    if (daysLeft <= 3) {
      return { backgroundColor: '#fdcb6e', color: '#2d3436', label: '3일 이내' };
    }
    if (daysLeft <= 7) {
      return { backgroundColor: '#a29bfe', color: 'white', label: '일주일 이내' };
    }
    return { backgroundColor: '#74b9ff', color: 'white', label: '여유' };
  };

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#00b894';
    if (progress >= 60) return '#fdcb6e';
    if (progress >= 40) return '#fd79a8';
    return '#e17055';
  };

  const formatDueDate = (dueDate) => {
    const date = new Date(dueDate);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    if (hours === 0 && minutes === 0) {
      return `${month}/${day}`;
    }
    return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const sortedDueSoon = [...dueSoon].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>
          📅 마감 예정
        </h3>
        <button
          onClick={() => navigate('/reports')}
          style={{
            padding: '4px 8px',
            fontSize: '12px',
            backgroundColor: 'transparent',
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer',
            color: '#636e72'
          }}
        >
          전체보기
        </button>
      </div>

      {sortedDueSoon.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#636e72',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎉</div>
          <div>마감 예정인 보고서가 없습니다!</div>
        </div>
      ) : (
        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {sortedDueSoon.slice(0, 10).map((item, index) => {
            const daysLeft = getDaysUntilDue(item.dueAt);
            const urgencyStyle = getUrgencyStyle(daysLeft);
            const progressColor = getProgressColor(item.progress);

            return (
              <div
                key={item._id || index}
                style={{
                  padding: '12px',
                  marginBottom: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => navigate(`/reports/${item._id}`)}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e9ecef';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f8f9fa';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#2c3e50',
                      marginBottom: '4px',
                      fontSize: '14px'
                    }}>
                      {item.title}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#636e72',
                      marginBottom: '4px'
                    }}>
                      팀: {item.team}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'end', gap: '4px' }}>
                    <span style={{
                      ...urgencyStyle,
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '11px',
                      fontWeight: '600'
                    }}>
                      {urgencyStyle.label}
                    </span>
                    <span style={{ fontSize: '11px', color: '#636e72' }}>
                      {formatDueDate(item.dueAt)}
                    </span>
                  </div>
                </div>

                {/* 진행률 표시 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      backgroundColor: '#e9ecef', 
                      borderRadius: '2px'
                    }}>
                      <div style={{
                        width: `${item.progress}%`,
                        height: '100%',
                        backgroundColor: progressColor,
                        borderRadius: '2px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '600',
                    color: progressColor,
                    minWidth: '35px',
                    textAlign: 'right'
                  }}>
                    {item.progress}%
                  </span>
                </div>

                {/* D-Day 표시 */}
                <div style={{ 
                  marginTop: '6px', 
                  fontSize: '11px', 
                  color: daysLeft <= 1 ? '#e17055' : '#636e72',
                  fontWeight: daysLeft <= 1 ? '600' : 'normal'
                }}>
                  {daysLeft <= 0 ? 
                    `${Math.abs(daysLeft)}일 지연` : 
                    daysLeft === 0 ? '오늘 마감' :
                    daysLeft === 1 ? '내일 마감' :
                    `D-${daysLeft}`
                  }
                </div>
              </div>
            );
          })}
          
          {dueSoon.length > 10 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '8px', 
              color: '#636e72', 
              fontSize: '12px',
              cursor: 'pointer'
            }}
            onClick={() => navigate('/reports')}
            >
              +{dueSoon.length - 10}개 더 보기
            </div>
          )}
        </div>
      )}
    </div>
  );
}