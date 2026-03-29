import api from './api';

export const attemptService = {
 startAttempt: async (assessmentId, passcode = null) => {
  const response = await api.post(`/attempts/assessments/${assessmentId}/start`, { passcode });
  return response.data;
 },

  startPublicAttempt: async (assessmentId, data = {}) => {
    const response = await api.post(`/attempts/public/${assessmentId}/start`, data);
    return response.data;
  },

  startInviteAttempt: async (token, data = {}) => {
    const response = await api.post(`/attempts/invite/${token}/start`, data);
    return response.data;
  },

  getMyAttempts: async (params = {}) => {
  const response = await api.get('/attempts', { params });
  return response.data;
 },

 getAttempt: async (id) => {
  const response = await api.get(`/attempts/${id}`);
  return response.data;
 },

 getPublicAttempt: async (id) => {
  const response = await api.get(`/attempts/public/attempt/${id}`);
  return response.data;
 },

 saveAnswer: async (attemptId, questionId, answerData) => {
  const response = await api.post(`/attempts/${attemptId}/answer`, {
  questionId,
  ...answerData,
  });
  return response.data;
 },

 submitAttempt: async (id) => {
  const response = await api.post(`/attempts/${id}/submit`);
  return response.data;
 },

 getAttemptByAssessment: async (assessmentId) => {
  const response = await api.get(`/attempts/assessment/${assessmentId}`);
  return response.data;
 },

 logProctoringEvent: async (attemptId, eventData) => {
  const response = await api.post(`/attempts/${attemptId}/proctoring-log`, eventData);
  return response.data;
 },

 verifyPasscode: async (assessmentId, passcode) => {
  const response = await api.post(`/attempts/assessments/${assessmentId}/verify-passcode`, { passcode });
  return response.data;
 },

  requestReportAccess: async (attemptId, message = '') => {
    const response = await api.post(`/attempts/${attemptId}/request-report`, { message });
    return response.data;
  },

  abandonAttempt: async (id) => {
    const response = await api.post(`/attempts/${id}/abandon`);
    return response.data;
  },
};
