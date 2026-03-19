import api from './api';

export const organizationService = {
 getOrganizations: async (params = {}) => {
 const response = await api.get('/organizations', { params });
 return response.data;
 },

 getOrganization: async (id) => {
 const response = await api.get(`/organizations/${id}`);
 return response.data;
 },

 getMyOrganization: async () => {
 const response = await api.get('/organizations/my-organization');
 return response.data;
 },

 createOrganization: async (data) => {
 const response = await api.post('/organizations', data);
 return response.data;
 },

 updateOrganization: async (id, data) => {
 const response = await api.put(`/organizations/${id}`, data);
 return response.data;
 },

 deleteOrganization: async (id) => {
 const response = await api.delete(`/organizations/${id}`);
 return response.data;
 },

 updateBranding: async (id, data) => {
 const response = await api.put(`/organizations/${id}/branding`, data);
 return response.data;
 },

 updatePublicProfile: async (id, data) => {
 const response = await api.put(`/organizations/${id}/public-profile`, data);
 return response.data;
 },

 getPublicProfile: async (slug) => {
 const response = await api.get(`/organizations/public/${slug}`);
 return response.data;
 },

 toggleFeature: async (id, feature, enabled) => {
 const response = await api.patch(`/organizations/${id}/features/${feature}`, { enabled });
 return response.data;
 },

 getStats: async (id) => {
 const response = await api.get(`/organizations/${id}/stats`);
 return response.data;
 },
};
