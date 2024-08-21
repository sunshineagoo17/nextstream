import { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faUsersViewfinder, faFaceKissWinkHeart, faChildren, faFilm, faTv, faPlus, faPalette, faHandSpock, faQuidditch, faClapperboard, faMask, faFingerprint, faChevronDown, faChevronCircleDown, faChevronCircleUp, faVideoCamera, faHeart, faMinus, faPlay, faTimes, faCalendarPlus, faSearch, faBomb, faStar, faUserSecret, faRedo, faGhost, faLaugh, faTheaterMasks, faBolt, faMap, faGlobe, faTrophy } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import BlobBg from '../../components/BlobBg/BlobBg';
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar';
import './FavouritesPage.scss';

const FavouritesPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [faves, setFaves] = useState([]);
  const [filteredFaves, setFilteredFaves] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState({});
  const [displayedFaves, setDisplayedFaves] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [filter, setFilter] = useState('');
  const { isAuthenticated } = useContext(AuthContext);
  const calendarRef = useRef(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const fetchFaves = async () => {
      if (!isAuthenticated) return;

      setIsLoading(true);
      try {
        const response = await api.get(`/api/faves/${userId}/faves`, {
          params: {
            page: 1,
            limit: 1000,
            search: searchQuery,
            filter,
          },
        });
        const newFaves = response.data;
        setFaves(newFaves);
        setFilteredFaves(newFaves);
        setDisplayedFaves(newFaves.slice(0, 4));
      } catch (error) {
        console.error('Error fetching faves:', error);
        setAlert({ message: 'Error fetching favorites. Please try again later.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaves();
  }, [userId, isAuthenticated, searchQuery, filter]);

  useEffect(() => {
    const updatePlaceholder = () => {
      const input = document.querySelector('.faves-page__search-input');
      if (window.innerWidth < 768) {
        input.placeholder = 'Search...';
      } else if (window.innerWidth < 1280) {
        input.placeholder = 'Search for titles...';
      } else {
        input.placeholder = 'Search for movies, shows, or genres...';
      }
    };

    updatePlaceholder();
    window.addEventListener('resize', updatePlaceholder);

    return () => {
      window.removeEventListener('resize', updatePlaceholder);
    };
  }, []);

  const handleShowMore = (id) => {
    setShowFullDescription((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  const toggleFaves = () => {
    if (isExpanded) {
      setDisplayedFaves(filteredFaves.slice(0, 4));
    } else {
      setDisplayedFaves(filteredFaves.slice(0, displayedFaves.length + 8));
    }
    setIsExpanded(!isExpanded);
  };

  const handlePlayTrailer = async (media_id, media_type) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/faves/${userId}/trailer/${media_type}/${media_id}`);
      const trailerData = response.data;
      if (trailerData && trailerData.trailerUrl) {
        setTrailerUrl(trailerData.trailerUrl);
        setIsModalOpen(true);
      } else {
        setAlert({ message: 'Apologies, the trailer was not found.', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
      setAlert({ message: 'Error fetching trailer.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCalendar = async (title, mediaType, mediaId) => {
    let duration = 0;
    try {
      if (mediaType === 'movie') {
        const movieDetails = await api.get(`/api/tmdb/movie/${mediaId}`);
        duration = movieDetails.data.runtime || 0;
        if (duration === 0) {
          showAlert("Duration's not available for this media.", 'info');
        }
      } else if (mediaType === 'tv') {
        const tvDetails = await api.get(`/api/tmdb/tv/${mediaId}`);
        duration = tvDetails.data.episode_run_time[0] || 0;
        if (duration > 0) {
          showAlert('Duration is based on the very first episode.', 'info');
        }
      }
      if (duration === 0) {
        showAlert("Duration's not available for this media.", 'info');
      }
    } catch (error) {
      console.error('Error fetching duration data:', error);
      showAlert('Failed to fetch media duration.', 'error');
      return;
    }

    setEventTitle(title);
    setSelectedMediaType(mediaType);
    setSelectedMediaId(mediaId);
    setDuration(duration);
    setShowCalendar(true);
  };

  const handleCloseCalendar = () => {
    setShowCalendar(false);
  };

  const handleSaveEvent = async (eventTitle, eventDate) => {
    try {
      const newEvent = {
        title: eventTitle,
        start: eventDate,
        end: eventDate,
        media_id: selectedMediaId,
        userId,
      };
      await api.post(`/api/calendar/${userId}/events`, newEvent);
      setShowCalendar(false);
    } catch (error) {
      console.error('Error saving event:', error);
      if (error.response && error.response.status === 401) {
        showAlert('You are not authorized. Please log in again.', 'error');
      } else {
        showAlert('Error saving event. Please try again later.', 'error');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTrailerUrl('');
  };

  const handleSearchQuery = async () => {
    setIsSearching(true);
    try {
      setPage(1);
      const lowerCaseQuery = searchQuery.toLowerCase();
      const response = await api.get(`/api/faves/${userId}/faves`, {
        params: {
          search: lowerCaseQuery,
          filter,
          page: 1,
          limit: 1000,
        },
      });
      const filtered = response.data;
      setFaves(filtered);
      setFilteredFaves(filtered);
      setDisplayedFaves(filtered.slice(0, 4));
      setIsExpanded(false);
    } catch (error) {
      console.error('Error searching:', error);
      setAlert({ message: 'Error during search. Please try again later.', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      handleSearchQuery();
    }
  };

  const handleSearchClick = (title, name) => {
    const query = title || name;
    const encodedQuery = encodeURIComponent(query);
    navigate(`/search?q=${encodedQuery}`);
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const clearSearchQuery = () => {
    setSearchQuery('');
    setFilter('');
    setPage(1);
    setFilteredFaves(faves);
    setDisplayedFaves(faves.slice(0, 4));
    setIsExpanded(false);
  };

  const applyFilter = async (filterType) => {
    setFilter(filterType);
    setPage(1);
    setIsExpanded(false);

    try {
      setIsLoading(true);
      const response = await api.get(`/api/faves/${userId}/faves`, {
        params: {
          search: searchQuery,
          filter: filterType,
          page: 1,
          limit: 1000,
        },
      });
      const filtered = response.data;
      setFaves(filtered);
      setFilteredFaves(filtered);
      setDisplayedFaves(filtered.slice(0, 4));
    } catch (error) {
      console.error('Error filtering:', error);
      setAlert({ message: 'Error during filtering. Please try again later.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMoreMedia = async () => {
    setIsLoading(true); // Start loader
  
    try {
      const response = await api.get(`/api/faves/${userId}/faves`, {
        params: {
          page: page + 1,
          limit: 4,
          search: searchQuery,
          filter,
        },
      });
  
      const newFaves = response.data;
  
      // Ensure no duplicates are added
      const uniqueNewFaves = newFaves.filter(
        (newFave) =>
          !displayedFaves.some(
            (displayedFave) =>
              displayedFave.media_id === newFave.media_id && displayedFave.media_type === newFave.media_type
          )
      );
  
      // Add new faves to the list and update the page number
      setDisplayedFaves((prevFaves) => [...prevFaves, ...uniqueNewFaves]);
      setFaves((prevFaves) => [...prevFaves, ...uniqueNewFaves]);
      setFilteredFaves((prevFaves) => [...prevFaves, ...uniqueNewFaves]);
      setPage(page + 1);
    } catch (error) {
      console.error('Error fetching more media:', error);
      setAlert({ message: 'Error fetching more media. Please try again later.', type: 'error' });
    } finally {
      setIsLoading(false); // Stop loader after the media has been successfully added
    }
  };  

  return (
    <div className="faves-page">
      <BlobBg />
      <h1 className="faves-page__title">
        Your Favourites <FontAwesomeIcon icon={faHeart} className="faves-page__heart-icon" />
      </h1>
      <div className="faves-page__content">
        <div className="faves-page__search-bar-container">
          <div className="faves-page__search-bar">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchEnter}
              className="faves-page__search-input"
            />
            <FontAwesomeIcon icon={faSearch} onClick={handleSearchQuery} className="faves-page__magnifying-glass-icon" />
            {searchQuery && (
              <FontAwesomeIcon icon={faTimes} onClick={clearSearchQuery} className="faves-page__clear-icon" />
            )}
          </div>
        </div>
        <div className="faves-page__filters">
          <div className="faves-page__filter-card" onClick={() => applyFilter('popular')}>
            <div className="faves-page__filter-label faves-page__label-featured">Featured</div>
            <FontAwesomeIcon icon={faStar} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Popular</p>
          </div>
          <div className="faves-page__filter-card" onClick={() => applyFilter('new')}>
            <div className="faves-page__filter-label faves-page__label-featured">Featured</div>
            <FontAwesomeIcon icon={faBolt} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">New</p>
          </div>
          <div className="faves-page__filter-card" onClick={() => applyFilter('top-rated')}>
            <div className="faves-page__filter-label faves-page__label-featured">Featured</div>
            <FontAwesomeIcon icon={faTrophy} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Top Rated</p>
          </div>
          <div className="faves-page__filter-card" onClick={() => applyFilter('adult')}>
            <div className="faves-page__filter-label faves-page__label-audiences">Audiences</div>
            <FontAwesomeIcon icon={faUsersViewfinder} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Broad Audience</p>
          </div>
          <div className="faves-page__filter-card" onClick={() => applyFilter('children')}>
            <div className="faves-page__filter-label faves-page__label-audiences">Audiences</div>
            <FontAwesomeIcon icon={faChildren} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Family</p>
          </div>
          <div className="faves-page__filter-card" onClick={() => applyFilter('international')}>
            <div className="faves-page__filter-label faves-page__label-cultural">Cultural</div>
            <FontAwesomeIcon icon={faGlobe} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">International</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('adventure')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faMap} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Adventure</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('action')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faBomb} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Action</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('animation')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faPalette} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Animation</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('comedy')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faLaugh} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Comedy</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('crime')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faFingerprint} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Crime</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('documentary')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faClapperboard} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Documentary</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('drama')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faTheaterMasks} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Drama</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('fantasy')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faQuidditch} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Fantasy</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('horror')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faGhost} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Horror</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('mystery')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faUserSecret} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Mystery</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('reality')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faVideoCamera} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Reality</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('romance')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faFaceKissWinkHeart} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Romance</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('science-fiction')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faHandSpock} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Science Fiction</p>
          </div>
          <div className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('thriller')}>
            <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
            <FontAwesomeIcon icon={faMask} className="faves-page__filter-icon" />
            <p className="faves-page__filter-card-title">Thriller</p>
          </div>
        </div>
        {alert && <CustomAlerts message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        {isSearching ? (
          <Loader />
        ) : (
          <div className="faves-page__grid">
            {displayedFaves.length > 0 ? (
              displayedFaves.map((fave) => (
                <div key={`${fave.media_id}-${fave.media_type}-${fave.title}`} className="faves-page__card">
                  <div className="faves-page__poster-container">
                    <img
                      src={fave.poster_path ? `https://image.tmdb.org/t/p/w500${fave.poster_path}` : 'default-poster-url'}
                      alt={fave.title}
                      className="faves-page__poster"
                    />
                    <div className="faves-page__play-overlay" onClick={() => handlePlayTrailer(fave.media_id, fave.media_type)}>
                      <FontAwesomeIcon icon={faPlay} className="faves-page__play-icon" />
                    </div>
                  </div>
                  <h2 className="faves-page__subtitle">{fave.title}</h2>
                  <p className="faves-page__media-icon">
                    <a href={`https://www.themoviedb.org/${fave.media_type}/${fave.media_id}`} target="_blank" rel="noopener noreferrer">
                      <FontAwesomeIcon icon={fave.media_type === 'tv' ? faTv : faFilm} className="faves-page__media-icon-link" />
                    </a>
                    <FontAwesomeIcon icon={faCalendarPlus} onClick={() => handleAddToCalendar(fave.title, fave.media_type, fave.media_id)} className="faves-page__cal-icon" />
                    <FontAwesomeIcon icon={faSearch} onClick={() => handleSearchClick(fave.title, fave.name)} className="faves-page__search-icon" />
                  </p>
                  <p className="faves-page__text">Genre: {fave.genres.join(', ')}</p>
                  <p className={`faves-page__description ${showFullDescription[fave.media_id] ? 'faves-page__description--expanded' : ''}`}>
                    Description: {fave.overview}
                  </p>
                  <button className="faves-page__more-button" onClick={() => handleShowMore(fave.media_id)}>
                    <FontAwesomeIcon icon={showFullDescription[fave.media_id] ? faChevronCircleUp : faChevronCircleDown} className="faves-page__load-descript" />
                  </button>
                </div>
              ))
            ) : (
              <p className="faves-page__text">No favourites found.</p>
            )}
          </div>
        )}
        <div className="faves-page__action-buttons">
          {filteredFaves.length > 4 && (
            <button className="faves-page__show-more" onClick={toggleFaves}>
              <FontAwesomeIcon icon={isExpanded ? faMinus : faPlus} /> {isExpanded ? 'Hide Cards' : 'Show More'}
            </button>
          )}
          <button className="faves-page__reset" onClick={clearSearchQuery}>
            <FontAwesomeIcon icon={faRedo} /> Reset View
          </button>
          <button className="faves-page__fetch-faves" onClick={fetchMoreMedia}>
            <FontAwesomeIcon icon={faChevronDown} /> Fetch Faves
          </button>
        </div>
        {isLoading && <Loader />}
        {isModalOpen && (
          <div className="faves-page__modal">
            <div className="faves-page__modal-content">
              <button className="faves-page__modal-content-close" onClick={closeModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>
              {isLoading ? (
                <Loader />
              ) : (
                <iframe
                  width="560"
                  height="315"
                  src={trailerUrl}
                  title="YouTube video player"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
          </div>
        )}
        {showCalendar && (
          <div className="faves-page__calendar-modal">
            <button className="faves-page__calendar-close-btn" onClick={handleCloseCalendar}>
              <FontAwesomeIcon icon={faClose} className="faves-page__close-icon" />
            </button>
            <Calendar
              userId={userId}
              eventTitle={eventTitle}
              mediaType={selectedMediaType}
              duration={duration}
              handleSave={handleSaveEvent}
              onClose={handleCloseCalendar}
              ref={calendarRef}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FavouritesPage;