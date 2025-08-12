import client from './client';
export const createInvite = (payload) => client.post('/invites/create', payload);
export const getInvite = (code) => client.get(`/invites/${code}`);
export const acceptInvite = (code) => client.post(`/invites/${code}/accept`);