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

 getDemoOrganizations: async () => {
  const response = await api.get('/auth/demo/organizations');
  return response.data;
 },

 getDemoUsers: async (slug) => {
  const response = await api.get(`/auth/demo/organizations/${slug}/users`);
  return response.data;
 },

 demoLogin: async (email, orgSlug) => {
  const response = await api.post('/auth/demo/login', { email, orgSlug });
  if (response.data.success) {
  localStorage.setItem('token', response.data.data.token);
  localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  return response.data;
 },

logout: async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    api.post('/auth/logout').catch(() => {});

    return { success: true, message: 'Logout successful' };
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

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
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
