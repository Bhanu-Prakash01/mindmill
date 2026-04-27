import api, { publicApi } from './api';

export const attemptService = {
 startAttempt: async (assessmentId, passcode = null) => {
  const response = await api.post(`/attempts/assessments/${assessmentId}/start`, { passcode });
  return response.data;
 },

  startPublicAttempt: async (assessmentId, data = {}) => {
    const response = await publicApi.post(`/attempts/public/${assessmentId}/start`, data);
    return response.data;
  },

  startInviteAttempt: async (token, data = {}) => {
    const response = await publicApi.post(`/attempts/invite/${token}/start`, data);
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

saveAnswer: async (attemptId, questionIdOrData, answerData) => {
    let questionId, selectedOption, textAnswer, ratingAnswer, timeSpent;
    
    // Handle both call styles:
    // 1. saveAnswer(attemptId, '1', { selectedOption: 3 }) - string questionId
    // 2. saveAnswer(attemptId, { questionId: '1', selectedOption: 3 }) - object form
    if (typeof questionIdOrData === 'object' && questionIdOrData !== null) {
      questionId = questionIdOrData.questionId;
      selectedOption = questionIdOrData.selectedOption;
      textAnswer = questionIdOrData.textAnswer;
      ratingAnswer = questionIdOrData.ratingAnswer;
      timeSpent = questionIdOrData.timeSpent;
    } else {
      questionId = questionIdOrData;
      if (answerData) {
        selectedOption = answerData.selectedOption;
        textAnswer = answerData.textAnswer;
        ratingAnswer = answerData.ratingAnswer;
        timeSpent = answerData.timeSpent;
      }
    }
    
    const response = await api.post(`/attempts/${attemptId}/answer`, {
      questionId,
      selectedOption,
      textAnswer,
      ratingAnswer,
      timeSpent,
    });
    return response.data;
  },

 submitAttempt: async (id, body = {}) => {
  const response = await api.post(`/attempts/${id}/submit`, body);
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
