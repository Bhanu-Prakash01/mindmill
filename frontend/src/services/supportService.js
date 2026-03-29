import api from './api';

export const supportService = {
 getTickets: async (params = {}) => {
 const response = await api.get('/support/tickets', { params });
 return response.data;
 },

 getMyTickets: async () => {
 const response = await api.get('/support/my-tickets');
 return response.data;
 },

 getTicket: async (id) => {
 const response = await api.get(`/support/tickets/${id}`);
 return response.data;
 },

 createTicket: async (data) => {
 const response = await api.post('/support/tickets', data);
 return response.data;
 },

 addResponse: async (id, message, isInternal = false) => {
 const response = await api.post(`/support/tickets/${id}/respond`, {
 message,
 isInternal,
 });
 return response.data;
 },

 updateStatus: async (id, status) => {
 const response = await api.put(`/support/tickets/${id}/status`, { status });
 return response.data;
 },

 assignTicket: async (id, userId) => {
 const response = await api.put(`/support/tickets/${id}/assign`, { userId });
 return response.data;
 },

 getCoordinators: async () => {
 const response = await api.get('/support/coordinators');
 return response.data;
 },

 getStandardQueries: async () => {
 const response = await api.get('/settings/standard-queries');
 return response.data;
 },

 getAllStandardQueries: async () => {
 const response = await api.get('/settings/standard-queries/all');
 return response.data;
 },

 createStandardQuery: async (data) => {
 const response = await api.post('/settings/standard-queries', data);
 return response.data;
 },

 updateStandardQuery: async (id, data) => {
 const response = await api.put(`/settings/standard-queries/${id}`, data);
 return response.data;
 },

 deleteStandardQuery: async (id) => {
 const response = await api.delete(`/settings/standard-queries/${id}`);
 return response.data;
 },

 seedDefaultQueries: async () => {
 const response = await api.post('/settings/standard-queries/seed');
 return response.data;
 },
};
