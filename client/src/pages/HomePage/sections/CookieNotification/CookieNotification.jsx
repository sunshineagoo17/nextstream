import { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import './CookieNotification.scss';

const CookieNotification = () => {
  const [visible, setVisible] = useState(false);
  const [cookiesEnabled, setCookiesEnabled] = useState(false);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    const cookieConsent = Cookies.get('cookieConsent');
    if (!cookieConsent) {
      setVisible(true);
    } else {
      setCookiesEnabled(cookieConsent === 'enabled');
    }
  }, []);

  const handleClose = () => {
    setAnimationClass('fade-out');
    setTimeout(() => {
      setVisible(false);
    }, 500);
  };

  const handleEnableCookies = () => {
    setCookiesEnabled(true);
    Cookies.set('cookieConsent', 'enabled', { expires: 365, secure: true, sameSite: 'Strict' });
    setAnimationClass('fade-out');
    setTimeout(() => {
      setVisible(false);
    }, 500);
  };
  
  const handleDisableCookies = () => {
    setCookiesEnabled(false);
    Cookies.set('cookieConsent', 'disabled', { expires: 365, secure: true, sameSite: 'Strict' });
    Cookies.remove('token');
    Cookies.remove('userId');
    setAnimationClass('fade-out');
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
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

export default CookieNotification;