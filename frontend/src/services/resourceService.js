import api from './api';

export const resourceService = {
  getResources: (params = {}) =>
    api.get('/resources', { params }).then(r => r.data),

  getAllResources: (params = {}) =>
    api.get('/resources/all', { params }).then(r => r.data),

  createResource: (formData) =>
    api.post('/resources', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  updateResource: (id, formData) =>
    api.put(`/resources/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }).then(r => r.data),

  deleteResource: (id) =>
    api.delete(`/resources/${id}`).then(r => r.data),
};
