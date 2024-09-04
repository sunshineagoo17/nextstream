import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader/Loader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlay, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons'; 
import UserRating from '../TopPicksPage/sections/UserRating/UserRating'; 
import './NextSearch.scss';
import DefaultPoster from "../../assets/images/posternoimg-icon.png";

const NextSearch = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [popularMedia, setPopularMedia] = useState([]);
  const [mediaType, setMediaType] = useState('streaming');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLeftArrowResults, setShowLeftArrowResults] = useState(false);
  const [showRightArrowResults, setShowRightArrowResults] = useState(false);
  const [showLeftArrowPopular, setShowLeftArrowPopular] = useState(false);
  const [showRightArrowPopular, setShowRightArrowPopular] = useState(false);

  const location = useLocation();
  const searchScrollRef = useRef(null);
  const popularScrollRef = useRef(null);

  const query = new URLSearchParams(location.search).get('q');

  const checkForOverflow = (scrollRef, setShowLeft, setShowRight) => {
    if (!scrollRef || !scrollRef.current) {
      return;
    }

    const { scrollWidth, clientWidth, scrollLeft } = scrollRef.current;
    setShowRight(scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth);
    setShowLeft(scrollLeft > 0);
  };

  useEffect(() => {
    const searchScrollEl = searchScrollRef.current;

    const handleScrollResults = () => {
      checkForOverflow(searchScrollRef, setShowLeftArrowResults, setShowRightArrowResults);
    };

    if (searchScrollEl) {
      checkForOverflow(searchScrollRef, setShowLeftArrowResults, setShowRightArrowResults);
      searchScrollEl.addEventListener('scroll', handleScrollResults);
    }

    return () => {
      if (searchScrollEl) {
        searchScrollEl.removeEventListener('scroll', handleScrollResults);
      }
    };
  }, [results]);

  useEffect(() => {
    const popularScrollEl = popularScrollRef.current;

    const handleScrollPopular = () => {
      checkForOverflow(popularScrollRef, setShowLeftArrowPopular, setShowRightArrowPopular);
    };

    if (popularScrollEl) {
      checkForOverflow(popularScrollRef, setShowLeftArrowPopular, setShowRightArrowPopular);
      popularScrollEl.addEventListener('scroll', handleScrollPopular);
    }

    return () => {
      if (popularScrollEl) {
        popularScrollEl.removeEventListener('scroll', handleScrollPopular);
      }
    };
  }, [popularMedia]);

  const handlePlayTrailer = async (mediaId, mediaType) => {
    try {
      const response = await api.get(`/api/tmdb/${mediaType}/${mediaId}/videos`);
      const { trailerUrl } = response.data;
      if (trailerUrl) {
        setTrailerUrl(trailerUrl);
        setIsModalOpen(true);
      } else {
        alert('No trailer available for this media');
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
      alert('Could not load the trailer. Please try again later.');
    }
  };

  const handleSearch = useCallback(async () => {
    if (searchQuery.trim() && isAuthenticated) {
      setIsLoading(true);
      try {
        const response = await api.get('/api/tmdb/search', {
          params: { query: searchQuery },
        });

        const filteredResults = await Promise.all(
          response.data.results
            .filter(result => result.media_type === 'movie' || result.media_type === 'tv' || result.media_type === 'person')
            .map(async result => {
              if (result.media_type === 'person') {
                const knownFor = result.known_for.map(item => ({
                  id: item.id,
                  title: item.title || item.name,
                  poster_path: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : DefaultPoster,
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
      const updatedPopularMedia = response.data.results.map(media => ({
        ...media,
        poster_path: media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : DefaultPoster,
        vote_average: media.vote_average,
      }));
      setPopularMedia(updatedPopularMedia);
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

  const clearSearch = () => {
    setSearchQuery('');
    setResults([]);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTrailerUrl('');
  };

  return (
    <div className="next-search">
      {/* Search Bar */}
      <div className="next-search__input-container">
        <FontAwesomeIcon 
            icon={faSearch}
            className="next-search__search-icon"
            onClick={handleSearch} 
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search for movies, shows, or actors..."
          className="next-search__input"
          disabled={!isAuthenticated}
        />
        <FontAwesomeIcon
          icon={faTimes}
          className="next-search__close-icon"
          onClick={clearSearch} 
        />
      </div>

      {/* Search Results Section */}
      {results.length > 0 && (
        <div className="next-search__results-section">
          <div className="next-search__carousel">
            {showLeftArrowResults && <FontAwesomeIcon icon={faChevronLeft} className="next-search__nav-arrow left" onClick={() => scrollLeft(searchScrollRef)} />}
            <div className="next-search__scroll-container-results" ref={searchScrollRef}>
              {isLoading ? (
                <Loader />
              ) : (
                results.map((result) => (
                  <div key={result.id} className="next-search__card next-search__card--results">
                    <h3 className="next-search__title--results">{result.title || result.name}</h3>
                    <div className="next-search__poster-container">
                        <img
                            src={result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : DefaultPoster}
                            alt={result.title || result.name}
                            className="next-search__poster next-search__poster--results"
                        />
                        <div className="next-search__rating-container">
                            <UserRating rating={(result.vote_average || 0) * 10} />
                        </div>
                        <div className="next-search__play-overlay" onClick={() => handlePlayTrailer(result.id, result.media_type)}>
                            <FontAwesomeIcon icon={faPlay} className="next-search__play-icon" />
                        </div>
                    </div>
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
            {showRightArrowResults && <FontAwesomeIcon icon={faChevronRight} className="next-search__nav-arrow right" onClick={() => scrollRight(searchScrollRef)} />}
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
          {showLeftArrowPopular && <FontAwesomeIcon icon={faChevronLeft} className="next-search__nav-arrow left" onClick={() => scrollLeft(popularScrollRef)} />}
          <div className="next-search__scroll-container-popular" ref={popularScrollRef}>
            {isLoading ? (
              <Loader />
            ) : popularMedia.length > 0 ? (
              popularMedia.map((media) => (
                <div key={media.id} className="next-search__card next-search__card--popular">
                  <h3 className="next-search__title--popular">{media.title || media.name}</h3>
                  <div className="next-search__poster-container">
                    <img
                      src={media.poster_path || DefaultPoster}
                      alt={media.title || media.name}
                      className="next-search__poster next-search__poster--popular"
                    />
                    <div className="next-search__rating-container">
                        <UserRating rating={(media.vote_average || 0) * 10} />
                    </div>
                    <div className="next-search__play-overlay" onClick={() => handlePlayTrailer(media.id, media.media_type || 'movie')}>
                      <FontAwesomeIcon icon={faPlay} className="next-search__play-icon" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="next-search__no-results">No popular media found.</p>
            )}
          </div>
          {showRightArrowPopular && <FontAwesomeIcon icon={faChevronRight} className="next-search__nav-arrow right" onClick={() => scrollRight(popularScrollRef)} />}
        </div>
      </div>

      {/* Trailer Modal */}
      {isModalOpen && (
        <div className="next-search__modal">
          <div className="next-search__modal-content">
            <button className="next-search__modal-content-close" onClick={closeModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <iframe
              width="560"
              height="315"
              src={trailerUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextSearch;