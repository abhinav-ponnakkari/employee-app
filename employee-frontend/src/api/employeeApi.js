import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5170/api',
});

export const getEmployees = () => api.get('/employees');
export const getEmployee = (id) => api.get(`/employees/${id}`);
export const createEmployee = (data) => api.post('/employees', data);
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data);
export const deleteEmployee = (id) => api.delete(`/employees/${id}`);
