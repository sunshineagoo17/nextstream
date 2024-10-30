import { useState, useEffect, useCallback, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faHeart } from '@fortawesome/free-solid-svg-icons'; 
import { Link } from 'react-router-dom';
import './QuickStartGuide.scss';

const QuickstartGuide = ({ onClose, isAuthenticated, currentPage, userId }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [guidePosition, setGuidePosition] = useState({ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' });
  const [isNewUser, setIsNewUser] = useState(false);

  useEffect(() => {
    if (userId) {
      const quickstartCompleted = localStorage.getItem(`quickstartCompleted_${userId}`);
      setIsNewUser(!quickstartCompleted); 
    }
  }, [userId]);

  const steps = useMemo(() => [
      { text: "Welcome to NextStream! Give it a go. Explore!", position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }},
      { text: "Use the search bar to find movie titles and shows.", position: { top: '14%', left: '4%', transform: 'translate(0, 0)' }},
      { text: "Here's the hover menu. Check out our pages!", position: { top: '8.5%', left: '2%', transform: 'translate(0, 0)' }},
      { text: (
          <>
              <Link to={`/faves/${userId}`}>
                  <FontAwesomeIcon icon={faHeart} className="quickstart-guide__fave-icon"/>
              </Link>
              Add to your favourites and grow your watchlist. 
          </>
      ), position: { top: '5%', left: '1%', transform: 'translate(0, 0)' }},
      { text: (
          <>
              <Link to={`/calendar/${userId}`}>
                  <FontAwesomeIcon icon={faCalendarAlt} className="quickstart-guide__cal-icon"/>
              </Link> 
              Use the calendar to track your favourite shows/movies.
          </>
      ), position: { top: '5%', left: '2%', transform: 'translate(0, 0)' }},
      { text: "You're all set! Enjoy exploring the app!", position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
  ], [userId]);

  const updatePosition = useCallback((step) => {
    setGuidePosition(steps[step].position);
  }, [steps]);

  useEffect(() => {
    updatePosition(currentStep);
    const handleResize = () => updatePosition(currentStep);
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize);
    };
  }, [currentStep, updatePosition]);

  if (!isAuthenticated || currentPage !== 'profile' || !isNewUser) {
    return null;
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCloseGuide();
    }
  };

  const handleCloseGuide = () => {
    if (userId) {
      localStorage.setItem(`quickstartCompleted_${userId}`, 'true');
    }
    setIsNewUser(false);
    onClose();
  };

  return (
    <div className="quickstart-guide__overlay">
      <div
        className="quickstart-guide__container"
        style={{
          position: 'absolute',
          top: guidePosition.top,
          left: guidePosition.left,
          transform: guidePosition.transform,
          zIndex: 9999,
        }}
      >
        <div className="quickstart-guide__header">
          <h2 className="quickstart-guide__title">{steps[currentStep].text}</h2>
        </div>

        <button className="quickstart-guide__button" onClick={handleNext}>
          {currentStep < steps.length - 1 ? "Next" : "Finish"}
        </button>
        <button className="quickstart-guide__close" onClick={handleCloseGuide}>
          Close Quick Start Guide
        </button>
      </div>
    </div>
  );
};

export default QuickstartGuide;