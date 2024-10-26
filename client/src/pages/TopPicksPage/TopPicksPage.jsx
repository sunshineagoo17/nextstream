import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Cookies from 'js-cookie'; 
import {
  faPlay, faCalendarPlus, faPlus, faChevronDown, faChevronUp, faFilm, faTv, faChevronCircleDown, faChevronCircleUp, faTimes, faThumbsUp, faThumbsDown, faShareAlt, faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import LightBlobBg from '../../components/Backgrounds/LightBlobBg/LightBlobBg';
import DefaultPoster from "../../assets/images/posternoimg-icon.png";
import Loader from '../../components/Loaders/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar/Calendar';
import UserRating from './sections/UserRating/UserRating';
import ProgressSVG from '../../assets/images/progress-img.svg';
import './TopPicksPage.scss';
import api from '../../services/api';

const TopPicksPage = () => {
  const { userId, isGuest } = useContext(AuthContext);
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
  const [likedStatus, setLikedStatus] = useState({});
  const calendarRef = useRef(null);
  const calendarModalRef = useRef(null);
  const trailerModalRef = useRef(null);

  useEffect(() => {
    const fetchInitialMedia = async () => {
        try {
            setIsLoading(true);
            let initialMedia = [];
            const idToUse = isGuest ? 'guest' : userId;

            // Fetch all interacted media (liked, disliked, or swiped) from the database
            const interactedMediaResponse = await api.get(`/api/interactions/${idToUse}`);
            const interactedMediaIds = interactedMediaResponse.data.map(media => media.media_id);

            // Fetch Top Picks media
            const topPicksResponse = await api.get(`/api/interactions/toppicks/${idToUse}`);
            let topPicks = topPicksResponse.data.topPicks;

            // Filter out interacted media from top picks
            const filteredTopPicks = topPicks.filter(media => !interactedMediaIds.includes(media.id));

            if (!isGuest) {
                // Fetch recommendations only for authenticated users
                const recommendationsResponse = await api.get(`/api/recommendations/${idToUse}`, {
                    params: { limit: 4 },
                });
                let recommendations = recommendationsResponse.data.recommendations;

                // Combine and filter out duplicates and interacted media from recommendations
                initialMedia = [
                    ...filteredTopPicks,
                    ...recommendations.filter(rec => !filteredTopPicks.some(tp => tp.id === rec.id) && !interactedMediaIds.includes(rec.id)),
                ];
            } else {
                initialMedia = filteredTopPicks;
            }

            // Update state with the filtered media
            setMedia(initialMedia);
            setIsExpanded(initialMedia.length > 8);
        } catch (error) {
            console.error('Error fetching initial media:', error);
            showAlert('Error fetching media. Please try again later.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (userId || isGuest) {
        fetchInitialMedia();
    }
  }, [userId, isGuest]);

  const handleShare = (title, mediaId, mediaType) => {
    const mediaTitle = title || 'Title Unavailable'; 
    console.log('Sharing media:', { mediaTitle, mediaId, mediaType }); 

    const nextViewUrl = `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;
    console.log('Constructed URL:', nextViewUrl); 

    if (isGuest) {
      showAlert('Guests cannot share media. Please log in to access more features.', 'info');
      return;
    }

    if (navigator.share) {
      navigator.share({
        title: `Check out this title - ${mediaTitle}`,
        url: nextViewUrl,
      })
      .then(() => console.log('Successful share!'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(`Check out this title - ${mediaTitle}: ${nextViewUrl}`)
      .then(() => showAlert('Link copied to clipboard!', 'success'))
      .catch((error) => showAlert('Failed to copy link', 'error'));
    }
  };

  const fetchRecommendations = async () => {
    if (isGuest) {
      showAlert('Guests cannot fetch new recommendations. Please log in to access more features.', 'info');
      return;
    }

    try {
      setIsFetchingMore(true);
      const response = await api.get(`/api/recommendations/${userId}`, {
        params: { page, limit: 4 },
      });
  
      const newRecommendations = response.data.recommendations;
      const uniqueRecommendations = newRecommendations.filter(
        (newRec) => !media.some((existingRec) => existingRec.id === newRec.id)
      );
  
      if (uniqueRecommendations.length > 0) {
        const updatedMedia = [...media, ...uniqueRecommendations];
        setMedia(updatedMedia);

        Cookies.set('media', JSON.stringify(updatedMedia), { expires: 7 }); 

        setPage((prevPage) => prevPage + 1);
        setHasFetched(true);
        setIsExpanded(true);
      } else {
        showAlert("That's all for now. Try again later.", 'info');
      }
    } catch (error) {
      console.error('Error fetching more recommendations:', error);
      showAlert('Error fetching recommendations. Please try again later.', 'error');
    } finally {
      setIsFetchingMore(false);
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
    if (isGuest) {
      showAlert('Guests cannot add to calendar.', 'info');
      return;
    }

    try {
        let mediaTitle = title;

        if (mediaType === 'movie') {
            const movieDetails = await api.get(`/api/tmdb/movie/${mediaId}`);
            mediaTitle = movieDetails.data.title || title;
            setDuration(movieDetails.data.runtime || 0);
        } else if (mediaType === 'tv') {
            const tvDetails = await api.get(`/api/tmdb/tv/${mediaId}`);
            mediaTitle = tvDetails.data.name || title;
            setDuration(tvDetails.data.episode_run_time[0] || 0);
        }

        setEventTitle(mediaTitle);
        setSelectedMediaType(mediaType);
        setShowCalendar(true);
    } catch (error) {
        console.error('Error fetching duration data:', error);
        showAlert('Failed to fetch media duration.', 'error');
    }
  };

  const handleCloseCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);  

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTrailerUrl('');
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarModalRef.current && !calendarModalRef.current.contains(event.target)) {
        handleCloseCalendar();
      }
      if (trailerModalRef.current && !trailerModalRef.current.contains(event.target)) {
        closeModal();
      }
    };
  
    if (showCalendar || isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, isModalOpen, handleCloseCalendar, closeModal]);
  
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
    if (isGuest) {
      showAlert('Guests cannot like media. Please log in to access more features.', 'info');
      return;
    }
  
    try {
      await api.post('/api/interactions', { media_id, interaction: 1, media_type });
      showAlert('You liked this media!', 'success');
  
      setLikedStatus((prevState) => ({
        ...prevState,
        [media_id]: 1, 
      }));
    } catch (error) {
      console.error('Error liking media:', error);
      showAlert('Failed to like the media.', 'error');
    }
  };
  
  const handleDislike = async (media_id, media_type) => {
    if (isGuest) {
      showAlert('Guests cannot dislike media. Please log in to access more features.', 'info');
      return;
    }
  
    try {
      await api.post('/api/interactions', { media_id, interaction: 0, media_type });
      showAlert('You disliked this media!', 'success');
  
      setLikedStatus((prevState) => ({
        ...prevState,
        [media_id]: 0,
      }));
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
  
  const handleClick = (e) => {
    if (isGuest) {
      e.preventDefault();
      showAlert('Guests cannot access this feature. Please log in for full access.', 'info');
    }
  };

  return (
    <div className="top-picks-page">
      <div className='top-picks-page__blob-bg'>
        <LightBlobBg />
      </div>
      <div className="top-picks-page__header-container">
        <h1 className="top-picks-page__title">
            {name ? `${name}'s Top Picks` : 'Your Top Picks'}
        </h1>
        <h2 className="top-picks-page__copy">
          Explore personalized movie and show picks. Like or dislike media, watch trailers, add events to your calendar, and share your favourites with friends!
        </h2>
      </div>
      <div className="top-picks-page__content">
        {alert && <CustomAlerts message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        {isLoading && media.length === 0 ? (
          <div className="top-picks-page__loading-container">
            <img src={ProgressSVG} alt="Loading..." className="top-picks-page__loading-svg" />
            <p className="top-picks-page__text--center">Media is currently loading...</p>
            <Loader />
          </div>
        ) : (
          <>
            <div className="top-picks-page__grid">
              {media.slice(0, isExpanded ? media.length : 8).map((item) => (
                <div key={`${item.id}-${item.media_type}`} className="top-picks-page__card">
                  <div className="top-picks-page__poster-container">
                    <img
                      src={item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DefaultPoster}
                      alt={item.title}
                      className="top-picks-page__poster"
                    />
                    <button className="top-picks-page__play-overlay" onClick={() => handlePlayTrailer(item.id, item.media_type)}>
                      <FontAwesomeIcon icon={faPlay} className="top-picks-page__play-icon" />
                    </button>
                  </div>
                  <h2 className="top-picks-page__subtitle">{item.title || item.name || 'Title: N/A'}</h2>
                  <UserRating rating={(item.vote_average || 0) * 10} className="top-picks-page__rating-icon" />
                  <p className="top-picks-page__media-icon">
                  <Link 
                      to={`/nextview/${userId}/${item.media_type}/${item.id}`} 
                      onClick={handleClick}
                      aria-disabled={isGuest ? "true" : "false"}
                    >
                      <FontAwesomeIcon
                        icon={item.media_type === 'tv' ? faTv : faFilm}
                        className="top-picks-page__media-icon-link"
                        data-tooltip-id="mediaTooltip"
                        data-tooltip-content="More Info"
                      />
                    </Link>
                    <Link 
                      to={`/nextwatch/${userId}/${item.media_type}/${item.id}`} 
                      onClick={handleClick}
                      aria-disabled={isGuest ? "true" : "false"}
                    >
                      <FontAwesomeIcon
                        icon={faLightbulb}
                        className="top-picks-page__lightbulb-icon"
                        data-tooltip-id="lightbulbTooltip"
                        data-tooltip-content="Discover More"
                      />
                    </Link>
                    <button>
                      <FontAwesomeIcon
                        icon={faCalendarPlus}
                        onClick={() => handleAddToCalendar(item.title, item.media_type, item.id)}
                        className="top-picks-page__cal-icon"
                        data-tooltip-id="calTooltip"
                        data-tooltip-content="Add to Calendar"
                      />
                    </button>
                    {/* Like button */}
                    <button style={{ display: likedStatus[item.id] !== 0 ? 'inline' : 'none' }}>
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        className={`top-picks-page__like-icon ${likedStatus[item.id] === 1 ? 'active' : ''}`}
                        data-tooltip-id="likeTooltip"
                        data-tooltip-content="Like"
                        onClick={() => handleLike(item.id, item.media_type)}
                      />
                    </button>

                    {/* Dislike button */}
                    <button style={{ display: likedStatus[item.id] !== 1 ? 'inline' : 'none' }}>
                      <FontAwesomeIcon
                        icon={faThumbsDown}
                        className={`top-picks-page__dislike-icon ${likedStatus[item.id] === 0 ? 'active' : ''}`}
                        data-tooltip-id="dislikeTooltip"
                        data-tooltip-content="Dislike"
                        onClick={() => handleDislike(item.id, item.media_type)}
                      />
                    </button>

                    {/* Share button */}
                    <button>
                      <FontAwesomeIcon
                        icon={faShareAlt}
                        className="top-picks-page__share-icon"
                        data-tooltip-id="shareIconTooltip"
                        data-tooltip-content="Share"
                        onClick={() => handleShare(item.title || item.name, item.id, item.media_type)}
                      />
                    </button>

                  </p>
                  <p className="top-picks-page__text">
                    Genre: {Array.isArray(item.genres) && item.genres.length > 0 ? item.genres.map((genre) => genre.name || genre).join(', ') : 'N/A'}
                  </p>
                  <p className={`top-picks-page__description ${showFullDescription[item.id] ? 'top-picks-page__description--expanded' : ''}`}>
                    Description: {item.overview || 'Unavailable'}
                  </p>
                  <button className="top-picks-page__more-button" onClick={() => handleShowMore(item.id)}>
                    <FontAwesomeIcon icon={showFullDescription[item.id] ? faChevronCircleUp : faChevronCircleDown} className="top-picks-page__load-descript" />
                  </button>
                </div>
              ))}
            </div>
            <div className="top-picks-page__action-buttons">
              <button className="top-picks-page__fetch-more" onClick={fetchRecommendations}>
                <FontAwesomeIcon icon={faPlus} /> Fetch More
              </button>
              {hasFetched && (
                <button className="top-picks-page__toggle" onClick={toggleRecommendations}>
                  <FontAwesomeIcon icon={isExpanded ? faChevronUp : faChevronDown} /> {isExpanded ? 'Hide Cards' : 'Show Cards'}
                </button>
              )}
            </div>
          </>
        )}
        {isFetchingMore && (
          <div className="top-picks-page__loading-overlay">
            <Loader />
          </div>
        )}
        {isModalOpen && (
          <div className="top-picks-page__modal">
            <div className="top-picks-page__modal-content" ref={trailerModalRef}>
              <button className="top-picks-page__modal-content-close" onClick={closeModal}>
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
          <div className="top-picks-page__calendar-modal">
            <button className="top-picks-page__calendar-close-btn" onClick={handleCloseCalendar}>
              <FontAwesomeIcon icon={faTimes} className="top-picks-page__close-icon" />
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
        {/* Tooltip components */}
        <Tooltip id="lightbulbTooltip" place="top" />
        <Tooltip id="mediaTooltip" place="top" />
        <Tooltip id="calTooltip" place="top" />
        <Tooltip id="likeTooltip" place="top" />
        <Tooltip id="dislikeTooltip" place="top" />
        <Tooltip id="shareIconTooltip" place="top" />
      </div>
    </div>
  );
};

export default TopPicksPage;