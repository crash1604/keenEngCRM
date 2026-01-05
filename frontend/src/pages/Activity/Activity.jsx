// src/pages/Activity/Activity.jsx
import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import {
  Chip,
  Button,
  TextField,
  MenuItem
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  Clear as ClearIcon,
  Sync as SyncIcon,
  NoteAdd as NoteAddIcon,
  Edit as EditIconMui,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  AddCircle as AddCircleIcon,
  Update as UpdateIcon,
  People as PeopleIcon,
  Architecture as ArchitectureIcon,
  ManageAccounts as ManageAccountsIcon,
  Assignment as AssignmentIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import { useActivityStore } from '../../stores/activity.store';
import { useAuthStore } from '../../stores/auth.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Helper to check dark mode
const isDarkMode = () => document.documentElement.classList.contains('dark');

// Action type options for filter
const ACTION_TYPES = [
  { value: '', label: 'All Actions' },
  // Project actions
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
  // Client actions
  { value: 'client_created', label: 'Client Created' },
  { value: 'client_updated', label: 'Client Updated' },
  { value: 'client_archived', label: 'Client Archived' },
  { value: 'client_restored', label: 'Client Restored' },
  // Architect actions
  { value: 'architect_created', label: 'Architect Created' },
  { value: 'architect_updated', label: 'Architect Updated' },
  { value: 'architect_deactivated', label: 'Architect Deactivated' },
  { value: 'architect_activated', label: 'Architect Activated' },
];

// Action type configuration for display (with light and dark mode colors)
const ACTION_CONFIG = {
  // Project actions
  status_change: { label: 'Status Change', light: { color: '#3b82f6', bgColor: '#dbeafe' }, dark: { color: '#93c5fd', bgColor: '#1e3a5f' }, Icon: SyncIcon },
  note_added: { label: 'Note Added', light: { color: '#22c55e', bgColor: '#dcfce7' }, dark: { color: '#86efac', bgColor: '#064e3b' }, Icon: NoteAddIcon },
  field_updated: { label: 'Field Updated', light: { color: '#eab308', bgColor: '#fef9c3' }, dark: { color: '#fcd34d', bgColor: '#78350f' }, Icon: EditIconMui },
  inspection_scheduled: { label: 'Inspection', light: { color: '#a855f7', bgColor: '#f3e8ff' }, dark: { color: '#c4b5fd', bgColor: '#4c1d95' }, Icon: EventIcon },
  due_date_changed: { label: 'Due Date', light: { color: '#f97316', bgColor: '#ffedd5' }, dark: { color: '#fdba74', bgColor: '#7c2d12' }, Icon: ScheduleIcon },
  project_created: { label: 'Project Created', light: { color: '#10b981', bgColor: '#d1fae5' }, dark: { color: '#6ee7b7', bgColor: '#064e3b' }, Icon: AddCircleIcon },
  project_updated: { label: 'Project Updated', light: { color: '#6366f1', bgColor: '#e0e7ff' }, dark: { color: '#a5b4fc', bgColor: '#312e81' }, Icon: UpdateIcon },
  client_changed: { label: 'Client Changed', light: { color: '#ec4899', bgColor: '#fce7f3' }, dark: { color: '#f9a8d4', bgColor: '#831843' }, Icon: PeopleIcon },
  architect_changed: { label: 'Architect Changed', light: { color: '#06b6d4', bgColor: '#cffafe' }, dark: { color: '#67e8f9', bgColor: '#164e63' }, Icon: ArchitectureIcon },
  manager_changed: { label: 'Manager Changed', light: { color: '#f43f5e', bgColor: '#ffe4e6' }, dark: { color: '#fda4af', bgColor: '#881337' }, Icon: ManageAccountsIcon },
  email_sent: { label: 'Email Sent', light: { color: '#14b8a6', bgColor: '#ccfbf1' }, dark: { color: '#5eead4', bgColor: '#134e4a' }, Icon: EmailIcon },
  // Client actions
  client_created: { label: 'Client Created', light: { color: '#10b981', bgColor: '#d1fae5' }, dark: { color: '#6ee7b7', bgColor: '#064e3b' }, Icon: AddCircleIcon },
  client_updated: { label: 'Client Updated', light: { color: '#ec4899', bgColor: '#fce7f3' }, dark: { color: '#f9a8d4', bgColor: '#831843' }, Icon: EditIconMui },
  client_archived: { label: 'Client Archived', light: { color: '#6b7280', bgColor: '#f3f4f6' }, dark: { color: '#9ca3af', bgColor: '#374151' }, Icon: PeopleIcon },
  client_restored: { label: 'Client Restored', light: { color: '#22c55e', bgColor: '#dcfce7' }, dark: { color: '#86efac', bgColor: '#064e3b' }, Icon: PeopleIcon },
  // Architect actions
  architect_created: { label: 'Architect Created', light: { color: '#10b981', bgColor: '#d1fae5' }, dark: { color: '#6ee7b7', bgColor: '#064e3b' }, Icon: AddCircleIcon },
  architect_updated: { label: 'Architect Updated', light: { color: '#8b5cf6', bgColor: '#ede9fe' }, dark: { color: '#c4b5fd', bgColor: '#4c1d95' }, Icon: EditIconMui },
  architect_deactivated: { label: 'Architect Deactivated', light: { color: '#6b7280', bgColor: '#f3f4f6' }, dark: { color: '#9ca3af', bgColor: '#374151' }, Icon: ArchitectureIcon },
  architect_activated: { label: 'Architect Activated', light: { color: '#22c55e', bgColor: '#dcfce7' }, dark: { color: '#86efac', bgColor: '#064e3b' }, Icon: ArchitectureIcon },
};

// View mode options (client and architect only visible to admin/manager)
const VIEW_MODES = [
  { value: 'all', label: 'All Activity' },
  { value: 'my', label: 'My Activity' },
  { value: 'project', label: 'Project Activity' },
  { value: 'client', label: 'Client Activity', adminOnly: true },
  { value: 'architect', label: 'Architect Activity', adminOnly: true },
];

// Entity type configuration for display (with light and dark mode colors)
const ENTITY_CONFIG = {
  project: { label: 'Project', light: { color: '#3b82f6', bgColor: '#dbeafe' }, dark: { color: '#93c5fd', bgColor: '#1e3a5f' } },
  client: { label: 'Client', light: { color: '#ec4899', bgColor: '#fce7f3' }, dark: { color: '#f9a8d4', bgColor: '#831843' } },
  architect: { label: 'Architect', light: { color: '#8b5cf6', bgColor: '#ede9fe' }, dark: { color: '#c4b5fd', bgColor: '#4c1d95' } },
};

// Cell Renderer Components
const ActionTypeCellRenderer = (props) => {
  const { value } = props;
  const dark = isDarkMode();
  const config = ACTION_CONFIG[value] || {
    label: value || 'Unknown',
    light: { color: '#6b7280', bgColor: '#f3f4f6' },
    dark: { color: '#9ca3af', bgColor: '#374151' },
    Icon: AssignmentIcon
  };
  const { Icon } = config;
  const colors = dark ? config.dark : config.light;

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          margin: '6px 0',
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: colors.bgColor,
          color: colors.color,
          fontSize: '12px',
          fontWeight: 500,
          height: 'fit-content',
          maxHeight: '26px',
        }}
      >
        <Icon style={{ fontSize: 14 }} />
        {config.label}
      </span>
    </div>
  );
};

const TimestampCellRenderer = (props) => {
  const { value } = props;
  const dark = isDarkMode();

  if (!value) {
    return <span style={{ color: dark ? '#6b7280' : '#9ca3af' }}>-</span>;
  }

  const date = new Date(value);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relativeTime;
  if (diffMins < 1) {
    relativeTime = 'Just now';
  } else if (diffMins < 60) {
    relativeTime = `${diffMins}m ago`;
  } else if (diffHours < 24) {
    relativeTime = `${diffHours}h ago`;
  } else if (diffDays < 7) {
    relativeTime = `${diffDays}d ago`;
  } else {
    relativeTime = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const fullDateTime = date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }} title={fullDateTime}>
      <span style={{ fontWeight: 500, fontSize: '13px', color: dark ? '#e5e7eb' : 'inherit' }}>{relativeTime}</span>
      <span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '11px' }}>
        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

const EntityTypeCellRenderer = (props) => {
  const { value } = props;
  const dark = isDarkMode();
  const config = ENTITY_CONFIG[value] || {
    label: value || 'Unknown',
    light: { color: '#6b7280', bgColor: '#f3f4f6' },
    dark: { color: '#9ca3af', bgColor: '#374151' }
  };
  const colors = dark ? config.dark : config.light;

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          margin: '6px 0',
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: colors.bgColor,
          color: colors.color,
          fontSize: '11px',
          fontWeight: 500,
          height: 'fit-content',
          maxHeight: '24px',
        }}
      >
        {config.label}
      </span>
    </div>
  );
};

const EntityCellRenderer = (props) => {
  const { data } = props;
  const dark = isDarkMode();
  const entityType = data?.entity_type;

  // Get entity name based on type
  let entityName = data?.entity_display_name;
  let secondaryInfo = null;

  if (entityType === 'project') {
    entityName = data?.project_name || entityName;
    secondaryInfo = data?.project_job_number;
  } else if (entityType === 'client') {
    entityName = data?.client_name || entityName;
    secondaryInfo = data?.client_company;
  } else if (entityType === 'architect') {
    entityName = data?.architect_name || entityName;
    secondaryInfo = data?.architect_company;
  }

  if (!entityName) {
    return <span style={{ color: dark ? '#6b7280' : '#9ca3af', fontStyle: 'italic' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <span style={{ fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: dark ? '#e5e7eb' : 'inherit' }}>
        {entityName}
      </span>
      {secondaryInfo && (
        <span style={{ color: dark ? '#9ca3af' : '#6b7280', fontSize: '11px', fontFamily: entityType === 'project' ? 'monospace' : 'inherit' }}>
          {secondaryInfo}
        </span>
      )}
    </div>
  );
};

const UserCellRenderer = (props) => {
  const { data } = props;
  const dark = isDarkMode();
  const userName = data?.user_name;
  const userEmail = data?.user_email;

  if (!userName) {
    return <span style={{ color: dark ? '#6b7280' : '#9ca3af', fontStyle: 'italic' }}>System</span>;
  }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '8px' }} title={userEmail || ''}>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: dark ? '#312e81' : '#e0e7ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600,
          color: dark ? '#a5b4fc' : '#4f46e5',
        }}
      >
        {initials}
      </div>
      <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px', color: dark ? '#e5e7eb' : 'inherit' }}>
        {userName}
      </span>
    </div>
  );
};

const ChangesCellRenderer = (props) => {
  const { data } = props;
  const dark = isDarkMode();
  const oldValue = data?.old_value;
  const newValue = data?.new_value;

  if (!oldValue && !newValue) {
    return <span style={{ color: dark ? '#6b7280' : '#9ca3af' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '2px' }}>
      {oldValue && (
        <span style={{ color: dark ? '#fca5a5' : '#dc2626', textDecoration: 'line-through', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {oldValue}
        </span>
      )}
      {newValue && (
        <span style={{ color: dark ? '#86efac' : '#16a34a', fontWeight: 500, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {newValue}
        </span>
      )}
    </div>
  );
};

const Activity = () => {
  const gridRef = useRef(null);
  const { user } = useAuthStore();
  const {
    activityLogs,
    myActivity,
    projectActivity,
    clientActivity,
    architectActivity,
    loading,
    error,
    fetchActivityLogs,
    fetchMyActivity,
    fetchProjectActivity,
    fetchClientActivity,
    fetchArchitectActivity,
  } = useActivityStore();

  // Filter states
  const [viewMode, setViewMode] = useState('all');
  const [quickFilterText, setQuickFilterText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Filter view modes based on role
  const availableViewModes = useMemo(() => {
    return VIEW_MODES.filter(mode => !mode.adminOnly || isAdminOrManager);
  }, [isAdminOrManager]);

  // Load activity data based on view mode
  const loadActivityData = useCallback(async () => {
    const params = { page_size: 1000 };

    switch (viewMode) {
      case 'my':
        await fetchMyActivity(params);
        break;
      case 'project':
        await fetchProjectActivity(params);
        break;
      case 'client':
        await fetchClientActivity(params);
        break;
      case 'architect':
        await fetchArchitectActivity(params);
        break;
      case 'all':
      default:
        await fetchActivityLogs(params);
        break;
    }
  }, [viewMode, fetchActivityLogs, fetchMyActivity, fetchProjectActivity, fetchClientActivity, fetchArchitectActivity]);

  useEffect(() => {
    loadActivityData();
  }, [loadActivityData]);

  // Get the appropriate activity data based on view mode
  const activities = useMemo(() => {
    switch (viewMode) {
      case 'my':
        return myActivity || [];
      case 'project':
        return projectActivity || [];
      case 'client':
        return clientActivity || [];
      case 'architect':
        return architectActivity || [];
      case 'all':
      default:
        return activityLogs || [];
    }
  }, [viewMode, myActivity, projectActivity, clientActivity, architectActivity, activityLogs]);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 130,
      sort: 'desc',
      cellRenderer: TimestampCellRenderer,
    },
    {
      field: 'entity_type',
      headerName: 'Type',
      width: 100,
      cellRenderer: EntityTypeCellRenderer,
    },
    {
      field: 'action_type',
      headerName: 'Action',
      width: 170,
      cellRenderer: ActionTypeCellRenderer,
    },
    {
      field: 'entity_display_name',
      headerName: 'Entity',
      width: 180,
      cellRenderer: EntityCellRenderer,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'user_name',
      headerName: 'User',
      width: 160,
      cellRenderer: UserCellRenderer,
      hide: !isAdminOrManager,
    },
    {
      field: 'changed_field',
      headerName: 'Field',
      width: 120,
      valueFormatter: (params) => params.value || '-',
    },
    {
      field: 'changes',
      headerName: 'Changes',
      width: 150,
      filter: false,
      sortable: false,
      cellRenderer: ChangesCellRenderer,
    },
    {
      field: 'ip_address',
      headerName: 'IP',
      width: 120,
      hide: !isAdminOrManager,
      valueFormatter: (params) => params.value || '-',
      cellStyle: { fontFamily: 'monospace', fontSize: '12px' },
    },
  ], [isAdminOrManager]);

  // Default column configuration
  const defaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    floatingFilter: true,
    suppressMovable: true,
  }), []);

  // Pagination options
  const paginationPageSizeSelector = useMemo(() => [20, 50, 100, 200], []);

  // Grid ready handler
  const onGridReady = useCallback((params) => {
    params.api.sizeColumnsToFit();
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadActivityData();
  }, [loadActivityData]);

  // Handle quick filter
  const onQuickFilterChange = useCallback((e) => {
    const value = e.target.value;
    setQuickFilterText(value);
    if (gridRef.current?.api) {
      gridRef.current.api.setGridOption('quickFilterText', value);
    }
  }, []);

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setQuickFilterText('');
    setDateFrom('');
    setDateTo('');
    if (gridRef.current?.api) {
      gridRef.current.api.setFilterModel(null);
      gridRef.current.api.setGridOption('quickFilterText', '');
    }
  }, []);

  // Get statistics
  const stats = useMemo(() => {
    const total = activities.length;
    const actionCounts = activities.reduce((acc, activity) => {
      acc[activity.action_type] = (acc[activity.action_type] || 0) + 1;
      return acc;
    }, {});
    return { total, actionCounts };
  }, [activities]);

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingSpinner size="lg" text="Loading activity logs..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Activity Log
            </h1>
            <div className="flex gap-2 mt-1 items-center flex-wrap">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Total: {stats.total} activities
              </span>
              <Chip label="Read Only" size="small" color="info" variant="outlined" />
              {loading && <Chip label="Refreshing..." size="small" color="primary" />}
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <TextField
              select
              size="small"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              sx={{
                minWidth: 160,
                '.dark & .MuiOutlinedInput-root': {
                  backgroundColor: 'rgb(55 65 81)',
                  color: 'white',
                },
                '.dark & .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgb(75 85 99)',
                },
                '.dark & .MuiInputLabel-root': {
                  color: 'rgb(156 163 175)',
                },
                '.dark & .MuiSelect-icon': {
                  color: 'rgb(156 163 175)',
                },
              }}
              label="View"
            >
              {availableViewModes.map((mode) => (
                <MenuItem key={mode.value} value={mode.value}>
                  {mode.label}
                </MenuItem>
              ))}
            </TextField>

            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <TextField
            size="small"
            placeholder="Search all columns..."
            value={quickFilterText}
            onChange={onQuickFilterChange}
            sx={{
              minWidth: 220,
              '.dark & .MuiOutlinedInput-root': {
                backgroundColor: 'rgb(55 65 81)',
                color: 'white',
                '& input': { color: 'white' },
                '& input::placeholder': { color: 'rgb(156 163 175)' },
              },
              '.dark & .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgb(75 85 99)',
              },
            }}
            InputProps={{
              startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20, '.dark &': { color: 'rgb(156 163 175)' } }} />,
            }}
          />

          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: 150,
              '.dark & .MuiOutlinedInput-root': {
                backgroundColor: 'rgb(55 65 81)',
                color: 'white',
                '& input': { color: 'white' },
              },
              '.dark & .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgb(75 85 99)',
              },
              '.dark & .MuiInputLabel-root': {
                color: 'rgb(156 163 175)',
              },
              '.dark & .MuiInputLabel-root.Mui-focused': {
                color: '#3b82f6',
              },
            }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{
              width: 150,
              '.dark & .MuiOutlinedInput-root': {
                backgroundColor: 'rgb(55 65 81)',
                color: 'white',
                '& input': { color: 'white' },
              },
              '.dark & .MuiOutlinedInput-notchedOutline': {
                borderColor: 'rgb(75 85 99)',
              },
              '.dark & .MuiInputLabel-root': {
                color: 'rgb(156 163 175)',
              },
              '.dark & .MuiInputLabel-root.Mui-focused': {
                color: '#3b82f6',
              },
            }}
          />

          <Button variant="text" startIcon={<ClearIcon />} onClick={clearAllFilters} size="small">
            Clear
          </Button>

          <span className="hidden md:block ml-auto text-xs text-gray-500 dark:text-gray-400">
            Use column headers for filtering by User, Project, Action, Time
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-4">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* AG Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
        <div className="ag-theme-quartz" style={{ height: 500, width: '100%' }}>
          <AgGridReact
            ref={gridRef}
            theme={themeQuartz}
            rowData={activities}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            animateRows={true}
            pagination={true}
            paginationPageSize={50}
            paginationPageSizeSelector={paginationPageSizeSelector}
            rowSelection="single"
            suppressRowClickSelection={true}
            enableCellTextSelection={true}
            onGridReady={onGridReady}
            rowHeight={45}
            headerHeight={44}
            floatingFiltersHeight={36}
            domLayout="normal"
            suppressHorizontalScroll={false}
            loadingOverlayComponent={() => (
              <div className="flex justify-center items-center h-24">
                <LoadingSpinner size="md" text="Loading..." />
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div className="flex flex-col justify-center items-center h-24 text-gray-500 dark:text-gray-400">
                <p className="text-lg font-medium">No activity logs found</p>
                <p className="text-sm">Activity will appear here as changes are made</p>
              </div>
            )}
          />
        </div>
      </div>

      {/* Statistics Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs text-gray-500 dark:text-gray-400 mr-2">
            Summary:
          </span>
          {Object.entries(stats.actionCounts).map(([action, count]) => (
            <Chip
              key={action}
              label={`${ACTION_CONFIG[action]?.label || action}: ${count}`}
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.7rem',
                height: 24,
                '.dark &': {
                  borderColor: 'rgb(75 85 99)',
                  color: 'rgb(209 213 219)',
                },
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Activity;
