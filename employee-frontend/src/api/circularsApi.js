import api from './axiosInstance';

export const getCirculars = () => api.get('/circulars');
export const createCircular = (data) => api.post('/circulars', data);
export const deleteCircular = (id) => api.delete(`/circulars/${id}`);
