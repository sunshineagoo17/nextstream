import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { signInAndRegisterWithGoogle, signInWithGoogle, logOut } from '../../services/firebase'; 
import { useNavigate } from 'react-router-dom';
import 'react-toastify/dist/ReactToastify.css';
import Cookies from 'js-cookie';
import Loader from '../../components/Loader/Loader';
import api from '../../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true); 
  const navigate = useNavigate(); 

  useEffect(() => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    const guestToken = Cookies.get('guestToken') || localStorage.getItem('guestToken');
    const storedUserId = localStorage.getItem('userId') || Cookies.get('userId');

    if (token && storedUserId) {
      setIsAuthenticated(true);
      setIsGuest(false);
      setUserId(parseInt(storedUserId, 10));

      const fetchUserName = async () => {
        try {
          const response = await api.get(`/api/profile/${storedUserId}`);
          setName(response.data.name);
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
        setIsLoading(false);
      };

      fetchUserName();
    } else if (guestToken) {
      setIsGuest(true);
      setIsAuthenticated(false);
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (token, userId, rememberMe) => {
    if (!token || !userId) {
      console.error('Invalid token or userId');
      return;
    }

    setIsLoading(true); 

    Cookies.set('token', token, { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    Cookies.set('userId', userId.toString(), { expires: rememberMe ? 7 : 1, secure: true, sameSite: 'strict', path: '/' });
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId.toString());
    setIsAuthenticated(true);
    setIsGuest(false);
    setUserId(userId);

    const fetchUserName = async () => {
      try {
        const response = await api.get(`/api/profile/${userId}`);
        setName(response.data.name);
        navigate(`/profile/${userId}`); 
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
      setIsLoading(false); 
    };

    await fetchUserName();
  };

  // Amalgamated function to handle OAuth login
  const handleOAuthLogin = async (providerLogin, provider) => {
    try {
      // Ensure the user is signed out before triggering the popup
      await logOut(); 
      
      const result = await providerLogin();
  
      if (result && result.user) {
        const { email } = result.user;
  
        // Send provider and email to the server for authentication
        const response = await api.post('/api/auth/oauth-login', {
          email,
          provider,
        });
  
        if (response.data.success) {
          // Set cookies and local storage for the token and user ID
          Cookies.set('token', response.data.token, { expires: 7, secure: true, sameSite: 'strict' });
          Cookies.set('userId', response.data.userId, { expires: 7, secure: true, sameSite: 'strict' });
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('userId', response.data.userId);
  
          // Log the user in and redirect to the profile page
          login(response.data.token, response.data.userId, true);
          toast.success('Login successful! Redirecting...');
          setTimeout(() => navigate(`/profile/${response.data.userId}`), 3000);
        } else if (response.data.reason === 'email_linked_to_other_provider') {
          toast.error(`This email is already linked to ${response.data.provider}. Please log in using that provider.`);
        } else {
          toast.error('OAuth login failed. Please try again.');
        }
      }
    } catch (error) {
      toast.error('OAuth login error. Please try again.');
    }
  };  

  const guestLogin = (guestToken) => {
    if (!guestToken) {
      console.error('Invalid guest token');
      return;
    }

    Cookies.set('guestToken', guestToken, { expires: 1, secure: true, sameSite: 'strict', path: '/' });
    localStorage.setItem('guestToken', guestToken);
    setIsGuest(true);
    setIsAuthenticated(false);
    setIsLoading(false); 
  };

  const logout = async () => {
    try {
      await logOut();
      Cookies.remove('token', { path: '/' });
      Cookies.remove('userId', { path: '/' });
      Cookies.remove('guestToken', { path: '/' });
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      localStorage.removeItem('guestToken');
      setIsAuthenticated(false);
      setIsGuest(false);
      setUserId(null);
      setName('');
      setIsLoading(false);
    } catch (error) {
      console.error('Sign-out error:', error);
    }
  };

  if (isLoading) {
    return <Loader />; 
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isGuest,
        userId,
        name,
        setName,
        setIsAuthenticated,
        login,
        registerWithGoogle: () => handleOAuthLogin(signInAndRegisterWithGoogle, 'google'),    
        loginWithGoogle: () => handleOAuthLogin(signInWithGoogle, 'google'),
        guestLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};