import { useState, useEffect, useContext, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import MediaCard from './sections/MediaCard/MediaCard';
import CalendarModal from '../CalendarPage/sections/Calendar';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import NoMoreMedia from "../../assets/images/no-more-media.svg";
import api from '../../services/api';
import 'react-toastify/dist/ReactToastify.css';
import './TopPicksPage.scss';

const TopPicksPage = () => {
  const { userId, name, isAuthenticated } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');
  const [swipedMediaIds, setSwipedMediaIds] = useState([]);
  const [noMoreMedia, setNoMoreMedia] = useState(false);
  const calendarRef = useRef(null);

  const saveStateToLocalStorage = (state, key) => {
    localStorage.setItem(key, JSON.stringify(state));
  };

  const loadStateFromLocalStorage = (key, defaultValue) => {
    const savedState = localStorage.getItem(key);
    return savedState ? JSON.parse(savedState) : defaultValue;
  };

  const uniqueMedia = (mediaArray) => {
    const seen = new Set();
    return mediaArray.filter(item => {
      const duplicate = seen.has(item.id);
      seen.add(item.id);
      return !duplicate;
    });
  };

  useEffect(() => {
    const storedMedia = loadStateFromLocalStorage(`media_${userId}`, []);
    const storedCurrentIndex = loadStateFromLocalStorage(`currentIndex_${userId}`, 0);
    const storedSwipedMediaIds = loadStateFromLocalStorage(`swipedMediaIds_${userId}`, []);
    setMedia(storedMedia);
    setCurrentIndex(storedCurrentIndex);
    setSwipedMediaIds(storedSwipedMediaIds);
  }, [userId]);

  useEffect(() => {
    const fetchInitialMedia = async () => {
      try {
        setIsLoading(true);

        const response = await api.get(`/api/interactions/recommendations/${userId}`);
        console.log('Initial API Response:', response.data);

        const { topPicks } = response.data;

        const initialMedia = uniqueMedia(topPicks.map(item => ({
          ...item,
          media_type: item.title ? 'movie' : 'tv'
        })));

        console.log('Processed Initial Media:', initialMedia);

        setMedia(initialMedia);
        saveStateToLocalStorage(initialMedia, `media_${userId}`);
      } catch (error) {
        console.error('Error fetching data', error);
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
    saveStateToLocalStorage(media, `media_${userId}`);
  }, [media, userId]);

  useEffect(() => {
    saveStateToLocalStorage(currentIndex, `currentIndex_${userId}`);
  }, [currentIndex, userId]);

  useEffect(() => {
    saveStateToLocalStorage(swipedMediaIds, `swipedMediaIds_${userId}`);
  }, [swipedMediaIds, userId]);

  useEffect(() => {
    if (!isAuthenticated) {
      setMedia([]);
      setCurrentIndex(0);
      setSwipedMediaIds([]);
      setNoMoreMedia(false);
      localStorage.removeItem(`media_${userId}`);
      localStorage.removeItem(`currentIndex_${userId}`);
      localStorage.removeItem(`swipedMediaIds_${userId}`);
    }
  }, [isAuthenticated, userId]);

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      setNoMoreMedia(false);

      const response = await api.get(`/api/interactions/recommendations/${userId}`);
      console.log('API Response:', response.data);

      const { recommendations } = response.data;
      console.log('Raw Recommendations:', recommendations);

      const recommendedMedia = uniqueMedia(recommendations.filter(mediaItem => !swipedMediaIds.includes(mediaItem.id)).map(item => ({
        ...item,
        media_type: item.title ? 'movie' : 'tv'
      })));

      console.log('Filtered Recommendations:', recommendedMedia);

      if (recommendedMedia.length > 0) {
        setMedia((prevMedia) => {
          const updatedMedia = uniqueMedia([...prevMedia, ...recommendedMedia]);
          saveStateToLocalStorage(updatedMedia, `media_${userId}`);
          return updatedMedia;
        });
        setCurrentIndex(media.length);
        saveStateToLocalStorage(media.length, `currentIndex_${userId}`);
      } else {
        setNoMoreMedia(true);
      }
    } catch (error) {
      console.error('Error fetching recommendations', error);
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
          saveStateToLocalStorage(updatedSwipedMediaIds, `swipedMediaIds_${userId}`);
          return updatedSwipedMediaIds;
        });

        setCurrentIndex(prevIndex => {
          const updatedIndex = prevIndex + 1;
          saveStateToLocalStorage(updatedIndex, `currentIndex_${userId}`);
          if (updatedIndex >= media.length) {
            setNoMoreMedia(true);
          }
          return updatedIndex;
        });

      } catch (error) {
        console.error('Error recording interaction', error);
      }
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => !showCalendar && handleSwipe('Left'),
    onSwipedRight: () => !showCalendar && handleSwipe('Right'),
    trackMouse: true,
  });

  const handleAddToCalendar = (title, mediaType) => {
    setEventTitle(title);
    setSelectedMediaType(mediaType);
    setShowCalendar(true);
  };

  const handleCloseCalendar = () => {
    setShowCalendar(false);
  };

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
      toast.success('Event added successfully!');
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error('Error saving event.');
    }
  };

  useEffect(() => {
    if (media[currentIndex] && media[currentIndex].seen_before && !swipedMediaIds.includes(media[currentIndex].id)) {
      toast.info('You have already viewed this media. Please like or dislike it to avoid seeing it again.');
    }
  }, [currentIndex, media, swipedMediaIds]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="top-picks-page">
      <div className="top-picks-page__container">
        <div className="top-picks-page__title-container">
          <h1 className="top-picks-page__title">{name}'s Top Picks</h1>
          <p className="top-picks-page__intro">
            Use NextSwipe to discover new movies and shows. Swipe right to like and left to dislike each media card, tailoring your perfect viewing schedule. For desktop users, you can click and drag left or right, or simply click on the arrows. Add your favourites to your calendar today!
          </p>
        </div>
        {isLoading && <Loader />}
        {!isLoading && media.length > 0 && currentIndex < media.length && (
          <div className="top-picks-page__media-card">
            <button className="top-picks-page__nav-button top-picks-page__nav-button--left" onClick={() => handleSwipe('Left')}>
              <FontAwesomeIcon icon={faArrowLeft} />
            </button>
            <MediaCard media={media[currentIndex]} handlers={handlers} onAddToCalendar={handleAddToCalendar} />
            <button
              className="top-picks-page__calendar-button"
              onClick={() => handleAddToCalendar(media[currentIndex].title || media[currentIndex].name, media[currentIndex].media_type)}
            >
              <FontAwesomeIcon icon={faCalendarPlus} /> <p className="top-picks-page__calendar-copy">Add to Calendar</p>
            </button>
            <button className="top-picks-page__nav-button top-picks-page__nav-button--right" onClick={() => handleSwipe('Right')}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        )}
        {!isLoading && noMoreMedia && (
          <div className="top-picks-page__no-more-media-container">
            <img src={NoMoreMedia} alt="No more media" className="top-picks-page__no-more-media-image" />
            <div className="top-picks-page__no-more-media">
              <p>All swipes have been recorded!</p>
              <button
                className="top-picks-page__recommendations-button"
                onClick={fetchRecommendations}
              >
                Get Recommendations
              </button>
            </div>
          </div>
        )}
        {showCalendar && (
          <div className="calendar-modal">
            <button className="top-picks-page__calendar-close-btn" onClick={handleCloseCalendar}>
              <p className="calendar-close-btn__txt">x</p>
            </button>
            <CalendarModal
              userId={userId}
              eventTitle={eventTitle}
              mediaType={selectedMediaType}
              onClose={handleCloseCalendar}
              handleSave={handleSaveEvent}
              ref={calendarRef}
            />
          </div>
        )}
        <div className="top-picks-page__background">
          <AnimatedBg />
        </div>
      </div>
    </div>
  );
};

export default TopPicksPage;