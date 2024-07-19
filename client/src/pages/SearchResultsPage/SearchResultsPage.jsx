import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ToastContainer, toast, Slide } from 'react-toastify';
import axios from 'axios';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import DefaultVideoImg from '../../assets/images/video-img-default.png';
import NoDataImg from '../../assets/images/no-data.svg';
import MovieIcon from '../../assets/images/videocamera-1.png';
import TvIcon from '../../assets/images/tv-icon.png'; 
import 'react-toastify/dist/ReactToastify.css';
import './SearchResultsPage.scss';

const SearchResultsPage = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  const query = new URLSearchParams(location.search).get('q');

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleRegisterClick = () => {
    navigate('/register');
  };

  const getMediaTypeIcon = (mediaType) => {
    if (mediaType === 'movie') {
      return MovieIcon;
    } else if (mediaType === 'tv') {
      return TvIcon;
    }
    return null;
  };

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
        setResults(limitedResults);

      } catch (error) {
        console.error('Error fetching search results:', error);
        toast.error('Error fetching search results. Please try again later.', {
          className: 'frosted-toast-search',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (query) {
      fetchResults();
    }
  }, [query]);

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
      {isLoading && <Loader />}
      <div className="search-results">
        <div className="search-results__content-card">
          <h1 className="search-results__title">Search Results</h1>
          <div className="search-results__copy-container">
            <p className="search-results__intro">Here's where you'll find your top results.</p>
            <p className="search-results__text--top">
              To view where these titles are streaming and add them to your calendar, please{' '}
              <button className="search-results__login-link" onClick={handleLoginClick} aria-label="Go to Login Page">
                sign in.
              </button>
            </p>
            <p className="search-results__text--bottom">
              Don't have an account?{' '}
              <button className="search-results__register-link" onClick={handleRegisterClick} aria-label="Go to Register Page">
                Register
              </button>{' '}
              now!
            </p>
          </div>
          <div className="search-results__card-media-container">
            {results.length > 0 ? (
              results.map(result => (
                <div key={result.id} className="search-results__card">
                  <a href={`https://www.themoviedb.org/${result.media_type}/${result.id}`} className="search-results__link" target="_blank" rel="noopener noreferrer">
                    {result.poster_path ? (
                      <img
                        className="search-results__poster"
                        alt={result.title || result.name}
                        src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                        onError={(e) => { e.target.src = DefaultVideoImg; }}
                      />
                    ) : (
                      <div className="search-results__no-image">
                        <img
                          className="search-results__poster search-results__poster--default"
                          alt={result.title || result.name}
                          src={DefaultVideoImg}
                        />
                        <span className="search-results__error-no-img-txt">No Image Available for:</span>
                        <span className="search-results__error-no-img-title">{result.title || result.name}</span>
                      </div>
                    )}
                    <img
                      className="search-results__media-icon"
                      src={getMediaTypeIcon(result.media_type)}
                      alt={result.media_type}
                    />
                  </a>
                </div>
              ))
            ) : (
              <div className="search-results__no-results">
                <img src={NoDataImg} alt="No results found" />
                <p className="search-results__no-results-copy">No results found for your search. Try a different title!</p>
              </div>
            )}
          </div>
        </div>
        <div className="search-results__background">
          <AnimatedBg />
        </div>
      </div>
    </>
  );
};

export default SearchResultsPage;