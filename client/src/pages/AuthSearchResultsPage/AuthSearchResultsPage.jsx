import React, { useState, useEffect, useContext, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import 'react-toastify/dist/ReactToastify.css';
import './AuthSearchResultsPage.scss';
import Loader from '../../components/Loader/Loader';
import DefaultVideoImg from '../../assets/images/video-img-default.png';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import VideoCamera from "../../assets/images/videocamera-1.png";
import TvIcon from "../../assets/images/tv-icon.png";
import CalendarModal from '../CalendarPage/sections/Calendar';

const AuthSearchResultsPage = ({ openModal }) => {
  const { isAuthenticated, userId } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalendar, setShowCalendar] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const calendarRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  useEffect(() => {
    const fetchResults = async () => {
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
              return { ...result, providers };
            } catch (error) {
              console.error(`Error fetching watch providers for ${result.media_type} ${result.id}:`, error);
              return { ...result, providers: [] };
            }
          })
        );

        setResults(updatedResults);

        if (updatedResults.length === 0) {
          toast.info('No results found for your search. Try a different title!', {
            position: 'top-center',
            autoClose: 4000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
  }, [query]);

  const handleAddToCalendar = (title) => {
    setEventTitle(title);
    setShowCalendar(true);
  };

  return (
    <>
      <ToastContainer />
      {isLoading && <Loader />}
      <div className="auth-search-results">
        <div className="auth-search-results__content-card">
          <h1 className="auth-search-results__title">Search Results</h1>
          <p className="auth-search-results__intro">Here's where you'll find your top 3 results.</p>
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
            {results.map(result => (
              <div key={result.id} className="auth-search-results__card">
                  {result.poster_path ? (
                    <div className="auth-search-results__poster-wrapper">
                      <img
                        className="auth-search-results__poster"
                        alt={result.title || result.name}
                        src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                        onError={(e) => { e.target.src = DefaultVideoImg; }}
                      />
                    {/* <a href={`https://www.themoviedb.org/${result.media_type}/${result.id}`} className="auth-search-results__link" target="_blank" rel="noopener noreferrer"> */}
                      <img 
                        src={result.media_type === 'movie' ? VideoCamera : TvIcon} 
                        className="auth-search-results__media-icon" 
                        alt={result.media_type === 'movie' ? 'Movie Icon' : 'TV Show Icon'} 
                      />
                    {/* </a> */}
                      <button 
                        className="auth-search-results__calendar-button"
                        onClick={() => handleAddToCalendar(result.title || result.name)}
                      >
                        <FontAwesomeIcon icon={faCalendarAlt} />
                      </button>
                    </div>
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
                <div className="auth-search-results__streaming-services">
                  {result.providers && result.providers.map(provider => (
                    <div key={provider.provider_id} className="auth-search-results__streaming-service">
                      <img 
                        src={`https://image.tmdb.org/t/p/original${provider.logo_path}`} 
                        alt={provider.provider_name} 
                        className="auth-search-results__streaming-provider-logo"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="auth-search-results__background">
          <AnimatedBg />
        </div>
      </div>
      {showCalendar && (
        <CalendarModal 
          userId={userId}
          eventTitle={eventTitle}
          onClose={() => setShowCalendar(false)}
          calendarRef={calendarRef}
        />
      )}
    </>
  );
};

export default AuthSearchResultsPage;