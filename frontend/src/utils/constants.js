export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
  CLIENT: 'client',
  ARCHITECT: 'architect',
};

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  CLIENTS: '/clients',
  PROJECTS: '/projects',
  ARCHITECTS: '/architects',
  ACTIVITY: '/activity',
  COMMUNICATION: '/communication',
  SETTINGS: '/settings',
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
};

export const TOKEN_KEYS = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
  USER: 'user',
};

// Activity action types configuration
export const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'note_added', label: 'Note Added' },
  { value: 'field_updated', label: 'Field Updated' },
  { value: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { value: 'due_date_changed', label: 'Due Date Changed' },
  { value: 'project_created', label: 'Project Created' },
  { value: 'project_updated', label: 'Project Updated' },
  { value: 'client_changed', label: 'Client Changed' },
  { value: 'architect_changed', label: 'Architect Changed' },
  { value: 'manager_changed', label: 'Manager Changed' },
  { value: 'email_sent', label: 'Email Sent' },
  { value: 'client_created', label: 'Client Created' },
  { value: 'client_updated', label: 'Client Updated' },
  { value: 'client_archived', label: 'Client Archived' },
  { value: 'client_restored', label: 'Client Restored' },
  { value: 'architect_created', label: 'Architect Created' },
  { value: 'architect_updated', label: 'Architect Updated' },
  { value: 'architect_deactivated', label: 'Architect Deactivated' },
  { value: 'architect_activated', label: 'Architect Activated' },
];

// Status colors for charts
export const STATUS_CHART_COLORS = {
  not_started: '#9ca3af',
  in_progress: '#2563eb',
  submitted: '#ea580c',
  completed: '#16a34a',
  closed_paid: '#7c3aed',
  cancelled: '#dc2626',
  on_hold: '#ca8a04',
};

// Activity view modes
export const ACTIVITY_VIEW_MODES = [
  { value: 'all', label: 'All Activity' },
  { value: 'my', label: 'My Activity' },
  { value: 'project', label: 'Project Activity' },
  { value: 'client', label: 'Client Activity', adminOnly: true },
  { value: 'architect', label: 'Architect Activity', adminOnly: true },
];