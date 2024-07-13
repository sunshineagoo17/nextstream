import React, { createContext, useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import Loader from '../../components/Loader/Loader';
import api from '../../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState(''); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = Cookies.get('token') || sessionStorage.getItem('token');
    const storedUserId = sessionStorage.getItem('userId') || Cookies.get('userId');

    if (token && storedUserId) {
      setIsAuthenticated(true);
      setUserId(parseInt(storedUserId, 10));

      const fetchUserName = async () => {
        try {
          const response = await api.get(`/api/profile/${storedUserId}`);
          setName(response.data.name);
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
        setIsLoading(false); // Set loading to false after fetching user name
      };

      fetchUserName();
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = (token, userId, rememberMe) => {
    Cookies.set('token', token, { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    Cookies.set('userId', userId.toString(), { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    sessionStorage.setItem('token', token);
    sessionStorage.setItem('userId', userId.toString());
    setIsAuthenticated(true);
    setUserId(userId);

    const fetchUserName = async () => {
      try {
        const response = await api.get(`/api/profile/${userId}`);
        setName(response.data.name);
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  };

  const logout = () => {
    Cookies.remove('token', { path: '/' });
    Cookies.remove('userId', { path: '/' });
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userId');
    setIsAuthenticated(false);
    setUserId(null);
    setName(''); 
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