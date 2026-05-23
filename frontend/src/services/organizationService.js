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

  uploadLogo: async (id, file) => {
  const formData = new FormData();
  formData.append('logo', file);
  const response = await api.put(`/organizations/${id}/logo`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
  },

  uploadBanner: async (id, file) => {
  const formData = new FormData();
  formData.append('banner', file);
  const response = await api.put(`/organizations/${id}/banner`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
  },

  updateBanner: async (id, banner) => {
   const response = await api.put(`/organizations/${id}/banner`, { banner });
   return response.data;
   },

  reassignAdmin: async (id, adminId) => {
    const response = await api.patch(`/organizations/${id}/admin`, { adminId });
    return response.data;
  },

  uploadProfileDocument: async (id, section, file) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('section', section);
    const response = await api.post(`/organizations/${id}/profile-document`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteProfileDocument: async (id, section, documentId) => {
    const response = await api.delete(`/organizations/${id}/profile-document`, {
      data: { section, documentId },
    });
    return response.data;
  },

  getBankDetails: async () => {
    const response = await api.get('/organizations/bank-details');
    return response.data;
  },

  updateBankDetails: async (data) => {
    const response = await api.put('/organizations/bank-details', data);
    return response.data;
  },
};
