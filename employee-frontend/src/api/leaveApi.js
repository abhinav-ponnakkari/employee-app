import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5170/api',
});

export const getLeaveRequests = (params) => api.get('/leaverequests', { params });
export const createLeaveRequest = (data) => api.post('/leaverequests', data);
export const updateLeaveStatus = (id, data) => api.patch(`/leaverequests/${id}/status`, data);
export const deleteLeaveRequest = (id) => api.delete(`/leaverequests/${id}`);
