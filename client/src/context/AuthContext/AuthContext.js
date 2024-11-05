import { createContext, useState, useEffect } from 'react';
import { signInAndRegisterWithGoogle, signInWithGoogle, logOut } from '../../services/firebase'; 
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../../components/CustomAlerts/CustomAlerts';
import Cookies from 'js-cookie';
import Loader from '../../components/Loaders/Loader/Loader';
import api from '../../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [userId, setUserId] = useState(null);
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState({ message: '', type: '' });
  const [showAlert, setShowAlert] = useState(false); 
  const navigate = useNavigate();

  useEffect(() => {
    const token = Cookies.get('token');
    const guestToken = Cookies.get('guestToken');
    const storedUserId = Cookies.get('userId');
  
    if (token && storedUserId) {
      setIsAuthenticated(true);
      setIsGuest(false);
      setUserId(parseInt(storedUserId, 10));
  
      const fetchUserName = async () => {
        try {
          const response = await api.get(`/api/profile/${storedUserId}`);
          setName(response.data.name);
        } catch (error) {
          showAlertMessage('Please log in to access your profile.', 'info');
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

  const showAlertMessage = (message, type) => {
    setAlert({ message, type });
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 3000); 
  };

  const login = async (token, userId, rememberMe) => {
    if (!token || !userId) {
      return;
    }

    setIsLoading(true);

    const isProduction = process.env.NODE_ENV === 'production';

    Cookies.set('token', token, { expires: rememberMe ? 7 : 1, secure: isProduction, sameSite: 'strict', path: '/' });
    Cookies.set('userId', userId.toString(), { expires: rememberMe ? 7 : 1, secure: isProduction, sameSite: 'strict', path: '/' });
    
    setIsAuthenticated(true);
    setIsGuest(false);
    setUserId(userId);

    const fetchUserName = async () => {
      try {
        const response = await api.get(`/api/profile/${userId}`);
        setName(response.data.name);
        navigate(`/profile/${userId}`);
        showAlertMessage('Login successful!', 'success');
      } catch (error) {
        showAlertMessage('Error logging in. Please try again.', 'error');
      }
      setIsLoading(false);
    };

    await fetchUserName();
  };

// Amalgamated function to handle OAuth login
const handleOAuthLogin = async (providerLogin, provider) => {
  try {
    await logOut(); 
  
    const result = await providerLogin();
  
    if (result && result.user) {
      const { email } = result.user;
  
      const response = await api.post('/api/auth/oauth-login', { email, provider });
  
      if (response.data.success) {
        Cookies.set('token', response.data.token, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
        Cookies.set('userId', response.data.userId, { expires: 7, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });

        login(response.data.token, response.data.userId, true);
        showAlertMessage('Login successful! Redirecting...', 'success');
        setTimeout(() => navigate(`/profile/${response.data.userId}`), 3000);
      } else if (response.data.reason === 'email_linked_to_other_provider') {
        if (!response.data.provider) {
          showAlertMessage('This email is already linked to a provider, but the provider is unknown. Please log in with the correct provider.', 'error');
        } else {
          showAlertMessage(`This email is already linked to ${response.data.provider}. Please log in using that account.`, 'error');
        }
      } else {
        showAlertMessage('Login unsuccessful. Please try again.', 'error');
      }
    }
  } catch (error) {
    if (error.response && error.response.status) {
      if (error.response.status === 404) {
        showAlertMessage('User not found. Please register first.', 'error');
      } else if (error.response.status === 400) {
        showAlertMessage("Email's already being used. Please log in.", 'error');
      } else {
        showAlertMessage('Login failed. Please try again.', 'error');
      }
    } else {
      showAlertMessage('Login failed. Please try again.', 'error');
    }
  }
};  

  // Updated guest login to call the backend and store the token
  const guestLogin = async () => {
    try {
      const response = await api.post('/api/auth/guest-login');
      const guestToken = response.data.token;

      if (!guestToken) {
        throw new Error('Failed to obtain guest token');
      }

      Cookies.set('guestToken', guestToken, { expires: 1, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/' });
      
      setIsGuest(true);
      setIsAuthenticated(false);
      setIsLoading(false);
      showAlertMessage('Guest login successful', 'success');

      navigate('/top-picks/guest');
    } catch (error) {
      showAlertMessage('Failed to log in as a guest.', 'error');
    }
  };

  const logout = async () => {
    try {
      await logOut();
      
      Cookies.remove('token', { path: '/' });
      Cookies.remove('userId', { path: '/' });
      Cookies.remove('guestToken', { path: '/' });

      setIsAuthenticated(false);
      setIsGuest(false);
      setUserId(null);
      setName('');
      setIsLoading(false);
  
      showAlertMessage('Successfully logged out.', 'success');
  
      navigate('/'); 
  
    } catch (error) {
      showAlertMessage('Error during sign out. Please try again.', 'error');
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
      {showAlert && <CustomAlert message={alert.message} type={alert.type} onClose={() => setShowAlert(false)} />}
    </AuthContext.Provider>
  );
};