import client from './client';

export const listTeams = (params) => client.get('/teams', { params });
export const getTeam = (id) => client.get(`/teams/${id}`);
export const createTeam = (data) => client.post('/teams', data);

// ⬇️ 새로 추가/사용되는 함수들
export const updateTeam = (id, data) => client.put(`/teams/${id}`, data);
export const addMember = (id, payload) => client.post(`/teams/${id}/members`, payload);
export const removeMember = (id, userId) => client.delete(`/teams/${id}/members/${userId}`);
