import { useEffect } from 'react';
import './CustomAlerts.scss';

const CustomAlerts = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`custom-alerts custom-alerts--${type}`}>
      <div className="custom-alerts__content">
        <span>{message}</span>
        <button onClick={onClose} className="custom-alerts__close-btn">&times;</button>
      </div>
      <div className="custom-alerts__progress-bar"></div>
    </div>
  );
};

export default CustomAlerts;