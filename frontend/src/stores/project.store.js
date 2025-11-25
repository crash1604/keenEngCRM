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

  // Projects CRUD
  fetchProjects: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const filters = { ...get().filters, ...params };
      const data = await projectService.getProjects(filters);
      
      // Handle different response formats
      let projects = [];
      let pagination = get().pagination;
      
      if (Array.isArray(data)) {
        projects = data;
        pagination = {
          current: 1,
          total: data.length,
          page_size: data.length
        };
      } else if (data.results) {
        projects = data.results;
        pagination = {
          current: data.current || 1,
          total: data.count || 0,
          page_size: data.page_size || 20,
          next: data.next,
          previous: data.previous
        };
      } else {
        projects = [data];
        pagination = {
          current: 1,
          total: 1,
          page_size: 1
        };
      }
      
      set({ 
        projects, 
        pagination,
        loading: false,
        error: null
      });
      
      return { success: true, data: projects, pagination };
      
    } catch (error) {
      console.error('Error in fetchProjects:', error);
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Failed to fetch projects';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Dashboard Methods
  fetchDashboardStats: async () => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getDashboardStats();
      set({ dashboardStats: data, loading: false, error: null });
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
      const overdueProjects = Array.isArray(data) ? data : data.results || data;
      set({ overdueProjects, loading: false, error: null });
      return { success: true, data: overdueProjects };
    } catch (error) {
      console.error('Error in fetchOverdueProjects:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch overdue projects';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  fetchUpcomingInspections: async () => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getUpcomingInspections();
      const upcomingInspections = Array.isArray(data) ? data : data.results || data;
      set({ upcomingInspections, loading: false, error: null });
      return { success: true, data: upcomingInspections };
    } catch (error) {
      console.error('Error in fetchUpcomingInspections:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch upcoming inspections';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Single Project Methods
  fetchProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getProject(id);
      set({ currentProject: data, loading: false, error: null });
      return { success: true, data };
    } catch (error) {
      console.error('Error in fetchProject:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch project';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  createProject: async (projectData) => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.createProject(projectData);
      set((state) => ({ 
        projects: [data, ...state.projects],
        loading: false,
        error: null 
      }));
      return { success: true, data };
    } catch (error) {
      console.error('Error in createProject:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to create project';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateProject: async (id, projectData) => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.updateProject(id, projectData);
      set((state) => ({
        projects: state.projects.map(project => 
          project.id === id ? data : project
        ),
        currentProject: state.currentProject?.id === id ? data : state.currentProject,
        loading: false,
        error: null
      }));
      return { success: true, data };
    } catch (error) {
      console.error('Error in updateProject:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to update project';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  updateProjectStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.updateStatus(id, { status });
      const updatedProject = data.data || data;
      
      set((state) => ({
        projects: state.projects.map(project => 
          project.id === id ? { ...project, ...updatedProject, status } : project
        ),
        currentProject: state.currentProject?.id === id ? 
          { ...state.currentProject, ...updatedProject, status } : state.currentProject,
        loading: false,
        error: null
      }));
      
      return { success: true, data: updatedProject };
    } catch (error) {
      console.error('Error in updateProjectStatus:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to update status';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  deleteProject: async (id) => {
    set({ loading: true, error: null });
    try {
      await projectService.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter(project => project.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        loading: false,
        error: null
      }));
      return { success: true };
    } catch (error) {
      console.error('Error in deleteProject:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to delete project';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Activity Logs
  fetchActivityLogs: async (id) => {
    set({ loading: true, error: null });
    try {
      const data = await projectService.getActivityLogs(id);
      const activityLogs = Array.isArray(data) ? data : data.results || data;
      set({ activityLogs, loading: false, error: null });
      return { success: true, data: activityLogs };
    } catch (error) {
      console.error('Error in fetchActivityLogs:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch activity logs';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update single field
  updateProjectField: async (id, fieldName, value) => {
  set({ loading: true, error: null });
  try {
    const updateData = { [fieldName]: value };
    const data = await projectService.updateProject(id, updateData);
    
    set((state) => ({
      projects: state.projects.map(project => 
        project.id === id ? { ...project, ...data, [fieldName]: value } : project
      ),
      currentProject: state.currentProject?.id === id ? 
        { ...state.currentProject, ...data, [fieldName]: value } : state.currentProject,
      loading: false,
      error: null
    }));
    
    return { success: true, data };
  } catch (error) {
    console.error('Error in updateProjectField:', error);
    const errorMessage = error.response?.data?.detail || 
                        error.response?.data?.message || 
                        'Failed to update project field';
    set({ error: errorMessage, loading: false });
    return { success: false, error: errorMessage };
  }
},

  // Export
  exportProjects: async () => {
    set({ loading: true, error: null });
    try {
      const blob = await projectService.exportProjects();
      
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'projects_export.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      set({ loading: false, error: null });
      return { success: true };
    } catch (error) {
      console.error('Error in exportProjects:', error);
      const errorMessage = error.response?.data?.detail || error.response?.data?.message || 'Failed to export projects';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  clearError: () => set({ error: null }),
  clearCurrentProject: () => set({ currentProject: null }),
}));