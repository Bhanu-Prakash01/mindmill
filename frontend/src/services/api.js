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

// Routes that should NOT trigger a login redirect on 401:
// 1. Public assessment/attempt/report routes (unauthenticated users)
// 2. Auth routes where 401 means "bad credentials", not "session expired"
const PUBLIC_API_PREFIXES = [
  '/assessments/public/',
  '/assessments/invite/',
  '/attempts/public/',
  '/attempts/invite/',
  '/reports/shared/',
  '/auth/login',
  '/auth/demo/',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const isPublicRoute = (url = '') =>
  PUBLIC_API_PREFIXES.some((prefix) => url.includes(prefix));

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      if (!isPublicRoute(requestUrl)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Public API instance — NEVER sends an Authorization header.
 * Use for invite links and public test routes so that a stale
 * admin/user token in localStorage never pollutes a public request
 * and never triggers a spurious 401 → login redirect.
 */
const publicApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Export for use in components
export { orgSlug, getOrgSlugFromPath, publicApi };
export default api;
