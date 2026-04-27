import api from './axiosInstance';

export const getNotes = (employeeId) => api.get(`/employeenotes/employee/${employeeId}`);
export const addNote = (data) => api.post('/employeenotes', data);
export const deleteNote = (id) => api.delete(`/employeenotes/${id}`);
