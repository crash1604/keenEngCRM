import { makeAutoObservable, runInAction } from 'mobx';
import { emailSyncService } from '../services/emailSync';

class EmailSyncStore {
  // Accounts
  accounts = [];
  currentAccount = null;
  accountStatistics = null;

  // Threads
  threads = [];
  currentThread = null;

  // Emails
  emails = [];
  currentEmail = null;

  // UI State
  loading = false;
  syncLoading = false;
  oauthLoading = false;
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

  // ========== Account Actions ==========

  async fetchAccounts() {
    this.loading = true;
    this.error = null;
    try {
      const data = await emailSyncService.getAccounts();
      runInAction(() => {
        this.accounts = data.results || data;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch accounts';
        this.loading = false;
      });
    }
  }

  async createAccount(accountData) {
    this.loading = true;
    this.error = null;
    try {
      const data = await emailSyncService.createAccount(accountData);
      runInAction(() => {
        this.accounts.push(data);
        this.currentAccount = data;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || error.email_address?.[0] || 'Failed to create account';
        this.loading = false;
      });
      throw error;
    }
  }

  async updateAccount(id, accountData) {
    this.loading = true;
    this.error = null;
    try {
      const data = await emailSyncService.updateAccount(id, accountData);
      runInAction(() => {
        const idx = this.accounts.findIndex(a => a.id === id);
        if (idx !== -1) this.accounts[idx] = data;
        if (this.currentAccount?.id === id) this.currentAccount = data;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to update account';
        this.loading = false;
      });
      throw error;
    }
  }

  async deleteAccount(id) {
    this.loading = true;
    this.error = null;
    try {
      await emailSyncService.deleteAccount(id);
      runInAction(() => {
        this.accounts = this.accounts.filter(a => a.id !== id);
        if (this.currentAccount?.id === id) this.currentAccount = null;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to delete account';
        this.loading = false;
      });
    }
  }

  async testConnection(id) {
    this.syncLoading = true;
    this.error = null;
    try {
      const result = await emailSyncService.testConnection(id);
      runInAction(() => {
        this.syncLoading = false;
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Connection test failed';
        this.syncLoading = false;
      });
      throw error;
    }
  }

  async syncAccount(id) {
    this.syncLoading = true;
    this.error = null;
    try {
      const result = await emailSyncService.syncAccount(id);
      runInAction(() => {
        this.syncLoading = false;
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Sync failed';
        this.syncLoading = false;
      });
      throw error;
    }
  }

  async fetchAccountStatistics(id) {
    try {
      const data = await emailSyncService.getAccountStatistics(id);
      runInAction(() => {
        this.accountStatistics = data;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch statistics';
      });
    }
  }

  // ========== OAuth2 Actions ==========

  async initiateOAuth2(data = {}) {
    this.oauthLoading = true;
    this.error = null;
    try {
      const result = await emailSyncService.getOAuth2AuthUrl(data);
      runInAction(() => {
        this.oauthLoading = false;
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to initiate OAuth2';
        this.oauthLoading = false;
      });
      throw error;
    }
  }

  // ========== Thread Actions ==========

  async fetchThreads(params = {}) {
    this.loading = true;
    this.error = null;
    try {
      const mergedParams = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...this.filters,
        ...params,
      };
      const data = await emailSyncService.getThreads(mergedParams);
      runInAction(() => {
        this.threads = data.results || data;
        this.totalCount = data.count || this.threads.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch threads';
        this.loading = false;
      });
    }
  }

  async fetchThreadById(id) {
    this.loading = true;
    this.error = null;
    try {
      const data = await emailSyncService.getThreadById(id);
      runInAction(() => {
        this.currentThread = data;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch thread';
        this.loading = false;
      });
    }
  }

  async starThread(id) {
    try {
      const result = await emailSyncService.starThread(id);
      runInAction(() => {
        const thread = this.threads.find(t => t.id === id);
        if (thread) thread.is_starred = result.is_starred;
        if (this.currentThread?.id === id) {
          this.currentThread.is_starred = result.is_starred;
        }
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to star thread';
      });
    }
  }

  async archiveThread(id) {
    try {
      const result = await emailSyncService.archiveThread(id);
      runInAction(() => {
        const thread = this.threads.find(t => t.id === id);
        if (thread) thread.is_archived = result.is_archived;
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to archive thread';
      });
    }
  }

  async linkThread(id, linkData) {
    try {
      const result = await emailSyncService.linkThread(id, linkData);
      runInAction(() => {
        const idx = this.threads.findIndex(t => t.id === id);
        if (idx !== -1) this.threads[idx] = result;
        if (this.currentThread?.id === id) this.currentThread = result;
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to link thread';
      });
    }
  }

  async markThreadRead(id) {
    try {
      await emailSyncService.markThreadRead(id);
      runInAction(() => {
        const thread = this.threads.find(t => t.id === id);
        if (thread) thread.unread_count = 0;
        if (this.currentThread?.id === id) {
          this.currentThread.unread_count = 0;
        }
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to mark thread as read';
      });
    }
  }

  // ========== Email Actions ==========

  async fetchEmails(params = {}) {
    this.loading = true;
    this.error = null;
    try {
      const mergedParams = {
        page: this.currentPage,
        page_size: this.pageSize,
        ...this.filters,
        ...params,
      };
      const data = await emailSyncService.getEmails(mergedParams);
      runInAction(() => {
        this.emails = data.results || data;
        this.totalCount = data.count || this.emails.length;
        this.loading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch emails';
        this.loading = false;
      });
    }
  }

  async fetchEmailById(id) {
    this.loading = true;
    this.error = null;
    try {
      const data = await emailSyncService.getEmailById(id);
      runInAction(() => {
        this.currentEmail = data;
        this.loading = false;
      });
      return data;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to fetch email';
        this.loading = false;
      });
    }
  }

  async markEmailRead(id) {
    try {
      await emailSyncService.markEmailRead(id);
      runInAction(() => {
        const email = this.emails.find(e => e.id === id);
        if (email) email.is_read = true;
        if (this.currentEmail?.id === id) this.currentEmail.is_read = true;
      });
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to mark email as read';
      });
    }
  }

  async toggleEmailStar(id) {
    try {
      const result = await emailSyncService.toggleEmailStar(id);
      runInAction(() => {
        const email = this.emails.find(e => e.id === id);
        if (email) email.is_starred = result.is_starred;
        if (this.currentEmail?.id === id) {
          this.currentEmail.is_starred = result.is_starred;
        }
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to toggle star';
      });
    }
  }

  async linkEmail(id, linkData) {
    try {
      const result = await emailSyncService.linkEmail(id, linkData);
      runInAction(() => {
        const idx = this.emails.findIndex(e => e.id === id);
        if (idx !== -1) this.emails[idx] = result;
        if (this.currentEmail?.id === id) this.currentEmail = result;
      });
      return result;
    } catch (error) {
      runInAction(() => {
        this.error = error.detail || 'Failed to link email';
      });
    }
  }

  // ========== State Management ==========

  setFilters(filters) {
    this.filters = { ...this.filters, ...filters };
  }

  clearFilters() {
    this.filters = {};
    this.searchQuery = '';
    this.currentPage = 1;
  }

  setPage(page) {
    this.currentPage = page;
  }

  clearError() {
    this.error = null;
  }

  clearCurrentThread() {
    this.currentThread = null;
  }

  clearCurrentEmail() {
    this.currentEmail = null;
  }

  clearAll() {
    this.accounts = [];
    this.currentAccount = null;
    this.accountStatistics = null;
    this.threads = [];
    this.currentThread = null;
    this.emails = [];
    this.currentEmail = null;
    this.error = null;
    this.filters = {};
    this.searchQuery = '';
    this.currentPage = 1;
  }
}

export const emailSyncStore = new EmailSyncStore();
