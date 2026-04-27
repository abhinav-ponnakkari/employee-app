import api from './axiosInstance';

export const getUsers = () => api.get('/users');
export const getUserByEmployee = (employeeId) => api.get(`/users/byemployee/${employeeId}`);
export const createUser = (data) => api.post('/users', data);
export const resetPassword = (id, password) => api.patch(`/users/${id}/password`, { password });
export const changeUsername = (id, username) => api.patch(`/users/${id}/username`, { username });
export const deleteUser = (id) => api.delete(`/users/${id}`);
