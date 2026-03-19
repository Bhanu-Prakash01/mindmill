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
 const response = await api.post(`/support/tickets/${id}/responses`, {
 message,
 isInternal,
 });
 return response.data;
 },

 updateStatus: async (id, status) => {
 const response = await api.patch(`/support/tickets/${id}/status`, { status });
 return response.data;
 },

 assignTicket: async (id, userId) => {
 const response = await api.patch(`/support/tickets/${id}/assign`, { userId });
 return response.data;
 },

 addTags: async (id, tags) => {
 const response = await api.patch(`/support/tickets/${id}/tags`, { tags });
 return response.data;
 },

 submitSatisfaction: async (id, rating, feedback) => {
 const response = await api.post(`/support/tickets/${id}/satisfaction`, {
 rating,
 feedback,
 });
 return response.data;
 },
};
