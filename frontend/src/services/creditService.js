import api from './api';

export const creditService = {
 getCreditRequests: async (params = {}) => {
  const response = await api.get('/credits/requests', { params });
  return response.data;
 },

 getMyCreditRequests: async () => {
  const response = await api.get('/credits/my-requests');
  return response.data;
 },

 requestCredits: async (data) => {
  const response = await api.post('/credits/request', data);
  return response.data;
 },

   approveRequest: async (id, data) => {
  const response = await api.put(`/credits/requests/${id}/approve`, data);
  return response.data;
 },

   rejectRequest: async (id, data) => {
  const response = await api.put(`/credits/requests/${id}/reject`, data);
  return response.data;
 },

   deleteRequest: async (id) => {
  const response = await api.delete(`/credits/requests/${id}`);
  return response.data;
 },

 getCreditStats: async () => {
  const response = await api.get('/credits/stats');
  return response.data;
 },

 addCredits: async (organizationId, data) => {
  const response = await api.post(`/credits/organizations/${organizationId}/add`, data);
  return response.data;
 },

 getAllOrganizationCredits: async () => {
  const response = await api.get('/credits', { params: { all: true } });
  return response.data;
 },
};
