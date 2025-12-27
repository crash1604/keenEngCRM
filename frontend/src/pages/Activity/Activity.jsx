// src/pages/Activity/Activity.jsx
import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  TextField,
  MenuItem,
  Stack
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
} from '@mui/icons-material';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { useActivityStore } from '../../stores/activity.store';
import { useAuthStore } from '../../stores/auth.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

// Action type options for filter
const ACTION_TYPES = [
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
];

// Action type configuration for display
const ACTION_CONFIG = {
  status_change: { label: 'Status Change', color: '#3b82f6', bgColor: '#dbeafe', Icon: SyncIcon },
  note_added: { label: 'Note Added', color: '#22c55e', bgColor: '#dcfce7', Icon: NoteAddIcon },
  field_updated: { label: 'Field Updated', color: '#eab308', bgColor: '#fef9c3', Icon: EditIconMui },
  inspection_scheduled: { label: 'Inspection', color: '#a855f7', bgColor: '#f3e8ff', Icon: EventIcon },
  due_date_changed: { label: 'Due Date', color: '#f97316', bgColor: '#ffedd5', Icon: ScheduleIcon },
  project_created: { label: 'Created', color: '#10b981', bgColor: '#d1fae5', Icon: AddCircleIcon },
  project_updated: { label: 'Updated', color: '#6366f1', bgColor: '#e0e7ff', Icon: UpdateIcon },
  client_changed: { label: 'Client', color: '#ec4899', bgColor: '#fce7f3', Icon: PeopleIcon },
  architect_changed: { label: 'Architect', color: '#06b6d4', bgColor: '#cffafe', Icon: ArchitectureIcon },
  manager_changed: { label: 'Manager', color: '#f43f5e', bgColor: '#ffe4e6', Icon: ManageAccountsIcon },
};

// View mode options
const VIEW_MODES = [
  { value: 'all', label: 'All Activity' },
  { value: 'my', label: 'My Activity' },
  { value: 'project', label: 'Project Activity' },
];

// Cell Renderer Components
const ActionTypeCellRenderer = (props) => {
  const { value } = props;
  const config = ACTION_CONFIG[value] || { label: value || 'Unknown', color: '#6b7280', bgColor: '#f3f4f6', Icon: AssignmentIcon };
  const { Icon } = config;

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          borderRadius: '12px',
          backgroundColor: config.bgColor,
          color: config.color,
          fontSize: '12px',
          fontWeight: 500,
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

  if (!value) {
    return <span style={{ color: '#9ca3af' }}>-</span>;
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
      <span style={{ fontWeight: 500, fontSize: '13px' }}>{relativeTime}</span>
      <span style={{ color: '#6b7280', fontSize: '11px' }}>
        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

const ProjectCellRenderer = (props) => {
  const { data } = props;
  const projectName = data?.project_name;
  const jobNumber = data?.project_job_number;

  if (!projectName && !jobNumber) {
    return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
      <span style={{ fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {projectName || 'Unknown Project'}
      </span>
      {jobNumber && (
        <span style={{ color: '#6b7280', fontSize: '11px', fontFamily: 'monospace' }}>
          {jobNumber}
        </span>
      )}
    </div>
  );
};

const UserCellRenderer = (props) => {
  const { data } = props;
  const userName = data?.user_name;
  const userEmail = data?.user_email;

  if (!userName) {
    return <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>System</span>;
  }

  const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%', gap: '8px' }} title={userEmail || ''}>
      <div
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          backgroundColor: '#e0e7ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: 600,
          color: '#4f46e5',
        }}
      >
        {initials}
      </div>
      <span style={{ fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100px' }}>
        {userName}
      </span>
    </div>
  );
};

const ChangesCellRenderer = (props) => {
  const { data } = props;
  const oldValue = data?.old_value;
  const newValue = data?.new_value;

  if (!oldValue && !newValue) {
    return <span style={{ color: '#9ca3af' }}>-</span>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '2px' }}>
      {oldValue && (
        <span style={{ color: '#dc2626', textDecoration: 'line-through', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {oldValue}
        </span>
      )}
      {newValue && (
        <span style={{ color: '#16a34a', fontWeight: 500, fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
    loading,
    error,
    fetchActivityLogs,
    fetchMyActivity,
    fetchProjectActivity,
  } = useActivityStore();

  // Filter states
  const [viewMode, setViewMode] = useState('all');
  const [quickFilterText, setQuickFilterText] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

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
      case 'all':
      default:
        await fetchActivityLogs(params);
        break;
    }
  }, [viewMode, fetchActivityLogs, fetchMyActivity, fetchProjectActivity]);

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
      case 'all':
      default:
        return activityLogs || [];
    }
  }, [viewMode, myActivity, projectActivity, activityLogs]);

  // Column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'timestamp',
      headerName: 'Time',
      width: 150,
      sort: 'desc',
      cellRenderer: TimestampCellRenderer,
    },
    {
      field: 'action_type',
      headerName: 'Action',
      width: 160,
      cellRenderer: ActionTypeCellRenderer,
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 200,
    },
    {
      field: 'project_name',
      headerName: 'Project',
      width: 180,
      cellRenderer: ProjectCellRenderer,
    },
    {
      field: 'project_job_number',
      headerName: 'Job #',
      width: 110,
      cellStyle: { fontFamily: 'monospace', fontWeight: '500' },
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
    <Box sx={{ height: 'calc(100vh - 32px)', display: 'flex', flexDirection: 'column', p: 2, bgcolor: '#f9fafb' }}>
      {/* Header */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Activity Log
            </Typography>
            <Box display="flex" gap={1} mt={0.5} alignItems="center" flexWrap="wrap">
              <Typography variant="body2" color="text.secondary">
                Total: {stats.total} activities
              </Typography>
              <Chip label="Read Only" size="small" color="info" variant="outlined" />
              {loading && <Chip label="Refreshing..." size="small" color="primary" />}
            </Box>
          </Box>

          <Box display="flex" gap={2} alignItems="center">
            <TextField
              select
              size="small"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              sx={{ minWidth: 140 }}
              label="View"
            >
              {VIEW_MODES.map((mode) => (
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
          </Box>
        </Box>
      </Paper>

      {/* Filter Bar */}
      <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <TextField
            size="small"
            placeholder="Search all columns..."
            value={quickFilterText}
            onChange={onQuickFilterChange}
            sx={{ minWidth: 220 }}
            InputProps={{
              startAdornment: <FilterIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />,
            }}
          />

          <TextField
            size="small"
            type="date"
            label="From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />
          <TextField
            size="small"
            type="date"
            label="To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 150 }}
          />

          <Button variant="text" startIcon={<ClearIcon />} onClick={clearAllFilters} size="small">
            Clear
          </Button>

          <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto', display: { xs: 'none', md: 'block' } }}>
            Use column headers for filtering by User, Project, Action, Time
          </Typography>
        </Stack>
      </Paper>

      {/* Error Display */}
      {error && (
        <Paper elevation={0} sx={{ p: 2, mb: 2, borderRadius: 2, bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* AG Grid */}
      <Paper elevation={0} sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', minHeight: 400 }}>
        <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
          <AgGridReact
            ref={gridRef}
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
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                <LoadingSpinner size="md" text="Loading..." />
              </div>
            )}
            noRowsOverlayComponent={() => (
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100px', color: '#6b7280' }}>
                <Typography variant="h6">No activity logs found</Typography>
                <Typography variant="body2">Activity will appear here as changes are made</Typography>
              </div>
            )}
          />
        </div>
      </Paper>

      {/* Statistics Summary */}
      <Paper elevation={0} sx={{ p: 1.5, mt: 2, borderRadius: 2 }}>
        <Box display="flex" gap={1} flexWrap="wrap" alignItems="center">
          <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
            Summary:
          </Typography>
          {Object.entries(stats.actionCounts).map(([action, count]) => (
            <Chip
              key={action}
              label={`${ACTION_CONFIG[action]?.label || action}: ${count}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 24 }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default Activity;
