import api from './axiosInstance';

export const sendMessage = (messages) => api.post('/chat/message', { messages });
