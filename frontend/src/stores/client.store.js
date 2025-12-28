import { makeAutoObservable, runInAction } from 'mobx';
import { clientService } from '../services/client';

class ClientStore {
  clients = [];
  currentClient = null;
  loading = false;
  error = null;
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  searchQuery = '';
  filters = {};
  statistics = null;
  activities = [];
  bulkCreateResult = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Fetch all clients
  async fetchClients(page = 1, filters = {}) {
    this.loading = true;
    this.error = null;
    this.currentPage = page;
    this.filters = { ...this.filters, ...filters };

    try {
      const params = {
        page,
        page_size: this.pageSize,
        ...this.filters,
      };

      const data = await clientService.getAllClients(params);
      
      runInAction(() => {
        this.clients = data.results;
        this.totalCount = data.count;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch clients';
        this.loading = false;
      });
      throw error;
    }
  }

  // Fetch client by ID
  async fetchClientById(id) {
    this.loading = true;
    this.error = null;

    try {
      const data = await clientService.getClientById(id);
      
      runInAction(() => {
        this.currentClient = data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch client';
        this.loading = false;
      });
      throw error;
    }
  }

  // Create client
  async createClient(clientData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await clientService.createClient(clientData);
      
      runInAction(() => {
        this.clients.unshift(data);
        this.totalCount += 1;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to create client';
        this.loading = false;
      });
      throw error;
    }
  }

  // Update client
  async updateClient(id, clientData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await clientService.updateClient(id, clientData);

      runInAction(() => {
        const index = this.clients.findIndex(client => client.id === id);
        if (index !== -1) {
          this.clients[index] = data;
        }
        if (this.currentClient?.id === id) {
          this.currentClient = data;
        }
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to update client';
        this.loading = false;
      });
      throw error;
    }
  }

  // Update single field (async without page reload)
  async updateClientField(id, fieldName, value) {
    try {
      const updateData = { [fieldName]: value };

      // Optimistic update - update UI immediately
      runInAction(() => {
        const index = this.clients.findIndex(client => client.id === id);
        if (index !== -1) {
          this.clients[index] = { ...this.clients[index], [fieldName]: value };
        }
        if (this.currentClient?.id === id) {
          this.currentClient = { ...this.currentClient, [fieldName]: value };
        }
      });

      // Send to backend asynchronously
      const data = await clientService.updateClient(id, updateData);

      // Update with server response
      runInAction(() => {
        const index = this.clients.findIndex(client => client.id === id);
        if (index !== -1) {
          this.clients[index] = { ...this.clients[index], ...data };
        }
        if (this.currentClient?.id === id) {
          this.currentClient = { ...this.currentClient, ...data };
        }
        this.error = null;
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateClientField:', error);
      // Revert by refetching on error
      this.fetchClients(this.currentPage);
      return { success: false, error: error.detail || 'Failed to update field' };
    }
  }

  // Delete client
  async deleteClient(id) {
    this.loading = true;
    this.error = null;

    try {
      await clientService.deleteClient(id);
      
      runInAction(() => {
        this.clients = this.clients.filter(client => client.id !== id);
        this.totalCount -= 1;
        if (this.currentClient?.id === id) {
          this.currentClient = null;
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to delete client';
        this.loading = false;
      });
      throw error;
    }
  }

  // Search clients
  async searchClients(query) {
    this.loading = true;
    this.error = null;
    this.searchQuery = query;

    try {
      const data = await clientService.searchClients(query);
      
      runInAction(() => {
        this.clients = data.results || data;
        this.totalCount = data.count || data.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to search clients';
        this.loading = false;
      });
      throw error;
    }
  }

  // Get statistics
  async fetchStatistics() {
    this.loading = true;
    this.error = null;

    try {
      const data = await clientService.getClientStatistics();
      
      runInAction(() => {
        this.statistics = data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch statistics';
        this.loading = false;
      });
      throw error;
    }
  }

  // Bulk create clients
  async bulkCreate(clientsData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await clientService.bulkCreateClients(clientsData);
      
      runInAction(() => {
        this.bulkCreateResult = data;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to bulk create clients';
        this.loading = false;
      });
      throw error;
    }
  }

  // Export clients
  async exportClients(format = 'json', filters = {}) {
    this.loading = true;
    this.error = null;

    try {
      const data = await clientService.exportClients(format, filters);
      
      runInAction(() => {
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to export clients';
        this.loading = false;
      });
      throw error;
    }
  }

  // Get client activities
  async fetchClientActivities(id) {
    this.loading = true;
    this.error = null;

    try {
      const data = await clientService.getClientActivities(id);
      
      runInAction(() => {
        this.activities = data.activities || [];
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch activities';
        this.loading = false;
      });
      throw error;
    }
  }

  // Clear error
  clearError() {
    this.error = null;
  }

  // Clear current client
  clearCurrentClient() {
    this.currentClient = null;
  }

  // Clear activities
  clearActivities() {
    this.activities = [];
  }

  // Clear bulk create result
  clearBulkCreateResult() {
    this.bulkCreateResult = null;
  }

  // Set page size
  setPageSize(size) {
    this.pageSize = size;
  }

  // Set filters
  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
  }

  // Clear filters
  clearFilters() {
    this.filters = {};
  }
}

export const clientStore = new ClientStore();