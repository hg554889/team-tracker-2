import client from './client';
export const login = (data) => client.post('/auth/login', data);
export const signup = (data) => client.post('/auth/signup', data);