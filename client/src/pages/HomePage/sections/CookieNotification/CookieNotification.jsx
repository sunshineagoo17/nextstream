import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../context/AuthContext/AuthContext';  
import './CookieNotification.scss';

const CookieNotification = () => {
  const [visible, setVisible] = useState(false);
  const [cookiesEnabled, setCookiesEnabled] = useState(false);
  const [animationClass, setAnimationClass] = useState('');
  const { login, logout } = useContext(AuthContext); 

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setVisible(true); 
    } else {
      setCookiesEnabled(cookieConsent === 'enabled');
    }
  }, []);

  const handleClose = () => {
    setAnimationClass('slide-out');
    setTimeout(() => {
      setVisible(false);
    }, 500);
  };

  const handleEnableCookies = () => {
    setCookiesEnabled(true);
    localStorage.setItem('cookieConsent', 'enabled');
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      login(token, userId); 
    }
    setAnimationClass('slide-out');
    setTimeout(() => {
      setVisible(false);
    }, 500);
  };

  const handleDisableCookies = () => {
    setCookiesEnabled(false);
    localStorage.setItem('cookieConsent', 'disabled');
    logout();  
    localStorage.removeItem('token');  
    localStorage.removeItem('userId');
    setAnimationClass('slide-out');
    setTimeout(() => {
      setVisible(false);
    }, 500);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className={`cookie-notification ${animationClass}`}>
      <p className="cookie-notification__message">
        Please enable your cookies to save your preferences and stay logged in. Without them, some essential features may not work properly.
      </p>
      <div className="cookie-notification__buttons">
        {!cookiesEnabled && (
          <button className="cookie-notification__enable-btn" onClick={handleEnableCookies}>
            Enable Cookies
          </button>
        )}
        {cookiesEnabled && (
          <button className="cookie-notification__disable-btn" onClick={handleDisableCookies}>
            Disable Cookies
          </button>
        )}
        <button className="cookie-notification__close-btn" onClick={handleClose} aria-label="Close notification">
          &times;
        </button>
      </div>
    </div>
  );
};

export default CookieNotification;