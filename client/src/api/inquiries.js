import client from './client';

// Create a new inquiry
export const createInquiry = (data) => client.post('/inquiries', data);

// Get my inquiries
export const getMyInquiries = (params = {}) => client.get('/inquiries/my', { params });

// Get all inquiries (ADMIN/EXECUTIVE only)
export const getAllInquiries = (params = {}) => client.get('/inquiries', { params });

// Get single inquiry by ID
export const getInquiry = (id) => client.get(`/inquiries/${id}`);

// Update inquiry (ADMIN/EXECUTIVE only)
export const updateInquiry = (id, data) => client.put(`/inquiries/${id}`, data);

// Delete inquiry (ADMIN only)
export const deleteInquiry = (id) => client.delete(`/inquiries/${id}`);