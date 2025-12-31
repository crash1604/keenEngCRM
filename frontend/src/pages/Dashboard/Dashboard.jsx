// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { STATUS_CONFIG } from '../../components/projects/StatusRenderer';
import {
  Sync as SyncIcon,
  NoteAdd as NoteAddIcon,
  Edit as EditIcon,
  Event as EventIcon,
  Schedule as ScheduleIcon,
  AddCircle as AddCircleIcon,
  Update as UpdateIcon,
  People as PeopleIcon,
  Architecture as ArchitectureIcon,
  ManageAccounts as ManageAccountsIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Inbox as InboxIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/auth.store';
import { useProjectStore } from '../../stores/project.store';
import { useActivityStore } from '../../stores/activity.store';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { capitalizeFirst, formatDate, formatRelativeTime } from '../../utils/helpers';

ModuleRegistry.registerModules([AllCommunityModule]);

// Chart colors for each status (vibrant colors for pie chart)
const STATUS_CHART_COLORS = {
  not_started: '#9ca3af',   // Gray
  in_progress: '#2563eb',   // Blue
  submitted: '#ea580c',     // Orange
  completed: '#16a34a',     // Green
  closed_paid: '#7c3aed',   // Purple
  cancelled: '#dc2626',     // Red
  on_hold: '#ca8a04'        // Yellow/Gold
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const {
    dashboardStats,
    overdueProjects,
    upcomingInspections,
    loading: projectsLoading,
    fetchDashboardStats,
    fetchOverdueProjects,
    fetchUpcomingInspections
  } = useProjectStore();

  const {
    activityLogs,
    myActivity,
    loading: activityLoading,
    fetchActivityLogs,
    fetchMyActivity
  } = useActivityStore();

  useEffect(() => {
    const loadDashboardData = async () => {
      await Promise.all([
        fetchDashboardStats(),
        fetchOverdueProjects(),
        fetchUpcomingInspections()
      ]);
    };

    loadDashboardData();
  }, [fetchDashboardStats, fetchOverdueProjects, fetchUpcomingInspections]);

  useEffect(() => {
    const loadActivityData = async () => {
      if (user?.role === 'admin' || user?.role === 'manager') {
        // Admin/Manager: Show all activity logs
        await fetchActivityLogs({ page_size: 100 });
      } else {
        // Other users: Show only their activity
        await fetchMyActivity({ page_size: 100 });
      }
    };

    loadActivityData();
  }, [user, fetchActivityLogs, fetchMyActivity]);

  // Get the appropriate activity data based on user role
  const getRecentActivities = () => {
    if (user?.role === 'admin' || user?.role === 'manager') {
      return activityLogs;
    } else {
      return myActivity;
    }
  };

  const recentActivities = getRecentActivities();

  // Activity icon configuration
  const ACTIVITY_ICONS = {
    'status_change': { Icon: SyncIcon, color: '#3b82f6' },
    'note_added': { Icon: NoteAddIcon, color: '#22c55e' },
    'field_updated': { Icon: EditIcon, color: '#eab308' },
    'inspection_scheduled': { Icon: EventIcon, color: '#a855f7' },
    'due_date_changed': { Icon: ScheduleIcon, color: '#f97316' },
    'project_created': { Icon: AddCircleIcon, color: '#10b981' },
    'project_updated': { Icon: UpdateIcon, color: '#6366f1' },
    'client_changed': { Icon: PeopleIcon, color: '#ec4899' },
    'architect_changed': { Icon: ArchitectureIcon, color: '#06b6d4' },
    'manager_changed': { Icon: ManageAccountsIcon, color: '#f43f5e' }
  };

  // AG Grid row data - transform activities for grid display
  const activityRowData = useMemo(() => {
    return recentActivities.map((activity) => ({
      id: activity.id,
      action_type: activity.action_type,
      action: activity.description,
      project: activity.project_name || activity.project_job_number || '-',
      user: activity.user_name || '-',
      type: activity.action_type_display || activity.action_type,
      time: formatRelativeTime(activity.timestamp),
      timestamp: activity.timestamp
    }));
  }, [recentActivities]);

  // Icon cell renderer component
  const IconCellRenderer = (props) => {
    const actionType = props.data?.action_type;
    const config = ACTIVITY_ICONS[actionType] || { Icon: AssignmentIcon, color: '#6b7280' };
    const { Icon, color } = config;
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <Icon style={{ fontSize: 18, color }} />
      </div>
    );
  };

  // AG Grid column definitions
  const columnDefs = useMemo(() => {
    const baseColumns = [
      {
        field: 'action_type',
        headerName: '',
        width: 50,
        sortable: false,
        filter: false,
        cellRenderer: IconCellRenderer
      },
      {
        field: 'action',
        headerName: 'Action',
        flex: 2,
        minWidth: 200,
        sortable: true,
        filter: true
      },
      {
        field: 'project',
        headerName: 'Project',
        flex: 1,
        minWidth: 120,
        sortable: true,
        filter: true
      },
      {
        field: 'type',
        headerName: 'Type',
        width: 130,
        sortable: true,
        filter: true
      },
      {
        field: 'time',
        headerName: 'Time',
        width: 120,
        sortable: true,
        filter: false,
        comparator: (valueA, valueB, nodeA, nodeB) => {
          const dateA = new Date(nodeA.data.timestamp);
          const dateB = new Date(nodeB.data.timestamp);
          return dateA - dateB;
        }
      }
    ];

    // Add user column for admin/manager
    if (user?.role === 'admin' || user?.role === 'manager') {
      baseColumns.splice(3, 0, {
        field: 'user',
        headerName: 'User',
        width: 120,
        sortable: true,
        filter: true
      });
    }

    return baseColumns;
  }, [user?.role]);

  // AG Grid default column definitions
  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true
  }), []);

  // AG Grid pagination settings
  const paginationPageSize = 10;
  const paginationPageSizeSelector = [10];

  // Pie chart data for project status breakdown
  const pieChartData = useMemo(() => {
    if (!dashboardStats?.by_status) return [];

    // Default colors array as fallback
    const FALLBACK_COLORS = ['#2563eb', '#16a34a', '#ea580c', '#dc2626', '#7c3aed', '#ca8a04', '#9ca3af'];

    return Object.entries(dashboardStats.by_status).map(([status, count], index) => {
      // Try to get color from STATUS_CHART_COLORS, otherwise use fallback
      const color = STATUS_CHART_COLORS[status] || FALLBACK_COLORS[index % FALLBACK_COLORS.length];
      return {
        name: STATUS_CONFIG[status]?.label || status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        value: count,
        color: color,
        fill: color
      };
    });
  }, [dashboardStats?.by_status]);

  const loading = projectsLoading || activityLoading;

  if (loading && !dashboardStats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.first_name} {user?.last_name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Here's what's happening with your projects today. You're doing great as a{' '}
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {capitalizeFirst(user?.role)}
          </span>
          !
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
          <span>Member since: {formatDate(user?.date_joined || user?.created_at)}</span>
          <span>•</span>
          <span>Email: {user?.email}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats?.total_projects || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">All projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats?.overdue_projects || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Need attention</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Due Soon</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats?.due_soon_projects || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">Next 7 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats?.completed_this_month || 0}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">This month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Project Status Breakdown with Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Project Status</h2>
          {pieChartData.length > 0 ? (
            <div style={{ width: '100%', height: 280, minWidth: 200 }}>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="40%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">No project data available</p>
            </div>
          )}
        </div>

        {/* Recent Activities with AG Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Activities</h2>
            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">
              {user?.role === 'admin' || user?.role === 'manager' ? 'All Activities' : 'My Activities'}
            </span>
          </div>

          {activityLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" text="Loading activities..." />
            </div>
          ) : activityRowData.length > 0 ? (
            <div style={{ height: 400, width: '100%' }}>
              <AgGridReact
                theme={themeQuartz}
                rowData={activityRowData}
                columnDefs={columnDefs}
                defaultColDef={defaultColDef}
                pagination={true}
                paginationPageSize={paginationPageSize}
                paginationPageSizeSelector={paginationPageSizeSelector}
                domLayout="normal"
                suppressCellFocus={true}
                rowHeight={45}
                headerHeight={40}
                getRowId={(params) => String(params.data.id)}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <InboxIcon style={{ fontSize: 48, color: '#9ca3af', marginBottom: 8 }} />
              <p className="text-gray-500 dark:text-gray-400">No recent activities</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Activities will appear here as they happen</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Overdue Projects</h2>
          {overdueProjects.length > 0 ? (
            <div className="space-y-3">
              {overdueProjects.slice(0, 5).map(project => (
                <div key={project.id} className="border-l-4 border-red-500 pl-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white">{project.project_name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Job #: {project.job_number}</p>
                  <p className="text-xs text-red-500">
                    Due: {new Date(project.due_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircleIcon style={{ fontSize: 32, color: '#22c55e', marginBottom: 4 }} />
              <p className="text-gray-500 dark:text-gray-400">No overdue projects</p>
            </div>
          )}
        </div>

        {/* Upcoming Inspections */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Upcoming Inspections</h2>
          {upcomingInspections.length > 0 ? (
            <div className="space-y-3">
              {upcomingInspections.slice(0, 5).map(project => (
                <div key={project.id} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg">
                  <h4 className="font-medium text-gray-900 dark:text-white">{project.project_name}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {project.rough_in_date && (
                      <span>Rough-in: {new Date(project.rough_in_date).toLocaleDateString()}</span>
                    )}
                    {project.rough_in_date && project.final_inspection_date && ' • '}
                    {project.final_inspection_date && (
                      <span>Final: {new Date(project.final_inspection_date).toLocaleDateString()}</span>
                    )}
                  </p>
                  <p className="text-xs text-blue-500">Inspection scheduled</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">No upcoming inspections</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors duration-150 text-left group"
            onClick={() => window.location.href = '/projects'}
          >
            <div className="text-blue-600 dark:text-blue-400 font-semibold group-hover:text-blue-700 dark:group-hover:text-blue-300">
              View Projects
            </div>
            <div className="text-sm text-blue-500 dark:text-blue-500 mt-1">Manage all projects</div>
          </button>

          <button className="p-4 bg-green-50 dark:bg-green-900/30 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors duration-150 text-left group">
            <div className="text-green-600 dark:text-green-400 font-semibold group-hover:text-green-700 dark:group-hover:text-green-300">
              Create Project
            </div>
            <div className="text-sm text-green-500 dark:text-green-500 mt-1">Start new project</div>
          </button>

          <button
            className="p-4 bg-purple-50 dark:bg-purple-900/30 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors duration-150 text-left group"
            onClick={() => window.location.href = '/clients'}
          >
            <div className="text-purple-600 dark:text-purple-400 font-semibold group-hover:text-purple-700 dark:group-hover:text-purple-300">
              Clients
            </div>
            <div className="text-sm text-purple-500 dark:text-purple-500 mt-1">Manage clients</div>
          </button>

          <button className="p-4 bg-orange-50 dark:bg-orange-900/30 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors duration-150 text-left group">
            <div className="text-orange-600 dark:text-orange-400 font-semibold group-hover:text-orange-700 dark:group-hover:text-orange-300">
              Reports
            </div>
            <div className="text-sm text-orange-500 dark:text-orange-500 mt-1">View analytics</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;