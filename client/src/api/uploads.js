import client from './client';
export const upload = (formData) => client.post('/uploads', formData, { headers: { 'Content-Type':'multipart/form-data' } });