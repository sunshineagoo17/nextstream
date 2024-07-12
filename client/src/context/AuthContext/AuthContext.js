import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Loader from '../../components/Loader/Loader';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext useEffect');
    const token = Cookies.get('token') || sessionStorage.getItem('token');
    const storedUserId = sessionStorage.getItem('userId') || Cookies.get('userId');
    console.log('Initial userId from sessionStorage:', storedUserId);

    // Check if token and userId exist in cookies or session storage
    if (token && storedUserId) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId, 10));
      console.log('User authenticated:', true);
      console.log('UserId set:', storedUserId);
    } else {
      console.log('No valid token or userId found.');
    }
    setIsLoading(false); // Set loading to false after checking authentication
  }, []); // Empty dependency array ensures this effect runs only once on mount

  const login = (token, userId, rememberMe) => {
    console.log('Login function called');
    // console.log('Login userId:', userId); for testing purposes
    Cookies.set('token', token, { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    Cookies.set('userId', userId.toString(), { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('userId', userId.toString());
    setIsAuthenticated(true);
    setUserId(userId);
    console.log('User logged in successfully');
  };

  const logout = () => {
    console.log('Logout function called');
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userId', { path: '/' });
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserId(null);
    console.log('User logged out successfully');
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, setIsAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
