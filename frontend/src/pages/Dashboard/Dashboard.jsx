// src/pages/Dashboard/Dashboard.jsx
import React, { useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name} {user?.last_name}!
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your projects today. You're doing great as a{' '}
          <span className="font-semibold text-blue-600">
            {capitalizeFirst(user?.role)}
          </span>
          !
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
          <span>Member since: {formatDate(user?.date_joined || user?.created_at)}</span>
          <span>•</span>
          <span>Email: {user?.email}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-blue-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total_projects || 0}</p>
              <p className="text-xs text-gray-500">All projects</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-red-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.overdue_projects || 0}</p>
              <p className="text-xs text-gray-500">Need attention</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-yellow-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Due Soon</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.due_soon_projects || 0}</p>
              <p className="text-xs text-gray-500">Next 7 days</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center">
            <div className="bg-green-500 w-12 h-12 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.completed_this_month || 0}</p>
              <p className="text-xs text-gray-500">This month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Project Status</h2>
          <div className="space-y-4">
            {dashboardStats?.by_status && Object.entries(dashboardStats.by_status).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    status === 'completed' ? 'bg-green-500' :
                    status === 'in_progress' ? 'bg-blue-500' :
                    status === 'submitted' ? 'bg-yellow-500' :
                    status === 'not_started' ? 'bg-gray-500' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {status.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities with AG Grid */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              {user?.role === 'admin' || user?.role === 'manager' ? 'All Activities' : 'My Activities'}
            </span>
          </div>

          {activityLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner size="sm" text="Loading activities..." />
            </div>
          ) : activityRowData.length > 0 ? (
            <div className="ag-theme-quartz" style={{ height: '100%', width: '100%' }}>
              <AgGridReact
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
                getRowId={(params) => params.data.id}
              />
            </div>
          ) : (
            <div className="text-center py-8">
              <InboxIcon style={{ fontSize: 48, color: '#9ca3af', marginBottom: 8 }} />
              <p className="text-gray-500">No recent activities</p>
              <p className="text-sm text-gray-400 mt-1">Activities will appear here as they happen</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overdue Projects */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overdue Projects</h2>
          {overdueProjects.length > 0 ? (
            <div className="space-y-3">
              {overdueProjects.slice(0, 5).map(project => (
                <div key={project.id} className="border-l-4 border-red-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg">
                  <h4 className="font-medium text-gray-900">{project.project_name}</h4>
                  <p className="text-sm text-gray-600">Job #: {project.job_number}</p>
                  <p className="text-xs text-red-500">
                    Due: {new Date(project.due_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <CheckCircleIcon style={{ fontSize: 32, color: '#22c55e', marginBottom: 4 }} />
              <p className="text-gray-500">No overdue projects</p>
            </div>
          )}
        </div>

        {/* Upcoming Inspections */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Upcoming Inspections</h2>
          {upcomingInspections.length > 0 ? (
            <div className="space-y-3">
              {upcomingInspections.slice(0, 5).map(project => (
                <div key={project.id} className="border-l-4 border-blue-500 pl-4 py-2 hover:bg-gray-50 rounded-r-lg">
                  <h4 className="font-medium text-gray-900">{project.project_name}</h4>
                  <p className="text-sm text-gray-600">
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
            <p className="text-gray-500 text-center py-4">No upcoming inspections</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-150 text-left group"
            onClick={() => window.location.href = '/projects'}
          >
            <div className="text-blue-600 font-semibold group-hover:text-blue-700">
              View Projects
            </div>
            <div className="text-sm text-blue-500 mt-1">Manage all projects</div>
          </button>

          <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-150 text-left group">
            <div className="text-green-600 font-semibold group-hover:text-green-700">
              Create Project
            </div>
            <div className="text-sm text-green-500 mt-1">Start new project</div>
          </button>

          <button 
            className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-150 text-left group"
            onClick={() => window.location.href = '/clients'}
          >
            <div className="text-purple-600 font-semibold group-hover:text-purple-700">
              Clients
            </div>
            <div className="text-sm text-purple-500 mt-1">Manage clients</div>
          </button>

          <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-150 text-left group">
            <div className="text-orange-600 font-semibold group-hover:text-orange-700">
              Reports
            </div>
            <div className="text-sm text-orange-500 mt-1">View analytics</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;