import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarPlus, faClose, faChevronRight, faChevronLeft, faThumbsUp, faThumbsDown, faImage, faShareAlt, faTv, faVideo } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { Tooltip } from 'react-tooltip'; 
import AnimatedBg from '../../components/Backgrounds/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loaders/Loader/Loader';
import DefaultVideoImg from '../../assets/images/video-img-default.png';
import NoDataImg from '../../assets/images/no-data.svg';
import Calendar from '../../pages/CalendarPage/sections/Calendar/Calendar';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './AuthSearchResultsPage.scss';
import api from '../../services/api'; 

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
      const response = await api.get(`/api/tmdb/search`, {
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

      const filteredResults = response.data.results.filter(result => result.media_type === 'movie' || result.media_type === 'tv');

      const updatedResults = await Promise.all(
        filteredResults.map(async (result) => {
          try {
            const interactionResponse = await api.get(`/api/interactions/${userId}`, {
              params: {
                media_id: result.id,
                media_type: result.media_type,
              }
            });

            const interactionData = interactionResponse.data.find(interaction => interaction.media_id === result.id);
            const interaction = interactionData ? interactionData.interaction : null;

            const providersResponse = await api.get(`/api/tmdb/${result.media_type}/${result.id}/watch/providers`);
            const providers = providersResponse.data || [];

            let duration = 0;
            if (result.media_type === 'movie') {
              const movieDetails = await api.get(`/api/tmdb/movie/${result.id}`);
              duration = movieDetails.data.runtime || 0;
            } else if (result.media_type === 'tv') {
              const tvDetails = await api.get(`/api/tmdb/tv/${result.id}`);
              duration = tvDetails.data.episode_run_time[0] || 0;
            }

            return { ...result, providers, duration, interaction };
          } catch (error) {
            return { ...result, providers: [], duration: 0, interaction: null };
          }
        })
      );

      setResults(updatedResults);
    } catch (error) {
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
      return () => clearTimeout(timer); 
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
        return;
      }
  
      if (!result.media_type) {
        return;
      }
  
      await api.post(`/api/interactions`, {
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
  
      if (newInteraction === 1) {
        showAlert('You liked this media!', 'success');
      } else if (newInteraction === 0) {
        showAlert('You disliked this media!', 'info');
      } else {
        showAlert('Interaction removed.', 'info');
      }
    } catch (error) {
      showAlert('Error toggling interaction. Please try again later.', 'error');
    }
  };

  const handleShare = (title, mediaType, mediaId) => {
    const url = `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Check out this title - ${title}`,
        url: url,
      });
    } else {
      navigator.clipboard.writeText(`Check out this title - ${title}: ${url}`)
      .then(() => showAlert('Link copied to clipboard!', 'success'))
      .catch(() => showAlert('Failed to copy link', 'error'));
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
      return <FontAwesomeIcon icon={faVideo} alt="Movie" className="auth-search-results__media-icon" />;
    } else if (mediaType === 'tv') {
      return <FontAwesomeIcon icon={faTv} alt="TV Show" className="auth-search-results__media-icon" />;
    }
    return <FontAwesomeIcon icon={faImage} className="auth-search-results__media-icon auth-search-results__media-none-icon" alt="No Media Type Available" />;
  };

  const getInteractionIcon = (interaction, mediaId, mediaType, title) => {
    return (
      <>
        {interaction === 1 ? (
          <button>
            <FontAwesomeIcon
              icon={faThumbsUp}
              className="auth-search-results__thumbs-up"
              onClick={() => handleToggleInteraction(mediaId, 0)}
              data-tooltip-id={`thumbsUpTooltip-${mediaId}`}
              data-tooltip-content="LIKED"
            />
            <Tooltip id={`thumbsUpTooltip-${mediaId}`} place="top" className="tooltip-custom" />
          </button>
        ) : interaction === 0 ? (
          <button>
            <FontAwesomeIcon
              icon={faThumbsDown}
              className="auth-search-results__thumbs-down"
              onClick={() => handleToggleInteraction(mediaId, 1)}
              data-tooltip-id={`thumbsDownTooltip-${mediaId}`}
              data-tooltip-content="DISLIKED"
            />
            <Tooltip id={`thumbsDownTooltip-${mediaId}`} place="top" className="tooltip-custom" />
          </button>
        ) : (
          <button>
            <div className="auth-search-results__neutral-interactions">
              <FontAwesomeIcon
                icon={faThumbsUp}
                className="auth-search-results__thumbs-up"
                onClick={() => handleToggleInteraction(mediaId, 1)}
                data-tooltip-id={`interactionTooltip-${mediaId}`}
                data-tooltip-content="LIKE"
              />
              <FontAwesomeIcon
                icon={faThumbsDown}
                className="auth-search-results__thumbs-down"
                onClick={() => handleToggleInteraction(mediaId, 0)}
                data-tooltip-id={`interactionTooltip-${mediaId}`}
                data-tooltip-content="DISLIKE"
              />
            </div>
            <Tooltip id={`interactionTooltip-${mediaId}`} place="top" className="tooltip-custom" />
          </button>
        )}
        <button>
          <FontAwesomeIcon
            icon={faShareAlt}
            className="auth-search-results__share-icon"
            onClick={() => handleShare(title, mediaType, mediaId)}
            data-tooltip-id={`shareTooltip-${mediaId}`}
            data-tooltip-content="SHARE"
          />
          <Tooltip id={`shareTooltip-${mediaId}`} place="top" className="tooltip-custom" />
        </button>
      </>
    );
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
                    <div 
                      className="auth-search-results__link" 
                      onClick={() => navigate(`/nextview/${userId}/${result.media_type}/${result.id}`)} 
                      aria-label={`View details for ${result.title || result.name}`}>
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
                    </div>
                    <button
                      aria-label="Add to Calendar"
                      className="auth-search-results__calendar-button"
                      onClick={() => handleAddToCalendar(result.title || result.name, result.media_type, result.duration)} 
                    >
                      <FontAwesomeIcon icon={faCalendarPlus} className='auth-search-results__calendar-icon' />
                    </button>
                  </div>

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

                  <div className="auth-search-results__interaction-icons">
                    {getInteractionIcon(result.interaction, result.id, result.media_type, result.title || result.name)}
                  </div>
                </div>
              ))
            ) : (
              <div className="auth-search-results__no-results">
                <img src={NoDataImg} alt="No results found" className='auth-search-results__no-data-img' />
                <p className="auth-search-results__no-results-copy">No results found for your search. Try a different title!</p>
              </div>
            )}
          </div>
          {results.length > 3 && (
            <div className="auth-search-results__pagination-container">
              <button className="auth-search-results__page-nav-wrapper" onClick={handlePrevious}>
                <FontAwesomeIcon icon={faChevronLeft} className="auth-search-results__previous-icon" />
              </button>
              {renderPaginationCircles()}
              <button className="auth-search-results__page-nav-wrapper" onClick={handleNext}>
                <FontAwesomeIcon icon={faChevronRight} className="auth-search-results__next-icon" />
              </button>
            </div>
          )}
        </div>
        <div className="auth-search-results__background">
          <AnimatedBg />
        </div>
      </div>
      {showCalendar && (
        <div className="auth-search-results__cal-modal">
          <button className="auth-search-results__cal-close-btn" onClick={handleCloseCalendar}>
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