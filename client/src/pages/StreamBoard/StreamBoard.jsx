import React, { useState, useEffect, useContext } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';  
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
const MediaColumn = ({ status, mediaItems, moveMediaItem }) => {
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
      }
    };

    fetchMediaItems();
  }, [userId]);

  const moveMediaItem = (media_id, newStatus) => {
    setMediaItems((prevItems) => {
      const updatedItems = { ...prevItems };

      // Find and remove the item from its current status array
      let movedItem;
      // eslint-disable-next-line no-unused-vars
      for (const [key, items] of Object.entries(updatedItems)) {
        const itemIndex = items.findIndex((item) => item.media_id === media_id);
        if (itemIndex > -1) {
          [movedItem] = items.splice(itemIndex, 1);
          break;
        }
      }

      if (movedItem) {
        movedItem.status = newStatus;
        updatedItems[newStatus.toLowerCase().replace(' ', '_')].push(movedItem);
      }

      return updatedItems;
    });

    // Update status in the database
    api.put(`/api/media-status/${media_id}`, { status: newStatus })
      .then(response => console.log('Media status updated:', response.data))
      .catch(error => console.error('Error updating media status:', error));
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="streamboard">
        <MediaColumn 
          status="To Watch" 
          mediaItems={mediaItems.to_watch} 
          moveMediaItem={moveMediaItem} 
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