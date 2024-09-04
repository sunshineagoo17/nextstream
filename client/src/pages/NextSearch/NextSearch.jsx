import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import './NextSearch.scss';

const NextSearch = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popularMedia, setPopularMedia] = useState([]);
  const [mediaType, setMediaType] = useState('streaming');
  const location = useLocation();
  const searchScrollRef = useRef(null);
  const popularScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim() && isAuthenticated) {
      setIsLoading(true);
      try {
        const response = await api.get('/api/tmdb/search', {
          params: { query: searchQuery },
        });

        const filteredResults = await Promise.all(
          response.data.results
            .filter(
              result =>
                result.media_type === 'movie' ||
                result.media_type === 'tv' ||
                result.media_type === 'person'
            )
            .map(async result => {
              if (result.media_type === 'person') {
                const knownFor = result.known_for.map(item => ({
                  id: item.id,
                  title: item.title || item.name,
                  poster_path: item.poster_path,
                  media_type: item.media_type,
                }));
                return { ...result, knownFor };
              } else {
                const castResponse = await api.get(`/api/tmdb/${result.media_type}/${result.id}/credits`);
                return { ...result, cast: castResponse.data.cast.slice(0, 5) };
              }
            })
        );

        setResults(filteredResults);
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
      let endpoint;
      switch (type) {
        case 'on_tv':
          endpoint = 'tv/on_the_air';
          break;
        case 'for_rent':
          endpoint = 'movie/now_playing';
          break;
        case 'in_theatres':
          endpoint = 'movie/upcoming';
          break;
        case 'streaming':
        default:
          endpoint = 'movie/popular';
          break;
      }
      const response = await api.get(`/api/tmdb/${endpoint}`);
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

  const scrollLeft = (scrollRef) => {
    scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = (scrollRef) => {
    scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

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

      {/* Search Results Section */}
      {results.length > 0 && (
        <div className="next-search__results-section">
          <div className="next-search__carousel">
            <FontAwesomeIcon icon={faChevronLeft} className="next-search__nav-arrow left" onClick={() => scrollLeft(searchScrollRef)} />
            <div className="next-search__scroll-container-results" ref={searchScrollRef}>
              {isLoading ? (
                <Loader />
              ) : (
                results.map((result) => (
                  <div key={result.id} className="next-search__card next-search__card--results">
                    <h3 className="next-search__title">{result.title || result.name}</h3>
                    <img
                      src={`https://image.tmdb.org/t/p/w500${result.poster_path}`}
                      alt={result.title || result.name}
                      className="next-search__poster next-search__poster--results"
                    />
                    {/* Show cast or known for based on media type */}
                    {result.media_type === 'movie' || result.media_type === 'tv' ? (
                      result.cast && (
                        <div className="next-search__cast">
                          <h4>Cast:</h4>
                          <ul>
                            {result.cast.map((actor) => (
                              <li key={actor.id}>{actor.name}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    ) : result.media_type === 'person' && result.knownFor ? (
                      <div className="next-search__known-for">
                        <h4>Known For:</h4>
                        <ul>
                          {result.knownFor.map((media) => (
                            <li key={media.id}>
                              {media.title || media.name} ({media.media_type})
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </div>
            <FontAwesomeIcon icon={faChevronRight} className="next-search__nav-arrow right" onClick={() => scrollRight(searchScrollRef)} />
          </div>
        </div>
      )}

      {/* Popular Media Section */}
      <div className="next-search__popular-section">
        <div className="next-search__tabs">
          <div className="next-search__tabs-container">
            <button className={`next-search__tab ${mediaType === 'streaming' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('streaming')}>
              Streaming
            </button>
            <button className={`next-search__tab ${mediaType === 'on_tv' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('on_tv')}>
              On TV
            </button>
            <button className={`next-search__tab ${mediaType === 'for_rent' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('for_rent')}>
              For Rent
            </button>
            <button className={`next-search__tab ${mediaType === 'in_theatres' ? 'next-search__tab--active' : ''}`} onClick={() => setMediaType('in_theatres')}>
              In Theatres
            </button>
          </div>
        </div>
        <div className="next-search__carousel">
          <FontAwesomeIcon icon={faChevronLeft} className="next-search__nav-arrow left" onClick={() => scrollLeft(popularScrollRef)} />
          <div className="next-search__scroll-container-popular" ref={popularScrollRef}>
            {isLoading ? (
              <Loader />
            ) : popularMedia.length > 0 ? (
              popularMedia.map((media) => (
                <div key={media.id} className="next-search__card next-search__card--popular">
                  <h3 className="next-search__title">{media.title || media.name}</h3>
                  <img
                    src={`https://image.tmdb.org/t/p/w500${media.poster_path}`}
                    alt={media.title || media.name}
                    className="next-search__poster next-search__poster--popular"
                  />
                </div>
              ))
            ) : (
              <p className="next-search__no-results">No popular media found.</p>
            )}
          </div>
          <FontAwesomeIcon icon={faChevronRight} className="next-search__nav-arrow right" onClick={() => scrollRight(popularScrollRef)} />
        </div>
      </div>
    </div>
  );
};

export default NextSearch;