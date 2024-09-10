import { useState, useEffect, useContext } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import {
  faFilm, faTv, faMap, faBomb, faPalette, faLaugh, faFingerprint, faClapperboard, faTheaterMasks, faQuidditch, faGhost,
  faUserSecret, faVideoCamera, faFaceKissWinkHeart, faMusic, faHandSpock, faMask, faChildren, faFighterJet, faScroll,
  faHatCowboy, faChild, faTelevision, faBalanceScale, faHeartBroken, faBolt, faExplosion, faMeteor, faMicrophone,
  faCalendarPlus, faTrash, faClose, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import Calendar from '../CalendarPage/sections/Calendar'; 
import api from '../../services/api';
import './StreamBoard.scss';

const ItemTypes = {
  MEDIA: 'media',
};

const genreIconMapping = {
  Adventure: faMap,
  Action: faBomb,
  Animation: faPalette,
  Comedy: faLaugh,
  Crime: faFingerprint,
  Documentary: faClapperboard,
  Drama: faTheaterMasks,
  Fantasy: faQuidditch,
  History: faScroll,
  Horror: faGhost,
  Music: faMusic,
  Mystery: faUserSecret,
  Politics: faBalanceScale,
  Reality: faVideoCamera,
  Romance: faFaceKissWinkHeart,
  'Science Fiction': faHandSpock,
  Soap: faHeartBroken,
  Talk: faMicrophone,
  Thriller: faMask,
  War: faFighterJet,
  Western: faHatCowboy,
  Family: faChildren,
  Kids: faChild,
  'TV Movie': faTelevision,
  'Action & Adventure': faBolt,
  'War & Politics': faExplosion,
  'Sci-Fi & Fantasy': faMeteor
};

const MediaItem = ({ item, index, status, moveMediaItem, handleAddToCalendar, handleDeleteMedia, isSearchResult }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.MEDIA,
    item: { id: item.media_id, index, currentStatus: status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  return (
    <div
      ref={drag}
      className={`streamboard__media-item${isDragging ? ' streamboard__media-item--dragging' : ''}`}
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {/* Status Tag */}
      {isSearchResult && (
        <div className="streamboard__media-status">
          {status === 'to_watch' && <div className="streamboard__status-badge">Watchlist</div>}
          {status === 'scheduled' && <div className="streamboard__status-badge">Scheduled</div>}
          {status === 'watched' && <div className="streamboard__status-badge">Watched</div>}
        </div>
      )}

      <h3 className="streamboard__media-item-title">{item.title}</h3>
      <div className="streamboard__media-item-icon">
        <p className="streamboard__media-item-duration">Duration: {item.duration ? `${item.duration} min` : 'Duration N/A'}</p>
      </div>

      <div className="streamboard__media-item-details">
        <div className="streamboard__media-item-genre">
          {item.genre && item.genre.split(', ').map((genreName, i) => (
            <span key={i} className="streamboard__media-genre-item">
              <FontAwesomeIcon
                icon={genreIconMapping[genreName] || faFilm}
                className="streamboard__genre-icon"
              />
              <span className="streamboard__genre-text">{genreName}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="streamboard__media-actions">
        <Link to={`/nextview/${item.userId}/${item.media_type}/${item.media_id}`}>
          <FontAwesomeIcon className="streamboard__media-type-icon" icon={item.media_type === 'movie' ? faFilm : faTv} />
        </Link>
        <FontAwesomeIcon
          icon={faCalendarPlus}
          className="streamboard__calendar-icon"
          onClick={() => handleAddToCalendar(item.title, item.media_type, item.media_id, () => moveMediaItem(item.media_id, 'scheduled'))} 
        />
        <FontAwesomeIcon
          icon={faTrash}
          className="streamboard__trash-icon"
          onClick={() => handleDeleteMedia(item.media_id, item.media_type)} 
        />
      </div>
    </div>
  );
};

const MediaColumn = ({ status, mediaItems, moveMediaItem, handleAddToCalendar, handleDeleteMedia, showPagination, onPageChange }) => {
  const [, drop] = useDrop(() => ({
    accept: ItemTypes.MEDIA,
    drop: (draggedItem) => {
      if (draggedItem.currentStatus !== status) {
        moveMediaItem(draggedItem.id, status);
      }
    },
  }));

  return (
    <div ref={drop} className={`streamboard__media-column streamboard__media-column--${status.toLowerCase()}`}>
      <div className="streamboard__media-column-content">
        {mediaItems.map((item, index) => (
          <MediaItem
            key={item.media_id}
            item={item}
            index={index}
            status={status}
            moveMediaItem={moveMediaItem}
            handleAddToCalendar={handleAddToCalendar}
            handleDeleteMedia={handleDeleteMedia}
          />
        ))}
      </div>
      {showPagination && (
        <div className="streamboard__media-column-pagination">
          <button onClick={() => onPageChange('prev')} className="streamboard__pagination-button">Previous</button>
          <button onClick={() => onPageChange('next')} className="streamboard__pagination-button">Next</button>
        </div>
      )}
    </div>
  );
};

// New Search Bar and Result Display
const SearchBar = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  return (
    <div className="search-bar">
      <input
        type="text"
        placeholder="Search media..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-bar__input"
      />
      <button onClick={handleSearch} className="search-bar__button">
        <FontAwesomeIcon icon={faSearch} />
      </button>
    </div>
  );
};

const SearchResult = ({ result, moveMediaItem, handleAddToCalendar, handleDeleteMedia }) => (
  <div className="search-result">
    {result ? (
      <MediaItem
        item={result}
        index={0}
        status={result.status}
        moveMediaItem={moveMediaItem}
        handleAddToCalendar={handleAddToCalendar}
        handleDeleteMedia={handleDeleteMedia}
        isSearchResult={true} 
      />
    ) : (
      <p>No results found.</p>
    )}
  </div>
);

const StreamBoard = () => {
  const { userId, name } = useContext(AuthContext);
  const [mediaItems, setMediaItems] = useState({
    to_watch: [],
    scheduled: [],
    watched: [],
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [searchResult, setSearchResult] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('desktop');
  const [showCalendar, setShowCalendar] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [selectedMediaId, setSelectedMediaId] = useState(null);
  const [selectedMediaType, setSelectedMediaType] = useState('');

  const [toWatchPage, setToWatchPage] = useState(1);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [watchedPage, setWatchedPage] = useState(1);

  useEffect(() => {
    const updateScreenSize = () => {
      if (window.innerWidth <= 768) {
        setCurrentScreen('mobile');
      } else if (window.innerWidth <= 1024) {
        setCurrentScreen('tablet');
      } else {
        setCurrentScreen('desktop');
      }
    };

    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);

    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const itemsPerPage = currentScreen === 'mobile' ? 4 : 8;

  const fetchMediaItems = async () => {
    try {
      const toWatchResponse = await api.get(`/api/media-status/to_watch`);
      const scheduledResponse = await api.get(`/api/media-status/scheduled`);
      const watchedResponse = await api.get(`/api/media-status/watched`);

      setMediaItems({
        to_watch: toWatchResponse.data,
        scheduled: scheduledResponse.data,
        watched: watchedResponse.data,
      });

      const allItems = [...toWatchResponse.data, ...scheduledResponse.data, ...watchedResponse.data];
      const duplicates = allItems.filter((item, index, self) => self.findIndex(i => i.media_id === item.media_id) !== index);
      if (duplicates.length > 0) {
        console.warn('Duplicate items found:', duplicates);
      }

    } catch (error) {
      console.error('Error fetching media items:', error);
      setAlert({ type: 'error', message: 'Failed to load media items.' });
    }
  };

  useEffect(() => {
    fetchMediaItems();
  }, [userId]);

  const moveMediaItem = async (media_id, newStatus) => {
    setLoading(true);

    try {
      const response = await api.put(`/api/media-status/${media_id}`, { status: newStatus });
      console.log(`Media status updated to ${newStatus}:`, response.data);

      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };

        let movedItem = null;
        for (const status in updatedItems) {
          const itemIndex = updatedItems[status].findIndex((item) => item.media_id === media_id);
          if (itemIndex > -1) {
            [movedItem] = updatedItems[status].splice(itemIndex, 1);
            break;
          }
        }

        if (movedItem) {
          movedItem.status = newStatus;
          updatedItems[newStatus.toLowerCase().replace(' ', '_')].unshift(movedItem);
        }

        return updatedItems;
      });

      setAlert({ type: 'success', message: 'Media status updated successfully.' });
    } catch (error) {
      console.error('Error updating media status:', error);
      setAlert({ type: 'error', message: 'Failed to update media status.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMedia = async (media_id, media_type) => {
    setLoading(true);

    try {
      // Removes the media item from the media status database
      await api.delete(`/api/media-status/${media_id}`);

      // Changes the interaction value from 1 to 0
      await api.post('/api/interactions', {
        userId,
        media_id,
        interaction: 0,
        media_type,
      });

      // Updates the UI after successful deletion and interaction update
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };

        for (const status in updatedItems) {
          const itemIndex = updatedItems[status].findIndex((item) => item.media_id === media_id);
          if (itemIndex > -1) {
            updatedItems[status].splice(itemIndex, 1);
            break;
          }
        }

        return updatedItems;
      });

      setAlert({ type: 'success', message: 'Media removed successfully.' });
    } catch (error) {
      console.error('Error deleting media:', error);
      setAlert({ type: 'error', message: 'Failed to delete media.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (status, direction) => {
    const pageState = {
      to_watch: setToWatchPage,
      scheduled: setScheduledPage,
      watched: setWatchedPage,
    };

    const setPage = pageState[status];

    setPage((prevPage) => {
      if (direction === 'prev' && prevPage > 1) return prevPage - 1;
      if (direction === 'next' && prevPage < Math.ceil(mediaItems[status].length / itemsPerPage)) return prevPage + 1;
      return prevPage;
    });
  };

  const getPaginatedItems = (status, currentPage) => {
    return mediaItems[status].slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  };

  const handleAddToCalendar = async (title, mediaType, mediaId, callback) => {
    let duration = 0;
    try {
      if (mediaType === 'movie') {
        const movieDetails = await api.get(`/api/tmdb/movie/${mediaId}`);
        duration = movieDetails.data.runtime || 0;
        console.log('Movie details:', movieDetails.data);
      } else if (mediaType === 'tv') {
        const tvDetails = await api.get(`/api/tmdb/tv/${mediaId}`);
        duration = tvDetails.data.episode_run_time[0] || 0;
        console.log('TV details:', tvDetails.data);
      }

      setEventTitle(title);
      setSelectedMediaType(mediaType);
      setSelectedMediaId(mediaId);
      setDuration(duration);
      setShowCalendar(true);

      if (callback) callback(); // Moves the media item to scheduled
    } catch (error) {
      console.error('Error fetching duration data:', error);
      setAlert({ type: 'error', message: 'Failed to fetch media duration.' });
    }
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
      setAlert({ type: 'success', message: 'Event saved successfully.' });
    } catch (error) {
      console.error('Error saving event:', error);
      setAlert({ type: 'error', message: 'Failed to save event.' });
    }
  };

  const handleSearch = (query) => {
    const allItems = [...mediaItems.to_watch, ...mediaItems.scheduled, ...mediaItems.watched];
    const result = allItems.find((item) => item.title.toLowerCase().includes(query.toLowerCase()));
    setSearchResult(result || null);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="streamboard__container">
        <div className="streamboard__title">
          <h1 className='streamboard__header-text'>
            {name ? `${name}'s Streamboard` : 'Your Streamboard'}
          </h1>
          <p className="streamboard__copy">
            Drag, Drop, Done: Manage Your Favourites with Ease!<br />
            Your cards are looking a bit empty? Start adding some <Link to={`/faves/${userId}`} className='streamboard__link'>favourites</Link> and manage your must-watch list with ease.
          </p>
        </div>
        {loading && <Loader />}
        {alert.message && (
          <CustomAlerts
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ type: '', message: '' })}
          />
        )}

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} />

        {/* Search Result */}
        {searchResult && (
          <SearchResult
            result={searchResult}
            moveMediaItem={moveMediaItem}
            handleAddToCalendar={handleAddToCalendar}
            handleDeleteMedia={handleDeleteMedia}
          />
        )}

        <div className="streamboard">
          <MediaColumn
            status="to_watch"
            mediaItems={getPaginatedItems('to_watch', toWatchPage)}
            moveMediaItem={moveMediaItem}
            handleAddToCalendar={handleAddToCalendar}
            handleDeleteMedia={handleDeleteMedia}
            showPagination={mediaItems.to_watch.length > itemsPerPage}
            onPageChange={(direction) => handlePageChange('to_watch', direction)}
          />
          <MediaColumn
            status="scheduled"
            mediaItems={getPaginatedItems('scheduled', scheduledPage)}
            moveMediaItem={moveMediaItem}
            handleAddToCalendar={handleAddToCalendar}
            handleDeleteMedia={handleDeleteMedia}
            showPagination={mediaItems.scheduled.length > itemsPerPage}
            onPageChange={(direction) => handlePageChange('scheduled', direction)}
          />
          <MediaColumn
            status="watched"
            mediaItems={getPaginatedItems('watched', watchedPage)}
            moveMediaItem={moveMediaItem}
            handleAddToCalendar={handleAddToCalendar}
            handleDeleteMedia={handleDeleteMedia}
            showPagination={mediaItems.watched.length > itemsPerPage}
            onPageChange={(direction) => handlePageChange('watched', direction)}
          />
        </div>
        {showCalendar && (
          <div className="streamboard__calendar-modal">
            <button className="streamboard__calendar-close-btn" onClick={handleCloseCalendar}>
              <FontAwesomeIcon icon={faClose} className="streamboard__close-icon" />
            </button>
            <Calendar
              userId={userId}
              eventTitle={eventTitle}
              mediaType={selectedMediaType}
              duration={duration}
              handleSave={handleSaveEvent}
              onClose={handleCloseCalendar}
            />
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default StreamBoard;