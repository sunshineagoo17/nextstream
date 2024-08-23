import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faClose, faChevronRight, faChevronLeft, faThumbsUp, faThumbsDown, faImage } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import axios from 'axios';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import DefaultVideoImg from '../../assets/images/video-img-default.png';
import VideoCamera from "../../assets/images/videocamera-1.png";
import TvIcon from "../../assets/images/tv-icon.png";
import NoDataImg from "../../assets/images/no-data.svg";
import PreviousIcon from '../../assets/images/previous-icon.svg';
import NextIcon from '../../assets/images/next-icon.svg';
import Calendar from '../CalendarPage/sections/Calendar';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './AuthSearchResultsPage.scss';

const AuthSearchResultsPage = ({ userId }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventMediaType, setEventMediaType] = useState('');
  const [eventDuration, setEventDuration] = useState(0);  
  const [showMoreProviders, setShowMoreProviders] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [alert, setAlert] = useState({ show: false, message: '', type: '' });
  const location = useLocation();
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const initialRender = useRef(true);

  const query = new URLSearchParams(location.search).get('q');

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
  };

  const closeAlert = () => {
    setAlert({ show: false, message: '', type: '' });
  };

  const fetchResults = useCallback(async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/search`, {
        params: {
          query,
          language: 'en-US',
          region: 'CA',
          include_adult: false,
          page: 1,
          include_image_language: 'en,null',
          sort_by: 'popularity.desc'
        }
      });

      // Filter results to include only movies and TV shows
      const filteredResults = response.data.results.filter(result => result.media_type === 'movie' || result.media_type === 'tv');

      const updatedResults = await Promise.all(
        filteredResults.map(async (result) => {
          try {
            // Fetch the interaction status for the user and this media item
            const interactionResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/interactions/${userId}`, {
              params: {
                media_id: result.id,
                media_type: result.media_type,
              }
            });

            const interactionData = interactionResponse.data.find(interaction => interaction.media_id === result.id);
            const interaction = interactionData ? interactionData.interaction : null;

            const providersResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${result.media_type}/${result.id}/watch/providers`);
            const providers = providersResponse.data || [];

            // Fetch runtime for movies and episode runtime for TV shows
            let duration = 0;
            if (result.media_type === 'movie') {
              const movieDetails = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/movie/${result.id}`);
              duration = movieDetails.data.runtime || 0;
            } else if (result.media_type === 'tv') {
              const tvDetails = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/tv/${result.id}`);
              duration = tvDetails.data.episode_run_time[0] || 0;
            }

            return { ...result, providers, duration, interaction };
          } catch (error) {
            console.error(`Error fetching watch providers or interaction for ${result.media_type} ${result.id}:`, error);
            return { ...result, providers: [], duration: 0, interaction: null };
          }
        })
      );

      setResults(updatedResults);
    } catch (error) {
      console.error('Error fetching search results:', error);
      showAlert('Error fetching search results. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
      setShowCalendar(false);
    }
  }, [query, userId]);

  useEffect(() => {
    if (query && initialRender.current) {
      initialRender.current = false;
      fetchResults();
    } else if (query) {
      const timer = setTimeout(() => {
        fetchResults();
      }, 300);
      return () => clearTimeout(timer); // Cleanup function to clear timeout
    }
  }, [query, fetchResults]);

  const handleAddToCalendar = (title, mediaType, duration) => {
    if (duration === 0) {
      showAlert("Duration's not available for this media.", 'info');
    } else if (mediaType === 'tv' && duration > 0) {
      showAlert('Duration is based on the very first episode.', 'info');
    }
    setEventTitle(title);
    setEventMediaType(mediaType);
    setEventDuration(duration); 
    setShowCalendar(true);
  };

  const handleCloseCalendar = () => {
    setShowCalendar(false);
  };

  const toggleShowMoreProviders = (id) => {
    setShowMoreProviders(prevState => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? results.length - 3 : prevIndex - 3));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 3 >= results.length ? 0 : prevIndex + 3));
  };

  const handleToggleInteraction = async (mediaId, newInteraction) => {
    try {
      const result = results.find((result) => result.id === mediaId);
  
      if (!result) {
        console.error(`No result found for mediaId ${mediaId}`);
        return;
      }
  
      if (!result.media_type) {
        console.error(`media_type is missing for result with mediaId ${mediaId}`);
        return;
      }
  
      await axios.post(`${process.env.REACT_APP_BASE_URL}/api/interactions`, {
        userId,
        media_id: mediaId,
        interaction: newInteraction,
        media_type: result.media_type,
      });
  
      setResults((prevResults) =>
        prevResults.map((result) =>
          result.id === mediaId ? { ...result, interaction: newInteraction } : result
        )
      );
    } catch (error) {
      console.error('Error toggling interaction:', error);
      showAlert('Error toggling interaction. Please try again later.', 'error');
    }
  };  

  const renderPaginationCircles = () => {
    const totalPages = Math.ceil(results.length / 3);
    const currentPage = Math.floor(currentIndex / 3);

    return (
      <div className="auth-search-results__pagination-circles">
        {Array.from({ length: totalPages }).map((_, index) => (
          <div
            key={index}
            className={`auth-search-results__pagination-circle ${index === currentPage ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index * 3)}
          ></div>
        ))}
      </div>
    );
  };

  const getMediaTypeIcon = (mediaType) => {
    if (mediaType === 'movie') {
      return <img src={VideoCamera} alt="Movie" className="auth-search-results__media-icon" />;
    } else if (mediaType === 'tv') {
      return <img src={TvIcon} alt="TV Show" className="auth-search-results__media-icon" />;
    }
    return <FontAwesomeIcon icon={faImage} className="auth-search-results__media-icon auth-search-results__media-none-icon" alt="No Media Type Available" />;
  };

  const getInteractionIcon = (interaction, mediaId) => {
    if (interaction === 1) {
      return <FontAwesomeIcon icon={faThumbsUp} className="auth-search-results__thumbs-up" onClick={() => handleToggleInteraction(mediaId, 0)} />;
    } else if (interaction === 0) {
      return <FontAwesomeIcon icon={faThumbsDown} className="auth-search-results__thumbs-down" onClick={() => handleToggleInteraction(mediaId, 1)} />;
    } else {
      return (
        <div className="auth-search-results__neutral-interactions">
          <FontAwesomeIcon icon={faThumbsUp} className="auth-search-results__thumbs-up" onClick={() => handleToggleInteraction(mediaId, 1)} />
          <FontAwesomeIcon icon={faThumbsDown} className="auth-search-results__thumbs-down" onClick={() => handleToggleInteraction(mediaId, 0)} />
        </div>
      );
    }
  };     

  return (
    <>
      {alert.show && (
        <CustomAlerts
          message={alert.message}
          type={alert.type}
          onClose={closeAlert}
        />
      )}
      {isLoading && <Loader />}
      <div className="auth-search-results">
        <div className="auth-search-results__content-card">
          <h1 className="auth-search-results__title">Search Results</h1>
          <p className="auth-search-results__intro">Here's where you'll find your top results.</p>
          {!isAuthenticated && (
            <div>
              <p className="auth-search-results__text--top">
                To view where these titles are streaming and add them to your calendar, please{' '}
                <button className="auth-search-results__login-link" onClick={() => navigate('/login')} aria-label="Go to Login Page">
                  sign in.
                </button>
              </p>
              <p className="auth-search-results__text--bottom">
                Don't have an account?{' '}
                <button className="auth-search-results__register-link" onClick={() => navigate('/register')} aria-label="Go to Register Page">
                  Register
                </button>{' '}
                now!
              </p>
            </div>
          )}
          <div className="auth-search-results__card-media-container">
            {results.length > 0 ? (
              results.slice(currentIndex, currentIndex + 3).map(result => (
                <div key={result.id} className="auth-search-results__card">
                  <div className="auth-search-results__poster-wrapper">
                    <a href={`https://www.themoviedb.org/${result.media_type}/${result.id}`} className="auth-search-results__link" target="_blank" rel="noopener noreferrer">
                      {result.poster_path ? (
                        <img
                          className="auth-search-results__poster"
                          alt={result.title || result.name}
                          src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                          onError={(e) => { e.target.src = DefaultVideoImg; }}
                        />
                      ) : (
                        <div className="auth-search-results__no-image">
                          <img
                            className="auth-search-results__poster auth-search-results__poster--default"
                            alt={result.title || result.name}
                            src={DefaultVideoImg}
                          />
                          <span className="auth-search-results__error-no-img-txt">No Image Available for:</span>
                          <span className="auth-search-results__error-no-img-title">{result.title || result.name}</span>
                        </div>
                      )}
                      {getMediaTypeIcon(result.media_type)}
                    </a>
                    <button
                      aria-label="Add to Calendar"
                      className="auth-search-results__calendar-button"
                      onClick={() => handleAddToCalendar(result.title || result.name, result.media_type, result.duration)}  // Pass the duration
                    >
                      <FontAwesomeIcon icon={faCalendarPlus} className='auth-search-results__calendar-icon' />
                    </button>
                  </div>

                  {/* Streaming Services */}
                  <div className="auth-search-results__streaming-services">
                    {result.providers && result.providers.length > 0 ? (
                      <>
                        {result.providers.slice(showMoreProviders[result.id] ? 3 : 0, showMoreProviders[result.id] ? result.providers.length : 3).map(provider => (
                          <div key={provider.provider_id} className="auth-search-results__streaming-service">
                            <img
                              src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                              alt={provider.provider_name}
                              className="auth-search-results__streaming-provider-logo"
                            />
                          </div>
                        ))}
                        {result.providers.length > 3 && (
                          <button
                            className="auth-search-results__show-more-btn"
                            onClick={() => toggleShowMoreProviders(result.id)}
                            aria-label="Show more providers"
                          >
                            <FontAwesomeIcon
                              icon={showMoreProviders[result.id] ? faChevronLeft : faChevronRight}
                              className="auth-search-results__chevron-icon"
                            />
                          </button>
                        )}
                      </>
                    ) : (
                      <p className="auth-search-results__no-providers">
                        No streaming services available for {result.title || result.name}.
                      </p>
                    )}
                  </div>

                  {/* Interaction Icons */}
                  <div className="auth-search-results__interaction-icons">
                    {getInteractionIcon(result.interaction, result.id)}
                  </div>
                </div>
              ))
            ) : (
              <div className="auth-search-results__no-results">
                <img src={NoDataImg} alt="No results found" />
                <p className="auth-search-results__no-results-copy">No results found for your search. Try a different title!</p>
              </div>
            )}
          </div>
          {results.length > 3 && (
            <div className="auth-search-results__pagination-container">
              <div className="auth-search-results__page-nav-wrapper" onClick={handlePrevious}>
                <img src={PreviousIcon} className="auth-search-results__previous-icon" alt="Previous" />
              </div>
              {renderPaginationCircles()}
              <div className="auth-search-results__page-nav-wrapper" onClick={handleNext}>
                <img src={NextIcon} className="auth-search-results__next-icon" alt="Next" />
              </div>
            </div>
          )}
        </div>
        <div className="auth-search-results__background">
          <AnimatedBg />
        </div>
      </div>
      {showCalendar && (
        <div className="calendar-modal">
          <button className="calendar-close-btn" onClick={handleCloseCalendar}>
            <FontAwesomeIcon icon={faClose} className='auth-search-results__close-icon' />
          </button>
          <Calendar
            userId={userId}
            eventTitle={eventTitle}
            mediaType={eventMediaType}
            duration={eventDuration}  
            onClose={handleCloseCalendar}
            ref={calendarRef}
          />
        </div>
      )}
    </>
  );
};

export default AuthSearchResultsPage;