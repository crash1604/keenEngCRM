// src/stores/activity.store.js
import { create } from 'zustand';
import { activityService } from '../services/activity';

export const useActivityStore = create((set, get) => ({
  // State
  activityLogs: [],
  myActivity: [],
  projectActivity: [],
  loading: false,
  error: null,
  pagination: {
    current: 1,
    total: 0,
    page_size: 10
  },

  // Actions
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Get all activity logs (role-based)
  fetchActivityLogs: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await activityService.getActivityLogs(params);
      
      let activityLogs = [];
      let pagination = get().pagination;
      
      if (Array.isArray(data)) {
        activityLogs = data;
        pagination = {
          current: 1,
          total: data.length,
          page_size: data.length
        };
      } else if (data.results) {
        activityLogs = data.results;
        pagination = {
          current: data.current || 1,
          total: data.count || 0,
          page_size: data.page_size || 10
        };
      } else {
        activityLogs = [data];
      }
      
      set({ 
        activityLogs, 
        pagination,
        loading: false,
        error: null
      });
      
      return { success: true, data: activityLogs };
      
    } catch (error) {
      console.error('Error in fetchActivityLogs:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch activity logs';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get current user's activity only
  fetchMyActivity: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await activityService.getMyActivity(params);
      
      let myActivity = [];
      
      if (Array.isArray(data)) {
        myActivity = data;
      } else if (data.results) {
        myActivity = data.results;
      } else {
        myActivity = [data];
      }
      
      set({ 
        myActivity, 
        loading: false,
        error: null
      });
      
      return { success: true, data: myActivity };
      
    } catch (error) {
      console.error('Error in fetchMyActivity:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch my activity';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Get project activity
  fetchProjectActivity: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const data = await activityService.getProjectActivity(params);
      
      let projectActivity = [];
      
      if (Array.isArray(data)) {
        projectActivity = data;
      } else if (data.results) {
        projectActivity = data.results;
      } else {
        projectActivity = [data];
      }
      
      set({ 
        projectActivity, 
        loading: false,
        error: null
      });
      
      return { success: true, data: projectActivity };
      
    } catch (error) {
      console.error('Error in fetchProjectActivity:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch project activity';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Clear all activity data
  clearActivity: () => set({ 
    activityLogs: [], 
    myActivity: [], 
    projectActivity: [] 
  })
}));