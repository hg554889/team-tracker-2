import React from 'react';

export default function GoalAchievement({ summary }) {
  const kpi = summary?.kpi || {};
  const myTeamsProgress = summary?.myTeamsProgress || [];

  // 목표 달성 현황 계산
  const totalProgress = kpi.avgProgress || 0;
  const targetProgress = 80; // 목표 진행률
  const achievementRate = Math.min(Math.round((totalProgress / targetProgress) * 100), 100);

  // 팀 진행률 분포 분석 (실제 데이터 기반)
  const progressRanges = [
    {
      type: '우수 팀 (90%+)',
      count: myTeamsProgress.filter(team => {
        const avgProgress = team.history?.length > 0 
          ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
          : 0;
        return avgProgress >= 90;
      }).length,
      avgProgress: Math.round(
        myTeamsProgress
          .filter(team => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return avgProgress >= 90;
          })
          .reduce((sum, team) => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return sum + avgProgress;
          }, 0) / Math.max(1, myTeamsProgress.filter(team => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return avgProgress >= 90;
          }).length) || 0
      ),
      color: '#2ecc71'
    },
    {
      type: '양호 팀 (70-89%)',
      count: myTeamsProgress.filter(team => {
        const avgProgress = team.history?.length > 0 
          ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
          : 0;
        return avgProgress >= 70 && avgProgress < 90;
      }).length,
      avgProgress: Math.round(
        myTeamsProgress
          .filter(team => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return avgProgress >= 70 && avgProgress < 90;
          })
          .reduce((sum, team) => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return sum + avgProgress;
          }, 0) / Math.max(1, myTeamsProgress.filter(team => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return avgProgress >= 70 && avgProgress < 90;
          }).length) || 0
      ),
      color: '#3498db'
    },
    {
      type: '개선 필요 (70% 미만)',
      count: myTeamsProgress.filter(team => {
        const avgProgress = team.history?.length > 0 
          ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
          : 0;
        return avgProgress < 70;
      }).length,
      avgProgress: Math.round(
        myTeamsProgress
          .filter(team => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return avgProgress < 70;
          })
          .reduce((sum, team) => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return sum + avgProgress;
          }, 0) / Math.max(1, myTeamsProgress.filter(team => {
            const avgProgress = team.history?.length > 0 
              ? team.history.reduce((a, b) => a + b, 0) / team.history.length 
              : 0;
            return avgProgress < 70;
          }).length) || 0
      ),
      color: '#e67e22'
    }
  ].filter(range => range.count > 0);

  // 주차별 성과 트렌드 (실제 데이터 기반)
  const weeklyTrend = (() => {
    if (myTeamsProgress.length === 0) {
      return [
        { period: '3주 전', progress: 0 },
        { period: '2주 전', progress: 0 },
        { period: '1주 전', progress: 0 },
        { period: '이번 주', progress: totalProgress }
      ];
    }

    // 각 팀의 history를 주차별로 평균 계산
    const maxHistoryLength = Math.max(...myTeamsProgress.map(team => team.history?.length || 0));
    
    if (maxHistoryLength <= 1) {
      return [
        { period: '3주 전', progress: Math.max(0, totalProgress - 15) },
        { period: '2주 전', progress: Math.max(0, totalProgress - 10) },
        { period: '1주 전', progress: Math.max(0, totalProgress - 5) },
        { period: '이번 주', progress: totalProgress }
      ];
    }

    const weeklyAverages = [];
    for (let i = Math.max(0, maxHistoryLength - 4); i < maxHistoryLength; i++) {
      const weekData = myTeamsProgress
        .filter(team => team.history && team.history[i] !== undefined)
        .map(team => team.history[i]);
      
      const average = weekData.length > 0 
        ? Math.round(weekData.reduce((a, b) => a + b, 0) / weekData.length)
        : 0;
      
      weeklyAverages.push(average);
    }

    // 부족한 주차 데이터는 패딩으로 채움
    while (weeklyAverages.length < 4) {
      weeklyAverages.unshift(Math.max(0, (weeklyAverages[0] || totalProgress) - 5));
    }

    return [
      { period: '3주 전', progress: weeklyAverages[0] || 0 },
      { period: '2주 전', progress: weeklyAverages[1] || 0 },
      { period: '1주 전', progress: weeklyAverages[2] || 0 },
      { period: '이번 주', progress: weeklyAverages[3] || totalProgress }
    ];
  })();

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
        🎯 목표 달성 현황
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '24px'
        }}>
          {/* 동아리 전체 목표 vs 실제 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              📊 전체 목표 달성률
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `conic-gradient(#2ecc71 0deg ${achievementRate * 3.6}deg, #e9ecef ${achievementRate * 3.6}deg 360deg)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                position: 'relative'
              }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    fontSize: '20px',
                    fontWeight: '700',
                    color: '#2ecc71'
                  }}>
                    {achievementRate}%
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: '#636e72'
                  }}>
                    달성률
                  </div>
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: '#636e72'
              }}>
                <span>목표: {targetProgress}%</span>
                <span>현재: {totalProgress}%</span>
              </div>
            </div>
          </div>

          {/* 팀 진행률 분포 분석 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              🔍 팀 진행률 분포
            </h3>
            
            <div style={{ space: '12px' }}>
              {progressRanges.map((range, index) => (
                <div key={index} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${range.color}20`
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#2c3e50'
                    }}>
                      {range.type}
                    </span>
                    <span style={{
                      fontSize: '14px',
                      color: '#636e72'
                    }}>
                      {range.count}팀
                    </span>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      flex: 1,
                      height: '8px',
                      background: '#e9ecef',
                      borderRadius: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${Math.min(range.avgProgress, 100)}%`,
                        height: '100%',
                        background: range.color,
                        borderRadius: '4px',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: range.color,
                      minWidth: '35px'
                    }}>
                      {range.avgProgress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 주차별 성과 트렌드 */}
          <div>
            <h3 style={{
              fontSize: '16px',
              color: '#2c3e50',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              📈 주차별 성과 트렌드
            </h3>
            
            <div style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {weeklyTrend.map((week, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: index < weeklyTrend.length - 1 ? '1px solid #dee2e6' : 'none'
                }}>
                  <span style={{
                    fontSize: '12px',
                    color: '#636e72',
                    fontWeight: week.period === '이번 주' ? '600' : '400'
                  }}>
                    {week.period}
                  </span>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '6px',
                      background: '#e9ecef',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${week.progress}%`,
                        height: '100%',
                        background: week.period === '이번 주' ? '#2ecc71' : '#3498db',
                        borderRadius: '3px'
                      }} />
                    </div>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: week.period === '이번 주' ? '#2ecc71' : '#3498db',
                      minWidth: '30px'
                    }}>
                      {week.progress}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}