import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import { JiraApiProvider } from './context/JiraApiContext';
import Login from './pages/Login';
import Home from './pages/Home';
import 'antd/dist/reset.css';

const App: React.FC = () => {
  return (
    <Router>
      <UserProvider>
        <JiraApiProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </JiraApiProvider>
      </UserProvider>
    </Router>
  );
};

export default App; 