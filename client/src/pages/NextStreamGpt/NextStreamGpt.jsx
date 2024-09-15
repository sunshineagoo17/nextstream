import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { faChevronLeft, faRobot, faChevronRight, faPlay, faTimes, faSearch, faTv, faFilm, faCalendarPlus, faThumbsUp, faThumbsDown, faShareAlt, faUser, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader'; 
import ReelSVG from "../../assets/images/reel-svg.svg";
import UserRating from '../TopPicksPage/sections/UserRating/UserRating'; 
import './NextStreamGpt.scss';
import DefaultPoster from "../../assets/images/posternoimg-icon.png";

const NextStreamGpt = () => {
  const { userId, isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [duration, setDuration] = useState(0);
  const [eventTitle, setEventTitle] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [showLeftArrowResults, setShowLeftArrowResults] = useState(false);
  const [showRightArrowResults, setShowRightArrowResults] = useState(false);
  const [alert, setAlert] = useState({ message: '', type: '', visible: false });
  const [messages, setMessages] = useState([]);
  const [likedStatus, setLikedStatus] = useState({});
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  const location = useLocation();
  const searchScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  // Handler for the GPT button
  const handleGptSearch = () => {
    navigate(`/nextsearch/${userId}`);
  };

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

  const handleSendMessage = async () => {
    if (searchQuery.trim() && isAuthenticated) {
      setIsLoading(true);
      setMessages((prevMessages) => [...prevMessages, { sender: 'user', text: searchQuery }]);  // Append user's message to chat
  
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
  
        setResults(filteredResults);  // Save the results
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: 'Here are some recommendations!', results: filteredResults },  // Append GPT response to chat
        ]);
      } catch (error) {
        showAlert('Could not fetch search results. Please try again later.', 'error');
      } finally {
        setIsLoading(false);
      }
  
      setSearchQuery('');  // Clear the input field after sending
    }
  };  

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
    const nextViewUrl = mediaType === 'person' 
        ? `${window.location.origin}/spotlight/${userId}/${mediaId}` 
        : `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;

    const shareMessage = mediaType === 'person' 
        ? `Check out this artist - ${mediaTitle}` 
        : `Check out this title - ${mediaTitle}`;

    if (navigator.share) {
      navigator.share({
        title: shareMessage,
        url: nextViewUrl,
      })
      .then(() => showAlert('Successful share!', 'success'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(`${shareMessage}: ${nextViewUrl}`)
      .then(() => showAlert('Link copied to clipboard!', 'success'))
      .catch(() => showAlert('Failed to copy link', 'error'));
    }
  };

    // Define renderMessages function here
    const renderMessages = () => {
        return messages.map((message, index) => (
          <div key={index} className={`nextstream-gpt__chat-bubble nextstream-gpt__chat-bubble--${message.sender}`}>
            <p>{message.text}</p>
            {message.sender === 'bot' && message.results && (
              <button className="nextstream-gpt__gpt-button" onClick={() => navigate(`/nextsearch/${userId}`)}>
                <FontAwesomeIcon icon={faRobot} className="nextstream-gpt__gpt-icon" />
                <span>Display GPT Results</span>
              </button>
            )}
          </div>
        ));
      };

  return (
    <div className="nextstream-gpt">
      {isLoading && (
        <div className="nextstream-gpt__loader-overlay">
          <Loader />
        </div>
      )}
  
      {alert.visible && (
        <div className="nextstream-gpt__alert-wrapper">
          <CustomAlerts
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ ...alert, visible: false })}
          />
        </div>
      )}
  
      <div className="nextstream-gpt__title">
        <h1 className="nextstream-gpt__header-text">
          NextStream GPT:<br /> Your Personal Entertainment Assistant
        </h1>
        <p className="nextstream-gpt__copy">
          <span className="nextstream-gpt__gradient-subtitle">NextStream GPT</span> combines AI-powered search with real-time streaming data, helping you find the perfect movies and shows based on your preferences. Ask questions, get tailored recommendations, and discover trending content all in one place!
        </p>
      </div>

      {/* Ask GPT Button */}
     <div className="nextstream-gpt__gpt-container">
        <button className="nextstream-gpt__gpt-button" onClick={handleGptSearch}>
          <FontAwesomeIcon icon={faSearch} className="nextstream-gpt__gpt-icon" />
          <p className='nextstream-gpt__gpt-txt'>Switch to Classic Search</p>
        </button>
      </div>
  
<div className="nextstream-gpt__chat-block">


  {/* Chat Messages */}
  <div className="nextstream-gpt__chat-container">
    <div className="nextstream-gpt__messages">
      {messages.map((message, index) => (
        <div key={index} className={`nextstream-gpt__message nextstream-gpt__message--${message.sender}`}>
          {message.sender === 'gpt' && (
            <FontAwesomeIcon icon={faRobot} className="nextstream-gpt__gpt-icon-bubble" />
          )}
          <p>{message.text}</p>
          {message.sender === 'gpt' && message.results && (
            <button className="nextstream-gpt__gpt-button" onClick={() => navigate(`/nextsearch/${userId}`)}>
              <FontAwesomeIcon icon={faRobot} className="nextstream-gpt__gpt-icon" />
              <span>Display GPT Results</span>
            </button>
          )}
        </div>
      ))}
    </div>

    {/* Input Container */}
    <div className="nextstream-gpt__input-container">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
        placeholder="Chat with NextStream GPT..."
        className="nextstream-gpt__input"
      />
      <button 
        className="nextstream-gpt__send-button" 
        onClick={handleSendMessage} 
        disabled={!searchQuery.trim()}
      >
        <FontAwesomeIcon icon={faPaperPlane} className="nextstream-gpt__gpt-icon" />
    </button>
    </div>
  </div>
</div>


  
      {results.length > 0 && (
        <div className="nextstream-gpt__results-section">
          <div className="nextstream-gpt__carousel">
            {showLeftArrowResults && <FontAwesomeIcon icon={faChevronLeft} className="nextstream-gpt__nav-arrow left" onClick={() => scrollLeft(searchScrollRef)} />}
            <div className="nextstream-gpt__scroll-container-results" ref={searchScrollRef}>
              {results.map((result) => (
                <div key={result.id} className="nextstream-gpt__card nextstream-gpt__card--results">
                  <h3 className="nextstream-gpt__title--results">{result.title || result.name}</h3>
                  <div className="nextstream-gpt__poster-container-results">
                    <img
                      src={
                        result.media_type === 'person'
                          ? result.profile_path
                            ? `https://image.tmdb.org/t/p/w500${result.profile_path}`
                            : DefaultPoster
                          : result.poster_path
                          ? `https://image.tmdb.org/t/p/w500${result.poster_path}`
                          : DefaultPoster
                      }
                      alt={result.title || result.name}
                      className="nextstream-gpt__poster nextstream-gpt__poster--results"
                    />
                    <div className="nextstream-gpt__rating-container">
                      <UserRating rating={(result.vote_average || 0) * 10} />
                    </div>
  
                    {/* Play overlay only for non-person media types */}
                    {result.media_type !== 'person' && (
                      <div className="nextstream-gpt__play-overlay" onClick={() => handlePlayTrailer(result.id, result.media_type)}>
                        <FontAwesomeIcon icon={faPlay} className="nextstream-gpt__play-icon" />
                      </div>
                    )}
                  </div>
  
                  <div className="nextstream-gpt__icons-row">
                    {result.media_type === 'person' ? (
                      <>
                        <Link to={`/spotlight/${userId}/${result.id}`}>
                          <FontAwesomeIcon
                            icon={faUser}
                            className="nextstream-gpt__media-icon"
                            title="Person Spotlight"
                            data-tooltip-id="personTooltip"
                            data-tooltip-content="View Spotlight"
                          />
                        </Link>
                        <FontAwesomeIcon
                          icon={faShareAlt}
                          className="nextstream-gpt__share-icon"
                          onClick={() => handleShare(result.name, result.id, result.media_type)}
                          title="Share"
                          data-tooltip-id="shareIconTooltip"
                          data-tooltip-content="Share"
                        />
                      </>
                    ) : (
                      <>
                        <Link to={`/nextview/${userId}/${result.media_type}/${result.id}`}>
                          <FontAwesomeIcon
                            icon={result.media_type === 'tv' ? faTv : faFilm}
                            className="nextstream-gpt__media-icon"
                            title={result.media_type === 'tv' ? 'TV Show' : 'Movie'}
                            data-tooltip-id="mediaTooltip"
                            data-tooltip-content="More Info"
                          />
                        </Link>
  
                        <FontAwesomeIcon
                          icon={faCalendarPlus}
                          className="nextstream-gpt__cal-icon"
                          onClick={() => handleAddToCalendar(result.title, result.media_type, result.id)}
                          title="Add to Calendar"
                          data-tooltip-id="calTooltip"
                          data-tooltip-content="Add to Calendar"
                        />
  
                        {likedStatus[result.id] === 1 ? (
                          <FontAwesomeIcon
                            icon={faThumbsUp}
                            className="nextstream-gpt__like-icon active"
                            onClick={() => handleDislike(result.id, result.media_type)}
                            title="Liked"
                            data-tooltip-id="likeTooltip"
                            data-tooltip-content="Like"
                          />
                        ) : likedStatus[result.id] === 0 ? (
                          <FontAwesomeIcon
                            icon={faThumbsDown}
                            className="nextstream-gpt__dislike-icon active"
                            onClick={() => handleLike(result.id, result.media_type)}
                            title="Disliked"
                            data-tooltip-id="dislikeTooltip"
                            data-tooltip-content="Dislike"
                          />
                        ) : (
                          <>
                            <FontAwesomeIcon
                              icon={faThumbsUp}
                              className="nextstream-gpt__like-icon"
                              onClick={() => handleLike(result.id, result.media_type)}
                              title="Like"
                              data-tooltip-id="likeTooltip"
                              data-tooltip-content="Like"
                            />
                            <FontAwesomeIcon
                              icon={faThumbsDown}
                              className="nextstream-gpt__dislike-icon"
                              onClick={() => handleDislike(result.id, result.media_type)}
                              title="Dislike"
                              data-tooltip-id="dislikeTooltip"
                              data-tooltip-content="Dislike"
                            />
                          </>
                        )}
  
                        <FontAwesomeIcon
                          icon={faShareAlt}
                          className="nextstream-gpt__share-icon"
                          onClick={() => handleShare(result.title || result.name, result.id, result.media_type)}
                          title="Share"
                          data-tooltip-id="shareIconTooltip"
                          data-tooltip-content="Share"
                        />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {showRightArrowResults && <FontAwesomeIcon icon={faChevronRight} className="nextstream-gpt__nav-arrow right" onClick={() => scrollRight(searchScrollRef)} />}
          </div>
        </div>
      )}
  
      {isLoading && (
        <div className="nextstream-gpt__loading-container">
          <img src={ReelSVG} alt="Loading..." className="nextstream-gpt__loading-svg" />
          <p className="nextstream-gpt__text--center">Media is currently loading...</p>
        </div>
      )}
  
      {isModalOpen && (
        <div className="nextstream-gpt__modal">
          <div className="nextstream-gpt__modal-content">
            <button className="nextstream-gpt__modal-content-close" onClick={closeModal}>
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
        <div className="nextstream-gpt__calendar-modal">
          <button className="nextstream-gpt__calendar-close-btn" onClick={handleCloseCalendar}>
            <FontAwesomeIcon icon={faTimes} className="nextstream-gpt__cal-close-icon" />
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
      <Tooltip id="personTooltip" place="top" />
      <Tooltip id="trendingTvTooltip" place="top" />
      <Tooltip id="trendingMoviesTooltip" place="top" />
      <Tooltip id="trendingAllTooltip" place="top" />
      <Tooltip id="tvPopularTooltip" place="top" />
      <Tooltip id="tvTopTooltip" place="top" />
      <Tooltip id="tvOnAirTooltip" place="top" />
      <Tooltip id="tvAirsTodayTooltip" place="top" />
      <Tooltip id="movieNowPlayingTooltip" place="top" />
      <Tooltip id="moviePopularTooltip" place="top" />
      <Tooltip id="movieTopRatedTooltip" place="top" />
      <Tooltip id="movieUpcomingReleasesTooltip" place="top" />
      <Tooltip id="searchTooltip" place="top" />
      <Tooltip id="closeTooltip" place="top" />
      <Tooltip id="mediaTooltip" place="top" />
      <Tooltip id="calTooltip" place="top" />
      <Tooltip id="likeTooltip" place="top" />
      <Tooltip id="dislikeTooltip" place="top" />
      <Tooltip id="shareIconTooltip" place="top" />
    </div>
  );
  
};

export default NextStreamGpt;