import { create } from 'zustand';
import { authService } from '../services/auth';

// Track if we've already started initialization to prevent duplicate calls
let isInitializing = false;

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading to check auth status on mount
  error: null,

  /**
   * Login user - server sets HTTP-only cookies
   * Note: We don't set isLoading here to avoid triggering PublicRoute's loading spinner
   */
  login: async (credentials) => {
    set({ error: null });
    try {
      const data = await authService.login(credentials);

      set({
        user: data.user,
        isAuthenticated: true
      });

      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Login failed';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Register user - server sets HTTP-only cookies
   * Note: We don't set isLoading here to avoid triggering PublicRoute's loading spinner
   */
  register: async (userData) => {
    set({ error: null });
    try {
      const data = await authService.register(userData);

      set({
        user: data.user,
        isAuthenticated: true
      });

      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.details || error.response?.data?.error || 'Registration failed';
      set({ error: errorMessage });
      return { success: false, error: errorMessage };
    }
  },

  /**
   * Logout user - server clears HTTP-only cookies
   */
  logout: async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      set({
        user: null,
        isAuthenticated: false,
        error: null
      });
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.updateProfile(userData);
      set({ user: data, isLoading: false });
      return { success: true, data };
    } catch (error) {
      const errorMessage = error.response?.data?.details || 'Profile update failed';
      set({ error: errorMessage, isLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),

  /**
   * Check authentication status by calling the server
   * This is needed because we can't read HTTP-only cookies from JavaScript
   */
  checkAuth: async () => {
    // Prevent duplicate initialization calls
    if (isInitializing) return;
    isInitializing = true;

    try {
      const data = await authService.checkAuthStatus();

      if (data && data.isAuthenticated) {
        set({
          isAuthenticated: true,
          user: data.user,
          isLoading: false
        });
      } else {
        set({
          isAuthenticated: false,
          user: null,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // If the request fails, assume not authenticated
      set({
        isAuthenticated: false,
        user: null,
        isLoading: false
      });
    } finally {
      // Reset the flag to allow retries if needed (e.g., after login)
      isInitializing = false;
    }
  },
}));