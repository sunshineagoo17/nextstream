import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlay, faTimes, faSearch, faTv, faFilm, faCalendarPlus, faThumbsUp, faThumbsDown, faShareAlt, faUser } from '@fortawesome/free-solid-svg-icons'; // Added faUser icon
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader'; 
import UserRating from '../TopPicksPage/sections/UserRating/UserRating'; 
import './NextSearch.scss';
import DefaultPoster from "../../assets/images/posternoimg-icon.png";

const NextSearch = () => {
  const { userId, isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [media, setMedia] = useState([]);
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
  const [likedStatus] = useState({});
  const calendarRef = useRef(null);

  const location = useLocation();
  const searchScrollRef = useRef(null);
  const popularScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  const showAlert = (message, type) => {
    setAlert({ message, type });
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
        console.error('Error fetching search results:', error);
        setAlert({ message: 'Could not fetch search results. Please try again later.', type: 'error', visible: true });
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchQuery, isAuthenticated]);

  const fetchPopularMedia = async (type) => {
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
      console.error('Error fetching popular media:', error);
      setAlert({ message: 'Error fetching popular media', type: 'error', visible: true });
    } finally {
      setIsLoading(false);
    }
  };  

  useEffect(() => {
    fetchPopularMedia(mediaType);
  }, [mediaType]);

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
        console.error('Error fetching duration data:', error);
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
      console.error('Error saving event:', error);
      showAlert('Error saving event. Please try again later.', 'error');
    }
  };

  const handleLike = async (media_id, media_type) => {
    try {
      await api.post('/api/interactions', { userId, media_id, interaction: 1, media_type });
      showAlert('You liked this media!', 'success');
      const updatedMedia = media.map(item => item.id === media_id ? { ...item, interaction: 1 } : item);
      const nonInteractedMedia = updatedMedia.filter(item => item.interaction === null || item.interaction === undefined);
      
      setMedia(nonInteractedMedia);
      localStorage.setItem('media', JSON.stringify(nonInteractedMedia)); 
    } catch (error) {
      console.error('Error liking media:', error);
      showAlert('Failed to like the media.', 'error');
    }
  };  

  const handleDislike = async (media_id, media_type) => {
    try {
      await api.post('/api/interactions', { userId, media_id, interaction: 0, media_type });
      showAlert('You disliked this media!', 'info');
      
      const updatedMedia = media.map(item => item.id === media_id ? { ...item, interaction: 0 } : item);
      const nonInteractedMedia = updatedMedia.filter(item => item.interaction === null || item.interaction === undefined);
      
      setMedia(nonInteractedMedia);
      localStorage.setItem('media', JSON.stringify(nonInteractedMedia)); 
    } catch (error) {
      console.error('Error disliking media:', error);
      showAlert('Failed to dislike the media.', 'error');
    }
  };  


  const handleShare = (title, mediaId, mediaType) => {
    const mediaTitle = title || 'Title Unavailable'; 
    console.log('Sharing media:', { mediaTitle, mediaId, mediaType }); 

    const nextViewUrl = `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;
    console.log('Constructed URL:', nextViewUrl); 

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

  return (
    <div className="next-search">
      {isLoading && (
        <div className="next-search__loader-overlay">
          <Loader />
        </div>
      )}

    {/* Custom Alert */}
        {alert.visible && (
        <div className="next-search__alert-wrapper">
            <CustomAlerts
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ ...alert, visible: false })}
            />
        </div>
        )}

      {/* Search Bar */}
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

      {/* Search Results Section */}
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
                  
                  {/* Action Icons */}
                  <div className="next-search__icons-row">
                    {/* Logic to Display the Correct Icon */}
                    <FontAwesomeIcon
                      icon={result.media_type === 'person' ? faUser : result.media_type === 'tv' ? faTv : faFilm}
                      className="next-search__media-icon"
                      title={result.media_type === 'person' ? 'Person' : result.media_type === 'tv' ? 'TV Show' : 'Movie'}
                    />
                    <FontAwesomeIcon
                      icon={faCalendarPlus}
                      className="next-search__cal-icon"
                      onClick={() => handleAddToCalendar(result.title, result.media_type, result.id)}
                      title="Add to Calendar"
                    />
                    <FontAwesomeIcon
                      icon={faThumbsUp}
                      className="next-search__like-icon"
                      onClick={() => handleLike(result.id, result.media_type)}
                      style={{ display: likedStatus[result.id] === 'disliked' ? 'none' : 'inline' }} 
                      title="Like"
                    />
                    <FontAwesomeIcon
                      icon={faThumbsDown}
                      className="next-search__dislike-icon"
                      onClick={() => handleDislike(result.id, result.media_type)}
                      style={{ display: likedStatus[result.id] === 'liked' ? 'none' : 'inline' }}
                      title="Dislike"
                    />
                    <FontAwesomeIcon
                      icon={faShareAlt}
                      className="next-search__share-icon"
                      onClick={() => handleShare(result.title || result.name, result.id, result.media_type)}
                      title="Share"
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

      {/* Popular Media Section */}
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

                  {/* Action Icons */}
                  <div className="next-search__icons-row">
                    {/* Logic to Display the Correct Icon for Popular Section */}
                    <FontAwesomeIcon
                      icon={media.media_type === 'person' ? faUser : media.media_type === 'tv' ? faTv : faFilm}
                      className="next-search__media-icon"
                      title={media.media_type === 'person' ? 'Person' : media.media_type === 'tv' ? 'TV Show' : 'Movie'}
                    />
                    <FontAwesomeIcon
                      icon={faCalendarPlus}
                      className="next-search__cal-icon"
                      onClick={() => handleAddToCalendar(media.title, media.media_type, media.id)}
                      title="Add to Calendar"
                    />
                    <FontAwesomeIcon
                      icon={faThumbsUp}
                      className="next-search__like-icon"
                      onClick={() => handleLike(media.id, media.media_type)}
                      style={{ display: likedStatus[media.id] === 'disliked' ? 'none' : 'inline' }} 
                      title="Like"
                    />
                    <FontAwesomeIcon
                      icon={faThumbsDown}
                      className="next-search__dislike-icon"
                      onClick={() => handleDislike(media.id, media.media_type)}
                      style={{ display: likedStatus[media.id] === 'liked' ? 'none' : 'inline' }}
                      title="Dislike"
                    />
                    <FontAwesomeIcon
                      icon={faShareAlt}
                      className="next-search__share-icon"
                      onClick={() => handleShare(media.title || media.name, media.id, media.media_type)}
                      title="Share"
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

      {/* Trailer Modal */}
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
    </div>
  );
};

export default NextSearch;