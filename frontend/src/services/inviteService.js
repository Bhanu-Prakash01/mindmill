import api from './api';

export const inviteService = {
  createInvite: async (data) => {
    const response = await api.post('/invites', data);
    return response.data;
  },

  getInvites: async (params = {}) => {
    const response = await api.get('/invites', { params });
    return response.data;
  },

  getInviteStats: async () => {
    const response = await api.get('/invites/stats');
    return response.data;
  },

  getAssessmentInvites: async (assessmentId, params = {}) => {
    const response = await api.get(`/invites/assessment/${assessmentId}`, { params });
    return response.data;
  },

  cancelInvite: async (id) => {
    const response = await api.delete(`/invites/${id}`);
    return response.data;
  },

  resendInvite: async (id) => {
    const response = await api.post(`/invites/${id}/resend`);
    return response.data;
  }
};
