import api from './axiosInstance';

export const getSalaryHistory = (employeeId) => api.get(`/salaryhistory/employee/${employeeId}`);
export const addSalaryHistory = (data) => api.post('/salaryhistory', data);
export const deleteSalaryHistory = (id) => api.delete(`/salaryhistory/${id}`);
