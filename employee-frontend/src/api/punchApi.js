import api from './axiosInstance';

export const getPunchRecords = (employeeId) =>
  api.get('/punchrecords', { params: employeeId ? { employeeId } : {} });

export const punchIn = () => api.post('/punchrecords/punchin');
export const punchOut = (id) => api.patch(`/punchrecords/${id}/punchout`);
export const deletePunchRecord = (id) => api.delete(`/punchrecords/${id}`);
