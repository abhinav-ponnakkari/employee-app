import api from './axiosInstance';

export const getAttendanceReport = (month, year) =>
  api.get('/attendance/report', { params: { month, year } });
export const getTodayAttendance = () => api.get('/attendance/today');
export const getEmployeeAttendance = (id, month, year) =>
  api.get(`/attendance/employee/${id}`, { params: { month, year } });
