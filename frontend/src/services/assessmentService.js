import api from './api';

export const assessmentService = {
 getAssessments: async (params = {}) => {
  const response = await api.get('/assessments', { params });
  return response.data;
 },

 getAssessment: async (id) => {
  const response = await api.get(`/assessments/${id}`);
  return response.data;
 },

 createAssessment: async (data) => {
  const response = await api.post('/assessments', data);
  return response.data;
 },

 updateAssessment: async (id, data) => {
  const response = await api.put(`/assessments/${id}`, data);
  return response.data;
 },

 deleteAssessment: async (id) => {
  const response = await api.delete(`/assessments/${id}`);
  return response.data;
 },

 duplicateAssessment: async (id) => {
  const response = await api.post(`/assessments/${id}/duplicate`);
  return response.data;
 },

 togglePublish: async (id) => {
  const response = await api.patch(`/assessments/${id}/toggle-publish`);
  return response.data;
 },

 toggleMute: async (id) => {
  const response = await api.patch(`/assessments/${id}/toggle-mute`);
  return response.data;
 },

 generatePublicLink: async (id, expiresInDays = 30) => {
  const response = await api.post(`/assessments/${id}/generate-link`, { expiresInDays });
  return response.data;
 },

 revokePublicLink: async (id) => {
  const response = await api.delete(`/assessments/${id}/revoke-link`);
  return response.data;
 },

 assignToUsers: async (id, userIds) => {
  const response = await api.post(`/assessments/${id}/assign`, { userIds });
  return response.data;
 },

 assignToGroups: async (id, groupIds) => {
  const response = await api.post(`/assessments/${id}/assign`, { groupIds });
  return response.data;
 },

 unassign: async (id, userIds = [], groupIds = []) => {
  const response = await api.post(`/assessments/${id}/unassign`, { userIds, groupIds });
  return response.data;
 },

 getMyAssignments: async (params = {}) => {
  const response = await api.get('/assessments/my-assignments', { params });
  return response.data;
 },

 getQuestions: async (assessmentId) => {
  const response = await api.get(`/assessments/${assessmentId}/questions`);
  return response.data;
 },

 createQuestion: async (assessmentId, data) => {
  const response = await api.post(`/assessments/${assessmentId}/questions`, data);
  return response.data;
 },

 updateQuestion: async (assessmentId, questionId, data) => {
  const response = await api.put(`/assessments/${assessmentId}/questions/${questionId}`, data);
  return response.data;
 },

 deleteQuestion: async (assessmentId, questionId) => {
  const response = await api.delete(`/assessments/${assessmentId}/questions/${questionId}`);
  return response.data;
 },

 bulkCreateQuestions: async (assessmentId, questions) => {
  const response = await api.post(`/assessments/${assessmentId}/questions/bulk`, { questions });
  return response.data;
 },

 reorderQuestions: async (assessmentId, questionOrders) => {
  const response = await api.put(`/assessments/${assessmentId}/questions/reorder`, { questionOrders });
  return response.data;
 },

 getStats: async (id) => {
  const response = await api.get(`/assessments/${id}/stats`);
  return response.data;
 },

 getPublicAssessment: async (token) => {
  const response = await api.get(`/assessments/public/${token}`);
  return response.data;
 },
};
