import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import 'react-toastify/dist/ReactToastify.css';
import './SearchResultsPage.scss';
import Loader from '../../components/Loader/Loader';

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

        // Limiting to three results
        const limitedResults = response.data.results.slice(0, 3);
        setResults(limitedResults);

        if (limitedResults.length === 0) {
          // Display toast message if no results found
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

  return (
    <>
      <ToastContainer /> {/* ToastContainer component for displaying toast notifications */}
      {isLoading && <Loader />}
      <div className="search-results">
        <div className="search-results__content-card">
          <h1 className="search-results__title">Search Results</h1>
          <p className="search-results__intro">Here's where you'll find your top 3 results.</p>
          <p className="search-results__text">
            To view where these titles are streaming and add them to your calendar, please{' '}
            <button className="search-results__login-link" onClick={handleLoginClick} aria-label="Go to Login Page">
              sign in.
            </button>
          </p>
          <p className="search-results__text">
            Don't have an account?{' '}
            <button className="search-results__register-link" onClick={handleRegisterClick} aria-label="Go to Register Page">
              Register
            </button>{' '}
            now!
          </p>
          <div className="search-results__grid">
            {results.map(result => (
              <div key={result.id} className="search-results__card">
                <a href={`https://www.themoviedb.org/${result.media_type}/${result.id}`} target="_blank" rel="noopener noreferrer">
                  <img
                    className="search-results__poster"
                    alt={result.title || result.name}
                    src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                  />
                </a>
                <div className="search-results__info">
                  <h2 className="search-results__name">{result.title || result.name}</h2>
                </div>
              </div>
            ))}
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