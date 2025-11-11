import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: '📊' },
  { name: 'Clients', href: '/clients', icon: '👥' },
  { name: 'Projects', href: '/projects', icon: '📁' },
  { name: 'Sales', href: '/sales', icon: '💰' },
  { name: 'Admin', href: '/admin', icon: '⚙️' },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { sidebarOpen, setSidebar } = useUIStore();

  if (!sidebarOpen) return null;

  return (
    <div className="w-64 bg-white border-r border-gray-200 min-h-screen p-4">
      {/* User Info */}
      <div className="p-4 bg-gray-50 rounded-lg mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
              onClick={() => setSidebar(false)}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;