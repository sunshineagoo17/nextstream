import { useState, useEffect, useContext } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Link } from 'react-router-dom';
import {
  faFilm, faTv, faMap, faBomb, faPalette, faLaugh, faFingerprint, faClapperboard, faTheaterMasks, faQuidditch, faGhost,
  faUserSecret, faVideoCamera, faFaceKissWinkHeart, faMusic, faHandSpock, faMask, faChildren, faFighterJet, faScroll,
  faHatCowboy, faChild, faTelevision, faBalanceScale, faHeartBroken, faBolt, faExplosion, faMeteor, faMicrophone
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';  
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
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

const MediaItem = ({ item, index, status }) => {
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
      <div className="streamboard__media-item-icon">
        <Link to={`/nextview/${item.userId}/${item.media_type}/${item.media_id}`}>
            <FontAwesomeIcon icon={item.media_type === 'movie' ? faFilm : faTv} />
        </Link>
        <p className="streamboard__media-item-duration">{item.duration ? `${item.duration} min` : 'Duration N/A'}</p>
      </div>
      <div className="streamboard__media-item-details">
        <h3 className="streamboard__media-item-title">{item.title}</h3>
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
    </div>
  );
};

const MediaColumn = ({ status, mediaItems, moveMediaItem, showPagination, onPageChange }) => {
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

const StreamBoard = () => {
  const { userId, name } = useContext(AuthContext);  
  const [mediaItems, setMediaItems] = useState({
    to_watch: [],
    scheduled: [],
    watched: [],
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [currentScreen, setCurrentScreen] = useState('desktop');

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

  useEffect(() => {
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

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="streamboard-container">
        <div className="streamboard__title">
            <h1 className='streamboard__header-text'>
                {name ? `${name}'s Streamboard` : 'Your Streamboard'}
            </h1>
            <p className="streamboard__copy">
                Drag, Drop, Done: Manage Your Faves with Ease!
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
        <div className="streamboard">
          <MediaColumn 
            status="to_watch" 
            mediaItems={getPaginatedItems('to_watch', toWatchPage)} 
            moveMediaItem={moveMediaItem} 
            showPagination={mediaItems.to_watch.length > itemsPerPage} 
            onPageChange={(direction) => handlePageChange('to_watch', direction)} 
          />
          <MediaColumn 
            status="scheduled" 
            mediaItems={getPaginatedItems('scheduled', scheduledPage)} 
            moveMediaItem={moveMediaItem} 
            showPagination={mediaItems.scheduled.length > itemsPerPage} 
            onPageChange={(direction) => handlePageChange('scheduled', direction)} 
          />
          <MediaColumn 
            status="watched" 
            mediaItems={getPaginatedItems('watched', watchedPage)} 
            moveMediaItem={moveMediaItem} 
            showPagination={mediaItems.watched.length > itemsPerPage} 
            onPageChange={(direction) => handlePageChange('watched', direction)} 
          />
        </div>
      </div>
    </DndProvider>
  );
};

export default StreamBoard;