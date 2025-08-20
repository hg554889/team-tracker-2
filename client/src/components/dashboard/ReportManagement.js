import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ReportManagement({ summary }) {
  const navigate = useNavigate();
  const dueSoon = summary?.dueSoon || [];
  const kpi = summary?.kpi || {};

  // 이번 주 작성해야 할 보고서 (임시 데이터)
  const pendingReports = [
    {
      id: 1,
      title: '주간 개발 현황 보고서',
      teamName: '프론트엔드팀',
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      priority: 'high',
      status: 'pending'
    },
    {
      id: 2,
      title: '프로젝트 진행 보고서',
      teamName: '백엔드팀',
      dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      priority: 'medium',
      status: 'draft'
    }
  ];

  // 팀원별 보고서 제출 현황 (임시 데이터)
  const memberSubmissions = [
    { name: '김개발', submitted: true, submittedAt: '2일 전', status: 'completed' },
    { name: '박기획', submitted: true, submittedAt: '1일 전', status: 'completed' },
    { name: '이디자인', submitted: false, dueIn: '1일 후', status: 'pending' },
    { name: '최테스터', submitted: false, dueIn: '3일 후', status: 'pending' }
  ];

  const formatDueTime = (date) => {
    const now = new Date();
    const diffTime = date - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '내일';
    if (diffDays > 1) return `${diffDays}일 후`;
    return '지연됨';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#e74c3c';
      case 'medium': return '#f39c12';
      case 'low': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

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
        📝 보고서 관리
      </h2>
      
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
      }}>
        {/* 이번 주 작성해야 할 보고서 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            📋 이번 주 작성해야 할 보고서
          </h3>
          
          <div style={{ space: '12px' }}>
            {pendingReports.length > 0 ? (
              pendingReports.map((report) => (
                <div key={report.id} style={{
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '12px',
                  border: `1px solid ${getPriorityColor(report.priority)}30`,
                  borderLeft: `4px solid ${getPriorityColor(report.priority)}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => navigate('/reports/create')}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#e8f4f8';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8f9fa';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#2c3e50',
                        margin: '0 0 4px 0'
                      }}>
                        {report.title}
                      </h4>
                      <p style={{
                        fontSize: '12px',
                        color: '#636e72',
                        margin: 0
                      }}>
                        {report.teamName}
                      </p>
                    </div>
                    <div style={{
                      fontSize: '12px',
                      fontWeight: '600',
                      color: getPriorityColor(report.priority),
                      background: `${getPriorityColor(report.priority)}15`,
                      padding: '4px 8px',
                      borderRadius: '12px'
                    }}>
                      {formatDueTime(report.dueAt)}
                    </div>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{
                      fontSize: '11px',
                      color: '#95a5a6'
                    }}>
                      상태: {report.status === 'pending' ? '작성 대기' : '임시 저장'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#3498db',
                      fontWeight: '500'
                    }}>
                      작성하기 →
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '20px',
                color: '#2ecc71',
                background: '#f0fff0',
                borderRadius: '8px',
                border: '1px dashed #2ecc71'
              }}>
                ✅ 모든 보고서가 완료되었습니다!
              </div>
            )}
          </div>
        </div>

        {/* 팀원별 보고서 제출 현황 */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '16px',
            color: '#2c3e50',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            👥 팀원별 보고서 제출 현황
          </h3>
          
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px'
          }}>
            {memberSubmissions.map((member, index) => (
              <div key={index} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 0',
                borderBottom: index < memberSubmissions.length - 1 ? '1px solid #dee2e6' : 'none'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: member.submitted ? '#2ecc71' : '#f39c12'
                  }} />
                  <span style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#2c3e50'
                  }}>
                    {member.name}
                  </span>
                </div>
                
                <div style={{
                  fontSize: '12px',
                  color: member.submitted ? '#2ecc71' : '#f39c12',
                  fontWeight: '600'
                }}>
                  {member.submitted ? `✅ ${member.submittedAt}` : `⏳ ${member.dueIn}`}
                </div>
              </div>
            ))}
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid #dee2e6'
            }}>
              <span style={{
                fontSize: '12px',
                color: '#636e72'
              }}>
                제출률: {Math.round((memberSubmissions.filter(m => m.submitted).length / memberSubmissions.length) * 100)}%
              </span>
              <button 
                style={{
                  background: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/reports')}
              >
                전체 보기
              </button>
            </div>
          </div>
        </div>

        {/* 미완성 보고서 알림 */}
        <div>
          <h3 style={{
            fontSize: '16px',
            color: '#e74c3c',
            marginBottom: '16px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            ⚠️ 미완성 보고서 알림
          </h3>
          
          {dueSoon.length > 0 ? (
            <div style={{
              background: '#fff5f5',
              border: '1px solid #fed7d7',
              borderRadius: '8px',
              padding: '16px'
            }}>
              {dueSoon.slice(0, 3).map((report) => (
                <div key={report._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #fed7d7'
                }}>
                  <div>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#2c3e50',
                      marginBottom: '2px'
                    }}>
                      {report.title || 'Untitled Report'}
                    </div>
                    <div style={{
                      fontSize: '12px',
                      color: '#636e72'
                    }}>
                      {report.team} · {report.progress}% 완료
                    </div>
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#e74c3c',
                    fontWeight: '600'
                  }}>
                    {formatDueTime(new Date(report.dueAt))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{
              background: '#f0fff0',
              border: '1px solid #c3e6cb',
              borderRadius: '8px',
              padding: '16px',
              textAlign: 'center',
              color: '#2ecc71'
            }}>
              ✨ 모든 보고서가 완료되었습니다!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}