import { useState, useEffect, useContext, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faArrowLeft, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast, Slide } from 'react-toastify';
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
  const { userId, name } = useContext(AuthContext); 
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');
  const [swipedMediaIds, setSwipedMediaIds] = useState([]);
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchInitialMedia = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/api/interactions/recommendations/${userId}`);
        const { topPicks } = response.data;
        const initialMedia = topPicks.map(item => ({
          ...item,
          media_type: item.title ? 'movie' : 'tv'
        }));
        setMedia(initialMedia);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching data', error);
        setIsLoading(false);
      }
    };
    fetchInitialMedia();
  }, [userId]);

  const handleSwipe = async (direction) => {
    console.log(`Swiped ${direction}`);
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
        console.log('Interaction recorded');
        setSwipedMediaIds(prev => [...prev, currentMedia.id]);
      } catch (error) {
        console.error('Error recording interaction', error);
      }

      setCurrentIndex((prevIndex) => prevIndex + 1);

      if (currentIndex + 1 >= media.length) {
        fetchRecommendations();
      }
    }
  };

  const handlers = useSwipeable({
    onSwipedLeft: () => !showCalendar && handleSwipe('Left'),
    onSwipedRight: () => !showCalendar && handleSwipe('Right'),
    trackMouse: true,
  });

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/interactions/recommendations/${userId}`);
      const { recommendations } = response.data;
      const recommendedMedia = recommendations.filter(mediaItem => !swipedMediaIds.includes(mediaItem.id)).slice(0, 3).map(item => ({
        ...item,
        media_type: item.title ? 'movie' : 'tv'
      }));
      console.log('Recommendations:', response.data);
      setMedia((prevMedia) => [...prevMedia, ...recommendedMedia]);
      setCurrentIndex(media.length);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching recommendations', error);
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = (media) => {
    setSelectedMedia(media);
    setEventTitle(media.title || media.name);
    setShowCalendar(true);
    toast.info('Sort your calendar. Resume swiping once done.');
  };

  const handleCloseCalendar = () => {
    setShowCalendar(false);
    toast.info('You can now start swiping again.');
  };

  const handleSaveEvent = async (eventTitle, eventDate) => {
    try {
      const newEvent = {
        title: eventTitle,
        start: eventDate,
        end: eventDate,
        media_id: selectedMedia.id,
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

  return (
    <div className="top-picks-page">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
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
            <MediaCard media={media[currentIndex]} handlers={handlers} />
            <button
              className="top-picks-page__calendar-button"
              onClick={() => handleAddToCalendar(media[currentIndex])}
            >
              <FontAwesomeIcon icon={faCalendarPlus} /> <p className="top-picks-page__calendar-copy">Add to Calendar</p>
            </button>
            <button className="top-picks-page__nav-button top-picks-page__nav-button--right" onClick={() => handleSwipe('Right')}>
              <FontAwesomeIcon icon={faArrowRight} />
            </button>
          </div>
        )}
        {!isLoading && currentIndex >= media.length && (
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
            <button className="calendar-close-btn" onClick={handleCloseCalendar}>
              <p className="calendar-close-btn__txt">x</p>
            </button>
            <CalendarModal
              userId={userId}
              eventTitle={eventTitle}
              media_type={selectedMedia?.media_type} 
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