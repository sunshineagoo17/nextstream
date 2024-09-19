import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { faChevronLeft, faBroom, faRobot, faChevronRight, faPlay, faTimes, faSearch, faComment, faTv, faFilm, faCalendarPlus, faThumbsUp, faThumbsDown, faShareAlt, faUser, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import ChatbotSvg from "../../assets/images/chat-bot.svg";
import Calendar from '../CalendarPage/sections/Calendar';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import ReelSVG from '../../assets/images/reel-svg.svg';
import UserRating from '../TopPicksPage/sections/UserRating/UserRating';
import './NextStreamBot.scss';
import DefaultPoster from '../../assets/images/posternoimg-icon.png';

const NextStreamBot = () => {
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
  const [isTyping, setIsTyping] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();


  const location = useLocation();
  const searchScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  const showAlert = (message, type) => {
    setAlert({ message, type, visible: true });
  };

  const handleClearChat = () => {
    setMessages([]); 
    setResults([]); 
    setSearchQuery('');
    setIsTyping(false); 
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  

  const checkForOverflow = (scrollRef, setShowLeft, setShowRight) => {
    if (!scrollRef || !scrollRef.current) {
      return;
    }

    const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
    setShowRight(
      scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth
    );
    setShowLeft(scrollLeft > 0);
  };

  useEffect(() => {
    const searchScrollEl = searchScrollRef.current;

    const handleScrollResults = () => {
      checkForOverflow(
        searchScrollRef,
        setShowLeftArrowResults,
        setShowRightArrowResults
      );
    };

    if (searchScrollEl) {
      checkForOverflow(
        searchScrollRef,
        setShowLeftArrowResults,
        setShowRightArrowResults
      );
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
        setAlert({
          message: `No video available for this ${mediaType}`,
          type: 'info',
          visible: true,
        });
      }
    } catch (error) {
      setAlert({
        message: 'Apologies, there is no available video.',
        type: 'info',
        visible: true,
      });
    }
  };  

  const fetchInteractions = useCallback(async () => {
    try {
      const response = await api.get(`/api/interactions/${userId}`);
      const interactionsData = response.data;

      const interactionsMap = {};
      interactionsData.forEach((interaction) => {
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
  
        // Ensure we have a default media_type to avoid issues
        const filteredResults = await Promise.all(
          response.data.results
            .filter(result => 
              result.media_type === 'movie' || 
              result.media_type === 'tv' || 
              result.media_type === 'person'
            )
            .map(async result => {
              console.log("Vote Average for", result.title || result.name, "is:", result.vote_average);  
              
              if (result.media_type === 'person') {
                const knownFor = result.known_for.map(item => ({
                  id: item.id,
                  title: item.title || item.name,
                  poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DefaultPoster,
                  media_type: item.media_type,
                }));
                return { ...result, knownFor };
              } else {
                // For non-person media types (movie/tv)
                const castResponse = await api.get(`/api/tmdb/${result.media_type}/${result.id}/credits`);
                return {
                  ...result,
                  cast: castResponse.data.cast.slice(0, 5),
                  title: result.title || result.name,
                  poster_path: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : DefaultPoster,
                  media_type: result.media_type,
                  vote_average: result.vote_average // Add the vote_average here
                };
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
  

// Simulate typing effect for the chatbot message
const typeMessage = async (message, setMessages, setIsBotTyping) => {
  let displayedText = "";
  const typingSpeed = 50; // Adjust typing speed in milliseconds

  for (let i = 0; i < message.length; i++) {
    // Create a scoped version of displayedText for each iteration
    const currentText = displayedText + message[i];
    
    await new Promise((resolve) => setTimeout(resolve, typingSpeed));

    // Update displayedText after the delay
    displayedText = currentText;

    // Update messages state safely
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages];
      const lastMessage = updatedMessages[updatedMessages.length - 1];

      // Ensure we are only modifying the bot's message
      if (lastMessage && lastMessage.sender === 'bot') {
        lastMessage.text = currentText; // Use the current iteration's text
      }
      return updatedMessages;
    });
  }
  setIsBotTyping(false);
};

const handleSendMessage = async () => {
  if (searchQuery.trim()) {
    setIsTyping(true);
    setIsBotTyping(true);

    // Add user's message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: 'user', text: searchQuery },
    ]);

    try {
      const response = await api.post('/api/chatbot', {
        userInput: searchQuery,
        userId,
      });

      const chatbotMessage = response.data.message;
      const recommendedMedia = response.data.media || [];

      // Add a placeholder for the bot's message before typing
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: '' },
      ]);

      // Simulate typing effect for the chatbot message
      await typeMessage(chatbotMessage, setMessages, setIsBotTyping);

      if (recommendedMedia.length > 0) {
        // Extract media results outside the map loop to avoid unsafe references
        const mediaResults = recommendedMedia.map((item) => {
          const id = item.id;
          const title = item.title || item.name;
          const poster_path = item.poster_path;
          const media_type = item.media_type; 
          return { id, title, poster_path, media_type };
        });
        
        setResults(mediaResults);
        setIsLoading(false);
      } else if (!chatbotMessage || chatbotMessage.trim() === '') {
        setResults([]);
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: "Sorry, I came up with no answers. Let's try again." },
        ]);
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'bot', text: 'There was an error fetching the results. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setIsBotTyping(false);
      setSearchQuery('');
    }
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
      await api.post('/api/interactions', {
        userId,
        media_id,
        interaction: interactionValue,
        media_type,
      });

      setLikedStatus((prevStatus) => ({
        ...prevStatus,
        [media_id]: interactionValue,
      }));

      const message =
        interactionValue === 1
          ? "You've successfully liked this media!"
          : "You've successfully disliked this media!";
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
    const nextViewUrl =
      mediaType === 'person'
        ? `${window.location.origin}/spotlight/${userId}/${mediaId}`
        : `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;

    const shareMessage =
      mediaType === 'person'
        ? `Check out this artist - ${mediaTitle}`
        : `Check out this title - ${mediaTitle}`;

    if (navigator.share) {
      navigator
        .share({
          title: shareMessage,
          url: nextViewUrl,
        })
        .then(() => showAlert('Successful share!', 'success'))
        .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard
        .writeText(`${shareMessage}: ${nextViewUrl}`)
        .then(() => showAlert('Link copied to clipboard!', 'success'))
        .catch(() => showAlert('Failed to copy link', 'error'));
    }
  };

  return (
    <div className='nextstream-bot'>
      {isLoading && (
        <div className='nextstream-bot__loader-overlay'>
          <Loader />
        </div>
      )}
  
      {alert.visible && (
        <div className='nextstream-bot__alert-wrapper'>
          <CustomAlerts message={alert.message} type={alert.type} onClose={() => setAlert({ ...alert, visible: false })} />
        </div>
      )}
  
      <div className='nextstream-bot__title'>
        <h1 className='nextstream-bot__header-text'>
          Mizu:
          <br /> Your Personal Entertainment Assistant
        </h1>
        <p className='nextstream-bot__copy'>
          <span className='nextstream-bot__gradient-subtitle'>
            Mizu
          </span>{' '}
          combines AI-powered search with real-time streaming data, helping you
          find the perfect movies and shows based on your preferences. Ask
          questions, get tailored recommendations, and discover trending content
          all in one place!
        </p>
      </div>
  
      <button className='nextstream-bot__gpt-button' onClick={() => navigate(`/nextsearch/${userId}`)}>
        <FontAwesomeIcon icon={faSearch} className='nextstream-bot__gpt-icon' /><span>Classic Search</span>
      </button>
  
      <div className='nextstream-bot__chat-block'>
        <div className='nextstream-bot__chat-container'>
          <div className='nextstream-bot__messages'>
            {messages.length === 0 && (
              <div className="nextstream-bot__empty-chat">
                <img src={ChatbotSvg} alt="Chatbot" className="nextstream-bot__chatbot-svg" />
                <p className='nextstream-bot__empty-message'>
                  Say hello to Mizu (a.k.a. NextStream's cool bot) to discover your next favourite stream.
                </p>
              </div>
            )}
  
            {messages.map((message, index) => (
              <div key={index} className={`nextstream-bot__message nextstream-bot__message--${message.sender}`}>
                {message.sender === 'bot' && (
                  <div className='nextstream-bot__bot-message'>
                    <p>{message.text}</p>
                    <FontAwesomeIcon icon={faRobot} className='nextstream-bot__gpt-icon-inline' />
                  </div>
                )}
  
                {message.sender === 'user' && (
                  <div className='nextstream-bot__user-message'>
                    <p>{message.text}</p>
                    <FontAwesomeIcon icon={faUser} className='nextstream-bot__user-icon-inline' />
                  </div>
                )}
              </div>
            ))}
          </div>
  
          <div className='nextstream-bot__input-wrapper'>
            <FontAwesomeIcon icon={faComment} className="nextstream-bot__speech-icon" />
            <input
              type='text'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsTyping(!!e.target.value.trim());
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder='Chat with Mizu...'
              className='nextstream-bot__input'
            />
            {isTyping && !isBotTyping && (
              <div className="nextstream-bot__typing-indicator">
                <span className="nextstream-bot__typing-indicator-bubble"></span>
                <span className="nextstream-bot__typing-indicator-bubble"></span>
                <span className="nextstream-bot__typing-indicator-bubble"></span>
              </div>
            )}
            <button
              className='nextstream-bot__send-button'
              onClick={handleSendMessage}
              disabled={!searchQuery.trim()}
            >
              <FontAwesomeIcon icon={faPaperPlane} className='nextstream-bot__gpt-plane-icon' />
            </button>
            {searchQuery && (
              <FontAwesomeIcon
                icon={faTimes}
                className='nextstream-bot__clear-input'
                onClick={() => {
                  setSearchQuery('');
                  setIsTyping(false);
                }}
              />
            )}
          </div>
  
          {messages.length > 0 && (
            <button className='nextstream-bot__clear-chat-button' onClick={handleClearChat}>
              <FontAwesomeIcon icon={faBroom} className='nextstream-bot__clear-chat-icon' />
              <p className="nextstream-bot__clear-chat-text">Clear Chat</p>
            </button>
          )}
        </div>
      </div>
  
      {results.length > 0 && (
        <div className='nextstream-bot__results-section'>
          <div className='nextstream-bot__carousel'>
            {showLeftArrowResults && (
              <FontAwesomeIcon icon={faChevronLeft} className='nextstream-bot__nav-arrow left' onClick={() => scrollLeft(searchScrollRef)} />
            )}
            <div className='nextstream-bot__scroll-container-results' ref={searchScrollRef}>
              {results.map((result) => (
                <div key={result.id} className='nextstream-bot__card nextstream-bot__card--results'>
                  <h3 className='nextstream-bot__title--results'>
                    {result.title || result.name}
                  </h3>
                  <div className='nextstream-bot__poster-container-results'>
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
                      className='nextstream-bot__poster nextstream-bot__poster--results'
                    />

                    {result.media_type !== 'person' && (
                      <div className='nextstream-bot__rating-container'>
                        <UserRating rating={(result.vote_average || 0) * 10} />
                      </div>
                    )}
  
                    {result.media_type !== 'person' && (
                      <div className='nextstream-bot__play-overlay' onClick={() => handlePlayTrailer(result.id, result.media_type)}>
                        <FontAwesomeIcon icon={faPlay} className='nextstream-bot__play-icon' />
                      </div>
                    )}
                  </div>
  
                  <div className='nextstream-bot__icons-row'>
                    {result.media_type === 'person' ? (
                      <>
                        <Link to={`/spotlight/${userId}/${result.id}`}>
                          <FontAwesomeIcon icon={faUser} className='nextstream-bot__media-icon' title='Person Spotlight' />
                        </Link>
                        <FontAwesomeIcon icon={faShareAlt} className='nextstream-bot__share-icon' onClick={() => handleShare(result.name, result.id, result.media_type)} />
                      </>
                    ) : (
                      <>
                        <Link to={`/nextview/${userId}/${result.media_type}/${result.id}`}>
                          <FontAwesomeIcon icon={result.media_type === 'tv' ? faTv : faFilm} className='nextstream-bot__media-icon' title={result.media_type === 'tv' ? 'TV Show' : 'Movie'} />
                        </Link>
  
                        <FontAwesomeIcon icon={faCalendarPlus} className='nextstream-bot__cal-icon' onClick={() => handleAddToCalendar(result.title, result.media_type, result.id)} />
  
                        {likedStatus[result.id] === 1 ? (
                          <FontAwesomeIcon icon={faThumbsUp} className='nextstream-bot__like-icon active' onClick={() => handleDislike(result.id, result.media_type)} />
                        ) : likedStatus[result.id] === 0 ? (
                          <FontAwesomeIcon icon={faThumbsDown} className='nextstream-bot__dislike-icon active' onClick={() => handleLike(result.id, result.media_type)} />
                        ) : (
                          <>
                            <FontAwesomeIcon icon={faThumbsUp} className='nextstream-bot__like-icon' onClick={() => handleLike(result.id, result.media_type)} />
                            <FontAwesomeIcon icon={faThumbsDown} className='nextstream-bot__dislike-icon' onClick={() => handleDislike(result.id, result.media_type)} />
                          </>
                        )}
  
                        <FontAwesomeIcon icon={faShareAlt} className='nextstream-bot__share-icon' onClick={() => handleShare(result.title || result.name, result.id, result.media_type)} />
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {showRightArrowResults && (
              <FontAwesomeIcon icon={faChevronRight} className='nextstream-bot__nav-arrow right' onClick={() => scrollRight(searchScrollRef)} />
            )}
          </div>
        </div>
      )}
  
      {isLoading && (
        <div className='nextstream-bot__loading-container'>
          <img src={ReelSVG} alt='Loading...' className='nextstream-bot__loading-svg' />
          <p className='nextstream-bot__text--center'>Media is currently loading...</p>
        </div>
      )}
  
      {isModalOpen && (
        <div className='nextstream-bot__modal'>
          <div className='nextstream-bot__modal-content'>
            <button className='nextstream-bot__modal-content-close' onClick={closeModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <iframe width='560' height='315' src={trailerUrl} title='YouTube video player' allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' allowFullScreen></iframe>
          </div>
        </div>
      )}
  
      {showCalendar && (
        <div className='nextstream-bot__calendar-modal'>
          <button className='nextstream-bot__calendar-close-btn' onClick={handleCloseCalendar}>
            <FontAwesomeIcon icon={faTimes} className='nextstream-bot__cal-close-icon' />
          </button>
          <Calendar userId={userId} eventTitle={eventTitle} mediaType={selectedMediaType} duration={duration} handleSave={handleSaveEvent} onClose={handleCloseCalendar} ref={calendarRef} />
        </div>
      )}
  
      {/* Tooltip components */}
      <Tooltip id='personTooltip' place='top' />
      <Tooltip id='trendingTvTooltip' place='top' />
      <Tooltip id='trendingMoviesTooltip' place='top' />
      <Tooltip id='trendingAllTooltip' place='top' />
      <Tooltip id='tvPopularTooltip' place='top' />
      <Tooltip id='tvTopTooltip' place='top' />
      <Tooltip id='tvOnAirTooltip' place='top' />
      <Tooltip id='tvAirsTodayTooltip' place='top' />
      <Tooltip id='movieNowPlayingTooltip' place='top' />
      <Tooltip id='moviePopularTooltip' place='top' />
      <Tooltip id='movieTopRatedTooltip' place='top' />
      <Tooltip id='movieUpcomingReleasesTooltip' place='top' />
      <Tooltip id='searchTooltip' place='top' />
      <Tooltip id='closeTooltip' place='top' />
      <Tooltip id='mediaTooltip' place='top' />
      <Tooltip id='calTooltip' place='top' />
      <Tooltip id='likeTooltip' place='top' />
      <Tooltip id='dislikeTooltip' place='top' />
      <Tooltip id='shareIconTooltip' place='top' />
    </div>
  );  
};

export default NextStreamBot;