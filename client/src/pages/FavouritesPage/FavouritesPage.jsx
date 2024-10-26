import { useState, useContext, useEffect, useRef, useCallback } from 'react';
import { Tooltip } from 'react-tooltip';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClose, faUsersViewfinder, faFaceKissWinkHeart, faChildren, faFilm, faTv, faPlus, faPalette,
  faHandSpock, faQuidditch, faClapperboard, faMask, faFingerprint, faChevronDown, faChevronCircleDown,
  faChevronCircleUp, faVideoCamera, faHeart, faMinus, faPlay, faTimes, faCalendarPlus, faSearch,
  faBomb, faStar, faUserSecret, faRedo, faGhost, faLaugh, faTheaterMasks, faBolt, faMap, faGlobe, faTrophy,
  faLock, faUnlock, faTrash, faShareAlt, faClock, faEye, faBookmark,
  faLightbulb,
  faEraser,
  faBackspace
} from '@fortawesome/free-solid-svg-icons';
import HomeCinemaSVG from "../../assets/images/home-cinema.svg";
import LikesSVG from "../../assets/images/like-faves.svg";
import NoResultsSVG from "../../assets/images/search-faves.svg";
import api from '../../services/api';
import BlobBg from '../../components/Backgrounds/BlobBg/BlobBg';
import Loader from '../../components/Loaders/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import DefaultPoster from '../../assets/images/posternoimg-icon.png';
import Calendar from '../CalendarPage/sections/Calendar/Calendar';
import VoiceSearchFaves from '../../components/VoiceInteraction/VoiceSearchFaves/VoiceSearchFaves';
import './FavouritesPage.scss';

const FavouritesPage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, name, setName } = useContext(AuthContext);
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
  const calendarRef = useRef(null);
  const calendarModalRef = useRef(null);
  const [page, setPage] = useState(1);
  const trailerModalRef = useRef(null);
  const [lockedMedia, setLockedMedia] = useState({});
  const [mediaStatuses, setMediaStatuses] = useState({
    to_watch: [],
    scheduled: [],
    watched: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated) return;
  
      try {
        const [favesResponse, toWatchResponse, scheduledResponse, watchedResponse] = await Promise.all([
          api.get(`/api/faves/${userId}/faves`, {
            params: {
              page: 1,
              limit: 1000,
              search: searchQuery,
              filter,
            },
          }),
          api.get(`/api/media-status/to_watch`),
          api.get(`/api/media-status/scheduled`),
          api.get(`/api/media-status/watched`)
        ]);
  
        const fetchedFaves = favesResponse.data;
        const toWatch = toWatchResponse.data;
        const scheduled = scheduledResponse.data;
        const watched = watchedResponse.data;
  
        // Merge status into faves
        const favesWithStatus = fetchedFaves.map(fave => {
          const statusItem = toWatch.find(item => item.media_id === fave.media_id) 
                            || scheduled.find(item => item.media_id === fave.media_id) 
                            || watched.find(item => item.media_id === fave.media_id);
  
          return {
            ...fave,
            status: statusItem ? statusItem.status : null
          };
        });
  
        setFaves(favesWithStatus);
        setFilteredFaves(favesWithStatus);
        setDisplayedFaves(favesWithStatus.slice(0, 4));
  
        setMediaStatuses({
          to_watch: toWatch,
          scheduled: scheduled,
          watched: watched,
        });
      } catch (error) {
        setAlert({ message: 'Error fetching favourites. Please try again later.', type: 'error' });
      } finally {
        setIsLoading(false);
      }
    };
  
    if (userId) {
      fetchData();
    }
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

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          const response = await api.get(`/api/profile/${userId}`);
          setName(response.data.name);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [userId, setName]);

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
        showAlert('Apologies, the trailer is not available.', 'info');
      }
    } catch (error) {
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
      } else if (mediaType === 'tv') {
        const tvDetails = await api.get(`/api/tmdb/tv/${mediaId}`);
        duration = tvDetails.data.episode_run_time[0] || 0;
      }

      setEventTitle(title);
      setSelectedMediaType(mediaType);
      setSelectedMediaId(mediaId);
      setDuration(duration);
      setShowCalendar(true);

      // Update media status to "scheduled" immediately
      await moveMediaItem(mediaId, 'scheduled');
    } catch (error) {
      showAlert('Failed to fetch media duration.', 'error');
    }
  };

  const moveMediaItem = async (media_id, newStatus) => {
    try {
      // Send request to update the media status in the database
      await api.put(`/api/media-status/${media_id}`, { status: newStatus });
  
      // Update UI with the new status
      setFaves((prevFaves) => {
        return prevFaves.map((fave) =>
          fave.media_id === media_id ? { ...fave, status: newStatus } : fave
        );
      });
  
      setFilteredFaves((prevFaves) => {
        return prevFaves.map((fave) =>
          fave.media_id === media_id ? { ...fave, status: newStatus } : fave
        );
      });
  
      setDisplayedFaves((prevDisplayedFaves) => {
        return prevDisplayedFaves.map((fave) =>
          fave.media_id === media_id ? { ...fave, status: newStatus } : fave
        );
      });
  
      showAlert('Media status updated successfully', 'success');
    } catch (error) {
      showAlert('Failed to update media status.', 'error');
    }
  };

  const handleCloseCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);  

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setTrailerUrl('');
  }, []);  
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarModalRef.current && !calendarModalRef.current.contains(event.target)) {
        handleCloseCalendar();
      }
      if (trailerModalRef.current && !trailerModalRef.current.contains(event.target)) {
        closeModal();
      }
    };
  
    if (showCalendar || isModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar, isModalOpen, handleCloseCalendar, closeModal]);
  
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
      if (error.response && error.response.status === 401) {
        showAlert('You are not authorized. Please log in again.', 'error');
      } else {
        showAlert('Error saving event. Please try again later.', 'error');
      }
    }
  };

  const handleSearchQuery = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
  
    try {
      const lowerCaseQuery = searchQuery.toLowerCase();
  
      // Fetch all media items including to_watch, scheduled, and watched
      const [toWatchResponse, scheduledResponse, watchedResponse] = await Promise.all([
        api.get(`/api/media-status/to_watch`),
        api.get(`/api/media-status/scheduled`),
        api.get(`/api/media-status/watched`),
      ]);
  
      const allMedia = [...toWatchResponse.data, ...scheduledResponse.data, ...watchedResponse.data];
  
      // Search logic: include title, media type, and genres
      const filteredMedia = allMedia.filter((item) => {
        const titleMatch = item.title ? item.title.toLowerCase().includes(lowerCaseQuery) : false;
  
        // Check if genres exist and are an array
        const genreMatch = item.genres && Array.isArray(item.genres)
          ? item.genres.some((genre) => genre.toLowerCase().includes(lowerCaseQuery))
          : false;
  
        const mediaTypeMatch = item.media_type ? item.media_type.toLowerCase().includes(lowerCaseQuery) : false;
  
        return titleMatch || genreMatch || mediaTypeMatch;
      });
  
      // Fetch genre details if not available directly
      const mediaWithGenres = await Promise.all(
        filteredMedia.map(async (mediaItem) => {
          if (!mediaItem.genres || mediaItem.genres.length === 0) {
            try {
              const genreResponse = await api.get(`/api/tmdb/${mediaItem.media_type}/${mediaItem.media_id}`);
              mediaItem.genres = genreResponse.data.genres.map(genre => genre.name);
            } catch (error) {
              console.error('Error fetching genre information:', error);
            }
          }
          return mediaItem;
        })
      );
  
      const mediaWithStatus = mediaWithGenres.map((mediaItem) => {
        const statusItem =
          toWatchResponse.data.find((item) => item.media_id === mediaItem.media_id) ||
          scheduledResponse.data.find((item) => item.media_id === mediaItem.media_id) ||
          watchedResponse.data.find((item) => item.media_id === mediaItem.media_id);
  
        return {
          ...mediaItem,
          status: statusItem ? statusItem.status : null,
        };
      });
  
      // Update state with the search results
      setFaves(mediaWithStatus);
      setFilteredFaves(mediaWithStatus);
      setDisplayedFaves(mediaWithStatus.slice(0, 4));
      setIsExpanded(false);
    } catch (error) {
      setAlert({ message: 'Error during search. Please try again later.', type: 'error' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleMediaRecommendationsClick = (media_id, media_type) => {
    navigate(`/nextwatch/${userId}/${media_type}/${media_id}`);
  };  

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      handleSearchQuery();
    }
  };  

  const handleSearchClick = (mediaId, mediaType) => {
    navigate(`/nextview/${userId}/${mediaType}/${mediaId}`);
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
  
      // Fetch the filtered favorites and media statuses
      const [favesResponse, toWatchResponse, scheduledResponse, watchedResponse] = await Promise.all([
        api.get(`/api/faves/${userId}/faves`, {
          params: {
            search: searchQuery,
            filter: filterType,
            page: 1,
            limit: 1000,
          },
        }),
        api.get(`/api/media-status/to_watch`),
        api.get(`/api/media-status/scheduled`),
        api.get(`/api/media-status/watched`),
      ]);
  
      const fetchedFaves = favesResponse.data;
      const toWatch = toWatchResponse.data;
      const scheduled = scheduledResponse.data;
      const watched = watchedResponse.data;
  
      // Merge the status into faves
      const favesWithStatus = fetchedFaves.map((fave) => {
        const statusItem =
          toWatch.find((item) => item.media_id === fave.media_id) ||
          scheduled.find((item) => item.media_id === fave.media_id) ||
          watched.find((item) => item.media_id === fave.media_id);
  
        return {
          ...fave,
          status: statusItem ? statusItem.status : null,
        };
      });
  
      // Update state with filtered results and their status
      setFaves(favesWithStatus);
      setFilteredFaves(favesWithStatus);
      setDisplayedFaves(favesWithStatus.slice(0, 4));
    } catch (error) {
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
  
      // Fetch media until 4 new unique items are found
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
  
        // Merge the media statuses with the fetched faves
        const mergedFaves = fetchedFaves.map(fave => {
          const statusItem = mediaStatuses.to_watch.find(item => item.media_id === fave.media_id) ||
                             mediaStatuses.scheduled.find(item => item.media_id === fave.media_id) ||
                             mediaStatuses.watched.find(item => item.media_id === fave.media_id);
  
          return {
            ...fave,
            status: statusItem ? statusItem.status : null
          };
        });
  
        // Filter out duplicates
        const uniqueFaves = mergedFaves.filter(
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
  
      // Add the new unique faves to the displayed list
      setDisplayedFaves((prevFaves) => [...prevFaves, ...newFaves.slice(0, 4)]);
      setPage(currentPage);
    } catch (error) {
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
      await api.delete(`/api/faves/${userId}/delete/${media_id}/${media_type}`);
      
      // Removes the item from faves and displayedFaves
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
      showAlert('Error deleting media. Please try again later.', 'error');
    }
  };  

  const handleShare = (title, mediaId, mediaType) => {
    const nextViewUrl = `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;
    if (navigator.share) {
      navigator.share({
        title: `Check out this title - ${title}`,
        url: nextViewUrl,
      })
      .then(() => console.log('Successful share!'))
      .catch((error) => console.error('Error sharing:', error));
    } else {
      navigator.clipboard.writeText(`Check out this title - ${title}: ${nextViewUrl}`)
      .then(() => showAlert('Link copied to clipboard!', 'success'))
      .catch((error) => showAlert('Failed to copy link', 'error'));
    }
  };

  return (
    <div className="faves-page">
      <BlobBg />
      <h1 className="faves-page__title">
        {name ? `${name}'s Favourites` : 'Your Favourites'} <FontAwesomeIcon icon={faHeart} className="faves-page__heart-icon" />
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
            <button>
              <FontAwesomeIcon icon={faSearch} onClick={handleSearchQuery} className="faves-page__magnifying-glass-icon" />
            </button>
            {searchQuery && (
            <button>
              <FontAwesomeIcon icon={faEraser} onClick={clearSearchQuery} className="faves-page__clear-icon" />
            </button>
            )}
          </div>
          <VoiceSearchFaves setSearchQuery={setSearchQuery} handleSearch={handleSearchQuery} />
        </div>

        <div className="faves-page__search-actions">
          <button className="faves-page__clear-search" onClick={clearSearchQuery}>
            <FontAwesomeIcon icon={faBackspace} /> Clear Search
          </button>
          <button className="faves-page__reset-filters" onClick={() => applyFilter('')}>
            <FontAwesomeIcon icon={faRedo} /> Reset Filters
          </button>
        </div>

        <div className="faves-page__copy-container">
          <p className="faves-page__copy-header">Your Favourites, Your Way!</p>
          <p className="faves-page__copy">
            Search, filter, and explore your favourite movies and shows. Use the filter cards to narrow your results, expand cards for details, watch trailers, and add to your calendar. Click on the lock icon to save your must-watch, or remove them with the trash icon. Fetch more with the button below and enjoy a seamless streaming experience!
          </p>
        </div>
        <div className="faves-page__filters-container">
          <div className="faves-page__filters">
            <button className="faves-page__filter-card" onClick={() => applyFilter('popular')}>
              <div className="faves-page__filter-label faves-page__label-featured">Featured</div>
              <FontAwesomeIcon icon={faStar} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Popular</p>
            </button>
            <button className="faves-page__filter-card" onClick={() => applyFilter('new')}>
              <div className="faves-page__filter-label faves-page__label-featured">Featured</div>
              <FontAwesomeIcon icon={faBolt} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">New</p>
            </button>
            <button className="faves-page__filter-card" onClick={() => applyFilter('top-rated')}>
              <div className="faves-page__filter-label faves-page__label-featured">Featured</div>
              <FontAwesomeIcon icon={faTrophy} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Top Rated</p>
            </button>
            <button className="faves-page__filter-card" onClick={() => applyFilter('adult')}>
              <div className="faves-page__filter-label faves-page__label-audiences">Audiences</div>
              <FontAwesomeIcon icon={faUsersViewfinder} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Broad Audience</p>
            </button>
            <button className="faves-page__filter-card" onClick={() => applyFilter('children')}>
              <div className="faves-page__filter-label faves-page__label-audiences">Audiences</div>
              <FontAwesomeIcon icon={faChildren} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Family</p>
            </button>
            <button className="faves-page__filter-card" onClick={() => applyFilter('international')}>
              <div className="faves-page__filter-label faves-page__label-cultural">Cultural</div>
              <FontAwesomeIcon icon={faGlobe} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">International</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('adventure')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faMap} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Adventure</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('action')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faBomb} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Action</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('animation')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faPalette} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Animation</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('comedy')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faLaugh} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Comedy</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('crime')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faFingerprint} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Crime</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('documentary')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faClapperboard} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Documentary</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('drama')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faTheaterMasks} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Drama</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('fantasy')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faQuidditch} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Fantasy</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('horror')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faGhost} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Horror</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('mystery')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faUserSecret} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Mystery</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('reality')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faVideoCamera} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Reality</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('romance')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faFaceKissWinkHeart} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Romance</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('science-fiction')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faHandSpock} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Science Fiction</p>
            </button>
            <button className="faves-page__filter-card faves-page__hide-filter-card" onClick={() => applyFilter('thriller')}>
              <div className="faves-page__filter-label faves-page__label-genres">Genres</div>
              <FontAwesomeIcon icon={faMask} className="faves-page__filter-icon" />
              <p className="faves-page__filter-card-title">Thriller</p>
            </button>
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
                    <button className="faves-page__poster-container">
                      <img
                        src={fave.poster_path ? `https://image.tmdb.org/t/p/w500${fave.poster_path}` : DefaultPoster}
                        alt={fave.title}
                        className="faves-page__poster"
                      />
                      <div className="faves-page__play-overlay" onClick={() => handlePlayTrailer(fave.media_id, fave.media_type)}>
                        <FontAwesomeIcon icon={faPlay} className="faves-page__play-icon" />
                      </div>
                    </button>
                    <h2 className="faves-page__subtitle">{fave.title}</h2>
                    <p className="faves-page__media-icon">
                      <button>
                        <FontAwesomeIcon 
                          icon={fave.media_type === 'tv' ? faTv : faFilm} 
                          className="faves-page__media-icon-link" 
                          data-tooltip-id="searchTooltip" 
                          data-tooltip-content="More Info" 
                          onClick={() => handleSearchClick(fave.media_id, fave.media_type)}
                        />
                      </button>
                      <button>
                        <FontAwesomeIcon 
                          icon={faLightbulb} 
                          className="faves-page__lightbulb-icon" 
                          onClick={() => handleMediaRecommendationsClick(fave.media_id, fave.media_type)}
                          data-tooltip-id="lightbulbTooltip"
                          data-tooltip-content="Discover More"
                        />
                      </button>
                      <button>
                        <FontAwesomeIcon 
                          icon={faCalendarPlus} 
                          onClick={() => handleAddToCalendar(fave.title, fave.media_type, fave.media_id)} 
                          className="faves-page__cal-icon" 
                          data-tooltip-id="calendarTooltip" 
                          data-tooltip-content="Add to Calendar" 
                        />
                      </button>

                      {/* Media Status Icons */}
                      <Link to={`/streamboard/${userId}`} data-tooltip-id="watchlistStatusTooltip" data-tooltip-content="Watchlist Status">
                        {fave.status ? (
                          <>
                            {fave.status === 'to_watch' && (
                              <span>
                                <FontAwesomeIcon 
                                  icon={faBookmark}
                                  className="faves-page__status-icon" 
                                />
                              </span>
                            )}
                            {fave.status === 'scheduled' && (
                              <span>
                                <FontAwesomeIcon 
                                  icon={faClock}
                                  className="faves-page__status-icon" 
                                />
                              </span>
                            )}
                            {fave.status === 'watched' && (
                              <span>
                                <FontAwesomeIcon 
                                  icon={faEye}
                                  className="faves-page__status-icon" 
                                />
                              </span>
                            )}
                          </>
                        ) : (
                          <span>Status: N/A</span>
                        )}
                      </Link>
                      <button>
                        <FontAwesomeIcon 
                          icon={faShareAlt} 
                          onClick={() => handleShare(fave.title, fave.media_id, fave.media_type)} 
                          className="faves-page__share-icon" 
                          data-tooltip-id="shareTooltip" 
                          data-tooltip-content="Share this Title" 
                        />
                      </button>
                      <button>
                        <FontAwesomeIcon 
                          icon={lockedMedia[`${fave.media_id}-${fave.media_type}`] ? faLock : faUnlock} 
                          onClick={() => handleLockMedia(fave.media_id, fave.media_type)} 
                          className={`faves-page__lock-icon ${lockedMedia[`${fave.media_id}-${fave.media_type}`] ? 'faves-page__lock-icon--locked' : ''}`} 
                          data-tooltip-id="lockTooltip" 
                          data-tooltip-content={lockedMedia[`${fave.media_id}-${fave.media_type}`] ? 'Unlock Media' : 'Lock Media'} 
                        />
                      </button>
                      <button>
                        <FontAwesomeIcon 
                          icon={faTrash} 
                          onClick={() => handleDeleteMedia(fave.media_id, fave.media_type)} 
                          className="faves-page__trash-icon" 
                          data-tooltip-id="trashTooltip" 
                          data-tooltip-content="Delete from Favourites" 
                        />
                      </button>
                      <Tooltip id="lightbulbTooltip" place="top" />
                      <Tooltip id="watchlistStatusTooltip" place="top" />
                      <Tooltip id="calendarTooltip" place="top" />
                      <Tooltip id="searchTooltip" place="top" />
                      <Tooltip id="shareTooltip" place="top" />
                      <Tooltip id="lockTooltip" place="top" />
                      <Tooltip id="trashTooltip" place="top" />
                    </p>
                    <p className="faves-page__text">
                      Genre: {fave.genres && Array.isArray(fave.genres) ? fave.genres.join(', ') : 'N/A'}
                    </p>
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
                  <p className="faves-page__text faves-page__svg-text">
                    No results found for your search. Please try a different title or genre.
                  </p>
                </div>
              ) : (
                <div className="faves-page__no-faves-container">
                  <img src={LikesSVG} alt="Likes Img" className="faves-page__no-faves-svg" />
                  <p className="faves-page__svg-text">
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
            <div className="faves-page__modal-content" ref={trailerModalRef}>
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
            <div ref={calendarModalRef}>
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