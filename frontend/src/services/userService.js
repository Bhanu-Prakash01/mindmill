import api from './api';

export const userService = {
 getUsers: async (params = {}) => {
  const response = await api.get('/users', { params });
  return response.data;
 },

 getUser: async (id) => {
  const response = await api.get(`/users/${id}`);
  return response.data;
 },

 createUser: async (data) => {
  const response = await api.post('/users', data);
  return response.data;
 },

 updateUser: async (id, data) => {
  const response = await api.put(`/users/${id}`, data);
  return response.data;
 },

 deleteUser: async (id) => {
  const response = await api.delete(`/users/${id}`);
  return response.data;
 },

 toggleUserStatus: async (id) => {
  const response = await api.patch(`/users/${id}/toggle-status`);
  return response.data;
 },

 assignAssessments: async (id, assessmentIds) => {
  const response = await api.post(`/users/${id}/assign-assessments`, { assessmentIds });
  return response.data;
 },

  bulkUpload: async (data) => {
   const response = await api.post('/users/bulk-upload', data);
   return response.data;
  },

  resetPassword: async (id, newPassword) => {
   const response = await api.post(`/users/${id}/reset-password`, { newPassword });
   return response.data;
  },
};
