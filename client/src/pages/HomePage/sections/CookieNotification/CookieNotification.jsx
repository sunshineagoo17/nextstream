import React, { useState, useEffect } from 'react';
import './CookieNotification.scss';

const CookieNotification = () => {
  const [visible, setVisible] = useState(false);
  const [cookiesEnabled, setCookiesEnabled] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');
    if (!cookieConsent) {
      setVisible(true);
    } else {
      setCookiesEnabled(cookieConsent === 'enabled');
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    localStorage.setItem('cookieNotificationSeen', 'true');
  };

  const handleEnableCookies = () => {
    setCookiesEnabled(true);
    localStorage.setItem('cookieConsent', 'enabled');
    // Logic to enable cookies/related features
    // For example (in version 2.0), initialize analytics tracking
    // initAnalytics();
  };

  const handleDisableCookies = () => {
    setCookiesEnabled(false);
    localStorage.setItem('cookieConsent', 'disabled');
    // Logic to disable cookies/related features
    // For example (in version 2.0), disable analytics tracking
    // disableAnalytics();
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-notification">
      <p className="cookie-notification__message">
        {cookiesEnabled
          ? "Cookies are enabled. Enjoy a personalized experience!"
          : "We use cookies to enhance your experience. Please enable cookies."}
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
