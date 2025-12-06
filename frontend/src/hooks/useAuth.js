import { useAuthStore } from '../stores/auth.store';

/**
 * Custom hook for authentication
 * Note: Auth is initialized in App.jsx, so we don't need to call checkAuth here
 */
export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    checkAuth,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,
    checkAuth,
  };
};