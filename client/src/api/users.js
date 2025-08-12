import client from './client';
export const getMe = () => client.get('/users/me');
export const updateMe = (data) => client.put('/users/me', data);
export const listUsers = (params) => client.get('/users', { params });
export const adminUpdateUser = (id, data) => client.put(`/users/${id}`, data);

export function changeMyPassword(currentPassword, newPassword) {
  return client.put('/users/me/password', { currentPassword, newPassword });
}

export function updateUser(id, data){ return client.put(`/users/${id}`, data); }