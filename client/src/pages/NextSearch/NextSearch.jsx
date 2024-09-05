import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { faChevronLeft, faChevronRight, faPlay, faTimes, faSearch, faTv, faFilm, faCalendarPlus, faThumbsUp, faThumbsDown, faShareAlt, faUser } from '@fortawesome/free-solid-svg-icons'; // Added faUser icon
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader'; 
import UserRating from '../TopPicksPage/sections/UserRating/UserRating'; 
import './NextSearch.scss';
import DefaultPoster from "../../assets/images/posternoimg-icon.png";

const NextSearch = () => {
  const { userId, name, isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popularMedia, setPopularMedia] = useState([]);
  const [mediaType, setMediaType] = useState('streaming');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [eventTitle, setEventTitle] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [showLeftArrowResults, setShowLeftArrowResults] = useState(false);
  const [showRightArrowResults, setShowRightArrowResults] = useState(false);
  const [showLeftArrowPopular, setShowLeftArrowPopular] = useState(false);
  const [showRightArrowPopular, setShowRightArrowPopular] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '', visible: false });
  const [likedStatus, setLikedStatus] = useState({});
  const calendarRef = useRef(null);

  const location = useLocation();
  const searchScrollRef = useRef(null);
  const popularScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  const showAlert = (message, type) => {
    setAlert({ message, type, visible: true });  
  };

  const checkForOverflow = (scrollRef, setShowLeft, setShowRight) => {
    if (!scrollRef || !scrollRef.current) {
      return;
    }

    const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
    setShowRight(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth);
    setShowLeft(scrollLeft > 0);
  };

  useEffect(() => {
    const searchScrollEl = searchScrollRef.current;

    const handleScrollResults = () => {
      checkForOverflow(searchScrollRef, setShowLeftArrowResults, setShowRightArrowResults);
    };

    if (searchScrollEl) {
      checkForOverflow(searchScrollRef, setShowLeftArrowResults, setShowRightArrowResults);
      searchScrollEl.addEventListener('scroll', handleScrollResults);
    }

    return () => {
      if (searchScrollEl) {
        searchScrollEl.removeEventListener('scroll', handleScrollResults);
      }
    };
  }, [results]);

  useEffect(() => {
    const popularScrollEl = popularScrollRef.current;

    const handleScrollPopular = () => {
      checkForOverflow(popularScrollRef, setShowLeftArrowPopular, setShowRightArrowPopular);
    };

    if (popularScrollEl) {
      checkForOverflow(popularScrollRef, setShowLeftArrowPopular, setShowRightArrowPopular);
      popularScrollEl.addEventListener('scroll', handleScrollPopular);
    }

    return () => {
      if (popularScrollEl) {
        popularScrollEl.removeEventListener('scroll', handleScrollPopular);
      }
    };
  }, [popularMedia]);

  const handlePlayTrailer = async (mediaId, mediaType) => {
    try {
      const response = await api.get(`/api/tmdb/${mediaType}/${mediaId}/videos`);
      const { trailerUrl } = response.data;
      if (trailerUrl) {
        setTrailerUrl(trailerUrl);
        setIsModalOpen(true);
      } else {
        setAlert({ message: `No video available for this ${mediaType}`, type: 'info', visible: true });
      }
    } catch (error) {
      setAlert({ message: 'Apologies, there is no available video.', type: 'info', visible: true });
    }
  };

  // Fetch the interaction status for each media and merge it with the media data
  const fetchInteractions = useCallback(async () => {
    try {
      const response = await api.get(`/api/interactions/${userId}`);
      const interactionsData = response.data;

      const interactionsMap = {};
      interactionsData.forEach(interaction => {
        interactionsMap[interaction.media_id] = interaction.interaction;
      });

      setLikedStatus(interactionsMap); 
    } catch (error) {
      showAlert('Error fetching interactions', 'error');
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchInteractions(); 
    }
  }, [isAuthenticated, fetchInteractions]);

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim() && isAuthenticated) {
      setIsLoading(true);
      try {
        const response = await api.get('/api/tmdb/search', {
          params: { query: searchQuery },
        });

        const filteredResults = await Promise.all(
          response.data.results
            .filter(result => result.media_type === 'movie' || result.media_type === 'tv' || result.media_type === 'person')
            .map(async result => {
              if (result.media_type === 'person') {
                const knownFor = result.known_for.map(item => ({
                  id: item.id,
                  title: item.title || item.name,
                  poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DefaultPoster,
                  media_type: item.media_type,
                }));
                return { ...result, knownFor };
              } else {
                const castResponse = await api.get(`/api/tmdb/${result.media_type}/${result.id}/credits`);
                return { ...result, cast: castResponse.data.cast.slice(0, 5) };
              }
            })
        );

        setResults(filteredResults);
      } catch (error) {
        showAlert('Could not fetch search results. Please try again later.', 'error');
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchQuery, isAuthenticated]);

  const fetchPopularMedia = useCallback(async (type) => {
    setIsLoading(true);
    try {
      let endpoint;
      let mediaType = 'movie'; 
  
      switch (type) {
        case 'on_tv':
          endpoint = 'tv/on_the_air';
          mediaType = 'tv';
          break;
        case 'for_rent':
          endpoint = 'movie/now_playing';
          mediaType = 'movie';
          break;
        case 'in_theatres':
          endpoint = 'movie/upcoming';
          mediaType = 'movie';
          break;
        case 'streaming':
        default:
          endpoint = 'movie/popular';
          mediaType = 'movie';
          break;
      }
  
      const response = await api.get(`/api/tmdb/${endpoint}`);
      const updatedPopularMedia = response.data.results.map(media => ({
        ...media,
        media_type: mediaType, 
        poster_path: media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : DefaultPoster,
        vote_average: media.vote_average,
      }));
  
      setPopularMedia(updatedPopularMedia);
    } catch (error) {
      showAlert('Error fetching popular media', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPopularMedia(mediaType);
  }, [mediaType, fetchPopularMedia]);

  useEffect(() => {
    if (query && isAuthenticated) {
      setSearchQuery(query);
      handleSearch();
    }
  }, [query, handleSearch, isAuthenticated]);

  const scrollLeft = (scrollRef) => {
    scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (scrollRef) => {
    scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTrailerUrl('');
  };

  const handleAddToCalendar = async (title, mediaType, mediaId) => {
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
      showAlert('Failed to fetch media duration.', 'error');
    }
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
      showAlert('Error saving event. Please try again later.', 'error');
    }
  };

  const handleInteraction = async (media_id, media_type, interactionValue) => {
    try {
      await api.post('/api/interactions', { userId, media_id, interaction: interactionValue, media_type });
      
      setLikedStatus(prevStatus => ({ ...prevStatus, [media_id]: interactionValue }));
      
      const message = interactionValue === 1 ? "You've successfully liked this media!" : "You've successfully disliked this media!";
      showAlert(message, 'success');
    } catch (error) {
      showAlert('Failed to update the interaction.', 'error');
    }
  };
  
  const handleLike = (media_id, media_type) => {
    handleInteraction(media_id, media_type, 1);
  };
  
  const handleDislike = (media_id, media_type) => {
    handleInteraction(media_id, media_type, 0);
  };

  const handleShare = (title, mediaId, mediaType) => {
    const mediaTitle = title || 'Title Unavailable'; 
    const nextViewUrl = `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;

    if (navigator.share) {
      navigator.share({
        title: `Check out this title - ${mediaTitle}`,
        url: nextViewUrl,
      })
      .then(() => showAlert('Successful share!', 'success'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(`Check out this title - ${mediaTitle}: ${nextViewUrl}`)
      .then(() => showAlert('Link copied to clipboard!', 'success'))
      .catch(() => showAlert('Failed to copy link', 'error'));
    }
  };

  return (
    <div className="next-search">
      {isLoading && (
        <div className="next-search__loader-overlay">
          <Loader />
        </div>
      )}

      {alert.visible && (
        <div className="next-search__alert-wrapper">
          <CustomAlerts
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ ...alert, visible: false })}
          />
        </div>
      )}

    <div className="next-search__title">
        <h1 className='next-search__header-text'>
        {name ? `${name}'s NextSearch` : 'Your NextSearch'}
        </h1>
        <p className="next-search__copy">
            With <span className="next-search__gradient-subtitle">NextSearch</span>, explore popular movies and TV shows or search for specific titles, actors, and genres. Get extended search results tailored to your input and see what's trending now.
        </p>
    </div>

      <div className="next-search__input-container">
        <FontAwesomeIcon 
          icon={faSearch}
          className="next-search__search-icon"
          onClick={handleSearch} 
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for movies, shows, or actors..."
          className="next-search__input"
          disabled={!isAuthenticated}
        />
        <FontAwesomeIcon
          icon={faTimes}
          className="next-search__close-icon"
          onClick={clearSearch} 
        />
      </div>

      {results.length > 0 && (
        <div className="next-search__results-section">
          <div className="next-search__carousel">
            {showLeftArrowResults && <FontAwesomeIcon icon={faChevronLeft} className="next-search__nav-arrow left" onClick={() => scrollLeft(searchScrollRef)} />}
            <div className="next-search__scroll-container-results" ref={searchScrollRef}>
              {results.map((result) => (
                <div key={result.id} className="next-search__card next-search__card--results">
                  <h3 className="next-search__title--results">{result.title || result.name}</h3>
                  <div className="next-search__poster-container-results">
                    <img
                      src={result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : DefaultPoster}
                      alt={result.title || result.name}
                      className="next-search__poster next-search__poster--results"
                    />
                    <div className="next-search__rating-container">
                      <UserRating rating={(result.vote_average || 0) * 10} />
                    </div>
                    <div className="next-search__play-overlay" onClick={() => handlePlayTrailer(result.id, result.media_type)}>
                      <FontAwesomeIcon icon={faPlay} className="next-search__play-icon" />
                    </div>
                  </div>

                  <div className="next-search__icons-row">
                    <Link 
                      to={`/nextview/${userId}/${result.media_type}/${result.id}`} 
                    >
                        <FontAwesomeIcon
                            icon={result.media_type === 'person' ? faUser : result.media_type === 'tv' ? faTv : faFilm}
                            className="next-search__media-icon"
                            title={result.media_type === 'person' ? 'Person' : result.media_type === 'tv' ? 'TV Show' : 'Movie'}
                            data-tooltip-id="mediaTooltip"
                            data-tooltip-content="More Info"
                        />
                    </Link>
                    <FontAwesomeIcon
                      icon={faCalendarPlus}
                      className="next-search__cal-icon"
                      onClick={() => handleAddToCalendar(result.title, result.media_type, result.id)}
                      title="Add to Calendar"
                      data-tooltip-id="calTooltip"
                      data-tooltip-content="Add to Calendar"
                    />
                    {likedStatus[result.id] === 1 ? (
                      <FontAwesomeIcon
                        icon={faThumbsUp}
                        className="next-search__like-icon active"
                        onClick={() => handleDislike(result.id, result.media_type)}
                        title="Liked"
                        data-tooltip-id="likeTooltip"
                        data-tooltip-content="Like"
                      />
                    ) : likedStatus[result.id] === 0 ? (
                      <FontAwesomeIcon
                        icon={faThumbsDown}
                        className="next-search__dislike-icon active"
                        onClick={() => handleLike(result.id, result.media_type)}
                        title="Disliked"
                        data-tooltip-id="dislikeTooltip"
                        data-tooltip-content="Dislike"
                      />
                    ) : (
                      <>
                        <FontAwesomeIcon
                            icon={faThumbsUp}
                            className="next-search__like-icon"
                            onClick={() => handleLike(result.id, result.media_type)}
                            title="Like"
                            data-tooltip-id="likeTooltip"
                            data-tooltip-content="Like"
                        />
                        <FontAwesomeIcon
                            icon={faThumbsDown}
                            className="next-search__dislike-icon"
                            onClick={() => handleDislike(result.id, result.media_type)}
                            title="Dislike"
                            data-tooltip-id="dislikeTooltip"
                            data-tooltip-content="Dislike"
                        />
                      </>
                    )}
                    <FontAwesomeIcon
                        icon={faShareAlt}
                        className="next-search__share-icon"
                        onClick={() => handleShare(result.title || result.name, result.id, result.media_type)}
                        title="Share"
                        data-tooltip-id="shareIconTooltip"
                        data-tooltip-content="Share"
                    />
                  </div>

                  {result.media_type === 'movie' || result.media_type === 'tv' ? (
                    result.cast && result.cast.length > 0 ? (
                      <div className="next-search__cast">
                        <h4>Cast:</h4>
                        <ul>
                          {result.cast.map((actor) => (
                            <li key={actor.id}>{actor.name}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="next-search__cast">
                        <h4>Cast:</h4>
                        <p>Info Unavailable</p>
                      </div>
                    )
                  ) : result.media_type === 'person' && result.knownFor ? (
                    <div className="next-search__known-for">
                      <h4>Known For:</h4>
                      <ul>
                        {result.knownFor.map((media) => (
                          <li key={media.id}>
                            {media.title || media.name} ({media.media_type})
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
            {showRightArrowResults && <FontAwesomeIcon icon={faChevronRight} className="next-search__nav-arrow right" onClick={() => scrollRight(searchScrollRef)} />}
          </div>
        </div>
      )}

      <div className="next-search__popular-section">
        <div className="next-search__tabs">
          <div className="next-search__tabs-container">
            <button className={`next-search__tab ${mediaType === 'streaming' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('streaming')}>
              Streaming
            </button>
            <button className={`next-search__tab ${mediaType === 'on_tv' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('on_tv')}>
              On TV
            </button>
            <button className={`next-search__tab ${mediaType === 'for_rent' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('for_rent')}>
              For Rent
            </button>
            <button className={`next-search__tab ${mediaType === 'in_theatres' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('in_theatres')}>
              In Theatres
            </button>
          </div>
        </div>
        <div className="next-search__carousel">
          {showLeftArrowPopular && <FontAwesomeIcon icon={faChevronLeft} className="next-search__nav-arrow left" onClick={() => scrollLeft(popularScrollRef)} />}
          <div className="next-search__scroll-container-popular" ref={popularScrollRef}>
            {popularMedia.length > 0 ? (
              popularMedia.map((media) => (
                <div key={media.id} className="next-search__card next-search__card--popular">
                  <h3 className="next-search__title--popular">{media.title || media.name}</h3>
                  <div className="next-search__poster-container-popular">
                    <img
                      src={media.poster_path || DefaultPoster}
                      alt={media.title || media.name}
                      className="next-search__poster next-search__poster--popular"
                    />
                    <div className="next-search__rating-container">
                      <UserRating rating={(media.vote_average || 0) * 10} />
                    </div>
                    <div className="next-search__play-overlay" onClick={() => handlePlayTrailer(media.id, media.media_type || 'movie')}>
                      <FontAwesomeIcon icon={faPlay} className="next-search__play-icon" />
                    </div>
                </div>

                    <div className="next-search__icons-row">
                        <Link 
                        to={`/nextview/${userId}/${media.media_type}/${media.id}`} 
                        >
                            <FontAwesomeIcon
                                icon={media.media_type === 'person' ? faUser : media.media_type === 'tv' ? faTv : faFilm}
                                className="next-search__media-icon"
                                title={media.media_type === 'person' ? 'Person' : media.media_type === 'tv' ? 'TV Show' : 'Movie'}
                                data-tooltip-id="mediaTooltip"
                                data-tooltip-content="More Info"
                            />
                        </Link>
                        <FontAwesomeIcon
                            icon={faCalendarPlus}
                            className="next-search__cal-icon"
                            onClick={() => handleAddToCalendar(media.title, media.media_type, media.id)}
                            title="Add to Calendar"
                            data-tooltip-id="calTooltip"
                            data-tooltip-content="Add to Calendar"
                        />
                        {likedStatus[media.id] === 1 ? (
                            <FontAwesomeIcon
                                icon={faThumbsUp}
                                className="next-search__like-icon active"
                                onClick={() => handleDislike(media.id, media.media_type)}
                                title="Liked"
                                data-tooltip-id="likeTooltip"
                                data-tooltip-content="Like"
                            />
                        ) : likedStatus[media.id] === 0 ? (
                            <FontAwesomeIcon
                                icon={faThumbsDown}
                                className="next-search__dislike-icon active"
                                onClick={() => handleLike(media.id, media.media_type)}
                                title="Disliked"
                                data-tooltip-id="dislikeTooltip"
                                data-tooltip-content="Dislike"
                            />
                      ) : (
                        <>
                          <FontAwesomeIcon
                            icon={faThumbsUp}
                            className="next-search__like-icon"
                            onClick={() => handleLike(media.id, media.media_type)}
                            title="Like"
                            data-tooltip-id="likeTooltip"
                            data-tooltip-content="Like"
                          />
                          <FontAwesomeIcon
                            icon={faThumbsDown}
                            className="next-search__dislike-icon"
                            onClick={() => handleDislike(media.id, media.media_type)}
                            title="Dislike"
                            data-tooltip-id="dislikeTooltip"
                            data-tooltip-content="Dislike"
                          />
                        </>
                      )}
                      <FontAwesomeIcon
                        icon={faShareAlt}
                        className="next-search__share-icon"
                        onClick={() => handleShare(media.title || media.name, media.id, media.media_type)}
                        title="Share"
                        data-tooltip-id="shareIconTooltip"
                        data-tooltip-content="Share"
                      />
                  </div>
                </div>
              ))
            ) : (
              <p className="next-search__no-results">No popular media found.</p>
            )}
          </div>
          {showRightArrowPopular && <FontAwesomeIcon icon={faChevronRight} className="next-search__nav-arrow right" onClick={() => scrollRight(popularScrollRef)} />}
        </div>
      </div>

      {isModalOpen && (
        <div className="next-search__modal">
          <div className="next-search__modal-content">
            <button className="next-search__modal-content-close" onClick={closeModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <iframe
              width="560"
              height="315"
              src={trailerUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}

      {showCalendar && (
        <div className="next-search__calendar-modal">
          <button className="next-search__calendar-close-btn" onClick={handleCloseCalendar}>
            <FontAwesomeIcon icon={faTimes} className="next-search__cal-close-icon" />
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
        {/* Tooltip components */}
        <Tooltip id="mediaTooltip" place="top" />
        <Tooltip id="calTooltip" place="top" />
        <Tooltip id="likeTooltip" place="top" />
        <Tooltip id="dislikeTooltip" place="top" />
        <Tooltip id="shareIconTooltip" place="top" />
    </div>
  );
};

export default NextSearch;