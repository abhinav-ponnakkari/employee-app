import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5170/api',
});

export const getNotes = (employeeId) => api.get(`/employeenotes/employee/${employeeId}`);
export const addNote = (data) => api.post('/employeenotes', data);
export const deleteNote = (id) => api.delete(`/employeenotes/${id}`);
