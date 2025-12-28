import api from './api';

const BASE_URL = '/architects';

export const architectService = {
  // Get all architects with optional filters
  getAllArchitects: async (params = {}) => {
    const response = await api.get(`${BASE_URL}/`, { params });
    return response.data;
  },

  // Get single architect by ID
  getArchitectById: async (id) => {
    const response = await api.get(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // Create new architect
  createArchitect: async (data) => {
    const response = await api.post(`${BASE_URL}/`, data);
    return response.data;
  },

  // Update architect
  updateArchitect: async (id, data) => {
    const response = await api.patch(`${BASE_URL}/${id}/`, data);
    return response.data;
  },

  // Delete architect
  deleteArchitect: async (id) => {
    const response = await api.delete(`${BASE_URL}/${id}/`);
    return response.data;
  },

  // Get active architects only
  getActiveArchitects: async () => {
    const response = await api.get(`${BASE_URL}/active/`);
    return response.data;
  },

  // Get architect statistics
  getStatistics: async () => {
    const response = await api.get(`${BASE_URL}/statistics/`);
    return response.data;
  },

  // Search architects
  searchArchitects: async (query) => {
    const response = await api.get(`${BASE_URL}/`, { params: { search: query } });
    return response.data;
  },
};

export default architectService;
