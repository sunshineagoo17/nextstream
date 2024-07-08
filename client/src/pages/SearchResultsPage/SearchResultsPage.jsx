import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './SearchResultsPage.scss';
import Loader from '../../components/Loader/Loader';

const SearchResultsPage = () => {
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();

  const query = new URLSearchParams(location.search).get('q');

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/search`, {
          params: {
            query,
            language: 'en-US',
            region: 'CA', // Adjust region if need be
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
        <div className="search-results__container">
          <h1 className="search-results__title">Search Results</h1>
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
      </div>
    </>
  );
};

export default SearchResultsPage;