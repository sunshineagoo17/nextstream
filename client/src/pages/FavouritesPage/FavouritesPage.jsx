import { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose, faFilm, faTv, faPlus, faChevronDown, faChevronUp, faHeart, faMinus, faPlay, faTimes, faCalendarPlus, faSearch } from '@fortawesome/free-solid-svg-icons';
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
  const { isAuthenticated } = useContext(AuthContext);
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchFaves = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await api.get(`/api/faves/${userId}/faves`);
        setFaves(response.data);
        setFilteredFaves(response.data);
        setDisplayedFaves(response.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching faves:', error);
      }
    };

    fetchFaves();
  }, [userId, isAuthenticated]);

  const handleShowMore = (id) => {
    setShowFullDescription((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  const toggleFaves = () => {
    if (isExpanded) {
      setDisplayedFaves(filteredFaves.slice(0, 5));
    } else {
      setDisplayedFaves(filteredFaves);
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

  const handleSearchClick = (title, name) => {
    const query = title || name;
    const encodedQuery = encodeURIComponent(query);
    navigate(`/search?q=${encodedQuery}`);
  };

  const handleSearchQuery = () => {
    const lowerCaseQuery = searchQuery.toLowerCase();
    const filtered = faves.filter(fave =>
      fave.title.toLowerCase().includes(lowerCaseQuery) ||
      fave.genres.some(genre => genre.toLowerCase().includes(lowerCaseQuery)) ||
      fave.media_type.toLowerCase().includes(lowerCaseQuery)
    );
    setFilteredFaves(filtered);
    setDisplayedFaves(filtered.slice(0, 5));
  };

  const handleSearchEnter = (e) => {
    if (e.key === 'Enter') {
      handleSearchQuery();
    }
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
  };

  const clearSearchQuery = () => {
    setSearchQuery('');
    setFilteredFaves(faves);
    setDisplayedFaves(faves.slice(0, 5));
  };

  return (
    <div className="faves-page">
      <BlobBg />
      <h1 className="faves-page__title">
        Your Favourites <FontAwesomeIcon icon={faHeart} />
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
                placeholder="Search for movies, shows, or genres..." 
            />
            <FontAwesomeIcon icon={faSearch} onClick={handleSearchQuery} className="faves-page__magnifying-glass-icon" />
            {searchQuery && (
                <FontAwesomeIcon icon={faTimes} onClick={clearSearchQuery} className="faves-page__clear-icon" />
            )}
            </div>
        </div>
        {alert && <CustomAlerts message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
        <div className="faves-page__grid">
            {displayedFaves.length > 0 ? (
            displayedFaves.map(fave => (
                <div key={fave.id || `${fave.media_id}-${fave.media_type}`} className="faves-page__card">
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
                    <FontAwesomeIcon icon={showFullDescription[fave.media_id] ? faChevronUp : faChevronDown} />
                </button>
                </div>
            ))
            ) : (
            <p className="faves-page__text">No favourites found.</p>
            )}
        </div>
        {filteredFaves.length > 5 && (
            <button className="faves-page__load-more" onClick={toggleFaves}>
            <FontAwesomeIcon icon={isExpanded ? faMinus : faPlus} /> {isExpanded ? 'Hide Cards' : 'Load More'}
            </button>
        )}
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
                    <FontAwesomeIcon icon={faClose} className='faves-page__close-icon' />
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