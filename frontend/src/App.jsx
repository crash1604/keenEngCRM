import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';
import { useAuthStore } from './stores/auth.store';
import { useUIStore } from './stores/ui.store';

function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const initializeTheme = useUIStore((state) => state.initializeTheme);

  useEffect(() => {
    // Check auth status on app load
    checkAuth();
    // Initialize theme from persisted storage
    initializeTheme();
  }, []); // Empty dependency array - run once on mount

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;