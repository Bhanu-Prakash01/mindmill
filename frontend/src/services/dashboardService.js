import api from './api';

export const dashboardService = {
 getSuperAdminStats: async () => {
 const response = await api.get('/dashboard/superadmin');
 return response.data;
 },

 getAdminStats: async () => {
 const response = await api.get('/dashboard/admin');
 return response.data;
 },

 getUserStats: async () => {
 const response = await api.get('/dashboard/user');
 return response.data;
 },

 getRecentActivity: async (limit = 10) => {
 const response = await api.get('/dashboard/activity', { params: { limit } });
 return response.data;
 },

 getSystemHealth: async () => {
 const response = await api.get('/dashboard/health');
 return response.data;
 },
};
