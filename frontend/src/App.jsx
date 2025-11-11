import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import AppRouter from './router';
import { useAuthStore } from './stores/auth.store';

// Initialize auth store
const AuthInitializer = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  
  React.useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return null;
};

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;