import React, { useState, useEffect, useContext } from 'react';
import { useSwipeable } from 'react-swipeable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import MediaCard from './sections/MediaCard/MediaCard';
import CalendarModal from '../CalendarPage/sections/Calendar';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import api from '../../services/api';
import './TopPicksPage.scss';

const TopPicksPage = () => {
  const { userId } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right'),
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
          media_type: currentMedia.media_type
        });
        console.log('Interaction recorded');
      } catch (error) {
        console.error('Error recording interaction', error);
      }

      setCurrentIndex(prevIndex => prevIndex + 1);
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
    setShowModal(true);
  };

  const handleSaveEvent = async (eventTitle, eventDate) => {
    try {
      const newEvent = {
        title: eventTitle,
        start: eventDate,
        end: eventDate,
        media_id: selectedMedia.id,
        userId
      };
      await api.post(`/api/calendar/${userId}/events`, newEvent);
      setShowModal(false);
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  return (
    <div className="top-picks-page" {...handlers}>
      <div className="top-picks-page__title-container">
        <h1 className="top-picks-page__title">Top Picks</h1>
        <p className="top-picks-page__intro">Swipe to discover new movies and shows. Add them to your calendar for a perfect viewing schedule.</p>
      </div>
      {isLoading && <Loader />}
      {!isLoading && media.length > 0 && currentIndex < media.length && (
        <div className="top-picks-page__media-card">
          <MediaCard media={media[currentIndex]} />
          <button className="top-picks-page__calendar-button" onClick={() => handleAddToCalendar(media[currentIndex])}>
            <FontAwesomeIcon icon={faCalendarPlus} /> Add to Calendar
          </button>
        </div>
      )}
      {!isLoading && currentIndex >= media.length && (
        <div className="top-picks-page__no-more-media">
          <p>No more media</p>
          <button className="top-picks-page__recommendations-button" onClick={fetchRecommendations}>
            Get Recommendations
          </button>
        </div>
      )}
      {showModal && (
        <CalendarModal
          show={showModal}
          handleClose={() => setShowModal(false)}
          handleSave={handleSaveEvent}
          initialTitle={selectedMedia.title || selectedMedia.name}
        />
      )}
      <div className="top-picks-page__background">
        <AnimatedBg />
      </div>
    </div>
  );
};

export default TopPicksPage;