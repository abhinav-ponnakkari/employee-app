import axios from 'axios';

// Use a plain axios instance (no auth header needed for login)
const base = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5170/api',
});

export const login = (data) => base.post('/auth/login', data);
