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
      if (!quickstartCompleted) {
        setIsNewUser(true); 
      } else {
        setIsNewUser(false); 
      }
    }
  }, [userId]);

  const steps = useMemo(
    () => [
      { text: "Welcome to NextStream! Give it a go. Explore!", position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, showMenuArrow: false, showSearchArrow: false },
      { text: "Use the search bar to find movie titles and shows.", position: { top: '17%', left: '3%', transform: 'translate(0, 0)' }, showMenuArrow: false, showSearchArrow: true },
      { text: "Here's the hover menu. Check out our pages!", position: { top: '5%', left: '2%', transform: 'translate(0, 0)' }, showMenuArrow: true, showSearchArrow: false },
      { text: (
        <>
            <Link to={`/faves/${userId}`}>
                <FontAwesomeIcon icon={faHeart} className="quickstart-guide__fave-icon"/>
            </Link>
            Add to your favourites and grow your watchlist. 
        </>
      ), position: { top: '5%', left: '0%', transform: 'translate(0, 0)' }, showMenuArrow: false, showSearchArrow: false },
      { text: (
        <>
            <Link to={`/calendar/${userId}`}>
                <FontAwesomeIcon icon={faCalendarAlt} className="quickstart-guide__cal-icon"/>
            </Link> 
            Use the calendar to track your favourite shows/movies.
        </>
      ), position: { top: '5%', left: '2%', transform: 'translate(0, 0)' }, showMenuArrow: false, showSearchArrow: false },
      { text: "You're all set! Enjoy exploring the app!", position: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, showMenuArrow: false, showSearchArrow: false }
    ],
    [userId]
  );

  const updatePosition = useCallback((step) => {
    const position = steps[step].position;
    setGuidePosition(position);
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

        {steps[currentStep].showMenuArrow && (
          <div className="quickstart-guide__arrow quickstart-guide__arrow--menu">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="squiggly-arrow" style={{ transform: 'rotate(230deg)' }}>
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill="transparent" stroke="#blue" stroke-width="2" />
                </marker>
              </defs>
              <path d="M10,40 C 30,10 50,70 90,40" fill="transparent" stroke="#blue" stroke-width="2" marker-end="url(#arrowhead)" />
            </svg>
          </div>
        )}

        {steps[currentStep].showSearchArrow && (
        <div className="quickstart-guide__arrow quickstart-guide__arrow--search">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="squiggly-arrow squiggly-arrow--search" style={{ transform: 'scaleX(-1) rotate(280deg)' }}>
            <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="transparent" stroke="#blue" stroke-width="2" />
                </marker>
            </defs>
            <path d="M10,40 Q 50,0 90,40" fill="transparent" stroke="#blue" stroke-width="2" marker-end="url(#arrowhead)" />
            </svg>
        </div>
        )}

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