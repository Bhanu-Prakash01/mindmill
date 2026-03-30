import api from './api';

export const testTakerService = {
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

  getMyStats: async () => {
    const response = await api.get('/invites/my-stats');
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
  },

  bulkUploadInvites: async (formData) => {
    const response = await api.post('/invites/bulk-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data.data;
  },

  downloadTemplate: async () => {
    const response = await api.get('/invites/template', {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'test_takers_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },

  exportInvites: async (params = {}) => {
    const response = await api.get('/invites/export', {
      params,
      responseType: 'blob'
    });
    const format = params.format || 'csv';
    const filename = `test_takers_export_${new Date().toISOString().split('T')[0]}.${format === 'xlsx' ? 'xlsx' : 'csv'}`;
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};
