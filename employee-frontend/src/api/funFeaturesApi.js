import api from './axiosInstance';

// Employee of the Month
export const getEmployeeOfMonth = (year) =>
  api.get('/employee-of-month', { params: year ? { year } : {} });
export const getCurrentEmployeeOfMonth = () => api.get('/employee-of-month/current');
export const nominateEmployeeOfMonth = (data) => api.post('/employee-of-month', data);
export const deleteEmployeeOfMonth = (id) => api.delete(`/employee-of-month/${id}`);

// Mood Check-in
export const getMyMood = () => api.get('/mood/my');
export const submitMoodCheckin = (data) => api.post('/mood', data);
export const getTeamPulse = (weeks) => api.get('/mood/team-pulse', { params: { weeks } });
export const getMoodDistribution = () => api.get('/mood/distribution');

// Polls
export const getPolls = () => api.get('/polls');
export const createPoll = (data) => api.post('/polls', data);
export const votePoll = (id, optionIndex) => api.post(`/polls/${id}/vote`, { optionIndex });
export const closePoll = (id) => api.patch(`/polls/${id}/close`);
export const deletePoll = (id) => api.delete(`/polls/${id}`);

// Skills & Certifications
export const getMySkills = () => api.get('/skills/my');
export const getEmployeeSkills = (employeeId) => api.get(`/skills/employee/${employeeId}`);
export const addSkill = (data) => api.post('/skills', data);
export const updateSkill = (id, data) => api.put(`/skills/${id}`, data);
export const deleteSkill = (id) => api.delete(`/skills/${id}`);
export const getExpiringSkills = (days) => api.get('/skills/expiring', { params: { days } });

// Anonymous Feedback
export const submitFeedback = (data) => api.post('/feedback', data);
export const getAllFeedback = (params) => api.get('/feedback', { params });
export const markFeedbackRead = (id) => api.patch(`/feedback/${id}/read`);
export const replyToFeedback = (id, reply) => api.post(`/feedback/${id}/reply`, { reply });
export const deleteFeedback = (id) => api.delete(`/feedback/${id}`);
export const getFeedbackStats = () => api.get('/feedback/stats');

// HR Documents
export const getDocuments = (category) => api.get('/documents', { params: category ? { category } : {} });
export const downloadDocument = (id) => api.get(`/documents/${id}/download`, { responseType: 'blob' });
export const uploadDocument = (data) => api.post('/documents', data);
export const updateDocument = (id, data) => api.put(`/documents/${id}`, data);
export const deleteDocument = (id) => api.delete(`/documents/${id}`);

// Org Chart & Birthdays
export const getOrgChart = () => api.get('/employees/org-chart');
export const getUpcomingBirthdays = (days) => api.get('/employees/birthdays', { params: { days } });

// AI Insights
export const getAiInsights = () => api.get('/insights');
