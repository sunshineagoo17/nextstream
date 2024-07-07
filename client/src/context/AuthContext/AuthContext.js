import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId') || sessionStorage.getItem('userId');
    if (token && storedUserId) {
      setIsAuthenticated(true);
      setUserId(storedUserId);
    }
  }, []);

  const login = (token, userId, rememberMe) => {
    if (rememberMe) {
      localStorage.setItem('token', token);
      localStorage.setItem('userId', userId);
    } else {
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('userId', userId);
    }
    setIsAuthenticated(true);
    setUserId(userId);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, setIsAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
