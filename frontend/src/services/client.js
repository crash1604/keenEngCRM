import api from './api';

export const clientService = {
  // Get all clients (standard method)
  getAllClients: async (params = {}) => {
    try {
      const response = await api.get('/clients/clients/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all clients for AG Grid
  getAllClientsForGrid: async (params = {}) => {
    try {
      const response = await api.get('/clients/clients/', { params });
      return {
        rowData: response.data.results || response.data,
        rowCount: response.data.count,
        totalPages: response.data.total_pages,
        currentPage: response.data.current_page,
      };
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get client by ID
  getClientById: async (id) => {
    try {
      const response = await api.get(`/clients/clients/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create client
  createClient: async (clientData) => {
    try {
      const response = await api.post('/clients/clients/', clientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update client
  updateClient: async (id, clientData) => {
    try {
      const response = await api.put(`/clients/clients/${id}/`, clientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Partial update client
  partialUpdateClient: async (id, clientData) => {
    try {
      const response = await api.patch(`/clients/clients/${id}/`, clientData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete (archive) client
  deleteClient: async (id) => {
    try {
      const response = await api.delete(`/clients/clients/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search clients
  searchClients: async (query) => {
    try {
      const response = await api.get(`/clients/clients/search/?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get client statistics
  getClientStatistics: async () => {
    try {
      const response = await api.get('/clients/clients/stats/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Bulk create clients
  bulkCreateClients: async (clientsData) => {
    try {
      const response = await api.post('/clients/clients/bulk-create/', clientsData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Export clients
  exportClients: async (format = 'json', filters = {}) => {
    try {
      const params = { format, ...filters };
      const response = await api.get('/clients/clients/export/', {
        params,
        responseType: format === 'json' ? 'json' : 'blob'
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get client activities
  getClientActivities: async (id) => {
    try {
      const response = await api.get(`/clients/clients/${id}/activities/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};