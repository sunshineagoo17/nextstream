import { useState, useEffect, useContext } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import {
  faFilm, faTv, faMap, faBomb, faPalette, faLaugh, faFingerprint, faClapperboard, faTheaterMasks, faQuidditch, faGhost,
  faUserSecret, faVideoCamera, faFaceKissWinkHeart, faMusic, faHandSpock, faMask, faChildren, faFighterJet, faScroll,
  faHatCowboy, faChild, faTelevision, faBalanceScale, faHeartBroken, faBolt, faExplosion, faMeteor, faMicrophone,
  faCalendarPlus, faTrash, faClose, faSearch, faLightbulb, faSave, faRedo, faTag
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import TagModal from './sections/TagModal/TagModal';
import ReviewModal from './sections/ReviewModal/ReviewModal';
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
const MediaItem = ({ item, index, status, moveMediaItem, handleAddToCalendar, handleDeleteMedia, isSearchResult, setAlert, setTags, setSelectedMediaId, setShowTagModal, setReview, setShowReviewModal, tags }) => {
  

  const [{ isDragging }, drag] = useDrag(() => ({
    type: ItemTypes.MEDIA,
    item: { id: item.media_id, index, currentStatus: status },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const handleOpenTagModal = (mediaId) => {
    setTags(item.tags || []);
    setSelectedMediaId(item.media_id); 
    setShowTagModal(true);
  };
  
  const handleOpenReviewModal = () => {
    setReview(item.review || '');
    setSelectedMediaId(item.media_id); 
    setShowReviewModal(true);
  };

  const [season, setSeason] = useState(item.season || 1);
  const [episode, setEpisode] = useState(item.episode || 1);

  const updateSeasonEpisode = async (mediaId, season, episode) => {
    try {
      const response = await api.put(`/api/media-status/${mediaId}`, {
        season,
        episode,
      });
      console.log('Season and episode updated:', response.data);

      setAlert({ type: 'success', message: 'Season and episode saved successfully!' });
    } catch (error) {
      console.error('Error updating season and episode:', error);
      
      setAlert({ type: 'error', message: 'Failed to save season and episode.' });
    }
  };

  const resetSeasonEpisode = async (mediaId) => {
    try {
      await api.put(`/api/media-status/${mediaId}`, {
        season: 1,
        episode: 1,
      });

      setSeason(1);
      setEpisode(1);

      setAlert({ type: 'success', message: 'Season and episode reset successfully!' });
    } catch (error) {
      console.error('Error resetting season and episode:', error);
  
      setAlert({ type: 'error', message: 'Failed to reset season and episode.' });
    }
  };

  const handleSaveSeasonEpisode = () => {
    updateSeasonEpisode(item.media_id, season, episode);
  };

  const handleResetSeasonEpisode = () => {
    resetSeasonEpisode(item.media_id);
  };

  const handleSeasonChange = (e) => {
    setSeason(e.target.value);
  };

  const handleEpisodeChange = (e) => {
    setEpisode(e.target.value);
  };

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

      {/* Media Title */}
      <h3 className="streamboard__media-item-title">{item.title}</h3>

      {/* TV Show Only: Season and Episode Inputs */}
      {item.media_type === 'tv' && (
        <div className="streamboard__season-episode-inputs">
          <div className="streamboard__inputs-container">
            <label>
                Season
                <input 
                    type="number" 
                    min="1" 
                    value={season} 
                    onChange={handleSeasonChange} 
                />
            </label>
            <label>
                Episode
                <input 
                    type="number" 
                    min="1" 
                    value={episode} 
                    onChange={handleEpisodeChange} 
                />
            </label>
          </div>
          <div className='streamboard__season-buttons'>
            <button className="streamboard__save-button" onClick={handleSaveSeasonEpisode}>
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button className="streamboard__reset-button" onClick={handleResetSeasonEpisode}>
              <FontAwesomeIcon icon={faRedo} />
            </button>
          </div>
      </div>
      )}

      {/* Duration */}
      <div className="streamboard__media-item-icon">
        <p className="streamboard__media-item-duration">
          Duration: {item.duration ? `${item.duration} min` : 'N/A'}
        </p>
      </div>

      {/* Genres */}
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

      {/* Media Actions */}
      <div className="streamboard__media-actions-container">
      <div className="streamboard__media-actions">
        {/* Media Type Icon with Tooltip */}
        <Link to={`/nextview/${item.userId}/${item.media_type}/${item.media_id}`}>
          <FontAwesomeIcon
            className="streamboard__media-type-icon"
            icon={item.media_type === 'movie' ? faFilm : faTv}
            data-tooltip-id="streamboardMediaTooltip"
            data-tooltip-content="View Info"
          />
          <Tooltip id="streamboardMediaTooltip" place="top" />
        </Link>

        {/* Lightbulb Icon for Recommendations with Tooltip */}
        <Link to={`/nextwatch/${item.userId}/${item.media_type}/${item.media_id}`}>
          <FontAwesomeIcon
            className="streamboard__lightbulb-icon"
            icon={faLightbulb}
            data-tooltip-id="lightbulbTooltip"
            data-tooltip-content="Find Similar"
          />
          <Tooltip id="lightbulbTooltip" place="top" />
        </Link>

        {/* Calendar Icon with Tooltip */}
        <FontAwesomeIcon
          icon={faCalendarPlus}
          className="streamboard__calendar-icon"
          onClick={() => handleAddToCalendar(item.title, item.media_type, item.media_id, () => moveMediaItem(item.media_id, 'scheduled'))}
          data-tooltip-id="calendarTooltip"
          data-tooltip-content="Add to Calendar"
        />
        <Tooltip id="calendarTooltip" place="top" />

        {/* Trash Icon with Tooltip */}
        <FontAwesomeIcon
          icon={faTrash}
          className="streamboard__trash-icon"
          onClick={() => handleDeleteMedia(item.media_id, item.media_type)}
          data-tooltip-id="trashTooltip"
          data-tooltip-content="Delete from List"
        />
        <Tooltip id="trashTooltip" place="top" />
        </div>
        <div className='streamboard__tags-reviews-container'>
          {/* Add Tag Button */}
          <button
            className="streamboard__tag-button"
            onClick={handleOpenTagModal}
          >
            Tag
          </button>

          {/* Add Review Button */}
          <button
            className="streamboard__review-button"
            onClick={handleOpenReviewModal}
          >
            Review
          </button>
        </div>

        {/* Tags display */}
        {tags && tags.length > 0 && (
          <div className="streamboard__media-item-tags">
            {tags.map((tag, index) => (
              <span
                key={index}
                className="streamboard__tag"
                onClick={handleOpenTagModal} 
                style={{ cursor: 'pointer' }}  
              >
                <FontAwesomeIcon icon={faTag} className="streamboard__tag-icon" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const MediaColumn = ({ status, mediaItems, moveMediaItem, handleAddToCalendar, handleDeleteMedia, setAlert, setTags, setSelectedMediaId, setShowTagModal, setReview, setShowReviewModal, showPagination, onPageChange }) => {
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
          setTags={setTags}
          tags={item.tags}
          moveMediaItem={moveMediaItem}
          handleAddToCalendar={handleAddToCalendar}
          handleDeleteMedia={handleDeleteMedia}
          setAlert={setAlert}
          setSelectedMediaId={setSelectedMediaId}
          setShowTagModal={setShowTagModal}
          setReview={setReview} 
          setShowReviewModal={setShowReviewModal}
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

const SearchBar = ({ onSearch, onClearSearch }) => {
  const [query, setQuery] = useState('');

  const handleSearch = () => {
    onSearch(query);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery('');
    onClearSearch(); 
  };

  return (
    <div className="streamboard__search-bar">
      <input
        type="text"
        placeholder="Search media..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyPress={handleKeyPress}
        className="streamboard__search-bar-input"
      />
      {query && (
        <button onClick={handleClear} className="streamboard__search-bar-button-clear">
          <FontAwesomeIcon icon={faClose} className="streamboard__search-bar-clear-icon" />
        </button>
      )}
      <button onClick={handleSearch} className="streamboard__search-bar-button-search">
        <FontAwesomeIcon icon={faSearch} className="streamboard__search-bar-search-icon" />
      </button>
    </div>
  );
};

const SearchResult = ({ result, moveMediaItem, handleAddToCalendar, handleDeleteMedia }) => (
  <div className="streamboard__search-result">
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
  const [tags, setTags] = useState([]); 
  const [review, setReview] = useState(''); 
  const [selectedMediaId, setSelectedMediaId] = useState(null);  
  const [showTagModal, setShowTagModal] = useState(false);  
  const [showReviewModal, setShowReviewModal] = useState(false);  
  const [mediaItems, setMediaItems] = useState({ to_watch: [], scheduled: [], watched: [] }); 
  const { userId, name } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [searchResult, setSearchResult] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('desktop');
  const [showCalendar, setShowCalendar] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [duration, setDuration] = useState(0);
  const [selectedMediaType, setSelectedMediaType] = useState('');
  const [toWatchPage, setToWatchPage] = useState(1);
  const [scheduledPage, setScheduledPage] = useState(1);
  const [watchedPage, setWatchedPage] = useState(1);

  const handleSaveTags = async (newTags) => {
    try {
      const tagsArray = Array.isArray(newTags) ? newTags : [newTags];
  
      await api.put(`/api/media-status/${selectedMediaId}/tags`, { tags: tagsArray.join(', ') });
  
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };
        Object.keys(updatedItems).forEach((status) => {
          updatedItems[status] = updatedItems[status].map((item) =>
            item.media_id === selectedMediaId ? { ...item, tags: tagsArray } : item
          );
        });
  
        return updatedItems;
      });
  
      setShowTagModal(false);
      setAlert({ type: 'success', message: 'Tags updated successfully.' });
    } catch (error) {
      console.error('Error saving tags:', error);
      setAlert({ type: 'error', message: 'Failed to update tags.' });
    }
  };
  
  const handleSaveReview = async (newReview) => {
    try {
      await api.put(`/api/media-status/${selectedMediaId}/review`, { review: newReview });
  
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };
        Object.keys(updatedItems).forEach((status) => {
          updatedItems[status] = updatedItems[status].map((item) =>
            item.media_id === selectedMediaId ? { ...item, review: newReview } : item
          );
        });
  
        return updatedItems;
      });
  
      setReview(newReview);
      setShowReviewModal(false);
      setAlert({ type: 'success', message: 'Review saved successfully.' });
    } catch (error) {
      console.error('Error saving review:', error);
      setAlert({ type: 'error', message: 'Failed to save review.' });
    }
  };

  const handleDeleteTags = async () => {
    try {
      await api.delete(`/api/media-status/${selectedMediaId}/tags`);
  
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };
        Object.keys(updatedItems).forEach((status) => {
          updatedItems[status] = updatedItems[status].map((item) =>
            item.media_id === selectedMediaId ? { ...item, tags: [] } : item
          );
        });
  
        return updatedItems;
      });
  
      setShowTagModal(false);
      setAlert({ type: 'success', message: 'Tags deleted successfully.' });
    } catch (error) {
      console.error('Error deleting tags:', error);
      setAlert({ type: 'error', message: 'Failed to delete tags.' });
    }
  };
  
  const handleDeleteReview = async () => {
    try {
      await api.delete(`/api/media-status/${selectedMediaId}/review`);
  
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };
        Object.keys(updatedItems).forEach((status) => {
          updatedItems[status] = updatedItems[status].map((item) =>
            item.media_id === selectedMediaId ? { ...item, review: null } : item
          );
        });
  
        return updatedItems;
      });
  
      setShowReviewModal(false);
      setAlert({ type: 'success', message: 'Review deleted successfully.' });
    } catch (error) {
      console.error('Error deleting review:', error);
      setAlert({ type: 'error', message: 'Failed to delete review.' });
    }
  };  
  
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
  
      const parseTags = (items) =>
        items.map((item) => ({
          ...item,
          tags: item.tags ? item.tags.split(', ').map((tag) => tag.trim()) : [],
        }));
  
      setMediaItems({
        to_watch: parseTags(toWatchResponse.data),
        scheduled: parseTags(scheduledResponse.data),
        watched: parseTags(watchedResponse.data),
      });
  
      const allItems = [
        ...parseTags(toWatchResponse.data),
        ...parseTags(scheduledResponse.data),
        ...parseTags(watchedResponse.data),
      ];
  
      const duplicates = allItems.filter(
        (item, index, self) => self.findIndex((i) => i.media_id === item.media_id) !== index
      );
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

      if (callback) callback(); 
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
  
    if (result) {
      setSearchResult(result);
      setAlert({ type: '', message: '' }); 
    } else {
      setSearchResult(null);
      setAlert({ type: 'error', message: `No results found for "${query}". Try a different title.` });
    }
  };
  
  const handleClearSearch = () => {
    setSearchResult(null);
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
            Search and Discover: Quickly find and update your must-watch media.<br />
            Empty cards? Start adding titles to your <Link to={`/faves/${userId}`} className='streamboard__link'>favourites</Link> and organize your list in no time.
          </p>
        </div>
        {loading && <Loader />}
        {/* Alert Display */}
        {alert.message && (
          <CustomAlerts
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert({ type: '', message: '' })}
          />
        )}

        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} onClearSearch={handleClearSearch} />

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
            setAlert={setAlert}
            setReview={setReview}
            setTags={setTags} 
            setShowTagModal={setShowTagModal}
            setSelectedMediaId={setSelectedMediaId}
            setShowReviewModal={setShowReviewModal}
            showPagination={mediaItems.to_watch.length > itemsPerPage}
            onPageChange={(direction) => handlePageChange('to_watch', direction)}
          />
          <MediaColumn
            status="scheduled"
            mediaItems={getPaginatedItems('scheduled', scheduledPage)}
            moveMediaItem={moveMediaItem}
            handleAddToCalendar={handleAddToCalendar}
            handleDeleteMedia={handleDeleteMedia}
            setAlert={setAlert}
            setReview={setReview}
            setTags={setTags} 
            setShowTagModal={setShowTagModal}
            setShowReviewModal={setShowReviewModal}
            setSelectedMediaId={setSelectedMediaId}
            showPagination={mediaItems.scheduled.length > itemsPerPage}
            onPageChange={(direction) => handlePageChange('scheduled', direction)}
          />
          <MediaColumn
            status="watched"
            mediaItems={getPaginatedItems('watched', watchedPage)}
            moveMediaItem={moveMediaItem}
            handleAddToCalendar={handleAddToCalendar}
            handleDeleteMedia={handleDeleteMedia}
            setAlert={setAlert}
            setReview={setReview}
            setTags={setTags} 
            setShowTagModal={setShowTagModal}
            setShowReviewModal={setShowReviewModal}
            setSelectedMediaId={setSelectedMediaId}
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

        {showTagModal && (
          <div>
            {/* Overlay that covers the entire screen */}
            <div className="streamboard__modal-overlay" />

            {/* Modal content centered on the screen */}
            <div className="streamboard__modal">
              <TagModal
                show={showTagModal}
                onClose={() => setShowTagModal(false)}
                onSave={handleSaveTags}
                onDelete={handleDeleteTags} 
                tags={tags}
                mediaId={selectedMediaId} 
                setAlert={setAlert}
              />
            </div>
          </div>
        )}

        {showReviewModal && (
          <div>
            {/* Overlay that covers the entire screen */}
            <div className="streamboard__modal-overlay" />

            {/* Modal content centered on the screen */}
            <div className="streamboard__modal">
              <ReviewModal
                show={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSave={handleSaveReview}  
                review={review}
                onDelete={handleDeleteReview} 
                mediaId={selectedMediaId}  
                setAlert={setAlert} 
              />
            </div>
          </div>
        )}
      </div>
    </DndProvider>
  );
};

export default StreamBoard;