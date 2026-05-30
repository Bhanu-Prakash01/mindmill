import api, { publicApi } from './api';

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

  assignToUsers: async (id, userIds, memberSlots = {}) => {
    const response = await api.post(`/assessments/${id}/assign`, { userIds, memberSlots });
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
  const response = await api.put(`/questions/${questionId}`, data);
  return response.data;
 },

  deleteQuestion: async (assessmentId, questionId) => {
  const response = await api.delete(`/questions/${questionId}`);
  return response.data;
 },

 bulkCreateQuestions: async (assessmentId, questions, replaceExisting = false) => {
  const response = await api.post(`/assessments/${assessmentId}/questions/bulk`, { questions, replaceExisting });
  return response.data;
 },

  reorderQuestions: async (assessmentId, questionOrders) => {
    const response = await api.put(`/assessments/${assessmentId}/questions/reorder`, { questionOrders });
    return response.data;
  },

  uploadQuestionImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await api.post(`/upload-image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

 getStats: async (id) => {
  const response = await api.get(`/assessments/${id}/stats`);
    return response.data;
  },

  getAssessmentByInviteToken: async (token) => {
    const response = await publicApi.get(`/assessments/invite/${token}`);
    return response.data;
  },

  unlockAssessment: async (id, testCount) => {
    const response = await api.post(`/assessments/${id}/unlock`, { testCount });
    return response.data;
  },

  refundUnattempted: async (id) => {
    const response = await api.post(`/assessments/${id}/refund-unattempted`);
    return response.data;
  },

  getAssessmentPurchases: async (id) => {
    const response = await api.get(`/assessments/${id}/purchases`);
    return response.data;
  },

  allocateToMembers: async (id, allocations) => {
    const response = await api.post(`/assessments/${id}/allocate`, { allocations });
    return response.data;
  },

  getAllocations: async (id) => {
    const response = await api.get(`/assessments/${id}/allocations`);
    return response.data;
  },

  removeAllocation: async (id, allocId) => {
    const response = await api.delete(`/assessments/${id}/allocations/${allocId}`);
    return response.data;
  },

  getMyAllocation: async (id) => {
    const response = await api.get(`/assessments/${id}/my-allocation`);
    return response.data;
  },

  uploadBanner: async (id, file) => {
    const formData = new FormData();
    formData.append('banner', file);
    const response = await api.post(`/assessments/${id}/upload-banner`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteBanner: async (id) => {
    const response = await api.delete(`/assessments/${id}/banner`);
    return response.data;
  },
};
