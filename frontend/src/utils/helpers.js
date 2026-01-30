// Time constants (in seconds)
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 3600;
const SECONDS_PER_DAY = 86400;
const SECONDS_PER_WEEK = 604800;

export const getStoredUser = () => {
  try {
    return JSON.parse(localStorage.getItem('user'));
  } catch {
    return null;
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateISO = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '');
};

export const capitalizeFirst = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const hasRole = (allowedRoles, userRole) => {
  return allowedRoles.includes(userRole);
};

export const isAdminOrManager = (role) => {
  return role === 'admin' || role === 'manager';
};

export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < SECONDS_PER_MINUTE) {
    return 'Just now';
  } else if (diffInSeconds < SECONDS_PER_HOUR) {
    const minutes = Math.floor(diffInSeconds / SECONDS_PER_MINUTE);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < SECONDS_PER_DAY) {
    const hours = Math.floor(diffInSeconds / SECONDS_PER_HOUR);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < SECONDS_PER_WEEK) {
    const days = Math.floor(diffInSeconds / SECONDS_PER_DAY);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return date.toLocaleDateString();
  }
};

// Compact relative time for grids (e.g., "5m ago", "2h ago")
export const formatRelativeTimeShort = (timestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// CSV Export utilities
export const escapeCSV = (value) => {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const downloadCSV = (csvContent, filename) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const exportToCSV = (data, headers, filename) => {
  if (!data || data.length === 0) {
    return { success: false, error: 'No data to export' };
  }

  try {
    const headerRow = headers.map(h => h.label).join(',');
    const dataRows = data.map(row =>
      headers.map(h => escapeCSV(h.getValue(row))).join(',')
    );
    const csvContent = [headerRow, ...dataRows].join('\n');

    downloadCSV(csvContent, filename);

    return { success: true, count: data.length };
  } catch (error) {
    return { success: false, error: error.message || 'Export failed' };
  }
};

// Get user initials for avatars
export const getInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

// Check if dark mode is enabled (reads from DOM)
export const isDarkMode = () => {
  return document.documentElement.classList.contains('dark');
};