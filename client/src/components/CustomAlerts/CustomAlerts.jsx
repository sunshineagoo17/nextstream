import { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faInfoCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import './CustomAlerts.scss';

const CustomAlerts = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'info':
        return faInfoCircle;
      case 'error':
        return faExclamationCircle;
      default:
        return null;
    }
  };

  return (
    <div className={`custom-alerts custom-alerts--${type}`}>
      <div className="custom-alerts__content">
        <FontAwesomeIcon icon={getIcon()} className="custom-alerts__icon" />
        <span className="custom-alerts__message">{message}</span>
        <button onClick={onClose} className="custom-alerts__close-btn">&times;</button>
      </div>
      <div className="custom-alerts__progress-bar"></div>
    </div>
  );
};

export default CustomAlerts;