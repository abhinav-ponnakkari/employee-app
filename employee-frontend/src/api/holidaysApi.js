import api from './axiosInstance';

export const getHolidays = (year) => api.get('/holidays', { params: { year } });
export const checkHolidays = (start, end) => api.get('/holidays/check', { params: { start, end } });
export const createHoliday = (data) => api.post('/holidays', data);
export const updateHoliday = (id, data) => api.put(`/holidays/${id}`, data);
export const deleteHoliday = (id) => api.delete(`/holidays/${id}`);
