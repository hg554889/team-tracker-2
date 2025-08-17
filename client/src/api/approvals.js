import client from './client';

export const getPendingApprovals = () => client.get('/approvals/pending');

export const approveUser = (userId) => client.post(`/approvals/${userId}/approve`);

export const rejectUser = (userId) => client.post(`/approvals/${userId}/reject`);

export const updateUserInfo = (data) => client.put('/approvals/update-info', data);