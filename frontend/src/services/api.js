import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Extract org slug from current URL path
 * e.g., /o/acme/dashboard -> 'acme'
 * Returns null if not on an org-scoped route
 */
const getOrgSlugFromPath = () => {
  const pathname = window.location.pathname;
  const match = pathname.match(/^\/o\/([^/]+)/);
  return match ? match[1] : null;
};

const orgSlug = getOrgSlugFromPath();

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and org slug header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Re-read slug from current path on each request (SPA navigation)
    const slug = getOrgSlugFromPath();
    if (slug) {
      config.headers['X-Org-Slug'] = slug;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export for use in components
export { orgSlug, getOrgSlugFromPath };
export default api;
