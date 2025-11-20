// src/components/dashboard/Sidebar.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';

// Base navigation items available to all roles
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊', roles: ['admin', 'manager', 'employee', 'client', 'architect'] },
  { name: 'Projects', href: '/projects', icon: '📁', roles: ['admin', 'manager', 'employee', 'client', 'architect'] },
];

// Role-specific navigation items
const roleNavigation = {
  admin: [
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'Sales', href: '/sales', icon: '💰' },
    { name: 'Admin', href: '/admin', icon: '⚙️' },
    { name: 'Users', href: '/users', icon: '👤' },
  ],
  manager: [
    { name: 'Clients', href: '/clients', icon: '👥' },
    { name: 'Sales', href: '/sales', icon: '💰' },
    { name: 'Reports', href: '/reports', icon: '📈' },
  ],
  employee: [
    { name: 'My Tasks', href: '/tasks', icon: '✅' },
    { name: 'Time Tracking', href: '/time-tracking', icon: '⏱️' },
  ],
  client: [
    { name: 'My Projects', href: '/my-projects', icon: '📋' },
    { name: 'Invoices', href: '/invoices', icon: '🧾' },
  ],
  architect: [
    { name: 'Designs', href: '/designs', icon: '🎨' },
    { name: 'Submissions', href: '/submissions', icon: '📤' },
  ],
};

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebar } = useUIStore();

  // Get navigation items based on user role
  const getNavigationItems = () => {
    if (!user?.role) return baseNavigation;
    
    const userRole = user.role;
    const roleSpecificItems = roleNavigation[userRole] || [];
    
    // Combine base navigation with role-specific items
    return [
      ...baseNavigation,
      ...roleSpecificItems
    ];
  };

  const navigationItems = getNavigationItems();

  // Close sidebar on mobile when link is clicked
  const handleLinkClick = () => {
    if (window.innerWidth < 768) {
      setSidebar(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebar(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 bg-white border-r border-gray-200 min-h-screen
        transform transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:transition-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LOGO</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">ProjectFlow</h1>
                <p className="text-xs text-gray-500">Management System</p>
              </div>
            </div>
            
            {/* Close button for mobile */}
            <button 
              onClick={() => setSidebar(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 bg-gray-50 rounded-lg m-4 mt-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-sm">
                {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 hover:shadow-sm'
                  }`}
                >
                  <span className={`mr-3 text-lg transition-transform duration-200 group-hover:scale-110 ${
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    {item.icon}
                  </span>
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Active indicator */}
                  {isActive && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer/Settings */}
          <div className="p-4 border-t border-gray-200">
            <Link
              to="/settings"
              onClick={handleLinkClick}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                location.pathname === '/settings'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className="mr-3 text-lg">⚙️</span>
              Settings
            </Link>
            
            {/* Logout Button */}
            <button
              onClick={() => {
                // You can add logout logic here
                console.log('Logout clicked');
              }}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 mt-2"
            >
              <span className="mr-3 text-lg">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;