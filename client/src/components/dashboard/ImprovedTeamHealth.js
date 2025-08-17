import React from 'react';

export default function ImprovedTeamHealth({ myTeamsProgress = [], userRole, loading = false }) {
  
  if (loading) {
    return (
      <div className="card">
        <h3 style={{ margin: '0 0 16px 0' }}>팀 진행률 현황</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
          로딩 중...
        </div>
      </div>
    );
  }

  if (myTeamsProgress.length === 0) {
    return (
      <div className="card">
        <h3 style={{ margin: '0 0 16px 0' }}>팀 진행률 현황</h3>
        <div style={{ textAlign: 'center', padding: '40px', color: '#636e72' }}>
          표시할 팀 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const getProgressColor = (progress) => {
    if (progress >= 80) return '#00b894';
    if (progress >= 60) return '#fdcb6e';
    if (progress >= 40) return '#fd79a8';
    return '#e17055';
  };

  const getProgressStatus = (progress) => {
    if (progress >= 80) return '우수';
    if (progress >= 60) return '양호';
    if (progress >= 40) return '보통';
    return '관심필요';
  };

  const calculateTrend = (history) => {
    if (history.length < 2) return 'stable';
    const recent = history.slice(-2);
    if (recent[1] > recent[0] + 5) return 'up';
    if (recent[1] < recent[0] - 5) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➖';
    }
  };

  const getOverallStats = () => {
    const totalTeams = myTeamsProgress.length;
    const avgProgress = Math.round(
      myTeamsProgress.reduce((sum, team) => {
        const teamAvg = team.history.length > 0 
          ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
          : 0;
        return sum + teamAvg;
      }, 0) / totalTeams
    );
    
    const highPerformingTeams = myTeamsProgress.filter(team => {
      const teamAvg = team.history.length > 0 
        ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
        : 0;
      return teamAvg >= 70;
    }).length;

    return { totalTeams, avgProgress, highPerformingTeams };
  };

  const stats = getOverallStats();

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', color: '#2c3e50' }}>
          📊 팀 진행률 현황
        </h3>
        {userRole !== 'MEMBER' && (
          <div style={{ fontSize: '12px', color: '#636e72' }}>
            평균: {stats.avgProgress}% | 우수팀: {stats.highPerformingTeams}/{stats.totalTeams}
          </div>
        )}
      </div>

      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {myTeamsProgress.map((team, index) => {
          const avgProgress = team.history.length > 0 
            ? Math.round(team.history.reduce((a, b) => a + b, 0) / team.history.length)
            : 0;
          const trend = calculateTrend(team.history);
          const progressColor = getProgressColor(avgProgress);
          const status = getProgressStatus(avgProgress);

          return (
            <div
              key={team.teamId || index}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '600', color: '#2c3e50' }}>
                    {team.teamName}
                  </span>
                  <span style={{ fontSize: '14px' }}>
                    {getTrendIcon(trend)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ 
                    fontSize: '12px', 
                    padding: '2px 6px', 
                    borderRadius: '3px',
                    backgroundColor: progressColor,
                    color: 'white',
                    fontWeight: '600'
                  }}>
                    {status}
                  </span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: progressColor }}>
                    {avgProgress}%
                  </span>
                </div>
              </div>

              {/* 진행률 바 */}
              <div style={{ 
                width: '100%', 
                height: '6px', 
                backgroundColor: '#e9ecef', 
                borderRadius: '3px',
                marginBottom: '8px'
              }}>
                <div style={{
                  width: `${avgProgress}%`,
                  height: '100%',
                  backgroundColor: progressColor,
                  borderRadius: '3px',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* 최근 4주 히스토리 */}
              {team.history.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '11px', color: '#636e72', minWidth: '60px' }}>
                    최근 4주:
                  </span>
                  <div style={{ display: 'flex', gap: '2px' }}>
                    {team.history.map((progress, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: '16px',
                          height: '12px',
                          backgroundColor: getProgressColor(progress),
                          borderRadius: '2px',
                          opacity: 0.7 + (idx * 0.1)
                        }}
                        title={`${progress}%`}
                      />
                    ))}
                  </div>
                  <span style={{ fontSize: '11px', color: '#636e72', marginLeft: '8px' }}>
                    {team.history.join('% → ')}%
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}