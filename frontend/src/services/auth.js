import api from './api';

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  logout: async (refreshToken) => {
    const response = await api.post('/auth/logout/', { refresh_token: refreshToken });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await api.put('/auth/profile/', userData);
    return response.data;
  },

  refreshToken: async (refresh) => {
    const response = await api.post('/auth/token/refresh/', { refresh });
    return response.data;
  },

  verifyToken: async (token) => {
    const response = await api.post('/auth/token/verify/', { token });
    return response.data;
  },
};