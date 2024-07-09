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
    if (token && storedUserId) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId, 10)); 
    }
  }, []);

  const login = (token, userId, rememberMe) => {
    console.log('Login token:', token);
    console.log('Login userId:', userId);
    Cookies.set('token', token, { expires: rememberMe ? 7 : 1 });
    sessionStorage.setItem('userId', userId.toString()); 
    sessionStorage.setItem('token', token);
    setIsAuthenticated(true);
    setUserId(userId);
  };

  const logout = () => {
    Cookies.remove('token');
    sessionStorage.removeItem('userId'); 
    sessionStorage.removeItem('token');
    setIsAuthenticated(false);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, setIsAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
