import api from './axiosInstance';

export const getLeavePolicies = () => api.get('/leavepolicies');
export const createLeavePolicy = (data) => api.post('/leavepolicies', data);
export const updateLeavePolicy = (id, data) => api.put(`/leavepolicies/${id}`, data);
export const deleteLeavePolicy = (id) => api.delete(`/leavepolicies/${id}`);
export const getLeaveBalance = (employeeId, year) =>
  api.get(`/leavepolicies/balance/${employeeId}`, { params: { year } });
