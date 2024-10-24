import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import AnimatedBg from '../../components/Backgrounds/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loaders/Loader/Loader';
import UnsubscribeImg from "../../assets/images/email-magnet.svg";
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './UnsubscribePage.scss';

export const UnsubscribePage = () => {
  const [isLoading, setIsLoading] = useState(false); 
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [scaleTrigger, setScaleTrigger] = useState(false); 
  const navigate = useNavigate();
  const location = useLocation();

  const token = decodeURIComponent(new URLSearchParams(location.search).get('token'));

  const graphicRef = useRef(null);
  const containerRef = useRef(null);  

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => {
      setAlert({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleUnsubscribe = async () => {
    if (!token) {
      showAlert('Unsubscribe token is missing or invalid.', 'error');
      return;
    }

    setIsLoading(true); 
    
    try { 
      const response = await api.post(`/api/unsubscribe`, { token });
      showAlert(response.data.message, 'success');
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'We encountered an issue processing your request. Please try again.';
      showAlert(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const graphic = graphicRef.current;
    const graphicContainer = containerRef.current;

    const handleMouseMove = (e) => {
      if (graphic) {
        const rect = graphic.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Calculate rotation and skew values
        const rotateX = (y / rect.height - 0.5) * 30;
        const rotateY = (x / rect.width - 0.5) * -30;
        const skewX = (x / rect.width - 0.5) * 5;
        const skewY = (y / rect.height - 0.5) * 5;

        graphic.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) skew(${skewX}deg, ${skewY}deg)`;
        graphic.style.boxShadow = `${-rotateY}px ${rotateX}px 20px rgba(0, 0, 0, 0.2)`;
      }
    };

    if (graphicContainer) {
      graphicContainer.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (graphicContainer) {
        graphicContainer.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  const handleClick = () => {
    const graphic = graphicRef.current;
    if (graphic) {
      graphic.style.transform = 'scale(0.9)';
      setScaleTrigger(!scaleTrigger); 
      setTimeout(() => {
        navigate('/'); 
      }, 150); 
    }
  };

  return (
    <>
      {isLoading ? <Loader /> : (
        <div className="unsubscribe-page">
          <div className="unsubscribe-page__container">
            {alert.show && (
              <CustomAlerts
                message={alert.message}
                type={alert.type}
                onClose={() => setAlert({ show: false, message: '', type: '' })}
              />
            )}
            <div className="unsubscribe-page__content-card">
              <h1 className="unsubscribe-page__title">Unsubscribe</h1>
              <p className="unsubscribe-page__intro">You are about to stop receiving emails from NextStream.</p>
              <p className="unsubscribe-page__text">Are you sure you want to unsubscribe from all future notifications?</p>
              <button className="unsubscribe-page__button" onClick={handleUnsubscribe}>Yes, Unsubscribe Me</button>
              <div className="unsubscribe-page__graphic-container" ref={containerRef}>
                <img 
                  src={UnsubscribeImg} 
                  alt="unsubscribe graphic" 
                  className="unsubscribe-page__graphic" 
                  ref={graphicRef}  
                  onClick={handleClick}
                />
              </div>
            </div>
          </div>
          <div className="unsubscribe-page__background">
            <AnimatedBg />
          </div>
        </div>
      )}
    </>
  );
};

export default UnsubscribePage;