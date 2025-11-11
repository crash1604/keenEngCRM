import React from 'react';
import Header from '../dashboard/Header';
import Sidebar from '../dashboard/Sidebar';

export const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;