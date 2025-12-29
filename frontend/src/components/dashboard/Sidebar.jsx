// src/components/dashboard/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Folder as FolderIcon,
  Assignment as AssignmentIcon,
  People as PeopleIcon,
  Email as EmailIcon,
  AdminPanelSettings as AdminIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
  Timer as TimerIcon,
  Receipt as ReceiptIcon,
  Palette as PaletteIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Architecture as ArchitectureIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../stores/auth.store';
import { useUIStore } from '../../stores/ui.store';

// Base navigation items available to all roles
const baseNavigation = [
  { name: 'Dashboard', href: '/dashboard', Icon: DashboardIcon, roles: ['admin', 'manager', 'employee', 'client', 'architect'] },
  { name: 'Projects', href: '/projects', Icon: FolderIcon, roles: ['admin', 'manager', 'employee', 'client', 'architect'] },
  { name: 'Activity', href: '/activity', Icon: AssignmentIcon, roles: ['admin', 'manager', 'employee', 'client', 'architect'] },
];

// Role-specific navigation items
const roleNavigation = {
  admin: [
    { name: 'Clients', href: '/clients', Icon: PeopleIcon },
    { name: 'Architects', href: '/architects', Icon: ArchitectureIcon },
    { name: 'Communication', href: '/communication', Icon: EmailIcon },
    { name: 'Admin', href: '/admin', Icon: AdminIcon },
    { name: 'Users', href: '/users', Icon: PersonIcon },
  ],
  manager: [
    { name: 'Clients', href: '/clients', Icon: PeopleIcon },
    { name: 'Architects', href: '/architects', Icon: ArchitectureIcon },
    { name: 'Communication', href: '/communication', Icon: EmailIcon },
  ],
  employee: [
    { name: 'My Tasks', href: '/tasks', Icon: CheckCircleIcon },
    { name: 'Time Tracking', href: '/time-tracking', Icon: TimerIcon },
  ],
  client: [
    { name: 'My Projects', href: '/my-projects', Icon: AssignmentIcon },
    { name: 'Invoices', href: '/invoices', Icon: ReceiptIcon },
  ],
  architect: [
    { name: 'Designs', href: '/designs', Icon: PaletteIcon },
    { name: 'Submissions', href: '/submissions', Icon: SendIcon },
  ],
};

export const Sidebar = () => {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { sidebarOpen, setSidebar, sidebarCollapsed, setSidebarCollapsed } = useUIStore();
  const [profileModalOpen, setProfileModalOpen] = useState(false);

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

  // Close sidebar on mobile/tablet when link is clicked (matches lg:hidden breakpoint)
  const handleLinkClick = () => {
    if (window.innerWidth < 1024) {
      setSidebar(false);
    }
  };

  // Toggle sidebar collapse state
  const toggleCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
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
        bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 min-h-screen
        transform transition-all duration-300 ease-in-out
        lg:translate-x-0
        flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'}
        w-64
      `}
      style={{
        transition: 'width 400ms cubic-bezier(0.4, 0, 0.2, 1), transform 300ms ease-in-out'
      }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={`flex items-center border-b border-gray-200 dark:border-gray-700 relative transition-all duration-300 ease-in-out ${
              sidebarCollapsed ? 'justify-center p-4' : 'justify-between p-4'
            }`}
          >
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#DC143C' }}>
                  <span className="text-white font-bold text-sm">S</span>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Spartan</h1>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Management System</p>
                </div>
              </div>
            )}

            {sidebarCollapsed && (
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#DC143C' }}>
                <span className="text-white font-bold text-sm">S</span>
              </div>
            )}

            {/* Toggle Button - Positioned at outer edge when collapsed */}
            <button
              onClick={toggleCollapse}
              className={`hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                sidebarCollapsed
                  ? 'absolute -right-3 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md z-10'
                  : ''
              }`}
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>

            {/* Close button for mobile */}
            {!sidebarCollapsed && (
              <button
                onClick={() => setSidebar(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* User Info Section */}
          <div className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'px-2 py-4' : 'm-4 mt-6'}`}>
            <button
              onClick={() => setProfileModalOpen(true)}
              className={`transition-all duration-300 ease-in-out cursor-pointer ${
                sidebarCollapsed
                  ? 'w-full flex justify-center'
                  : 'w-full text-left p-4 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg'
              }`}
              title="View Profile"
            >
              <div className={`flex items-center transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'justify-center' : 'space-x-3'}`}>
                <div className={`bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm hover:shadow-md transition-all duration-300 ease-in-out flex-shrink-0 ${
                  sidebarCollapsed ? 'w-10 h-10 text-sm' : 'w-12 h-12 text-lg'
                }`}>
                  {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
                </div>
                <div className={`min-w-0 transition-all duration-300 ease-in-out ${
                  sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'flex-1 opacity-100'
                }`}>
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize truncate">{user?.role}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                </div>
              </div>
            </button>
          </div>

          {/* Navigation */}
          <nav className={`flex-1 space-y-1 overflow-y-auto transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'px-2' : 'px-4'}`}>
            {navigationItems.map((item) => {
              const isActive = location.pathname === item.href;
              const { Icon } = item;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={handleLinkClick}
                  className={`flex items-center text-sm font-medium rounded-xl transition-all duration-300 ease-in-out group ${
                    sidebarCollapsed ? 'justify-center py-3 px-2' : 'px-4 py-3'
                  } ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white hover:shadow-sm'
                  }`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <Icon
                    className={`transition-all duration-300 ease-in-out group-hover:scale-110 ${
                      isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`}
                    style={{ fontSize: sidebarCollapsed ? 22 : 20, marginRight: sidebarCollapsed ? 0 : 12 }}
                  />

                  <span className={`flex-1 transition-all duration-300 ease-in-out whitespace-nowrap ${
                    sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
                  }`}>
                    {item.name}
                  </span>
                  {/* Active indicator */}
                  {isActive && !sidebarCollapsed && (
                    <div className="w-2 h-2 bg-blue-600 rounded-full transition-all duration-300"></div>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer/Settings */}
          <div className={`border-t border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'p-2' : 'p-4'}`}>
            <Link
              to="/settings"
              onClick={handleLinkClick}
              className={`flex items-center text-sm font-medium rounded-xl transition-all duration-300 ease-in-out ${
                sidebarCollapsed ? 'justify-center py-3 px-2' : 'px-4 py-3'
              } ${
                location.pathname === '/settings'
                  ? 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
              }`}
              title={sidebarCollapsed ? 'Settings' : ''}
            >
              <SettingsIcon
                className="transition-all duration-300 ease-in-out"
                style={{ fontSize: sidebarCollapsed ? 22 : 20, marginRight: sidebarCollapsed ? 0 : 12 }}
              />
              <span className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                Settings
              </span>
            </Link>

            {/* Logout Button */}
            <button
              onClick={logout}
              className={`flex items-center w-full text-sm font-medium text-red-600 dark:text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 ease-in-out mt-2 ${
                sidebarCollapsed ? 'justify-center py-3 px-2' : 'px-4 py-3'
              }`}
              title={sidebarCollapsed ? 'Logout' : ''}
            >
              <LogoutIcon
                className="transition-all duration-300 ease-in-out"
                style={{ fontSize: sidebarCollapsed ? 22 : 20, marginRight: sidebarCollapsed ? 0 : 12 }}
              />
              <span className={`transition-all duration-300 ease-in-out ${sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'}`}>
                Logout
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      <Dialog
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
          }
        }}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 text-white relative">
          <IconButton
            onClick={() => setProfileModalOpen(false)}
            sx={{
              position: 'absolute',
              top: 12,
              right: 12,
              color: 'white',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' }
            }}
          >
            <CloseIcon />
          </IconButton>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{user?.first_name} {user?.last_name}</h2>
              <p className="text-blue-100 text-sm capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <DialogContent sx={{ p: 0 }}>
          <div className="p-6 space-y-4">
            {/* Full Name */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <PersonIcon />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Full Name</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {user?.first_name} {user?.last_name}
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-2 bg-green-100 rounded-lg text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Email Address</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {user?.email || 'Not provided'}
                </p>
              </div>
            </div>

            {/* Role/Position */}
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Position / Role</p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                  {user?.role || 'Not assigned'}
                </p>
              </div>
            </div>

            {/* Username */}
            {user?.username && (
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Username</p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {user?.username}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              To edit your profile, go to <Link to="/settings" onClick={() => setProfileModalOpen(false)} className="text-blue-600 hover:underline font-medium">Settings</Link>
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Sidebar;