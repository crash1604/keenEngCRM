import { makeAutoObservable, runInAction } from 'mobx';
import { architectService } from '../services/architect';

class ArchitectStore {
  architects = [];
  currentArchitect = null;
  loading = false;
  error = null;
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;
  searchQuery = '';
  filters = {};
  statistics = null;

  constructor() {
    makeAutoObservable(this);
  }

  // Fetch all architects
  async fetchArchitects(page = 1, filters = {}) {
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

      const data = await architectService.getAllArchitects(params);

      runInAction(() => {
        // Handle both paginated and non-paginated responses
        if (Array.isArray(data)) {
          this.architects = data;
          this.totalCount = data.length;
        } else if (data.results) {
          this.architects = data.results;
          this.totalCount = data.count;
        } else {
          this.architects = data;
          this.totalCount = data.length || 0;
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch architects';
        this.loading = false;
      });
      throw error;
    }
  }

  // Fetch architect by ID
  async fetchArchitectById(id) {
    this.loading = true;
    this.error = null;

    try {
      const data = await architectService.getArchitectById(id);

      runInAction(() => {
        this.currentArchitect = data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch architect';
        this.loading = false;
      });
      throw error;
    }
  }

  // Create architect
  async createArchitect(architectData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await architectService.createArchitect(architectData);

      runInAction(() => {
        this.architects.unshift(data);
        this.totalCount += 1;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to create architect';
        this.loading = false;
      });
      throw error;
    }
  }

  // Update architect
  async updateArchitect(id, architectData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await architectService.updateArchitect(id, architectData);

      runInAction(() => {
        const index = this.architects.findIndex(architect => architect.id === id);
        if (index !== -1) {
          this.architects[index] = data;
        }
        if (this.currentArchitect?.id === id) {
          this.currentArchitect = data;
        }
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to update architect';
        this.loading = false;
      });
      throw error;
    }
  }

  // Update single field (async without page reload)
  async updateArchitectField(id, fieldName, value) {
    try {
      const updateData = { [fieldName]: value };

      // Optimistic update - update UI immediately
      runInAction(() => {
        const index = this.architects.findIndex(architect => architect.id === id);
        if (index !== -1) {
          this.architects[index] = { ...this.architects[index], [fieldName]: value };
        }
        if (this.currentArchitect?.id === id) {
          this.currentArchitect = { ...this.currentArchitect, [fieldName]: value };
        }
      });

      // Send to backend asynchronously
      const data = await architectService.updateArchitect(id, updateData);

      // Update with server response
      runInAction(() => {
        const index = this.architects.findIndex(architect => architect.id === id);
        if (index !== -1) {
          this.architects[index] = { ...this.architects[index], ...data };
        }
        if (this.currentArchitect?.id === id) {
          this.currentArchitect = { ...this.currentArchitect, ...data };
        }
        this.error = null;
      });

      return { success: true, data };
    } catch (error) {
      console.error('Error in updateArchitectField:', error);
      // Revert by refetching on error
      this.fetchArchitects(this.currentPage);
      return { success: false, error: error.detail || 'Failed to update field' };
    }
  }

  // Delete architect
  async deleteArchitect(id) {
    this.loading = true;
    this.error = null;

    try {
      await architectService.deleteArchitect(id);

      runInAction(() => {
        this.architects = this.architects.filter(architect => architect.id !== id);
        this.totalCount -= 1;
        if (this.currentArchitect?.id === id) {
          this.currentArchitect = null;
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to delete architect';
        this.loading = false;
      });
      throw error;
    }
  }

  // Search architects
  async searchArchitects(query) {
    this.loading = true;
    this.error = null;
    this.searchQuery = query;

    try {
      const data = await architectService.searchArchitects(query);

      runInAction(() => {
        this.architects = data.results || data;
        this.totalCount = data.count || data.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to search architects';
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
      const data = await architectService.getStatistics();

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

  // Clear error
  clearError() {
    this.error = null;
  }

  // Clear current architect
  clearCurrentArchitect() {
    this.currentArchitect = null;
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

export const architectStore = new ArchitectStore();
