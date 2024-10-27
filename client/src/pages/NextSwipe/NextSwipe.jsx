import { useState, useCallback, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { useSwipeable } from 'react-swipeable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faClose, faArrowLeft, faArrowRight, faHandPointer } from '@fortawesome/free-solid-svg-icons';
import MediaCard from './sections/MediaCard/MediaCard';
import Calendar from '../CalendarPage/sections/Calendar/Calendar';
import AnimatedBg from '../../components/Backgrounds/AnimatedBg/AnimatedBg';
import LogoLoader from '../../components/Loaders/LogoLoader/LogoLoader';
import NoMoreMedia from "../../assets/images/no-more-media.svg";
import ShowMedia from "../../assets/images/show-media.svg";
import api from '../../services/api';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './NextSwipe.scss';

const NextSwipe = () => {
  const { userId, name, isAuthenticated } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');
  const [swipedMediaIds, setSwipedMediaIds] = useState([]);
  const [noMoreMedia, setNoMoreMedia] = useState(false);
  const [duration, setDuration] = useState(0);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const [showSwipeGuide, setShowSwipeGuide] = useState(false); 
  const [isFirstSession, setIsFirstSession] = useState(false); 
  const calendarRef = useRef(null);
  const calendarModalRef = useRef(null);

  const saveStateToStorage = (state, key) => {
    sessionStorage.setItem(key, JSON.stringify(state));
  };
  
  const loadStateFromStorage = (key, defaultValue) => {
    try {
      const savedState = sessionStorage.getItem(key);
      return savedState ? JSON.parse(savedState) : defaultValue;
    } catch (error) {
      console.error(`Error parsing session storage for key: ${key}`, error);
      sessionStorage.removeItem(key); 
      return defaultValue;
    }
  };
  
  const uniqueMedia = (mediaArray) => {
    const seen = new Set();
    return mediaArray.filter(item => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate && (item.media_type === 'movie' || item.media_type === 'tv');
    });
  };

  useEffect(() => {
    const sessionVersion = '1.0';
    const storedVersion = sessionStorage.getItem('sessionVersion');
  
    if (storedVersion !== sessionVersion) {
      sessionStorage.clear(); 
      sessionStorage.setItem('sessionVersion', sessionVersion);
    }
  
    const storedMedia = loadStateFromStorage(`media_${userId}`, []);
    const storedCurrentIndex = loadStateFromStorage(`currentIndex_${userId}`, 0);
    const storedSwipedMediaIds = loadStateFromStorage(`swipedMediaIds_${userId}`, []);
  
    if (!storedMedia.length || !Array.isArray(storedSwipedMediaIds)) {
      sessionStorage.removeItem(`media_${userId}`);
      sessionStorage.removeItem(`currentIndex_${userId}`);
      sessionStorage.removeItem(`swipedMediaIds_${userId}`);
      setMedia([]);
      setCurrentIndex(0);
      setSwipedMediaIds([]);
    } else {
      setMedia(storedMedia);
      setCurrentIndex(storedCurrentIndex);
      setSwipedMediaIds(storedSwipedMediaIds);
    }
  
    const hasSeenSwipeGuide = sessionStorage.getItem(`hasSeenSwipeGuide_${userId}`);
    if (!hasSeenSwipeGuide && storedCurrentIndex === 0) {
      setIsFirstSession(true);
      setShowSwipeGuide(true);
      sessionStorage.setItem(`hasSeenSwipeGuide_${userId}`, 'true');
      setTimeout(() => setShowSwipeGuide(false), 7000);
    }
  }, [userId]);  
  
  useEffect(() => {
    const fetchInitialMedia = async () => {
      try {
        setIsLoading(true);

        const response = await api.get(`/api/interactions/toppicks/${userId}`);

        const { topPicks } = response.data;

        const initialMedia = uniqueMedia(topPicks);

        setMedia(initialMedia);
        saveStateToStorage(initialMedia, `media_${userId}`);
      } catch (error) {
        if (error.response && error.response.status === 401) {
          showAlert('You are not authorized. Please log in again.', 'error');
        } else {
          showAlert('Error fetching data. Please try again later.', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchInitialMedia();
    }

    return () => {
      setMedia([]);
      setCurrentIndex(0);
      setSwipedMediaIds([]);
      setNoMoreMedia(false);
      setIsLoading(false);
    };
  }, [userId]);

  useEffect(() => {
    saveStateToStorage(media, `media_${userId}`);
  }, [media, userId]);

  useEffect(() => {
    saveStateToStorage(currentIndex, `currentIndex_${userId}`);
  }, [currentIndex, userId]);

  useEffect(() => {
    saveStateToStorage(swipedMediaIds, `swipedMediaIds_${userId}`);
  }, [swipedMediaIds, userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMedia([]);
      setCurrentIndex(0);
      setSwipedMediaIds([]);
      setNoMoreMedia(false);
      sessionStorage.removeItem(`media_${userId}`);
      sessionStorage.removeItem(`currentIndex_${userId}`);
      sessionStorage.removeItem(`swipedMediaIds_${userId}`);
      sessionStorage.removeItem(`hasSeenSwipeGuide_${userId}`);
    }
  }, [isAuthenticated, userId]);  

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setNoMoreMedia(false);

      const response = await api.get(`/api/interactions/recommendations/${userId}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      const { recommendations } = response.data;

      const recommendedMedia = await Promise.all(
        uniqueMedia(recommendations.filter(mediaItem => !swipedMediaIds.includes(mediaItem.id))).map(async (mediaItem) => {
          let duration = 0;
          try {
            if (mediaItem.media_type === 'movie') {
              const movieDetails = await api.get(`/api/tmdb/movie/${mediaItem.id}`);
              duration = movieDetails.data.runtime || 0;
            } else if (mediaItem.media_type === 'tv') {
              const tvDetails = await api.get(`/api/tmdb/tv/${mediaItem.id}`);
              duration = tvDetails.data.episode_run_time[0] || 0;
            }
          } catch (error) {
            showAlert('Failed to fetch media duration.', 'error');
          }
          return { ...mediaItem, duration };
        })
      );

      if (recommendedMedia.length > 0) {
        setMedia((prevMedia) => {
          const updatedMedia = uniqueMedia([...prevMedia, ...recommendedMedia]);
          saveStateToStorage(updatedMedia, `media_${userId}`);
          return updatedMedia;
        });
        setCurrentIndex(media.length);
        saveStateToStorage(media.length, `currentIndex_${userId}`);
      } else {
        setNoMoreMedia(true);
      }
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showAlert('You are not authorized. Please log in again.', 'error');
      } else {
        showAlert('Error fetching recommendations. Please try again later.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwipe = async (direction) => {
    if (currentIndex < media.length) {
      const interaction = direction === 'Right' ? 1 : 0;
      const currentMedia = media[currentIndex];

      try {
        await api.post('/api/interactions', {
          userId: userId,
          media_id: currentMedia.id,
          interaction: interaction,
          media_type: currentMedia.media_type,
        });

        setSwipedMediaIds(prev => {
          const updatedSwipedMediaIds = [...prev, currentMedia.id];
          saveStateToStorage(updatedSwipedMediaIds, `swipedMediaIds_${userId}`);
          return updatedSwipedMediaIds;
        });

        setCurrentIndex(prevIndex => {
          const updatedIndex = prevIndex + 1;
          saveStateToStorage(updatedIndex, `currentIndex_${userId}`);
          if (updatedIndex >= media.length) {
            setNoMoreMedia(true);
          }
          return updatedIndex;
        });

      } catch (error) {
        if (error.response && error.response.status === 401) {
          showAlert('You are not authorized. Please log in again.', 'error');
        } else {
          showAlert('Error recording interaction. Please try again later.', 'error');
        }
      }
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => !showCalendar && handleSwipe('Left'),
    onSwipedRight: () => !showCalendar && handleSwipe('Right'),
    trackMouse: true,
  });

  const handleAddToCalendar = async (title, mediaType, mediaId) => {
    let duration = 0;
    try {
      if (mediaType === 'movie') {
        const movieDetails = await api.get(`/api/tmdb/movie/${mediaId}`);
        duration = movieDetails.data.runtime || 0;
        if (duration === 0) {
          showAlert("Duration's not available for this media.", 'info');
        }
      } else if (mediaType === 'tv') {
        const tvDetails = await api.get(`/api/tmdb/tv/${mediaId}`);
        duration = tvDetails.data.episode_run_time[0] || 0;
        if (duration > 0) {
          showAlert('Duration is based on the very first episode.', 'info');
        }
      }
      if (duration === 0) {
        showAlert("Duration's not available for this media.", 'info');
      }
    } catch (error) {
      showAlert('Failed to fetch media duration.', 'error');
      return;
    }
  
    setEventTitle(title);
    setSelectedMediaType(mediaType);
    setDuration(duration);
    setShowCalendar(true);
  };  

  const handleCloseCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);  

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarModalRef.current && !calendarModalRef.current.contains(event.target)) {
        handleCloseCalendar();
      }
    };
  
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, handleCloseCalendar]);  

  const handleSaveEvent = async (eventTitle, eventDate) => {
    try {
      const newEvent = {
        title: eventTitle,
        start: eventDate,
        end: eventDate,
        media_id: media[currentIndex].id,
        userId,
      };
      await api.post(`/api/calendar/${userId}/events`, newEvent);
      setShowCalendar(false);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        showAlert('You are not authorized. Please log in again.', 'error');
      } else {
        showAlert('Error saving event. Please try again later.', 'error');
      }
    }
  };

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  const closeAlert = () => {
    setAlert({ show: false, message: '', type: '' });
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {alert.show && (
        <CustomAlerts
          message={alert.message}
          type={alert.type}
          onClose={closeAlert}
        />
      )}
      <div className="nextswipe-page">
        <div className="nextswipe-page__container">
          <div className="nextswipe-page__title-container">
            <h1 className="nextswipe-page__title">{name}'s Recommendations</h1>
            <p className="nextswipe-page__intro">
              Use <span className="nextswipe-page__gradient-subtitle">NextSwipe</span> to discover new movies and shows. Swipe right to like and left to dislike each media card, tailoring your perfect viewing schedule. For desktop users, you can click and drag left or right, or simply click on the arrows. Add your favourites to your calendar today!
            </p>
          </div>
          {isLoading && (
            <div className="nextswipe-page__graphic-container">
              <img src={ShowMedia} alt="Woman waiting for media" className="nextswipe-page__graphic" />
            </div>
          )}
          {isLoading && <LogoLoader />}
          {!isLoading && media.length > 0 && currentIndex < media.length && (
            <div className="nextswipe-page__media-card">
              {isFirstSession && showSwipeGuide && (
                <div className="nextswipe-page__swipe-guide">
                  <FontAwesomeIcon icon={faHandPointer} className="nextswipe-page__swipe-icon" />
                </div>
              )}
              <button className="nextswipe-page__nav-button nextswipe-page__nav-button--left" onClick={() => handleSwipe('Left')}>
                <FontAwesomeIcon icon={faArrowLeft} />
              </button>
              <MediaCard media={media[currentIndex]} handlers={handlers} onAddToCalendar={handleAddToCalendar} />
              <button
                className="nextswipe-page__calendar-button"
                onClick={() => handleAddToCalendar(media[currentIndex].title || media[currentIndex].name, media[currentIndex].media_type, media[currentIndex].id)}
              >
                <FontAwesomeIcon icon={faCalendarPlus} /> <p className="nextswipe-page__calendar-copy">Add to Calendar</p>
              </button>
              <button className="nextswipe-page__nav-button nextswipe-page__nav-button--right" onClick={() => handleSwipe('Right')}>
                <FontAwesomeIcon icon={faArrowRight} />
              </button>
            </div>
          )}
          {!isLoading && noMoreMedia && (
            <div className="nextswipe-page__no-more-media-container">
              <img src={NoMoreMedia} alt="No more media" className="nextswipe-page__no-more-media-image" />
              <div className="nextswipe-page__no-more-media">
                <p className="nextswipe-page__swipes">All swipes have been recorded!</p>
                <button
                  className="nextswipe-page__recommendations-button"
                  onClick={fetchRecommendations}
                >
                  Get Recommendations
                </button>
              </div>
            </div>
          )}
          {showCalendar && (
            <div className="nextswipe-page__calendar-modal">
              <button className="nextswipe-page__calendar-close-btn" onClick={handleCloseCalendar}>
                <FontAwesomeIcon icon={faClose} className='auth-search-results__close-icon' />
              </button>
              <div ref={calendarModalRef}>
                <Calendar
                  userId={userId}
                  eventTitle={eventTitle}
                  mediaType={selectedMediaType}
                  duration={duration}
                  handleSave={handleSaveEvent}
                  onClose={handleCloseCalendar}
                  ref={calendarRef}
                />
              </div>
            </div>
          )}
          <div className="nextswipe-page__background">
            <AnimatedBg />
          </div>
        </div>
      </div>
    </>
  );
};

export default NextSwipe;