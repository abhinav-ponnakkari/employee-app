import api from './axiosInstance';

export const getReviewCycles = () => api.get('/reviewcycles');
export const createReviewCycle = (data) => api.post('/reviewcycles', data);
export const closeReviewCycle = (id) => api.patch(`/reviewcycles/${id}/close`);
export const deleteReviewCycle = (id) => api.delete(`/reviewcycles/${id}`);

export const getReviews = (cycleId, employeeId) =>
  api.get(`/reviewcycles/${cycleId}/reviews`, { params: employeeId ? { employeeId } : {} });
export const createReview = (cycleId, data) => api.post(`/reviewcycles/${cycleId}/reviews`, data);
export const updateReview = (cycleId, reviewId, data) =>
  api.put(`/reviewcycles/${cycleId}/reviews/${reviewId}`, data);
export const deleteReview = (cycleId, reviewId) =>
  api.delete(`/reviewcycles/${cycleId}/reviews/${reviewId}`);
export const getMyReviews = () => api.get('/reviewcycles/myreviews');
