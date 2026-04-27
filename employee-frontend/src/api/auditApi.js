import api from './axiosInstance';

export const getAuditLogs = (params) => api.get('/audit', { params });
