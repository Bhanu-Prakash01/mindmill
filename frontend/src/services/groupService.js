import api from './api';

export const groupService = {
 getGroups: async (params = {}) => {
 const response = await api.get('/groups', { params });
 return response.data;
 },

 getGroup: async (id) => {
 const response = await api.get(`/groups/${id}`);
 return response.data;
 },

 createGroup: async (data) => {
 const response = await api.post('/groups', data);
 return response.data;
 },

 updateGroup: async (id, data) => {
 const response = await api.put(`/groups/${id}`, data);
 return response.data;
 },

 deleteGroup: async (id) => {
 const response = await api.delete(`/groups/${id}`);
 return response.data;
 },

 addMembers: async (id, userIds) => {
 const response = await api.post(`/groups/${id}/members`, { userIds });
 return response.data;
 },

 removeMembers: async (id, userIds) => {
 const response = await api.delete(`/groups/${id}/members`, { data: { userIds } });
 return response.data;
 },
};
