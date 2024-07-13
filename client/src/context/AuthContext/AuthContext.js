import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Loader from '../../components/Loader/Loader';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState(''); // Add name state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('AuthContext useEffect');
    const token = Cookies.get('token') || sessionStorage.getItem('token');
    const storedUserId = sessionStorage.getItem('userId') || Cookies.get('userId');
    const storedName = sessionStorage.getItem('name') || Cookies.get('name'); 

    // Check if token, userId, and name exist in cookies or session storage
    if (token && storedUserId && storedName) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId, 10));
      setName(storedName); // Set the name
      console.log('User authenticated:', true);
      console.log('UserId set:', storedUserId);
      console.log('Name set:', storedName);
    } else {
      console.log('No valid token, userId, or name found.');
    }
    setIsLoading(false); 
  }, []); 

  const login = (token, userId, name, rememberMe) => {
    console.log('Login function called');
    Cookies.set('token', token, { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    Cookies.set('userId', userId.toString(), { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    Cookies.set('name', name, { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('userId', userId.toString());
    sessionStorage.setItem('name', name); 
    setIsAuthenticated(true);
    setUserId(userId);
    setName(name); 
    console.log('User logged in successfully');
  };

  const logout = () => {
    console.log('Logout function called');
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userId', { path: '/' });
    Cookies.remove('name', { path: '/' });
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    sessionStorage.removeItem('name'); 
    setIsAuthenticated(false);
    setUserId(null);
    setName(''); 
    console.log('User logged out successfully');
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userId, name, setName, setIsAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};