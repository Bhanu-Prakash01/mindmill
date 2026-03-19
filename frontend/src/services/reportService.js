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

 downloadReport: async (id) => {
 const response = await api.get(`/reports/${id}/download`);
 return response.data;
 },
};
