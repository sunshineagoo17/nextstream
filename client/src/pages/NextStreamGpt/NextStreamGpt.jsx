import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { faChevronLeft, faLightbulb, faStopCircle, faBroom, faRobot, faChevronRight, faPlay, faTimes, faEraser, faComment, faTv, faFilm, faCalendarPlus, faThumbsUp, faThumbsDown, faShareAlt, faUser, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar/Calendar';
import api from '../../services/api';
import UserRating from '../TopPicksPage/sections/UserRating/UserRating';
import DefaultPoster from '../../assets/images/posternoimg-icon.png';
import MizuLoader from '../../components/Loaders/MizuLoader/MizuLoader';
import ChatRobotAnimation from "../../assets/animation/chat-robot.webm";
import HelloRobotAnimation from "../../assets/animation/hello-robot.webm";
import SearchRobotAnimation from "../../assets/animation/search-robot.webm";
import VoiceMessageMizu from '../../components/VoiceInteraction/VoiceMessageMizu/VoiceMessageMizu';
import './NextStreamGpt.scss';

const NextStreamGpt = () => {
  const { userId, isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
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
  const [showLoader, setShowLoader] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const isInterrupted = useRef(false);
  const controllerRef = useRef(null);

  const location = useLocation();
  const searchScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  const showAlert = (message, type) => {
    setAlert({ message, type, visible: true });
  };

  useEffect(() => {
    const hasSeenDisclaimer = localStorage.getItem('hasSeenDisclaimer');
    if (!hasSeenDisclaimer) {
      setShowDisclaimer(true);
    }
  }, []);

  const closeDisclaimer = () => {
    setShowDisclaimer(false);
    localStorage.setItem('hasSeenDisclaimer', 'true');
  };

  const handleBotTyping = useCallback(async () => {
    setIsBotTyping(true);

    setTimeout(() => {
      setShowLoader(false);
    }, 2000);
  }, []);

  // Helper function to extract titles from the GPT response
  const extractTitlesFromResponse = (responseText) => {
    const quotesRegex = /"([^"]+)"/g;
    const numberedRegex = /\d+\.\s*([^\n]+)/g;

    const matches = [];
    let match;

    while ((match = quotesRegex.exec(responseText)) !== null) {
      matches.push(match[1].trim());
    }

    if (matches.length === 0) {
      while ((match = numberedRegex.exec(responseText)) !== null) {
        matches.push(match[1].trim());
      }
    }

    return matches;
  };

  // Helper function to fetch movie data by title from TMDB
  const fetchMovieDataByTitle = async (title) => {
    if (!title || typeof title !== 'string') {
      console.warn(`Invalid title: ${title}`);
      return null;
    }

    try {
      const response = await api.get(`/api/tmdb/search`, {
        params: { query: title },
      });
      const results = response.data.results || [];

      const movieOrTvOrPerson = results.find(
        (result) =>
          result.media_type === 'movie' ||
          result.media_type === 'tv' ||
          result.media_type === 'person'
      );

      if (movieOrTvOrPerson) {
        const mediaPath =
          movieOrTvOrPerson.media_type === 'person'
            ? movieOrTvOrPerson.profile_path
              ? `https://image.tmdb.org/t/p/w500${movieOrTvOrPerson.profile_path}`
              : DefaultPoster
            : movieOrTvOrPerson.poster_path
            ? `https://image.tmdb.org/t/p/w500${movieOrTvOrPerson.poster_path}`
            : DefaultPoster;

        return {
          ...movieOrTvOrPerson,
          poster_path: mediaPath,
        };
      }

      if (results[0]) {
        return {
          ...results[0],
          poster_path: results[0].poster_path
            ? `https://image.tmdb.org/t/p/w500${results[0].poster_path}`
            : DefaultPoster,
        };
      }

      return null;
    } catch (error) {
      console.error(`Error fetching data for ${title}:`, error);
      return null;
    }
  };

  const handleInterrupt = () => {
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    isInterrupted.current = true;
    setIsBotTyping(false);
    setShowLoader(false);

    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.sender === 'bot' ? { ...msg, text: "Kk I'll stop now! 🤭🤐" } : msg
      )
    );
  };

  const fetchMoviesForTitles = async (titles) => {
    const movieDataPromises = titles.map((title) =>
      fetchMovieDataByTitle(title)
    );
    try {
      const movieResults = await Promise.all(movieDataPromises);
      return movieResults;
    } catch (error) {
      console.error('Error fetching movie data:', error);
      return [];
    }
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
      setShowLoader(true);

      // Clear previous results and reset scroll position
      setResults([]);
      resetScrollPosition();

      try {
        const response = await api.post('/api/gpt', {
          userInput: searchQuery,
          userId,
        });
        console.log('Response:', response.data);
        const chatbotMessage = response.data.message;
        const recommendedMedia = response.data.media || [];

        console.log('API Results:', recommendedMedia);

        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: chatbotMessage },
        ]);

        if (recommendedMedia.length > 0) {
          const mediaResults = recommendedMedia.map((item) => {
            return {
              id: item.id,
              title: item.title || item.name,
              media_type: item.media_type,
              poster_path: item.poster_path,
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
        setShowLoader(false);
      }
    }
  }, [searchQuery, isAuthenticated, userId]);

  const typeMessage = async (
    message,
    setMessages,
    setIsBotTyping,
    isInterrupted
  ) => {
    let displayedText = '';
    const typingSpeed = 50;

    for (let i = 0; i < message.length; i++) {
      if (isInterrupted.current) {
        setIsBotTyping(false);
        return;
      }

      const currentText = displayedText + message[i];

      await new Promise((resolve) => setTimeout(resolve, typingSpeed));

      displayedText = currentText;

      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];

        if (lastMessage && lastMessage.sender === 'bot') {
          lastMessage.text = currentText;
        } else {
          updatedMessages.push({ sender: 'bot', text: currentText });
        }

        return updatedMessages;
      });
    }

    setIsBotTyping(false);
  };

  const handleSendMessage = async (message = '') => {
    const finalMessage = message || searchQuery;  
  
    if (finalMessage.trim()) {
      setIsTyping(true);
      setIsBotTyping(true);
      setShowLoader(true);
      isInterrupted.current = false;
  
      // Add the user's message to the messages array
      setMessages((prevMessages) => [
        ...prevMessages,
        { sender: 'user', text: finalMessage },
      ]);
  
      await handleBotTyping();
  
      try {
        const response = await api.post('/api/gpt', {
          userInput: finalMessage, 
          userId,
        });
  
        console.log('GPT Response:', response.data);
  
        const chatbotMessage = response.data.response;
  
        setMessages((prevMessages) => [
          ...prevMessages,
          { sender: 'bot', text: chatbotMessage },
        ]);
  
        await typeMessage(
          chatbotMessage,
          setMessages,
          setIsBotTyping,
          isInterrupted
        );
  
        const titles = extractTitlesFromResponse(chatbotMessage);
        console.log('Extracted Titles:', titles);
  
        if (titles.length === 0) {
          setMessages((prevMessages) => [...prevMessages]);
          setShowLoader(false);
          setIsTyping(false);
          setIsBotTyping(false);
          return;
        }
  
        const mediaResults = await fetchMoviesForTitles(titles);
  
        const personResponse = await api.get(`/api/tmdb/search`, {
          params: { query: finalMessage },
        });
        const personResult = personResponse.data.results.find(
          (result) => result.media_type === 'person'
        );
  
        console.log('Person Result:', personResult);
  
        let personData = null;
  
        if (personResult) {
          personData = {
            id: personResult.id,
            title: personResult.name,
            media_type: 'person',
            poster_path: personResult.profile_path
              ? `https://image.tmdb.org/t/p/w500${personResult.profile_path}`
              : DefaultPoster,
          };
  
          console.log('Person Data:', personData);
        }
  
        const combinedResults = [
          ...(personData ? [personData] : []),
          ...mediaResults,
        ];
  
        console.log('Combined Results:', combinedResults);
  
        if (combinedResults.length > 0) {
          setResults(combinedResults);
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            {
              sender: 'bot',
              text: "Sorry, I couldn't find any matching results.",
            },
          ]);
        }
      } catch (error) {
        console.error('Error fetching results:', error);
        setMessages((prevMessages) => [
          ...prevMessages,
          {
            sender: 'bot',
            text: 'Error fetching the results. Please try again.',
          },
        ]);
      } finally {
        setIsTyping(false);
        setIsBotTyping(false);
        setShowLoader(false);
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
    <div className='nextstream-gpt'>
      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className='nextstream-gpt__disclaimer-modal'>
          <div className='nextstream-gpt__disclaimer-content'>
            <button
              className='nextstream-gpt__disclaimer-close'
              onClick={closeDisclaimer}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <p className='nextstream-gpt__disclaimer-header'>
              Say "Hi!" to Mizu AI!
            </p>
            <video
              className='nextstream-gpt__chatbot-svg'
              src={HelloRobotAnimation}
              alt='Chatbot'
              autoPlay
              loop
              muted
              playsInline
              style={{ width: '150px', height: 'auto' }}
            />
            <p className='nextstream-gpt__disclaimer-copy'>
              Meet Mizu, your AI-powered guide to discovering hidden gems in the
              world of movies and shows! Whether you're in the mood for a
              blockbuster or a binge-worthy series, Mizu's got you covered.
              <br />
              <p className='nextstream-gpt__disclaimer-note'>
                *Note: As smart as Mizu is, it's not always 100% accurate.
                Please double-check details when needed.*
              </p>
            </p>
            <button
              className='nextstream-gpt__disclaimer-close'
              onClick={closeDisclaimer}>
              Got it!
            </button>
          </div>
        </div>
      )}

      {showLoader && (
        <div className='nextstream-gpt__loader-overlay'>
          <MizuLoader />
        </div>
      )}

      {alert.visible && (
        <div className='nextstream-gpt__alert-wrapper'>
          <CustomAlerts
            message={alert.message}
            type={alert.type}
            onClose={() => setAlert({ ...alert, visible: false })}
          />
        </div>
      )}

      <div className='nextstream-gpt__title'>
        <h1 className='nextstream-gpt__header-text'>
          Mizu 2.0:
          <br />
          Your AI-Powered Assistant
        </h1>
        <p className='nextstream-gpt__copy'>
        <span className='nextstream-gpt__gradient-subtitle'>Mizu AI</span>{' '}
          combines the advanced power of GPT with real-time streaming data, offering an upgraded experience to help you discover the perfect movies and shows. Ask questions, get personalized recommendations, and explore trending content – all tailored to your tastes!
        </p>
      </div>

      <button
        className='nextstream-gpt__gpt-button--og'
        onClick={() => navigate(`/nextstream-bot/${userId}`)}>
        <FontAwesomeIcon icon={faRobot} className='nextstream-gpt__gpt-icon' />
        <span>Chat with Mizu Bot</span>
      </button>

      <div className='nextstream-gpt__chat-block'>
        <div className='nextstream-gpt__chat-container'>
          <div className='nextstream-gpt__messages' ref={messagesContainerRef}>
            {/* Show empty chat state */}
            {messages.length === 0 && (
              <div className='nextstream-gpt__empty-chat'>
                <video
                  className='nextstream-gpt__chatbot-svg'
                  src={ChatRobotAnimation}
                  alt='Chatbot'
                  autoPlay
                  loop
                  muted
                  playsInline
                  style={{ width: '200px', height: 'auto' }}
                />
                <p className='nextstream-gpt__empty-message'>
                  Meet Mizu, your smart bot. Let it guide you to your next
                  stream.
                </p>
              </div>
            )}

            {/* Loop through messages */}
            {messages.map((message, index) => (
              <div
                key={index}
                className={`nextstream-gpt__message nextstream-gpt__message--${message.sender}`}>
                {/* Bot message */}
                {message.sender === 'bot' && (
                  <div className='nextstream-gpt__bot-message-wrapper'>
                    <div className='nextstream-gpt__bot-message'>
                      <FontAwesomeIcon
                        icon={faRobot}
                        className='nextstream-gpt__gpt-icon-inline'
                      />
                      <p>{message.text}</p>
                    </div>

                    {/* Typing indicator under the bot message */}
                    {isBotTyping && (
                      <div className='nextstream-gpt__bot-typing-indicator'>
                        <span className='nextstream-gpt__bot-typing-indicator-bubble'></span>
                        <span className='nextstream-gpt__bot-typing-indicator-bubble'></span>
                        <span className='nextstream-gpt__bot-typing-indicator-bubble'></span>
                      </div>
                    )}
                  </div>
                )}

                {/* User message */}
                {message.sender === 'user' && (
                  <div
                    className={`nextstream-gpt__user-message ${
                      isTyping && !isBotTyping ? 'typing' : ''
                    }`}>
                    <p>{message.text}</p>
                    <FontAwesomeIcon
                      icon={faUser}
                      className={`nextstream-gpt__user-icon-inline ${
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
          <div className='nextstream-gpt__input-wrapper'>
            <FontAwesomeIcon
              icon={faComment}
              className='nextstream-gpt__speech-icon'
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
              className='nextstream-gpt__input'
            />
            {isTyping && !isBotTyping && (
              <div className='nextstream-gpt__typing-indicator'>
                <span className='nextstream-gpt__typing-indicator-bubble'></span>
                <span className='nextstream-gpt__typing-indicator-bubble'></span>
                <span className='nextstream-gpt__typing-indicator-bubble'></span>
              </div>
            )}

            <button
              className='nextstream-gpt__send-button'
              onClick={() => handleSendMessage(searchQuery)}
              disabled={!searchQuery.trim()}>
              <FontAwesomeIcon
                icon={faPaperPlane}
                className='nextstream-gpt__gpt-plane-icon'
              />
            </button>

            {/* Voice Message*/}
            <VoiceMessageMizu handleSendMessage={handleSendMessage} />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setIsTyping(false);
                }}
              >
                <FontAwesomeIcon
                  icon={faEraser}
                  className='nextstream-gpt__clear-input'
                  onClick={() => {
                    setSearchQuery('');
                    setIsTyping(false);
                  }}
                />
              </button>
            )}
          </div>

          {/* Clear Chat and Interrupt Mizu buttons */}
          {messages.length > 0 && (
            <div className='nextstream-gpt__stop-actions'>
              <button
                className='nextstream-gpt__interrupt-btn'
                onClick={handleInterrupt}>
                <FontAwesomeIcon
                  icon={faStopCircle}
                  className='nextstream-gpt__interrupt-icon'
                />
                Interrupt Mizu
              </button>

              <button
                className='nextstream-gpt__clear-chat-button'
                onClick={handleClearChat}>
                <FontAwesomeIcon
                  icon={faBroom}
                  className='nextstream-gpt__clear-chat-icon'
                />
                <p className='nextstream-gpt__clear-chat-text'>Clear Chat</p>
              </button>
            </div>
          )}
        </div>
      </div>

      {results && results.length > 0 && (
        <div className='nextstream-gpt__results-section'>
          <div className='nextstream-gpt__carousel'>
            {showLeftArrowResults && (
              <FontAwesomeIcon
                icon={faChevronLeft}
                className='nextstream-gpt__nav-arrow left'
                onClick={() => scrollLeft(searchScrollRef)}
              />
            )}
            <div
              className='nextstream-gpt__scroll-container-results'
              ref={searchScrollRef}>
              {[...new Map(results.map((item) => [item.id, item])).values()].map(
                (result) =>
                  result && (
                    <div
                      key={result.id}
                      className='nextstream-gpt__card nextstream-gpt__card--results'>
                      <h3 className='nextstream-gpt__title--results'>
                        {result.title || result.name || 'Unknown Title'}
                      </h3>
                      <div className='nextstream-gpt__poster-container-results'>
                        <button>
                          <img
                            src={result.poster_path}
                            alt={result.title || result.name}
                            className='nextstream-gpt__poster nextstream-gpt__poster--results'
                          />
                        </button>
                        {result.media_type !== 'person' && (
                          <div className='nextstream-gpt__rating-container'>
                            <UserRating rating={(result.vote_average || 0) * 10} />
                          </div>
                        )}
                        {result.media_type !== 'person' && (
                          <div
                            className='nextstream-gpt__play-overlay'
                            onClick={() =>
                              handlePlayTrailer(result.id, result.media_type)
                            }>
                            <button>
                              <FontAwesomeIcon
                                icon={faPlay}
                                className='nextstream-gpt__play-icon'
                              />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className='nextstream-gpt__icons-row'>
                        {result.media_type === 'person' ? (
                          <>
                            <Link to={`/spotlight/${userId}/${result.id}`}>
                              <FontAwesomeIcon
                                icon={faUser}
                                className='nextstream-gpt__media-icon'
                                title='Person Spotlight'
                              />
                            </Link>
                            <FontAwesomeIcon
                              icon={faShareAlt}
                              className='nextstream-gpt__share-icon'
                              onClick={() =>
                                handleShare(
                                  result.name,
                                  result.id,
                                  result.media_type
                                )
                              }
                            />
                          </>
                        ) : (
                          <>
                            <Link
                              to={`/nextview/${userId}/${result.media_type}/${result.id}`}>
                              <FontAwesomeIcon
                                icon={
                                  result.media_type === 'tv' ? faTv : faFilm
                                }
                                className='nextstream-gpt__media-icon'
                                title={
                                  result.media_type === 'tv' ? 'TV Show' : 'Movie'
                                }
                              />
                            </Link>

                            <Link to={`/nextwatch/${userId}/${result.media_type}/${result.id}`}>
                              <FontAwesomeIcon
                                icon={faLightbulb}
                                className='nextstream-gpt__lightbulb-icon'
                                title='Find Similar Shows/Movies'
                              />
                            </Link>

                            <button>
                              <FontAwesomeIcon
                                icon={faCalendarPlus}
                                title='Add to Calendar'
                                className='nextstream-gpt__cal-icon'
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
                                  title='Like Title'
                                  className='nextstream-gpt__like-icon active'
                                  onClick={() =>
                                    handleDislike(result.id, result.media_type)
                                  }
                                />
                              </button>
                            ) : likedStatus[result.id] === 0 ? (
                              <button>
                                <FontAwesomeIcon
                                  icon={faThumbsDown}
                                  title='Dislike Title'
                                  className='nextstream-gpt__dislike-icon active'
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
                                    title='Like Title'
                                    className='nextstream-gpt__like-icon'
                                    onClick={() =>
                                      handleLike(result.id, result.media_type)
                                    }
                                  />
                                </button>
                                <button>
                                  <FontAwesomeIcon
                                    icon={faThumbsDown}
                                    title='Dislike Title'
                                    className='nextstream-gpt__dislike-icon'
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
                                title='Share Title'
                                className='nextstream-gpt__share-icon'
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
                  )
              )}
            </div>
            {showRightArrowResults && (
              <button>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className='nextstream-gpt__nav-arrow right'
                  onClick={() => scrollRight(searchScrollRef)}
                />
              </button>
            )}
          </div>
        </div>
      )}

      {showLoader && (
        <div className='nextstream-gpt__loading-container'>
          <video
            className='nextstream-gpt__chatbot-svg'
            src={SearchRobotAnimation}
            alt='Chatbot'
            autoPlay
            loop
            muted
            playsInline
            style={{ width: '200px', height: 'auto' }}
          />
          <p className='nextstream-gpt__text--center'>
            Results are currently loading...
          </p>
        </div>
      )}

      {isModalOpen && (
        <div className='nextstream-gpt__modal'>
          <div className='nextstream-gpt__modal-content'>
            <button
              className='nextstream-gpt__modal-content-close'
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
        <div className='nextstream-gpt__calendar-modal'>
          <button
            className='nextstream-gpt__calendar-close-btn'
            onClick={handleCloseCalendar}>
            <FontAwesomeIcon
              icon={faTimes}
              className='nextstream-gpt__cal-close-icon'
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

export default NextStreamGpt;