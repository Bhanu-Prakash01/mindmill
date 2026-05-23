import api from './api';

const setTokenAndUser = (data) => {
  localStorage.setItem('token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
};

export const authService = {
 login: async (email, password, orgSlug) => {
  const headers = {};
  if (orgSlug) {
    headers['X-Org-Slug'] = orgSlug;
  }
  const response = await api.post('/auth/login', { email, password }, { headers });
  if (response.data.success) {
  setTokenAndUser(response.data.data);
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
   setTokenAndUser(response.data.data);
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

  // Free trial registration
  getFreeTrialAssessments: async () => {
    const response = await api.get('/auth/free-trial/assessments');
    return response.data;
  },

  registerFreeTrial: async (registrationData) => {
    const response = await api.post('/auth/register', registrationData);
    return response.data;
  },

  verifyEmailOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-email-otp', { email, otp });
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    return response.data;
  },

  resendVerificationOtp: async (email) => {
    const response = await api.post('/auth/resend-verification-otp', { email });
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
