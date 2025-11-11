import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useUIStore } from '../../stores/ui.store';

export const Header = () => {
  const { user, logout } = useAuth();
  const { sidebarOpen, setSidebar } = useUIStore();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
          </div>
          
          <button
            onClick={logout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;