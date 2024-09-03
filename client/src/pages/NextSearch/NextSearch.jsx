import { useState, useEffect, useCallback, useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import './NextSearch.scss';

const NextSearch = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popularMedia, setPopularMedia] = useState([]);
  const [mediaType, setMediaType] = useState('streaming');
  const location = useLocation();

  const query = new URLSearchParams(location.search).get('q');

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim() && isAuthenticated) {
      setIsLoading(true);
      try {
        const response = await api.get('/api/tmdb/search', {
          params: { query: searchQuery },
        });
        setResults(response.data.results);
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [searchQuery, isAuthenticated]);

  const fetchPopularMedia = async (type) => {
    setIsLoading(true);
    try {
      const response = await api.get('/api/tmdb/popular', {
        params: { type },
      });
      setPopularMedia(response.data.results);
    } catch (error) {
      console.error('Error fetching popular media:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPopularMedia(mediaType);
  }, [mediaType]);

  useEffect(() => {
    if (query && isAuthenticated) {
      setSearchQuery(query);
      handleSearch();
    }
  }, [query, handleSearch, isAuthenticated]);

  return (
    <div className="next-search">
      {/* Search Bar */}
      <div className="next-search__input-container">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for movies, shows, or actors..."
          className="next-search__input"
          disabled={!isAuthenticated}
        />
        <button onClick={handleSearch} className="next-search__button" disabled={!isAuthenticated}>
          Search
        </button>
      </div>

      {/* Popular Media Section */}
      <div className="next-search__popular-section">
        <h2 className="next-search__section-title">What's Popular</h2>
        <div className="next-search__tabs">
          <button
            className={`next-search__tab ${mediaType === 'streaming' ? 'next-search__tab--active' : ''}`}
            onClick={() => setMediaType('streaming')}
          >
            Streaming
          </button>
          <button
            className={`next-search__tab ${mediaType === 'on_tv' ? 'next-search__tab--active' : ''}`}
            onClick={() => setMediaType('on_tv')}
          >
            On TV
          </button>
          <button
            className={`next-search__tab ${mediaType === 'for_rent' ? 'next-search__tab--active' : ''}`}
            onClick={() => setMediaType('for_rent')}
          >
            For Rent
          </button>
          <button
            className={`next-search__tab ${mediaType === 'in_theatres' ? 'next-search__tab--active' : ''}`}
            onClick={() => setMediaType('in_theatres')}
          >
            In Theatres
          </button>
        </div>

        {/* Popular Media Grid */}
        {isLoading ? (
          <Loader />
        ) : (
          <div className="next-search__grid">
            {popularMedia.map((media) => (
              <div key={media.id} className="next-search__card">
                <img
                  src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                  alt={media.title || media.name}
                  className="next-search__poster"
                />
                <h3 className="next-search__title">{media.title || media.name}</h3>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Results Section */}
      <div className="next-search__results-section">
        <h2 className="next-search__section-title">Search Results</h2>
        {isLoading ? (
          <Loader />
        ) : results.length > 0 ? (
          <div className="next-search__grid">
            {results.map((result) => (
              <div key={result.id} className="next-search__card">
                {/* Display media based on its type */}
                {result.media_type === 'movie' && (
                  <div className="next-search__movie">
                    <h3 className="next-search__title">{result.title}</h3>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                      alt={result.title}
                      className="next-search__poster"
                    />
                  </div>
                )}
                {result.media_type === 'tv' && (
                  <div className="next-search__tv">
                    <h3 className="next-search__title">{result.name}</h3>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                      alt={result.name}
                      className="next-search__poster"
                    />
                  </div>
                )}
                {result.media_type === 'person' && (
                  <div className="next-search__person">
                    <h3 className="next-search__title">{result.name}</h3>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${result.profile_path}`}
                      alt={result.name}
                      className="next-search__poster"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="next-search__no-results">No results found.</p>
        )}
      </div>
    </div>
  );
};

export default NextSearch;