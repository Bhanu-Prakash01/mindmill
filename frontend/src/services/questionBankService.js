import api from './api';

export const questionBankService = {
  // Get all question banks across assessments
  getQuestionBanks: async (params = {}) => {
    const response = await api.get('/question-banks/banks', { params });
    return response.data;
  },

  // Get question sets for a specific assessment
  getQuestionSets: async (assessmentId) => {
    const response = await api.get(`/question-banks/assessments/${assessmentId}/sets`);
    return response.data;
  },

  // Create a new question set
  createQuestionSet: async (assessmentId, data) => {
    const response = await api.post(`/question-banks/assessments/${assessmentId}/sets`, data);
    return response.data;
  },

  // Get questions by set/dimension
  getQuestionsBySet: async (assessmentId, dimension) => {
    const response = await api.get(`/question-banks/assessments/${assessmentId}/sets/${dimension}`);
    return response.data;
  },

  // Bulk import questions to a set
  bulkImportQuestions: async (assessmentId, dimension, questions) => {
    const response = await api.post(
      `/question-banks/assessments/${assessmentId}/sets/${dimension}/import`,
      { questions }
    );
    return response.data;
  },

  // Delete a question set
  deleteQuestionSet: async (assessmentId, dimension) => {
    const response = await api.delete(`/question-banks/assessments/${assessmentId}/sets/${dimension}`);
    return response.data;
  },

  // Export a question set
  exportQuestionSet: async (assessmentId, dimension) => {
    const response = await api.get(`/question-banks/assessments/${assessmentId}/sets/${dimension}/export`);
    return response.data;
  },

  // Import a question set from JSON
  importQuestionSet: async (assessmentId, data) => {
    const response = await api.post(`/question-banks/assessments/${assessmentId}/import-set`, data);
    return response.data;
  }
};
