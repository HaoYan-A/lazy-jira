import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import { UserProvider } from './context/UserContext';
import { JiraApiProvider } from './context/JiraApiContext';
import { authEventBus } from './services/jiraApi';
import 'antd/dist/reset.css';

const AppRoutes: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // 监听认证过期事件
    const handleAuthExpired = () => {
      navigate('/login');
    };

    authEventBus.on('auth:expired', handleAuthExpired);

    return () => {
      // 清理事件监听器
      authEventBus.listeners['auth:expired'] = authEventBus.listeners['auth:expired'].filter(
        listener => listener !== handleAuthExpired
      );
    };
  }, [navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Home />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <JiraApiProvider>
          <AppRoutes />
        </JiraApiProvider>
      </UserProvider>
    </Router>
  );
};

export default App; 