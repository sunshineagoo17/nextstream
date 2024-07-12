import React, { useState, useEffect, useContext, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';
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
  const { userId } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [eventTitle, setEventTitle] = useState('');
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchPopularMedia = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/tmdb/popular');
        setMedia(response.data.results);
      } catch (error) {
        console.error('Error fetching data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPopularMedia();
  }, []);

  const handlers = useSwipeable({
    onSwipedLeft: () => showCalendar || handleSwipe('Left'),
    onSwipedRight: () => showCalendar || handleSwipe('Right'),
    trackMouse: true,
  });

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
      } catch (error) {
        console.error('Error recording interaction', error);
      }

      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/api/interactions/recommendations/${userId}`);
      console.log('Recommendations:', response.data);
      setMedia(response.data);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Error fetching recommendations', error);
    } finally {
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
    <div className="top-picks-page" {...handlers}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
      <div className="top-picks-page__title-container">
        <h1 className="top-picks-page__title">Top Picks</h1>
        <p className="top-picks-page__intro">
          SwipeStream your way through new movies and shows. Swipe right to like
          and left to dislike, helping us enhance your perfect viewing schedule.
          Add your favourites to your calendar today.
        </p>
      </div>
      {isLoading && <Loader />}
      {!isLoading && media.length > 0 && currentIndex < media.length && (
        <div className="top-picks-page__media-card">
          <MediaCard media={media[currentIndex]} />
          <button
            className="top-picks-page__calendar-button"
            onClick={() => handleAddToCalendar(media[currentIndex])}
          >
            <FontAwesomeIcon icon={faCalendarPlus} /> Add to Calendar
          </button>
        </div>
      )}
      {!isLoading && currentIndex >= media.length && (
        <div className="top-picks-page__no-more-media-container">
          <img src={NoMoreMedia} alt="No more media" className="top-picks-page__no-more-media-image" />
          <div className="top-picks-page__no-more-media">
            <p>No more media</p>
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
  );
};

export default TopPicksPage;