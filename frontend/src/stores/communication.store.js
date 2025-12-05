import { makeAutoObservable, runInAction } from 'mobx';
import { communicationService } from '../services/communication';

class CommunicationStore {
  // Email Templates
  templates = [];
  currentTemplate = null;
  templateVariables = [];

  // Email Logs
  emailLogs = [];
  currentEmailLog = null;
  statistics = null;

  // UI State
  loading = false;
  error = null;

  // Pagination
  totalCount = 0;
  currentPage = 1;
  pageSize = 20;

  // Filters
  filters = {};
  searchQuery = '';

  constructor() {
    makeAutoObservable(this);
  }

  // ========== Email Templates Actions ==========

  // Fetch all templates
  async fetchTemplates(page = 1, filters = {}) {
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

      const data = await communicationService.getAllTemplates(params);

      runInAction(() => {
        this.templates = data.results || data;
        this.totalCount = data.count || data.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch templates';
        this.loading = false;
      });
      throw error;
    }
  }

  // Fetch template by ID
  async fetchTemplateById(id) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.getTemplateById(id);

      runInAction(() => {
        this.currentTemplate = data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch template';
        this.loading = false;
      });
      throw error;
    }
  }

  // Create template
  async createTemplate(templateData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.createTemplate(templateData);

      runInAction(() => {
        this.templates.unshift(data);
        this.totalCount += 1;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to create template';
        this.loading = false;
      });
      throw error;
    }
  }

  // Update template
  async updateTemplate(id, templateData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.updateTemplate(id, templateData);

      runInAction(() => {
        const index = this.templates.findIndex(template => template.id === id);
        if (index !== -1) {
          this.templates[index] = data;
        }
        if (this.currentTemplate?.id === id) {
          this.currentTemplate = data;
        }
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to update template';
        this.loading = false;
      });
      throw error;
    }
  }

  // Delete template
  async deleteTemplate(id) {
    this.loading = true;
    this.error = null;

    try {
      await communicationService.deleteTemplate(id);

      runInAction(() => {
        this.templates = this.templates.filter(template => template.id !== id);
        this.totalCount -= 1;
        if (this.currentTemplate?.id === id) {
          this.currentTemplate = null;
        }
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to delete template';
        this.loading = false;
      });
      throw error;
    }
  }

  // Duplicate template
  async duplicateTemplate(id) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.duplicateTemplate(id);

      runInAction(() => {
        this.templates.unshift(data);
        this.totalCount += 1;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to duplicate template';
        this.loading = false;
      });
      throw error;
    }
  }

  // Get template variables
  async fetchTemplateVariables(id) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.getTemplateVariables(id);

      runInAction(() => {
        this.templateVariables = data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch template variables';
        this.loading = false;
      });
      throw error;
    }
  }

  // ========== Email Logs Actions ==========

  // Fetch all email logs
  async fetchEmailLogs(page = 1, filters = {}) {
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

      const data = await communicationService.getAllLogs(params);

      runInAction(() => {
        this.emailLogs = data.results || data;
        this.totalCount = data.count || data.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch email logs';
        this.loading = false;
      });
      throw error;
    }
  }

  // Fetch email log by ID
  async fetchEmailLogById(id) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.getLogById(id);

      runInAction(() => {
        this.currentEmailLog = data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch email log';
        this.loading = false;
      });
      throw error;
    }
  }

  // Get email statistics
  async fetchEmailStatistics() {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.getEmailStatistics();

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

  // ========== Email Actions ==========

  // Send email
  async sendEmail(emailData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.sendEmail(emailData);

      runInAction(() => {
        // Add new email to logs if successful
        if (data.email_log) {
          this.emailLogs.unshift(data.email_log);
          this.totalCount += 1;
        }
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || error.message || 'Failed to send email';
        this.loading = false;
      });
      throw error;
    }
  }

  // Preview email
  async previewEmail(previewData) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.previewEmail(previewData);

      runInAction(() => {
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to preview email';
        this.loading = false;
      });
      throw error;
    }
  }

  // ========== Helper Methods ==========

  // Get logs by project
  async fetchLogsByProject(projectId) {
    this.loading = true;
    this.error = null;

    try {
      const data = await communicationService.getLogsByProject(projectId);

      runInAction(() => {
        this.emailLogs = data.results || data;
        this.totalCount = data.count || data.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch logs by project';
        this.loading = false;
      });
      throw error;
    }
  }

  // Search email logs
  async searchEmailLogs(query) {
    this.loading = true;
    this.error = null;
    this.searchQuery = query;

    try {
      const data = await communicationService.searchLogs(query);

      runInAction(() => {
        this.emailLogs = data.results || data;
        this.totalCount = data.count || data.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to search email logs';
        this.loading = false;
      });
      throw error;
    }
  }

  // ========== State Management ==========

  // Clear error
  clearError() {
    this.error = null;
  }

  // Clear current template
  clearCurrentTemplate() {
    this.currentTemplate = null;
  }

  // Clear current email log
  clearCurrentEmailLog() {
    this.currentEmailLog = null;
  }

  // Clear template variables
  clearTemplateVariables() {
    this.templateVariables = [];
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
    this.searchQuery = '';
  }

  // Clear all data
  clearAll() {
    this.templates = [];
    this.currentTemplate = null;
    this.templateVariables = [];
    this.emailLogs = [];
    this.currentEmailLog = null;
    this.statistics = null;
    this.error = null;
    this.filters = {};
    this.searchQuery = '';
  }
}

export const communicationStore = new CommunicationStore();
