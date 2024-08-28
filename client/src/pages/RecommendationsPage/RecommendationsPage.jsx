import { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faCalendarPlus, faSearch, faPlus, faChevronDown, faChevronUp, faFilm, faTv, faChevronCircleDown, faChevronCircleUp, faTimes, faThumbsUp, faThumbsDown, faShareAlt,
} from '@fortawesome/free-solid-svg-icons';
import LightBlobBg from '../../components/LightBlobBg/LightBlobBg';
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar';
import './RecommendationsPage.scss';
import api from '../../services/api';

const RecommendationsPage = () => {
  const { userId } = useContext(AuthContext);
  const { name } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [page, setPage] = useState(1);
  const [showFullDescription, setShowFullDescription] = useState({});
  const [duration, setDuration] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false); 
  const [hasFetched, setHasFetched] = useState(false); 
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchInitialMedia = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/api/interactions/toppicks/${userId}`);
        const { topPicks } = response.data;
        setMedia(topPicks);
      } catch (error) {
        console.error('Error fetching top picks:', error);
        showAlert('Error fetching top picks. Please try again later.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchInitialMedia();
    }
  }, [userId]);

  const fetchRecommendations = async () => {
    try {
      setIsFetchingMore(true);
      const response = await api.get(`/api/recommendations/${userId}`, {
        params: {
          page,
          limit: 4,
        },
      });

      const newRecommendations = response.data.recommendations;

      // Filter out any recommendations that are already in the media state
      const uniqueRecommendations = newRecommendations.filter(
        (newRec) => !media.some((existingRec) => existingRec.id === newRec.id)
      );

      if (uniqueRecommendations.length > 0) {
        // Append the new unique recommendations to the existing media
        setMedia((prevMedia) => [...prevMedia, ...uniqueRecommendations]);
        setPage((prevPage) => prevPage + 1);
        setHasFetched(true); // Set to true when recommendations are fetched
        setIsExpanded(true); // Automatically expand to show new recommendations
      } else {
        showAlert("That's all for now. There's no more media available.", 'info');
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      showAlert('Error fetching recommendations. Please try again later.', 'error');
    } finally {
      setIsFetchingMore(false); // Ensure loading stops once the fetch is complete
    }
  };

  const handlePlayTrailer = async (media_id, media_type) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/interactions/${userId}/trailer/${media_type}/${media_id}`);
      const trailerData = response.data;

      if (trailerData && trailerData.trailerUrl) {
        setTrailerUrl(trailerData.trailerUrl);
        setIsModalOpen(true);
      } else {
        showAlert('Apologies, the video is not available.', 'info');
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
      showAlert('Apologies, the video is not available.', 'info');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = async (title, mediaType, mediaId) => {
    try {
      if (mediaType === 'movie') {
        const movieDetails = await api.get(`/api/tmdb/movie/${mediaId}`);
        setDuration(movieDetails.data.runtime || 0);
      } else if (mediaType === 'tv') {
        const tvDetails = await api.get(`/api/tmdb/tv/${mediaId}`);
        setDuration(tvDetails.data.episode_run_time[0] || 0);
      }
    } catch (error) {
      console.error('Error fetching duration data:', error);
      showAlert('Failed to fetch media duration.', 'error');
      return;
    }

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
        media_id: selectedMediaType,
        userId,
      };
      await api.post(`/api/calendar/${userId}/events`, newEvent);
      setShowCalendar(false);
    } catch (error) {
      console.error('Error saving event:', error);
      showAlert('Error saving event. Please try again later.', 'error');
    }
  };

  const handleLike = async (media_id, media_type) => {
    try {
      await api.post('/api/interactions', { userId, media_id, interaction: 1, media_type });
      showAlert('You liked this media!', 'success');
    } catch (error) {
      console.error('Error liking media:', error);
      showAlert('Failed to like the media.', 'error');
    }
  };

  const handleDislike = async (media_id, media_type) => {
    try {
      await api.post('/api/interactions', { userId, media_id, interaction: 0, media_type });
      showAlert('You disliked this media!', 'info');
    } catch (error) {
      console.error('Error disliking media:', error);
      showAlert('Failed to dislike the media.', 'error');
    }
  };

  const handleShowMore = (id) => {
    setShowFullDescription((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const toggleRecommendations = () => {
    setIsExpanded(!isExpanded);
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTrailerUrl('');
  };

  return (
    <div className="recommendations-page">
      <LightBlobBg />
      <h1 className="recommendations-page__title">
        {name ? `${name}'s Recommendations` : 'Your Recommendations'}
      </h1>
      <div className="recommendations-page__content">
        {alert && <CustomAlerts message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        {isLoading && media.length === 0 ? (
          <div className="recommendations-page__loading-container">
            <Loader />
          </div>
        ) : (
          <>
            <div className="recommendations-page__grid">
              {media.slice(0, isExpanded ? media.length : 8).map((item) => (
                <div key={`${item.id}-${item.media_type}`} className="recommendations-page__card">
                  <div className="recommendations-page__poster-container">
                    <img
                      src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : 'default-poster-url'}
                      alt={item.title}
                      className="recommendations-page__poster"
                    />
                    <div className="recommendations-page__play-overlay" onClick={() => handlePlayTrailer(item.id, item.media_type)}>
                      <FontAwesomeIcon icon={faPlay} className="recommendations-page__play-icon" />
                    </div>
                  </div>
                  <h2 className="recommendations-page__subtitle">{item.title || item.name || 'Title: N/A'}</h2>
                  <p className="recommendations-page__media-icon">
                    <a href={`https://www.themoviedb.org/${item.media_type}/${item.id}`} target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon
                        icon={item.media_type === 'tv' ? faTv : faFilm}
                        className="recommendations-page__media-icon-link"
                        data-tooltip-id="mediaTypeTooltip"
                        data-tooltip-content={item.media_type === 'tv' ? 'Media Type: TV Show' : 'Media Type: Movie'}
                      />
                    </a>
                    <FontAwesomeIcon
                      icon={faCalendarPlus}
                      onClick={() => handleAddToCalendar(item.title, item.media_type, item.id)}
                      className="recommendations-page__cal-icon"
                      data-tooltip-id="calendarTooltip"
                      data-tooltip-content="Add to Calendar"
                    />
                    <FontAwesomeIcon
                      icon={faSearch}
                      className="recommendations-page__search-icon"
                      data-tooltip-id="searchTooltip"
                      data-tooltip-content="More Info"
                    />
                    <FontAwesomeIcon
                      icon={faThumbsUp}
                      className="recommendations-page__like-icon"
                      data-tooltip-id="likeTooltip"
                      data-tooltip-content="Like"
                      onClick={() => handleLike(item.id, item.media_type)}
                    />
                    <FontAwesomeIcon
                      icon={faThumbsDown}
                      className="recommendations-page__dislike-icon"
                      data-tooltip-id="dislikeTooltip"
                      data-tooltip-content="Dislike"
                      onClick={() => handleDislike(item.id, item.media_type)}
                    />
                    <FontAwesomeIcon
                      icon={faShareAlt}
                      className="recommendations-page__share-icon"
                      data-tooltip-id="shareTooltip"
                      data-tooltip-content="Share"
                      onClick={() => navigator.share({ title: item.title || item.name, url: window.location.href })}
                    />
                  </p>
                  <p className="recommendations-page__text">
                    Genre: {Array.isArray(item.genres) && item.genres.length > 0 ? item.genres.map((genre) => genre.name || genre).join(', ') : 'N/A'}
                  </p>
                  <p className={`recommendations-page__description ${showFullDescription[item.id] ? 'recommendations-page__description--expanded' : ''}`}>
                    Description: {item.overview || 'Description: Unavailable'}
                  </p>
                  <button className="recommendations-page__more-button" onClick={() => handleShowMore(item.id)}>
                    <FontAwesomeIcon icon={showFullDescription[item.id] ? faChevronCircleUp : faChevronCircleDown} className="recommendations-page__load-descript" />
                  </button>
                </div>
              ))}
            </div>
            <div className="recommendations-page__action-buttons">
              <button className="recommendations-page__fetch-more" onClick={fetchRecommendations}>
                <FontAwesomeIcon icon={faPlus} /> Fetch More
              </button>
              {hasFetched && (
                <button className="recommendations-page__toggle" onClick={toggleRecommendations}>
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} /> {isExpanded ? 'Hide Cards' : 'Show Cards'}
                </button>
              )}
            </div>
          </>
        )}
        {isFetchingMore && (
          <div className="recommendations-page__loading-overlay">
            <Loader />
          </div>
        )}
        {isModalOpen && (
          <div className="recommendations-page__modal">
            <div className="recommendations-page__modal-content">
              <button className="recommendations-page__modal-content-close" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              {isLoading ? (
                <Loader />
              ) : (
                <iframe
                  width="560"
                  height="315"
                  src={trailerUrl}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        )}
        {showCalendar && (
          <div className="recommendations-page__calendar-modal">
            <button className="recommendations-page__calendar-close-btn" onClick={handleCloseCalendar}>
              <FontAwesomeIcon icon={faTimes} className="recommendations-page__close-icon" />
            </button>
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
        )}
      </div>
    </div>
  );
};

export default RecommendationsPage;