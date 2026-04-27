import api from './axiosInstance';

export const getPayrolls = (params) => api.get('/payroll', { params });
export const getPayroll = (id) => api.get(`/payroll/${id}`);
export const createPayroll = (data) => api.post('/payroll', data);
export const addPayrollItem = (id, item) => api.post(`/payroll/${id}/items`, item);
export const deletePayrollItem = (payrollId, itemId) => api.delete(`/payroll/${payrollId}/items/${itemId}`);
export const finalizePayroll = (id) => api.patch(`/payroll/${id}/finalize`);
export const deletePayroll = (id) => api.delete(`/payroll/${id}`);
