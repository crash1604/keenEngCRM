import api from './api';

export const authService = {
  /**
   * Login user - tokens are set as HTTP-only cookies by the server
   */
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  /**
   * Register user - tokens are set as HTTP-only cookies by the server
   */
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  /**
   * Logout user - clears HTTP-only cookies on the server
   */
  logout: async () => {
    const response = await api.post('/auth/logout/');
    return response.data;
  },

  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  /**
   * Update user profile
   */
  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile/', userData);
    return response.data;
  },

  /**
   * Check authentication status - useful for verifying if user is logged in
   * since we can't read HTTP-only cookies from JavaScript
   */
  checkAuthStatus: async () => {
    // Use a shorter timeout for auth check to avoid long waits if backend is down
    const response = await api.get('/auth/status/', { timeout: 5000 });
    return response.data;
  },

  /**
   * Refresh token - cookies are handled automatically
   */
  refreshToken: async () => {
    const response = await api.post('/auth/token/refresh/');
    return response.data;
  },

  /**
   * Verify token validity
   */
  verifyToken: async () => {
    const response = await api.post('/auth/token/verify/');
    return response.data;
  },

  /**
   * Change user password
   */
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password/', passwordData);
    return response.data;
  },

  /**
   * Update user settings/preferences
   */
  updateSettings: async (settings) => {
    const response = await api.patch('/auth/profile/', settings);
    return response.data;
  },
};