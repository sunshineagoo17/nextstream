import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { faChevronLeft, faBroom, faRobot, faLightbulb, faChevronRight, faPlay, faTimes, faComment, faTv, faFilm, faCalendarPlus, faThumbsUp, faThumbsDown, faShareAlt, faUser, faPaperPlane, faEraser } from '@fortawesome/free-solid-svg-icons';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import ChatbotSvg from "../../assets/images/chat-bot.svg";
import Calendar from '../CalendarPage/sections/Calendar/Calendar';
import api from '../../services/api';
import RobotLoader from '../../components/Loaders/RobotLoader/RobotLoader';
import ReelSVG from '../../assets/images/reel-svg.svg';
import UserRating from '../TopPicksPage/sections/UserRating/UserRating';
import './NextStreamBot.scss';
import VoiceMessage from '../../components/VoiceInteraction/VoiceMessage/VoiceMessage';
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
  const navigate = useNavigate();
  const messagesContainerRef = useRef(null);
  const messagesEndRef = useRef(null);

  const location = useLocation();
  const searchScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  const showAlert = (message, type) => {
    setAlert({ message, type, visible: true });
  };

  useEffect(() => {
    const checkOverflow = () => {
      if (messagesContainerRef.current) {
        const { scrollHeight, clientHeight } = messagesContainerRef.current;
        const isOverflow = scrollHeight > clientHeight;
        console.log(
          'Checking overflow:',
          scrollHeight,
          clientHeight,
          isOverflow
        );
      }
    };

    const handleNewMessages = () => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior: 'smooth',
        });
      }
      checkOverflow();
    };

    handleNewMessages();
  }, [messages]);

  const handleClearChat = () => {
    setMessages([]);
    setResults([]);
    setSearchQuery('');
    setIsTyping(false);
  };

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
      const response = await api.get(
        `/api/tmdb/${mediaType}/${mediaId}/videos`
      );
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

  // Scroll to the beginning of the scrollable results section
  const resetScrollPosition = () => {
    if (searchScrollRef.current) {
      searchScrollRef.current.scrollLeft = 0; 
    }
  };

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim() && isAuthenticated) {
      setIsLoading(true);

      // Clear previous results and reset scroll position
      setResults([]);
      resetScrollPosition();

      try {
        const response = await api.post('/api/chatbot', {
          userInput: searchQuery,
          userId,
        });

        const chatbotMessage = response.data.message;
        const recommendedMedia = response.data.media || [];

        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: chatbotMessage },
        ]);

        if (recommendedMedia.length > 0) {
          const mediaResults = recommendedMedia.map((item) => {
            let mediaPath;

            if (item.media_type === 'person') {
              mediaPath = item.profile_path
                ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
                : DefaultPoster; 
            } else if (
              item.media_type === 'movie' ||
              item.media_type === 'tv'
            ) {
              mediaPath = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : DefaultPoster; 
            }

            return {
              id: item.id,
              title: item.title || item.name,
              media_type: item.media_type,
              poster_path: mediaPath, 
              vote_average: item.vote_average || null,
              trailerUrl: item.trailerUrl,
              credits: item.credits,
            };
          });

          setResults(mediaResults);
        } else {
          setResults([]);
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: 'bot',
              text: "Sorry, I couldn't find any matching results.",
            },
          ]);
        }
      } catch (error) {
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: 'bot',
            text: 'Error fetching the results. Please try again.',
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchQuery, isAuthenticated, userId]);

  const typeMessage = async (message, setMessages, setIsBotTyping) => {
    let displayedText = '';
    const typingSpeed = 50; 

    for (let i = 0; i < message.length; i++) {
      const currentText = displayedText + message[i];

      await new Promise((resolve) => setTimeout(resolve, typingSpeed));

      displayedText = currentText;

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];

        if (lastMessage && lastMessage.sender === 'bot') {
          lastMessage.text = currentText;
        }
        return updatedMessages;
      });
    }
    setIsBotTyping(false);
  };

  const handleSendMessage = async (message) => {
    const finalMessage = message || searchQuery;  
  
    if (finalMessage.trim()) {
      setIsTyping(true);
      setIsBotTyping(true);
      setIsLoading(true);
  
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'user', text: finalMessage },
      ]);
  
      try {
        const response = await api.post('/api/chatbot', {
          userInput: finalMessage,
          userId, 
        });
  
        const chatbotMessage = response.data.message;
        const recommendedMedia = response.data.media || []; 
  
        let hasResponse = false;
  
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: '' },
        ]);
  
        await typeMessage(chatbotMessage, setMessages, setIsBotTyping);
  
        if (chatbotMessage && chatbotMessage.trim().length > 0) {
          hasResponse = true;
        }
  
        if (recommendedMedia.length > 0) {
          const mediaResults = [];
  
          recommendedMedia.forEach((item) => {
            let mediaPath;
  
            if (item.media_type === 'person') {
              // Add the person to the results
              mediaPath = item.profile_path
                ? `https://image.tmdb.org/t/p/w500${item.profile_path}`
                : DefaultPoster;
  
              mediaResults.push({
                id: item.id,
                title: item.name,
                media_type: 'person',
                poster_path: mediaPath,
                vote_average: null, 
                trailerUrl: null,
                credits: item.credits,
              });
  
              // Add all known_for media items to the results
              if (item.known_for && item.known_for.length > 0) {
                item.known_for.forEach((media) => {
                  const mediaKnownPath = media.poster_path
                    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
                    : DefaultPoster;
  
                  mediaResults.push({
                    id: media.id,
                    title: media.title || media.name,
                    media_type: media.media_type,
                    poster_path: mediaKnownPath,
                    vote_average: media.vote_average,
                    trailerUrl: media.trailerUrl,
                  });
                });
              }
            } else {
              // Handle normal media (movies and TV shows)
              mediaPath = item.poster_path
                ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                : DefaultPoster;
  
              mediaResults.push({
                id: item.id,
                title: item.title || item.name,
                media_type: item.media_type,
                poster_path: mediaPath,
                vote_average: item.vote_average,
                trailerUrl: item.trailerUrl,
              });
            }
          });
  
          setResults(mediaResults);
          hasResponse = true;
        }
  
        if (!hasResponse) {
          const apologiesMessages = [
            "I'm sorry, I didn't catch that. Could you please try again?",
            "Oops! I missed that one. Could you rephrase it for me?",
            "I didn't quite understand that. Can you say it differently?",
            "Hmm, that didn't come through clearly. Could you give it another go?",
            "Apologies, I couldn't understand. Mind rewording your request?",
          ];
  
          const randomApology = apologiesMessages[Math.floor(Math.random() * apologiesMessages.length)];
  
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: 'bot',
              text: randomApology,
            },
          ]);
        }
  
      } catch (error) {
        const noResultsMessages = [
          "Sorry, I couldn't find any results. Try again!",
          "It seems I couldn't locate any results. How about giving it another shot?",
          "No matches found this time. Please try rephrasing or searching again!",
          "Oops! I came up empty. Could you try asking in a different way?",
          "I couldn't fetch any results for that. Care to try again?",
        ];
  
        const randomNoResults = noResultsMessages[Math.floor(Math.random() * noResultsMessages.length)];
  
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: 'bot',
            text: randomNoResults,
          },
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
          <RobotLoader />  
        </div>
      )}

      {alert.visible && (
        <div className='nextstream-bot__alert-wrapper'>
          <CustomAlerts
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ ...alert, visible: false })}
          />
        </div>
      )}

      <div className='nextstream-bot__title'>
        <h1 className='nextstream-bot__header-text'>
          Mizu:
          <br /> Your Personal Entertainment Assistant
        </h1>
        <p className='nextstream-bot__copy'>
          <span className='nextstream-bot__gradient-subtitle'>Mizu Bot</span>{' '}
          combines AI-powered search with real-time streaming data, helping you
          find the perfect movies and shows based on your preferences. Ask
          questions, get tailored recommendations, and discover trending content
          all in one place!
        </p>
      </div>

      <button
        className='nextstream-bot__gpt-button'
        onClick={() => navigate(`/nextstream-gpt/${userId}`)}>
        <FontAwesomeIcon icon={faRobot} className='nextstream-bot__gpt-icon' />
        <span className='nextstream-bot__btn-txt'>Chat with Mizu AI</span>
      </button>

      <div className='nextstream-bot__chat-block'>
        <div className='nextstream-bot__chat-container'>
          <div className='nextstream-bot__messages' ref={messagesContainerRef}>
            {/* Show empty chat state */}
            {messages.length === 0 && (
              <div className='nextstream-bot__empty-chat'>
                <img
                  src={ChatbotSvg}
                  alt='Chatbot'
                  className='nextstream-bot__chatbot-svg'
                />
                <p className='nextstream-bot__empty-message'>
                  Say hello to Mizu to discover
                  your next favourite stream.
                </p>
              </div>
            )}

            {/* Loop through messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`nextstream-bot__message nextstream-bot__message--${message.sender}`}>
                {/* Bot message */}
                {message.sender === 'bot' && (
                  <div className='nextstream-bot__bot-message-wrapper'>
                    <div className='nextstream-bot__bot-message'>
                      <FontAwesomeIcon
                        icon={faRobot}
                        className='nextstream-bot__gpt-icon-inline'
                      />
                      <p>{message.text}</p>
                    </div>

                    {/* Typing indicator under the bot message */}
                    {isBotTyping && (
                      <div className='nextstream-bot__bot-typing-indicator'>
                        <span className='nextstream-bot__bot-typing-indicator-bubble'></span>
                        <span className='nextstream-bot__bot-typing-indicator-bubble'></span>
                        <span className='nextstream-bot__bot-typing-indicator-bubble'></span>
                      </div>
                    )}
                  </div>
                )}

                {/* User message */}
                {message.sender === 'user' && (
                  <div
                    className={`nextstream-bot__user-message ${
                      isTyping && !isBotTyping ? 'typing' : ''
                    }`}>
                    <p>{message.text}</p>
                    <FontAwesomeIcon
                      icon={faUser}
                      className={`nextstream-bot__user-icon-inline ${
                        isTyping && !isBotTyping ? 'typing-icon' : ''
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input section */}
          <div className='nextstream-bot__input-wrapper'>
            <FontAwesomeIcon
              icon={faComment}
              className='nextstream-bot__speech-icon'
            />
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
              <div className='nextstream-bot__typing-indicator'>
                <span className='nextstream-bot__typing-indicator-bubble'></span>
                <span className='nextstream-bot__typing-indicator-bubble'></span>
                <span className='nextstream-bot__typing-indicator-bubble'></span>
              </div>
            )}
            
            <button
              className='nextstream-bot__send-button'
              onClick={() => handleSendMessage(searchQuery)}
              disabled={!searchQuery.trim()}>
              <FontAwesomeIcon
                icon={faPaperPlane}
                className='nextstream-bot__gpt-plane-icon'
              />
            </button>
            
            {/* Voice Message*/}
            <VoiceMessage handleSendMessage={handleSendMessage} />
            
            {searchQuery && (
              <button
              onClick={() => {
                setSearchQuery('');
                setIsTyping(false);
              }}
              >
                <FontAwesomeIcon
                  icon={faEraser}
                  className='nextstream-bot__clear-input'
                  onClick={() => {
                    setSearchQuery('');
                    setIsTyping(false);
                  }}
                />
              </button>
            )}
          </div>

          {/* Clear chat button */}
          {messages.length > 0 && (
            <button
              className='nextstream-bot__clear-chat-button'
              onClick={handleClearChat}>
              <FontAwesomeIcon
                icon={faBroom}
                className='nextstream-bot__clear-chat-icon'
              />
              <p className='nextstream-bot__clear-chat-text'>Clear Chat</p>
            </button>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className='nextstream-bot__results-section'>
          <div className='nextstream-bot__carousel'>
            {showLeftArrowResults && (
              <button>
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  className='nextstream-bot__nav-arrow left'
                  onClick={() => scrollLeft(searchScrollRef)}
                />
              </button>
            )}
            <div
              className='nextstream-bot__scroll-container-results'
              ref={searchScrollRef}>
              {results
                .filter((result) => result.title || result.name) 
                .map((result) => (
                  <div
                    key={result.id}
                    className='nextstream-bot__card nextstream-bot__card--results'>
                    <h3 className='nextstream-bot__title--results'>
                      {result.title || result.name}
                    </h3>

                    <div className='nextstream-bot__poster-container-results'>
                      <img
                        src={result.poster_path}
                        alt={result.title || result.name}
                        className='nextstream-bot__poster nextstream-bot__poster--results'
                      />

                      {result.media_type !== 'person' && (
                        <div className='nextstream-bot__rating-container'>
                          <UserRating
                            rating={(result.vote_average || 0) * 10}
                          />
                        </div>
                      )}

                      {result.media_type !== 'person' && (
                        <button
                          className='nextstream-bot__play-overlay'
                          onClick={() =>
                            handlePlayTrailer(result.id, result.media_type)
                          }>
                          <FontAwesomeIcon
                            icon={faPlay}
                            className='nextstream-bot__play-icon'
                          />
                        </button>
                      )}
                    </div>

                    <div className='nextstream-bot__icons-row'>
                      {result.media_type === 'person' ? (
                        <>
                          <Link to={`/spotlight/${userId}/${result.id}`}>
                            <FontAwesomeIcon
                              icon={faUser}
                              className='nextstream-bot__media-icon'
                              title='Person Spotlight'
                            />
                          </Link>
                          <button>
                            <FontAwesomeIcon
                              icon={faShareAlt}
                              className='nextstream-bot__share-icon'
                              onClick={() =>
                                handleShare(
                                  result.name,
                                  result.id,
                                  result.media_type
                                )
                              }
                            />
                          </button>
                        </>
                      ) : (
                        <>
                          <Link
                            to={`/nextview/${userId}/${result.media_type}/${result.id}`}>
                            <FontAwesomeIcon
                              icon={result.media_type === 'tv' ? faTv : faFilm}
                              className='nextstream-bot__media-icon'
                              title={
                                result.media_type === 'tv' ? 'TV Show' : 'Movie'
                              }
                            />
                          </Link>

                          <Link
                            to={`/nextwatch/${userId}/${result.media_type}/${result.id}`}>
                            <FontAwesomeIcon
                              icon={faLightbulb}
                              className='nextstream-bot__lightbulb-icon'
                              title='Find Similar Shows/Movies'
                            />
                          </Link>

                          <button>
                            <FontAwesomeIcon
                              icon={faCalendarPlus}
                              className='nextstream-bot__cal-icon'
                              title='Add to Calendar'
                              onClick={() =>
                                handleAddToCalendar(
                                  result.title,
                                  result.media_type,
                                  result.id
                                )
                              }
                            />
                          </button>

                          {likedStatus[result.id] === 1 ? (
                            <button>
                              <FontAwesomeIcon
                                icon={faThumbsUp}
                                className='nextstream-bot__like-icon active'
                                title='Like Title'
                                onClick={() =>
                                  handleDislike(result.id, result.media_type)
                                }
                              />
                            </button>
                          ) : likedStatus[result.id] === 0 ? (
                            <button>
                              <FontAwesomeIcon
                                icon={faThumbsDown}
                                className='nextstream-bot__dislike-icon active'
                                title='Dislike Title'
                                onClick={() =>
                                  handleLike(result.id, result.media_type)
                                }
                              />
                            </button>
                          ) : (
                            <>
                              <button>
                                <FontAwesomeIcon
                                  icon={faThumbsUp}
                                  className='nextstream-bot__like-icon'
                                  title='Like Title'
                                  onClick={() =>
                                    handleLike(result.id, result.media_type)
                                  }
                                />
                              </button>
                              <button>
                                <FontAwesomeIcon
                                  icon={faThumbsDown}
                                  className='nextstream-bot__dislike-icon'
                                  title='Dislike Title'
                                  onClick={() =>
                                    handleDislike(result.id, result.media_type)
                                  }
                                />
                              </button>
                            </>
                          )}
                          <button>
                            <FontAwesomeIcon
                              icon={faShareAlt}
                              className='nextstream-bot__share-icon'
                              title='Share Title'
                              onClick={() =>
                                handleShare(
                                  result.title || result.name,
                                  result.id,
                                  result.media_type
                                )
                              }
                            />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
            {showRightArrowResults && (
              <button>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className='nextstream-bot__nav-arrow right'
                  onClick={() => scrollRight(searchScrollRef)}
                />
              </button>
            )}
          </div>
        </div>
      )}

      {isLoading && (
        <div className='nextstream-bot__loading-container'>
          <img
            src={ReelSVG}
            alt='Loading...'
            className='nextstream-bot__loading-svg'
          />
          <p className='nextstream-bot__text--center'>
            Results are currently loading...
          </p>
        </div>
      )}

      {isModalOpen && (
        <div className='nextstream-bot__modal'>
          <div className='nextstream-bot__modal-content'>
            <button
              className='nextstream-bot__modal-content-close'
              onClick={closeModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <iframe
              width='560'
              height='315'
              src={trailerUrl}
              title='YouTube video player'
              allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
              allowFullScreen></iframe>
          </div>
        </div>
      )}

      {showCalendar && (
        <div className='nextstream-bot__calendar-modal'>
          <button
            className='nextstream-bot__calendar-close-btn'
            onClick={handleCloseCalendar}>
            <FontAwesomeIcon
              icon={faTimes}
              className='nextstream-bot__cal-close-icon'
            />
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