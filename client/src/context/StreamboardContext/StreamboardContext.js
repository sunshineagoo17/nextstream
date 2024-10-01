import { createContext, useState, useEffect } from 'react';
import api from '../../services/api';

export const StreamBoardContext = createContext();

export const StreamBoardProvider = ({ children }) => {
  const [mediaItems, setMediaItems] = useState({
    to_watch: [],
    scheduled: [],
    watched: [],
  });

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

  const updateMediaStatus = async (media_id, newStatus) => {
    try {
      await api.put(`/api/media-status/${media_id}`, { status: newStatus });
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };
  
        // Remove the media item from its previous status
        let movedItem = null;
        for (const status in updatedItems) {
          const itemIndex = updatedItems[status].findIndex(item => item.media_id === media_id);
          if (itemIndex > -1) {
            [movedItem] = updatedItems[status].splice(itemIndex, 1);
            break;
          }
        }
  
        // Move the item to the new status
        if (movedItem) {
          movedItem.status = newStatus;
          updatedItems[newStatus].unshift(movedItem);
        }
  
        return updatedItems;
      });
    } catch (error) {
      console.error('Error updating media status:', error);
    }
  };

  useEffect(() => {
    fetchMediaItems();
  }, []);

  return (
    <StreamBoardContext.Provider value={{ mediaItems, updateMediaStatus }}>
      {children}
    </StreamBoardContext.Provider>
  );
};