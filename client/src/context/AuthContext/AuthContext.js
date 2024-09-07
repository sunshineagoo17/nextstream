import { createContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { signInAndRegisterWithGoogle, signInWithGoogle, signInWithGithub, logOut } from '../../services/firebase'; 
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

    console.log('Token:', token);
    console.log('Guest Token:', guestToken);
    console.log('Stored User ID:', storedUserId);

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

  const login = (token, userId, rememberMe) => {
    if (!token || !userId) {
      console.error('Invalid token or userId');
      return;
    }

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
      } catch (error) {
        console.error('Error fetching user name:', error);
      }
    };

    fetchUserName();
  };

  // Helper function to handle OAuth login response
  const handleOAuthLoginResponse = (response, provider) => {
    if (response.data.success) {
      login(response.data.token, response.data.userId, true);
      toast.success('Login successful! Redirecting...');
      setTimeout(() => navigate(`/profile/${response.data.userId}`), 3000);
    } else if (response.data.reason === 'email_linked_to_other_provider') {
      toast.error(`This email is already linked to ${provider}. Please log in using ${provider}.`);
    } else {
      throw new Error(response.data.message || 'OAuth login failed.');
    }
  };

  // Register with Google OAuth
  const registerWithGoogle = async () => {
    try {
      const result = await signInAndRegisterWithGoogle();
  
      if (!result || !result.user) {
        throw new Error("Google sign-in result is missing user data.");
      }
  
      const { email, displayName } = result.user;
  
      const response = await api.post('/api/auth/oauth-register', {
        email,
        displayName,
        provider: 'google',
      });
  
      if (response.data.success) {
        login(response.data.token, response.data.userId, true);
        toast.success("Registration successful! Redirecting...");
        setTimeout(() => navigate(`/profile/${response.data.userId}`), 3000);
      } else {
        throw new Error(response.data.message || 'OAuth registration failed.');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.info("This email's already being used.");  
      } else {
        toast.error(error.message || 'Error during Google sign-in. Please try again.');
      }
    }
  };  
  
  // Login with Google OAuth
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle(); 

      if (!result || !result.user) {
        throw new Error("Google sign-in result is missing user data.");
      }

      const { email } = result.user;
      const response = await api.post('/api/auth/oauth-login', { email, provider: 'google' });

      handleOAuthLoginResponse(response, 'Google');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.info("This email's already being used.");
      } else {
        toast.error(error.message || 'Error during Google login. Please try again.');
      }
    }
  };

  // Register with GitHub OAuth
  const registerWithGithub = async () => {
    try {
      const result = await signInWithGithub();

      if (!result || !result.user) {
        throw new Error("GitHub sign-in result is missing user data.");
      }

      const { email, displayName } = result.user;

      const response = await api.post('/api/auth/oauth-register', {
        email,
        displayName: displayName || 'GitHub User',
        provider: 'github',
      });

      if (response.data.success) {
        login(response.data.token, response.data.userId, true);
        toast.success("Registration successful! Redirecting...");
        setTimeout(() => navigate(`/profile/${response.data.userId}`), 3000);
      } else {
        throw new Error(response.data.message || 'OAuth registration failed.');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.info("This email's already being used.");
      } else {
        toast.error(error.message || 'Error during GitHub sign-in. Please try again.');
      }
    }
  };

  // Login with GitHub OAuth
  const loginWithGithub = async () => {
    try {
      const result = await signInWithGithub();

      if (!result || !result.user) {
        throw new Error("GitHub sign-in result is missing user data.");
      }

      const { email } = result.user;
      const response = await api.post('/api/auth/oauth-login', { email, provider: 'github' });

      handleOAuthLoginResponse(response, 'GitHub');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.info("This email's already being used.");
      } else {
        toast.error(error.message || 'Error during GitHub login. Please try again.');
      }
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
        registerWithGoogle,    
        registerWithGithub,    
        loginWithGoogle,      
        loginWithGithub,       
        guestLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};