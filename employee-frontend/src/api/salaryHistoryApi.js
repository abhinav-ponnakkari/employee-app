import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5170/api',
});

export const getSalaryHistory = (employeeId) => api.get(`/salaryhistory/employee/${employeeId}`);
export const addSalaryHistory = (data) => api.post('/salaryhistory', data);
export const deleteSalaryHistory = (id) => api.delete(`/salaryhistory/${id}`);
