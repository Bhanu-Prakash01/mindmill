import api from './api';

export const reportService = {
  getReports: async (params = {}) => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  getReport: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  shareReport: async (id, data) => {
    const response = await api.post(`/reports/${id}/share`, data);
    return response.data;
  },

  getSharedReport: async (token) => {
    const response = await api.get(`/reports/shared/${token}`);
    return response.data;
  },

  toggleVisibility: async (id, visibleToUser) => {
    const response = await api.put(`/reports/${id}/visibility`, { visibleToUser });
    return response.data;
  },

  addAdminNotes: async (id, notes) => {
    const response = await api.put(`/reports/${id}/notes`, { notes });
    return response.data;
  },

  // Download report as PDF - returns blob for direct download
  downloadReport: async (id, type = 'comprehensive', filename = 'report.pdf') => {
    const response = await api.get(`/reports/${id}/download`, {
      params: { type },
      responseType: 'blob',
    });
  
   // Create download link and trigger it
   const url = window.URL.createObjectURL(new Blob([response.data]));
   const link = document.createElement('a');
   link.href = url;
   link.setAttribute('download', filename);
   document.body.appendChild(link);
   link.click();
   link.parentNode.removeChild(link);
   window.URL.revokeObjectURL(url);
  
   return true;
  },

  // Generate comprehensive LLM-powered report
  generateComprehensiveReport: async (attemptId, reportType = 'disc', format = 'pdf') => {
    const response = await api.post(`/attempts/${attemptId}/comprehensive-report`, {
      reportType,
      format
    }, {
      responseType: format === 'pdf' ? 'blob' : 'json',
    });
    return response.data;
  },

  // Get quick summary
  getQuickSummary: async (attemptId, type = 'disc') => {
    const response = await api.get(`/attempts/${attemptId}/quick-summary`, {
      params: { type }
    });
    return response.data;
  },

  // Preview DISC report
  previewDiscReport: async () => {
    const response = await api.get('/reports/preview/disc', {
      responseType: 'blob',
    });
    return response.data;
  },

  // Preview Big5 report
  previewBig5Report: async () => {
    const response = await api.get('/reports/preview/big5', {
      responseType: 'blob',
    });
    return response.data;
  },
};
