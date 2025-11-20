// src/stores/project.store.js
import { create } from 'zustand';
import { projectService } from '../services/project';

export const useProjectStore = create((set, get) => ({
  // State
  projects: [],
  currentProject: null,
  dashboardStats: null,
  overdueProjects: [],
  upcomingInspections: [],
  activityLogs: [],
  loading: false,
  error: null,
  pagination: {
    current: 1,
    total: 0,
    page_size: 20
  },
  filters: {
    status: '',
    search: '',
    ordering: '-created_at',
    page: 1,
    page_size: 20
  },

  // Actions
  setFilters: (newFilters) => set((state) => ({ 
    filters: { ...state.filters, ...newFilters } 
  })),

  clearFilters: () => set({ 
    filters: {
      status: '',
      search: '',
      ordering: '-created_at',
      page: 1,
      page_size: 20
    }
  }),

  // Projects CRUD - Updated to handle different response formats
  fetchProjects: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const filters = { ...get().filters, ...params };
      const data = await projectService.getProjects(filters);
      
      // Handle both array and paginated responses
      let projects = [];
      let pagination = get().pagination;
      
      if (Array.isArray(data)) {
        projects = data;
      } else if (data.results) {
        // Django REST Framework paginated response
        projects = data.results;
        pagination = {
          current: data.current_page || 1,
          total: data.count || data.total_count || 0,
          page_size: data.page_size || 20,
          total_pages: data.total_pages || Math.ceil((data.count || 0) / (data.page_size || 20))
        };
      } else {
        projects = data;
      }
      
      set({ 
        projects, 
        pagination,
        loading: false 
      });
      return { success: true, data: projects, pagination };
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch projects';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // ... rest of your store methods remain similar but add better error handling
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getDashboardStats();
      set({ dashboardStats: data, loading: false });
      return { success: true, data };
    } catch (error) {
      console.error('Error in fetchDashboardStats:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch dashboard stats';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  fetchOverdueProjects: async () => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getOverdueProjects();
      // Handle paginated response for overdue projects too
      const overdueProjects = data.results || data;
      set({ overdueProjects, loading: false });
      return { success: true, data: overdueProjects };
    } catch (error) {
      console.error('Error in fetchOverdueProjects:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch overdue projects';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // ... update other methods similarly with better error handling

  clearError: () => set({ error: null }),
  clearCurrentProject: () => set({ currentProject: null }),
}));