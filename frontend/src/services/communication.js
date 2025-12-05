import api from './api';

export const communicationService = {
  // ========== Email Templates ==========

  // Get all email templates
  getAllTemplates: async (params = {}) => {
    try {
      const response = await api.get('/communication/templates/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get template by ID
  getTemplateById: async (id) => {
    try {
      const response = await api.get(`/communication/templates/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Create email template
  createTemplate: async (templateData) => {
    try {
      const response = await api.post('/communication/templates/', templateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Update email template
  updateTemplate: async (id, templateData) => {
    try {
      const response = await api.put(`/communication/templates/${id}/`, templateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Partial update template
  partialUpdateTemplate: async (id, templateData) => {
    try {
      const response = await api.patch(`/communication/templates/${id}/`, templateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Delete email template
  deleteTemplate: async (id) => {
    try {
      const response = await api.delete(`/communication/templates/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Duplicate email template
  duplicateTemplate: async (id) => {
    try {
      const response = await api.post(`/communication/templates/${id}/duplicate/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get available variables for template
  getTemplateVariables: async (id) => {
    try {
      const response = await api.get(`/communication/templates/${id}/variables/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Email Logs ==========

  // Get all email logs
  getAllLogs: async (params = {}) => {
    try {
      const response = await api.get('/communication/logs/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get all email logs for AG Grid
  getAllLogsForGrid: async (params = {}) => {
    try {
      const response = await api.get('/communication/logs/', { params });
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

  // Get email log by ID
  getLogById: async (id) => {
    try {
      const response = await api.get(`/communication/logs/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get email statistics
  getEmailStatistics: async () => {
    try {
      const response = await api.get('/communication/logs/statistics/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Email Actions ==========

  // Send email from template
  sendEmail: async (emailData) => {
    try {
      const response = await api.post('/communication/actions/send_email/', emailData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Preview email template
  previewEmail: async (previewData) => {
    try {
      const response = await api.post('/communication/actions/preview_email/', previewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Helper Methods ==========

  // Get email logs by project
  getLogsByProject: async (projectId) => {
    try {
      const response = await api.get('/communication/logs/', {
        params: { project_id: projectId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Get email logs by date range
  getLogsByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/communication/logs/', {
        params: { start_date: startDate, end_date: endDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Search email logs
  searchLogs: async (query) => {
    try {
      const response = await api.get('/communication/logs/', {
        params: { search: query }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
