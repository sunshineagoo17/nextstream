import { useState, useContext, useEffect, useRef } from 'react';
import { Tooltip } from 'react-tooltip';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClose, faUsersViewfinder, faFaceKissWinkHeart, faChildren, faFilm, faTv, faPlus, faPalette,
  faHandSpock, faQuidditch, faClapperboard, faMask, faFingerprint, faChevronDown, faChevronCircleDown,
  faChevronCircleUp, faVideoCamera, faHeart, faMinus, faPlay, faTimes, faCalendarPlus, faSearch,
  faBomb, faStar, faUserSecret, faRedo, faGhost, faLaugh, faTheaterMasks, faBolt, faMap, faGlobe, faTrophy,
  faLock, faUnlock, faTrash
} from '@fortawesome/free-solid-svg-icons';
import HomeCinemaSVG from "../../assets/images/home-cinema.svg";
import LikesSVG from "../../assets/images/like-faves.svg";
import NoResultsSVG from "../../assets/images/search-faves.svg";
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
  const [isLoading, setIsLoading] = useState(true);  
  const [alert, setAlert] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [eventTitle, setEventTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState('');
  const { isAuthenticated } = useContext(AuthContext);
  const calendarRef = useRef(null);
  const [page, setPage] = useState(1);
  const [lockedMedia, setLockedMedia] = useState({});

  useEffect(() => {
    const fetchFaves = async () => {
      if (!isAuthenticated) return;

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
        console.log('Fetched favourites:', newFaves);
        setFaves(newFaves);
        setFilteredFaves(newFaves);
        setDisplayedFaves(newFaves.slice(0, 4));
      } catch (error) {
        console.error('Error fetching faves:', error);
        setAlert({ message: 'Error fetching favourites. Please try again later.', type: 'error' });
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
      console.log(`Fetching trailer for ${media_type} with ID: ${media_id}`);
      const response = await api.get(`/api/faves/${userId}/trailer/${media_type}/${media_id}`);
      const trailerData = response.data;
      console.log('Trailer Data:', trailerData);
  
      if (trailerData && trailerData.trailerUrl) {
        setTrailerUrl(trailerData.trailerUrl);
        setIsModalOpen(true);
      } else {
        console.warn('No trailer found in the response:', trailerData);
        showAlert('Apologies, the trailer is not available.', 'info');
      }
    } catch (error) {
      console.error('Error fetching trailer:', error.response ? error.response.data : error.message);
      showAlert('Apologies, the trailer is not available.', 'info');
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
        console.log('Movie details:', movieDetails.data);
        if (duration === 0) {
          showAlert("Duration's not available for this media.", 'info');
        }
      } else if (mediaType === 'tv') {
        const tvDetails = await api.get(`/api/tmdb/tv/${mediaId}`);
        duration = tvDetails.data.episode_run_time[0] || 0;
        console.log('TV details:', tvDetails.data);
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
      console.log('Saving event:', newEvent);
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
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
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
  
      const filtered = response.data.filter((item) => {
        const titleMatch = item.title.toLowerCase().includes(lowerCaseQuery);
        const genreMatch = item.genres.some((genre) =>
          genre.toLowerCase().includes(lowerCaseQuery)
        );
        const mediaTypeMatch = item.media_type.toLowerCase().includes(lowerCaseQuery);
  
        return titleMatch || genreMatch || mediaTypeMatch;
      });
  
      console.log('Filtered results:', filtered);
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
    setHasSearched(false);
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
      console.log('Filtered faves:', filtered);
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
    setIsLoading(true); 

    try {
      let newFaves = [];
      let currentPage = page;

      while (newFaves.length < 4) {
        const response = await api.get(`/api/faves/${userId}/faves`, {
          params: {
            page: currentPage + 1,
            limit: 4,
            search: searchQuery,
            filter,
          },
        });

        const fetchedFaves = response.data;
        console.log('Fetched more media:', fetchedFaves);

        // Filter out duplicates
        const uniqueFaves = fetchedFaves.filter(
          (fave) =>
            !displayedFaves.some(
              (displayedFave) =>
                displayedFave.media_id === fave.media_id && displayedFave.media_type === fave.media_type
            )
        );

        newFaves = [...newFaves, ...uniqueFaves];

        // If there are no more items to fetch, break the loop and show a toast notification
        if (fetchedFaves.length < 4) {
          showAlert("That's all for now. There's no more media available.", "info");
          break;
        }

        currentPage += 1;
      }

      // Add exactly 4 new unique items to the displayed list
      setDisplayedFaves((prevFaves) => [...prevFaves, ...newFaves.slice(0, 4)]);
      setPage(currentPage);
    } catch (error) {
      console.error('Error fetching more media:', error);
      setAlert({ message: 'Error fetching more media. Please try again later.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLockMedia = (media_id, media_type) => {
    setLockedMedia((prevLocked) => ({
      ...prevLocked,
      [`${media_id}-${media_type}`]: !prevLocked[`${media_id}-${media_type}`],
    }));
  };

  const handleDeleteMedia = async (media_id, media_type) => {
    if (lockedMedia[`${media_id}-${media_type}`]) {
      showAlert('This media item is locked and cannot be deleted.', 'info');
      return;
    }
  
    try {
      console.log(`Deleting media: ID ${media_id}, Type ${media_type}`);
      await api.delete(`/api/faves/${userId}/delete/${media_id}/${media_type}`);
      
      // Remove the item from faves and displayedFaves
      setFaves((prevFaves) =>
        prevFaves.filter((fave) => !(fave.media_id === media_id && fave.media_type === media_type))
      );
      setFilteredFaves((prevFaves) =>
        prevFaves.filter((fave) => !(fave.media_id === media_id && fave.media_type === media_type))
      );
      setDisplayedFaves((prevDisplayed) =>
        prevDisplayed.filter((fave) => !(fave.media_id === media_id && fave.media_type === media_type))
      );
      
      showAlert('Media removed from favourites.', 'success');
    } catch (error) {
      console.error('Error deleting media:', error);
      showAlert('Error deleting media. Please try again later.', 'error');
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

        <div className="faves-page__search-actions">
          <button className="faves-page__clear-search" onClick={clearSearchQuery}>
            <FontAwesomeIcon icon={faTimes} /> Clear Search
          </button>
          <button className="faves-page__reset-filters" onClick={() => applyFilter('')}>
            <FontAwesomeIcon icon={faRedo} /> Reset Filters
          </button>
        </div>

        <div className="faves-page__copy-container">
          <p className="faves-page__copy">
            <p className="faves-page__copy-header">Your Favourites, Your Way!</p>
            Search, filter, and explore your favourite movies and shows. Use the filter cards to narrow your results, expand cards for details, watch trailers, and add to your calendar. Click on the lock icon to save your must-watch, or remove them with the trash icon. Fetch more with the button below and enjoy a seamless streaming experience!
          </p>
        </div>
        <div className="faves-page__filters-container">
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
        </div>
        {alert && <CustomAlerts message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        {isSearching ? (
          <Loader />
        ) : (
          <>
            {isLoading && displayedFaves.length === 0 ? (
              <div className="faves-page__loading-container">
                <img src={HomeCinemaSVG} alt="Loading..." className="faves-page__loading-svg" />
                <p className="faves-page__text--center">Favourites are currently loading...</p>
              </div>
            ) : displayedFaves.length > 0 ? (
              <div className="faves-page__grid">
                {displayedFaves.map((fave) => (
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
                        <FontAwesomeIcon 
                          icon={fave.media_type === 'tv' ? faTv : faFilm} 
                          className="faves-page__media-icon-link" 
                          data-tooltip-id="mediaTypeTooltip" 
                          data-tooltip-content={fave.media_type === 'tv' ? 'Media Type: TV Show' : 'Media Type: Movie'} 
                        />
                      </a>
                      <FontAwesomeIcon 
                        icon={faCalendarPlus} 
                        onClick={() => handleAddToCalendar(fave.title, fave.media_type, fave.media_id)} 
                        className="faves-page__cal-icon" 
                        data-tooltip-id="calendarTooltip" 
                        data-tooltip-content="Add to Calendar" 
                      />
                      <FontAwesomeIcon 
                        icon={faSearch} 
                        onClick={() => handleSearchClick(fave.title, fave.name)} 
                        className="faves-page__search-icon" 
                        data-tooltip-id="searchTooltip" 
                        data-tooltip-content="Find Streams" 
                      />
                      <FontAwesomeIcon 
                        icon={lockedMedia[`${fave.media_id}-${fave.media_type}`] ? faLock : faUnlock} 
                        onClick={() => handleLockMedia(fave.media_id, fave.media_type)} 
                        className={`faves-page__lock-icon ${lockedMedia[`${fave.media_id}-${fave.media_type}`] ? 'faves-page__lock-icon--locked' : ''}`} 
                        data-tooltip-id="lockTooltip" 
                        data-tooltip-content={lockedMedia[`${fave.media_id}-${fave.media_type}`] ? 'Unlock Media' : 'Lock Media'} 
                      />
                      <FontAwesomeIcon 
                        icon={faTrash} 
                        onClick={() => handleDeleteMedia(fave.media_id, fave.media_type)} 
                        className="faves-page__trash-icon" 
                        data-tooltip-id="trashTooltip" 
                        data-tooltip-content="Delete from Favourites" 
                      />
                      <Tooltip id="mediaTypeTooltip" place="top" />
                      <Tooltip id="calendarTooltip" place="top" />
                      <Tooltip id="searchTooltip" place="top" />
                      <Tooltip id="lockTooltip" place="top" />
                      <Tooltip id="trashTooltip" place="top" />
                    </p>
                    <p className="faves-page__text">Genre: {fave.genres.join(', ')}</p>
                    <p className={`faves-page__description ${showFullDescription[fave.media_id] ? 'faves-page__description--expanded' : ''}`}>
                      Description: {fave.overview}
                    </p>
                    <button className="faves-page__more-button" onClick={() => handleShowMore(fave.media_id)}>
                      <FontAwesomeIcon icon={showFullDescription[fave.media_id] ? faChevronCircleUp : faChevronCircleDown} className="faves-page__load-descript" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              !isLoading && hasSearched ? (
                <div className="faves-page__no-faves-container">
                  <img src={NoResultsSVG} alt="Likes Img" className="faves-page__no-faves-svg" />
                  <p className="faves-page__text faves-page__text--center">
                    No results found for your search. Please try a different title or genre.
                  </p>
                </div>
              ) : (
                <div className="faves-page__no-faves-container">
                  <img src={LikesSVG} alt="Likes Img" className="faves-page__no-faves-svg" />
                  <p className="faves-page__text--center">
                    You haven't added any favourites yet. Explore our <a className="faves-page__text-link" href={`/top-picks/${userId}`}>Top Picks</a> to find something to watch!
                  </p>
                </div>
              )
            )}
          </>
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
        {isLoading && displayedFaves.length > 0 && (
          <div className="faves-page__loader-container">
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
};

export default FavouritesPage;