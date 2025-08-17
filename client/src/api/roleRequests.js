import client from './client';

export const createRoleRequest = (data) => client.post('/role-requests', data);

export const getRoleRequests = () => client.get('/role-requests');

export const getMyRoleRequests = () => client.get('/role-requests/my-requests');

export const processRoleRequest = (requestId, action) => 
  client.post(`/role-requests/${requestId}/process`, { action });