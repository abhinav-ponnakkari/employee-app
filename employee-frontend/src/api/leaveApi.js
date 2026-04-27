import api from './axiosInstance';

export const getLeaveRequests = (params) => api.get('/leaverequests', { params });
export const createLeaveRequest = (data) => api.post('/leaverequests', data);
export const updateLeaveStatus = (id, data) => api.patch(`/leaverequests/${id}/status`, data);
export const deleteLeaveRequest = (id) => api.delete(`/leaverequests/${id}`);
