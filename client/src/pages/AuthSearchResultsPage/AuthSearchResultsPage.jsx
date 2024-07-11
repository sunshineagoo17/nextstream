import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast, Slide } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import axios from 'axios';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import 'react-toastify/dist/ReactToastify.css';
import './AuthSearchResultsPage.scss';
import Loader from '../../components/Loader/Loader';
import DefaultVideoImg from '../../assets/images/video-img-default.png';
import VideoCamera from "../../assets/images/videocamera-1.png";
import TvIcon from "../../assets/images/tv-icon.png";
import NoDataImg from "../../assets/images/no-data.svg";
import Calendar from '../CalendarPage/sections/Calendar';

const AuthSearchResultsPage = () => {
  const { isAuthenticated, userId } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const initialRender = useRef(true); 

  const query = new URLSearchParams(location.search).get('q');

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

      const limitedResults = response.data.results.slice(0, 3);

      const updatedResults = await Promise.all(
        limitedResults.map(async (result) => {
          try {
            const providersResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${result.media_type}/${result.id}/watch/providers`);
            const providers = providersResponse.data || [];
            if (providers.length === 0) {
              console.log(`No providers found for ${result.title || result.name}.`, {
              });
            }
      
            return { ...result, providers };
          } catch (error) {
            console.error(`Error fetching watch providers for ${result.media_type} ${result.id}:`, error);
            toast.error('Error fetching watch providers. Please try again later.', {
            });
            return { ...result, providers: [] };
          }
        })
      );
      
      setResults(updatedResults);

    } catch (error) {
      console.error('Error fetching search results:', error);
      toast.error('Error fetching search results. Please try again later.', {
      });
    } finally {
      setIsLoading(false);
      setShowCalendar(false); 
    }
  }, [query]);

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

  const handleAddToCalendar = (title) => {
    setEventTitle(title);
    setShowCalendar(true);
  };

  const handleCloseCalendar = () => {
    setShowCalendar(false);
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
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
              results.map(result => (
                <div key={result.id} className="auth-search-results__card">
                  {result.poster_path ? (
                    <div className="auth-search-results__poster-wrapper">
                      <a href={`https://www.themoviedb.org/${result.media_type}/${result.id}`} className="auth-search-results__link" target="_blank" rel="noopener noreferrer">
                        <img
                          className="auth-search-results__poster"
                          alt={result.title || result.name}
                          src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                          onError={(e) => { e.target.src = DefaultVideoImg; }}
                        />
                      </a>
                        <img 
                          src={result.media_type === 'movie' ? VideoCamera : TvIcon} 
                          className="auth-search-results__media-icon" 
                          alt={result.media_type === 'movie' ? 'Movie Icon' : 'TV Show Icon'} 
                        />
                      <button 
                        className="auth-search-results__calendar-button"
                        onClick={() => handleAddToCalendar(result.title || result.name)}
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} className='auth-search-results__calendar-icon' />
                      </button>
                    </div>
                  ) : (
                    <a href={`https://www.themoviedb.org/${result.media_type}/${result.id}`} className="auth-search-results__link" target="_blank" rel="noopener noreferrer">
                    <div className="auth-search-results__no-image">
                      <img
                        className="auth-search-results__poster auth-search-results__poster--default"
                        alt={result.title || result.name}
                        src={DefaultVideoImg}
                      />
                      <span className="auth-search-results__error-no-img-txt">No Image Available for:</span>
                      <span className="auth-search-results__error-no-img-title">{result.title || result.name}</span>
                    </div>
                    </a>
                  )}
                  <div className="auth-search-results__streaming-services">
                    {result.providers && result.providers.length > 0 ? (
                      result.providers.map(provider => (
                        <div key={provider.provider_id} className="auth-search-results__streaming-service">
                          <img 
                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                            alt={provider.provider_name} 
                            className="auth-search-results__streaming-provider-logo"
                          />
                        </div>
                      ))
                    ) : (
                      <p className="auth-search-results__no-providers">
                        No streaming services available for {result.title || result.name}.
                      </p>
                    )}
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
        </div>
        <div className="auth-search-results__background">
          <AnimatedBg />
        </div>
      </div>
      {showCalendar && (
        <div className="calendar-modal">
          <button className="calendar-close-btn" onClick={handleCloseCalendar}><p className="calendar-close-btn__txt">x</p></button>
          <Calendar 
            userId={userId}
            eventTitle={eventTitle}
            onClose={handleCloseCalendar}
            ref={calendarRef}
          />
        </div>
      )}
    </>
  );
};

export default AuthSearchResultsPage;