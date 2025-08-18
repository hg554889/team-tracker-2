import React, { useEffect, useState } from 'react';
import client from '../api/client';
import AIWidget from '../components/dashboard/AIWidget';
import NotificationPanel from '../components/dashboard/NotificationPanel';
import RoleBasedKPI from '../components/dashboard/RoleBasedKPI';
import ImprovedTeamHealth from '../components/dashboard/ImprovedTeamHealth';
import ImprovedDueSoon from '../components/dashboard/ImprovedDueSoon';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useAuth } from '../contexts/AuthContext';
import { useClub } from '../contexts/ClubContext';

export default function Dashboard(){
  const { user } = useAuth();
  const { currentClub } = useClub();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const params = {};
        
        // ADMIN인 경우에만 currentClub을 사용 (null이면 전체 보기)
        if (user?.role === 'ADMIN' && currentClub) {
          params.clubId = currentClub;
        }
        // 다른 역할은 본인 동아리 자동 필터링 (서버에서 처리)
        
        const { data } = await client.get('/dashboard/summary', { params });
        setSummary(data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        window.dispatchEvent(new CustomEvent('toast', { 
          detail: { type: 'error', msg: '대시보드 데이터를 불러오는데 실패했습니다.' } 
        }));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    
    // clubChanged 이벤트 리스너 추가
    const handleClubChange = () => {
      loadDashboardData();
    };
    
    window.addEventListener('clubChanged', handleClubChange);
    
    return () => {
      window.removeEventListener('clubChanged', handleClubChange);
    };
  }, [currentClub, user?.role]);

  const getScopeTitle = () => {
    if (!summary?.scope) return '';
    switch (summary.scope) {
      case 'GLOBAL': return '전체 시스템';
      case 'CLUB': return '우리 동아리';
      case 'MY': return '내 활동';
      default: return '';
    }
  };

  const getRoleDisplayName = () => {
    switch (user?.role) {
      case 'ADMIN': return '관리자';
      case 'EXECUTIVE': return '임원';
      case 'LEADER': return '팀장';
      case 'MEMBER': return '멤버';
      default: return '사용자';
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div style={{ 
          padding: '24px',
          maxWidth: '1280px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '18px', color: '#636e72' }}>
            대시보드를 불러오는 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ 
        padding: '24px',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* 헤더 섹션 */}
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ 
            margin: '0 0 8px 0', 
            fontSize: '28px', 
            color: '#2c3e50',
            fontWeight: '700'
          }}>
            👋 안녕하세요, {user?.username}님!
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '16px', 
            color: '#636e72'
          }}>
            {getRoleDisplayName()} · {getScopeTitle()}
          </p>
        </div>

        {/* 알림 패널 */}
        {summary?.notifications && summary.notifications.length > 0 && (
          <NotificationPanel notifications={summary.notifications} />
        )}

        {/* 상단 섹션: KPI + AI */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: user?.role === 'ADMIN' || user?.role === 'EXECUTIVE' ? '2fr 1fr' : '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <RoleBasedKPI 
            userRole={user?.role}
            kpi={summary?.kpi || {}}
            additionalStats={summary?.additionalStats || {}}
          />
          <AIWidget user={user} />
        </div>

        {/* 중간 섹션: 팀 현황 + 마감 예정 */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '24px',
          marginBottom: '24px'
        }}>
          <ImprovedTeamHealth 
            myTeamsProgress={summary?.myTeamsProgress || []}
            userRole={user?.role}
            loading={loading}
          />
          
          <ImprovedDueSoon 
            dueSoon={summary?.dueSoon || []}
            userRole={user?.role}
            loading={loading}
          />
        </div>

        {/* 하단 섹션: 활동 피드 */}
        <div>
          <ActivityFeed userId={user?._id} />
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          background-color: #f8f9fa;
          min-height: 100vh;
        }

        .card {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
          border: 1px solid #e9ecef;
        }

        @media (max-width: 1200px) {
          .dashboard-container > div {
            padding: 16px;
            maxWidth: '100%';
          }
        }

        @media (max-width: 768px) {
          .dashboard-container > div > div {
            grid-template-columns: 1fr !important;
          }
          
          .card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
