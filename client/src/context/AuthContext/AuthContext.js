import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const token = Cookies.get('token');
    const storedUserId = sessionStorage.getItem('userId');
    console.log('Initial token:', token);
    console.log('Initial userId:', storedUserId);
    
    // Check if token and userId exist in cookies and session storage
    if (token && storedUserId) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId, 10));
    }
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const login = (token, userId, rememberMe) => {
    console.log('Login token:', token);
    console.log('Login userId:', userId);
    Cookies.set('token', token, { expires: rememberMe ? 7 : 1 });
    sessionStorage.setItem('userId', userId.toString());
    setIsAuthenticated(true);
    setUserId(userId);
  };

  const logout = () => {
    Cookies.remove('token');
    sessionStorage.removeItem('userId');
    setIsAuthenticated(false); // Clear isAuthenticated state on logout
    setUserId(null);
  };

  // Persist isAuthenticated state across page reloads
  useEffect(() => {
    const token = Cookies.get('token');
    const storedUserId = sessionStorage.getItem('userId');
    if (token && storedUserId) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId, 10));
    }
  }, []); // This effect runs only on mount to restore isAuthenticated state

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, setIsAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
