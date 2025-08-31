import React, { useState, useEffect } from 'react';
import client from '../../api/client';

export default function ApprovalManagement() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [roleRequests, setRoleRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      console.log('[CLIENT] Loading approval data...');
      
      const [approvalResponse, roleRequestResponse] = await Promise.all([
        client.get('/approvals/pending'),
        client.get('/role-requests')
      ]);
      
      console.log('[CLIENT] Approval response:', approvalResponse.data);
      console.log('[CLIENT] Role request response:', roleRequestResponse.data);
      
      setPendingUsers(approvalResponse.data.users || []);
      setRoleRequests(roleRequestResponse.data.requests || []);
    } catch (error) {
      console.error('Failed to load approval data:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId) => {
    try {
      await client.post(`/approvals/${userId}/approve`);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '사용자가 승인되었습니다.' } 
      }));
      loadData();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '승인에 실패했습니다.' } 
      }));
    }
  };

  const rejectUser = async (userId) => {
    try {
      await client.post(`/approvals/${userId}/reject`);
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: '사용자가 거부되었습니다.' } 
      }));
      loadData();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '거부에 실패했습니다.' } 
      }));
    }
  };

  const processRoleRequest = async (requestId, action) => {
    try {
      await client.post(`/role-requests/${requestId}/process`, { action });
      
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'success', msg: `권한 요청이 ${action === 'approve' ? '승인' : '거부'}되었습니다.` } 
      }));
      loadData();
    } catch (error) {
      window.dispatchEvent(new CustomEvent('toast', { 
        detail: { type: 'error', msg: '처리에 실패했습니다.' } 
      }));
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
        승인 요청을 불러오는 중...
      </div>
    );
  }

  const tabs = [
    { id: 'users', label: '사용자 승인', count: pendingUsers.length },
    { id: 'roles', label: '권한 요청', count: roleRequests.length }
  ];

  return (
    <div>
      {/* 탭 헤더 */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid #e9ecef',
        marginBottom: '20px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: `2px solid ${activeTab === tab.id ? '#007bff' : 'transparent'}`,
              color: activeTab === tab.id ? '#007bff' : '#636e72',
              fontWeight: activeTab === tab.id ? '600' : '400',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                backgroundColor: '#dc3545',
                color: 'white',
                borderRadius: '10px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 사용자 승인 탭 */}
      {activeTab === 'users' && (
        <div>
          {pendingUsers.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#636e72',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              승인 대기 중인 사용자가 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {pendingUsers.map(user => (
                <div
                  key={user._id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#2d3436' }}>
                        {user.username}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#636e72', marginBottom: '4px' }}>
                        이메일: {user.email}
                      </div>
                      {user.studentId && (
                        <div style={{ fontSize: '14px', color: '#636e72', marginBottom: '4px' }}>
                          학번: {user.studentId}
                        </div>
                      )}
                      <div style={{ fontSize: '12px', color: '#868e96' }}>
                        신청일: {new Date(user.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => approveUser(user._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => rejectUser(user._id)}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        거부
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 권한 요청 탭 */}
      {activeTab === 'roles' && (
        <div>
          {roleRequests.length === 0 ? (
            <div style={{
              textAlign: 'center',
              color: '#636e72',
              padding: '40px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px'
            }}>
              권한 요청이 없습니다.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {roleRequests.map(request => (
                <div
                  key={request._id}
                  style={{
                    backgroundColor: 'white',
                    border: '1px solid #e9ecef',
                    borderRadius: '8px',
                    padding: '16px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 8px 0', color: '#2d3436' }}>
                        {request.userId?.username}
                      </h4>
                      <div style={{ fontSize: '14px', color: '#636e72', marginBottom: '4px' }}>
                        현재 권한: <span style={{ fontWeight: '500' }}>{request.currentRole}</span> → 
                        요청 권한: <span style={{ fontWeight: '500', color: '#007bff' }}>{request.requestedRole}</span>
                      </div>
                      <div style={{ fontSize: '14px', color: '#636e72', marginBottom: '8px' }}>
                        이메일: {request.userId?.email}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: '#495057',
                        backgroundColor: '#f8f9fa',
                        padding: '8px',
                        borderRadius: '4px',
                        marginBottom: '8px'
                      }}>
                        <strong>요청 사유:</strong> {request.reason}
                      </div>
                      <div style={{ fontSize: '12px', color: '#868e96' }}>
                        요청일: {new Date(request.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => processRoleRequest(request._id, 'approve')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        승인
                      </button>
                      <button
                        onClick={() => processRoleRequest(request._id, 'reject')}
                        style={{
                          padding: '8px 16px',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}
                      >
                        거부
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}