// src/router.jsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/auth.store';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Clients from './pages/Clients/Clients';
import Projects from './pages/Projects/Projects';
import Communication from './pages/Communication/Communication';
import Activity from './pages/Activity/Activity';
import Architects from './pages/Architects/Architects';
import Settings from './pages/Settings/Settings';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/auth/login" replace />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Checking authentication..." />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

const AppRouter = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/auth/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/auth/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes with Layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="projects" element={<Projects />} />
        <Route path="clients" element={<Clients />} />
        <Route path="communication" element={<Communication />} />
        <Route path="activity" element={<Activity />} />
        <Route path="architects" element={<Architects />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Default redirect - Remove this duplicate route */}
      {/* <Route path="/" element={<Navigate to="/dashboard" replace />} /> */}
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRouter;