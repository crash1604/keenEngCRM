// src/components/layout/Layout.jsx
import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../dashboard/Sidebar';
import { useUIStore } from '../../stores/ui.store';

const Layout = () => {
  const setSidebar = useUIStore((state) => state.setSidebar);

  // Close sidebar on mobile/tablet on initial load
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setSidebar(false);
    }
  }, [setSidebar]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-30">
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 relative">
          <Outlet /> {/* This is where child routes will render */}
        </main>
      </div>
    </div>
  );
};

export default Layout;