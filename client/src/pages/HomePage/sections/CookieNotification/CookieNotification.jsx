import React, { useState } from 'react';
import './CookieNotification.scss';

const CookieNotification = () => {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-notification">
      <p className="cookie-notification__message">
        We use cookies to improve your experience on our site. By using our site, you consent to cookies.
      </p>
      <button className="cookie-notification__close-btn" onClick={handleClose} aria-label="Close notification">
        &times;
      </button>
    </div>
  );
};

export default CookieNotification;
