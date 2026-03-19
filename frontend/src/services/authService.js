import api from './api';

export const authService = {
 login: async (email, password) => {
 const response = await api.post('/auth/login', { email, password });
 if (response.data.success) {
 localStorage.setItem('token', response.data.data.token);
 localStorage.setItem('user', JSON.stringify(response.data.data.user));
 }
 return response.data;
 },

 logout: async () => {
 const response = await api.post('/auth/logout');
 localStorage.removeItem('token');
 localStorage.removeItem('user');
 return response.data;
 },

 getMe: async () => {
 const response = await api.get('/auth/me');
 return response.data;
 },

 updateProfile: async (data) => {
 const response = await api.put('/auth/profile', data);
 return response.data;
 },

 changePassword: async (currentPassword, newPassword) => {
 const response = await api.post('/auth/change-password', {
 currentPassword,
 newPassword,
 });
 return response.data;
 },

 getToken: () => localStorage.getItem('token'),

 getUser: () => {
 const user = localStorage.getItem('user');
 return user ? JSON.parse(user) : null;
 },

 isAuthenticated: () => {
 return !!localStorage.getItem('token');
 },

 hasRole: (role) => {
 const user = authService.getUser();
 return user?.role === role;
 },
};
