import { create } from 'zustand';
import { authService } from '../services/auth';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.login(credentials);
      
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.details || 'Login failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(userData);
      
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      set({ 
        user: data.user, 
        isAuthenticated: true, 
        isLoading: false 
      });
      
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.details || 'Registration failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  logout: async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      set({ 
        user: null, 
        isAuthenticated: false, 
        error: null 
      });
    }
  },

  updateProfile: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updateProfile(userData);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, isLoading: false });
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.details || 'Profile update failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),

  checkAuth: () => {
    const token = localStorage.getItem('access_token');
    const user = localStorage.getItem('user');
    if (token && user) {
      set({ 
        isAuthenticated: true, 
        user: JSON.parse(user) 
      });
    }
  },
}));