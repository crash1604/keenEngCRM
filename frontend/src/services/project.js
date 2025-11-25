// src/services/project.js
import api from './api';

// Helper function to clean parameters - remove empty values that cause 400 errors
const cleanParams = (params = {}) => {
  const cleaned = {};
  Object.keys(params).forEach(key => {
    const value = params[key];
    // Only include non-empty, non-null, non-undefined values
    if (value !== '' && value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  return cleaned;
};

export const projectService = {
  // Basic CRUD Operations
  getProjects: async (params = {}) => {
    try {
      const cleanedParams = cleanParams(params);
      console.log('🚀 Sending request to /projects/ with params:', params);
      console.log('🧹 Cleaned params:', cleanedParams);
      
      const response = await api.get('/projects/', { params: cleanedParams });
      console.log('✅ Received response from /projects/:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error in getProjects service:', error);
      console.error('❌ Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        headers: error.response?.headers
      });
      throw error;
    }
  },

  // ... keep the rest of your service methods the same but add cleaning to all that use params
  getProject: async (id) => {
    const response = await api.get(`/projects/${id}/`);
    return response.data;
  },

  createProject: async (projectData) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },

  updateProject: async (id, projectData) => {
  try {
    console.log('Making PATCH request for project:', id);
    console.log('PATCH data:', projectData);
    
    // Use PATCH for partial updates instead of PUT
    const response = await api.patch(`/projects/${id}/`, projectData);
    
    console.log('PATCH response:', response.data);
    return response.data;
  } catch (error) {
    console.error('PATCH project error:', error);
    console.error('Error response data:', error.response?.data);
    throw error;
  }
},

  partialUpdateProject: async (id, projectData) => {
    const response = await api.patch(`/projects/${id}/`, projectData);
    return response.data;
  },

  deleteProject: async (id) => {
    const response = await api.delete(`/projects/${id}/`);
    return response.data;
  },

  // Custom Actions
  updateStatus: async (id, statusData) => {
    const response = await api.post(`/projects/${id}/update_status/`, statusData);
    return response.data;
  },
  updateProject: async (id, projectData) => {
  try {
    console.log('Making PATCH request for project:', id);
    console.log('PATCH data:', projectData);
    
    // Use PATCH for partial updates instead of PUT
    const response = await api.patch(`/projects/${id}/`, projectData);
    
    console.log('PATCH response:', response.data);
    return response.data;
  } catch (error) {
    console.error('PATCH project error:', error);
    console.error('Error response data:', error.response?.data);
    throw error;
  }
},

  getDashboardStats: async () => {
    const response = await api.get('/projects/dashboard_stats/');
    return response.data;
  },

  getOverdueProjects: async () => {
    const response = await api.get('/projects/overdue/');
    return response.data;
  },

  getUpcomingInspections: async () => {
    const response = await api.get('/projects/upcoming_inspections/');
    return response.data;
  },

  getActivityLogs: async (id) => {
    const response = await api.get(`/projects/${id}/activity_logs/`);
    return response.data;
  },

  exportProjects: async () => {
    const response = await api.get('/projects/export/', {
      responseType: 'blob'
    });
    return response.data;
  },

  // Filter helpers - also clean params in these methods
  getProjectsByStatus: async (status) => {
    const response = await api.get('/projects/', { params: cleanParams({ status }) });
    return response.data;
  },

  getMyProjects: async () => {
    const response = await api.get('/projects/', { params: cleanParams({ my_projects: true }) });
    return response.data;
  },

  searchProjects: async (searchTerm) => {
    const response = await api.get('/projects/', { params: cleanParams({ search: searchTerm }) });
    return response.data;
  },
};
