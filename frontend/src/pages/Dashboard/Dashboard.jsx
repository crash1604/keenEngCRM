import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { capitalizeFirst, formatDate } from '../../utils/helpers';

export const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: 'Total Projects',
      value: '12',
      description: 'Active projects',
      color: 'bg-blue-500',
    },
    {
      title: 'Completed Tasks',
      value: '48',
      description: 'This month',
      color: 'bg-green-500',
    },
    {
      title: 'Team Members',
      value: '8',
      description: 'Active team',
      color: 'bg-purple-500',
    },
    {
      title: 'Revenue',
      value: '$24.5k',
      description: 'This quarter',
      color: 'bg-orange-500',
    },
  ];

  const recentActivities = [
    { id: 1, action: 'Project completed', project: 'Website Redesign', time: '2 hours ago' },
    { id: 2, action: 'New client added', project: 'ABC Corporation', time: '4 hours ago' },
    { id: 3, action: 'Task assigned', project: 'Mobile App', time: '1 day ago' },
    { id: 4, action: 'Meeting scheduled', project: 'Team Sync', time: '2 days ago' },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.first_name} {user?.last_name}! 👋
        </h1>
        <p className="text-gray-600">
          Here's what's happening with your projects today. You're doing great as a{' '}
          <span className="font-semibold text-blue-600">
            {capitalizeFirst(user?.role)}
          </span>
          !
        </p>
        <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
          <span>Member since: {formatDate(user?.created_at)}</span>
          <span>•</span>
          <span>Email: {user?.email}</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-center">
              <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                <span className="text-white font-bold text-lg">{stat.value.charAt(0)}</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">{activity.project}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors duration-150 text-left group">
              <div className="text-blue-600 font-semibold group-hover:text-blue-700">
                View Clients
              </div>
              <div className="text-sm text-blue-500 mt-1">Manage client relationships</div>
            </button>

            <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors duration-150 text-left group">
              <div className="text-green-600 font-semibold group-hover:text-green-700">
                Create Project
              </div>
              <div className="text-sm text-green-500 mt-1">Start new project</div>
            </button>

            <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors duration-150 text-left group">
              <div className="text-purple-600 font-semibold group-hover:text-purple-700">
                Reports
              </div>
              <div className="text-sm text-purple-500 mt-1">View analytics</div>
            </button>

            <button className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors duration-150 text-left group">
              <div className="text-orange-600 font-semibold group-hover:text-orange-700">
                Team
              </div>
              <div className="text-sm text-orange-500 mt-1">Manage team members</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;