import { useState, useEffect, useContext } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';  
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import api from '../../services/api';  
import './StreamBoard.scss'; 

// Item Types for DnD
const ItemTypes = {
  MEDIA: 'media',
};

// Media Item Component
const MediaItem = ({ item, moveMediaItem, index, status }) => {
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
      className={`media-item${isDragging ? ' media-item--dragging' : ''}`} 
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      <div className="media-item__icon">
        <FontAwesomeIcon icon={item.media_type === 'movie' ? faFilm : faTv} />
      </div>
      <div className="media-item__details">
        <h3 className="media-item__title">{item.title}</h3>
        <p className="media-item__genre">{item.genre}</p>
      </div>
    </div>
  );
};

// Column Component
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
    <div ref={drop} className={`media-column media-column--${status.toLowerCase()}`}>
      <h2 className="media-column__title">{status.replace('_', ' ')}</h2>
      <div className="media-column__content">
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
        <div className="media-column__pagination">
          <button onClick={() => onPageChange('prev')}>Previous</button>
          <button onClick={() => onPageChange('next')}>Next</button>
        </div>
      )}
    </div>
  );
};

const StreamBoard = () => {
  const { userId } = useContext(AuthContext);  
  const [mediaItems, setMediaItems] = useState({
    to_watch: [],
    scheduled: [],
    watched: [],
  });
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  const [toWatchPage, setToWatchPage] = useState(1);
  const itemsPerPage = 8;

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
      } catch (error) {
        console.error('Error fetching media items:', error);
        setAlert({ type: 'error', message: 'Failed to load media items.' });
      }
    };

    fetchMediaItems();
  }, [userId]);

  const moveMediaItem = async (media_id, newStatus) => {
    setLoading(true); // Start loading

    try {
      const response = await api.put(`/api/media-status/${media_id}`, { status: newStatus });
      console.log(`Media status updated to ${newStatus}:`, response.data);

      // Update the UI only after the database confirms the change
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };

        // Remove the item from its current status array
        let movedItem = null;
        for (const status in updatedItems) {
          const itemIndex = updatedItems[status].findIndex((item) => item.media_id === media_id);
          if (itemIndex > -1) {
            [movedItem] = updatedItems[status].splice(itemIndex, 1);
            break;
          }
        }

        // Add the item to the new status array, ensuring no duplication
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
      setLoading(false); // End loading
    }
  };

  const handlePageChange = (direction) => {
    setToWatchPage((prevPage) => {
      if (direction === 'prev' && prevPage > 1) return prevPage - 1;
      if (direction === 'next' && prevPage < Math.ceil(mediaItems.to_watch.length / itemsPerPage)) return prevPage + 1;
      return prevPage;
    });
  };

  const paginatedToWatchItems = mediaItems.to_watch.slice((toWatchPage - 1) * itemsPerPage, toWatchPage * itemsPerPage);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="streamboard">
        {loading && <Loader />} {/* Show loader when loading */}
        {alert.message && (
          <CustomAlerts 
            type={alert.type} 
            message={alert.message} 
            onClose={() => setAlert({ type: '', message: '' })} 
          />
        )} {/* Show alert */}
        <MediaColumn 
          status="To Watch" 
          mediaItems={paginatedToWatchItems} 
          moveMediaItem={moveMediaItem} 
          showPagination={true} 
          onPageChange={handlePageChange} 
        />
        <MediaColumn 
          status="Scheduled" 
          mediaItems={mediaItems.scheduled} 
          moveMediaItem={moveMediaItem} 
        />
        <MediaColumn 
          status="Watched" 
          mediaItems={mediaItems.watched} 
          moveMediaItem={moveMediaItem} 
        />
      </div>
    </DndProvider>
  );
};

export default StreamBoard;