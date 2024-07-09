import React, { useState, useEffect } from 'react';
import './CookieNotification.scss';

const CookieNotification = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cookieNotificationSeen = sessionStorage.getItem('cookieNotificationSeen');
    if (!cookieNotificationSeen) {
      setVisible(true);
    }
  }, []);

  const handleClose = () => {
    setVisible(false);
    sessionStorage.setItem('cookieNotificationSeen', 'true');
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-notification">
      <p className="cookie-notification__message">
        We use cookies to enhance your experience. Please enable cookies.
      </p>
      <button className="cookie-notification__close-btn" onClick={handleClose} aria-label="Close notification">
        &times;
      </button>
    </div>
  );
};

export default CookieNotification;