import client from './client';

export const createJoinRequest = (teamId, message = '') => 
  client.post('/team-join-requests', { teamId, message });

export const getTeamJoinRequests = (teamId, params = {}) => 
  client.get(`/team-join-requests/team/${teamId}`, { params });

export const getMyJoinRequests = (params = {}) => 
  client.get('/team-join-requests/my-requests', { params });

export const processJoinRequest = (id, action) => 
  client.patch(`/team-join-requests/${id}/process`, { action });

export const cancelJoinRequest = (id) => 
  client.delete(`/team-join-requests/${id}`);