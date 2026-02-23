import api from './api';

export const emailSyncService = {
  // ========== Email Accounts ==========

  getAccounts: async () => {
    try {
      const response = await api.get('/communication/sync/accounts/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getAccountById: async (id) => {
    try {
      const response = await api.get(`/communication/sync/accounts/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  createAccount: async (accountData) => {
    try {
      const response = await api.post('/communication/sync/accounts/', accountData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  updateAccount: async (id, accountData) => {
    try {
      const response = await api.patch(`/communication/sync/accounts/${id}/`, accountData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  deleteAccount: async (id) => {
    try {
      await api.delete(`/communication/sync/accounts/${id}/`);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  testConnection: async (id) => {
    try {
      const response = await api.post(`/communication/sync/accounts/${id}/test_connection/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  syncAccount: async (id) => {
    try {
      const response = await api.post(`/communication/sync/accounts/${id}/sync_now/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getAccountFolders: async (id) => {
    try {
      const response = await api.get(`/communication/sync/accounts/${id}/folders/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getAccountStatistics: async (id) => {
    try {
      const response = await api.get(`/communication/sync/accounts/${id}/statistics/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Email Threads ==========

  getThreads: async (params = {}) => {
    try {
      const response = await api.get('/communication/sync/threads/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getThreadById: async (id) => {
    try {
      const response = await api.get(`/communication/sync/threads/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  starThread: async (id) => {
    try {
      const response = await api.post(`/communication/sync/threads/${id}/star/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  archiveThread: async (id) => {
    try {
      const response = await api.post(`/communication/sync/threads/${id}/archive/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  linkThread: async (id, linkData) => {
    try {
      const response = await api.post(`/communication/sync/threads/${id}/link/`, linkData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markThreadRead: async (id) => {
    try {
      const response = await api.post(`/communication/sync/threads/${id}/mark_read/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // ========== Synced Emails ==========

  getEmails: async (params = {}) => {
    try {
      const response = await api.get('/communication/sync/emails/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getEmailById: async (id) => {
    try {
      const response = await api.get(`/communication/sync/emails/${id}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  markEmailRead: async (id) => {
    try {
      const response = await api.post(`/communication/sync/emails/${id}/mark_read/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  toggleEmailStar: async (id) => {
    try {
      const response = await api.post(`/communication/sync/emails/${id}/toggle_star/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  linkEmail: async (id, linkData) => {
    try {
      const response = await api.post(`/communication/sync/emails/${id}/link/`, linkData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },
};
