import React, { useState, useEffect } from 'react';
import NutritionDashboard from './components/NutritionDashboard';
import AuthPage from './components/AuthPage';
import { authService } from './services/authService';

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    if (authService.isAuthenticated()) {
      setUser(authService.getUser());
    }
    setCheckingAuth(false);
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
  };

  if (checkingAuth) {
    return (
      <div className="App" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div className="auth-spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div className="App">
      <NutritionDashboard user={user} onLogout={handleLogout} />
    </div>
  );
}

export default App;
