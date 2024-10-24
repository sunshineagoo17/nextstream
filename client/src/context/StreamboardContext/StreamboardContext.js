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
      const [toWatchResponse, scheduledResponse, watchedResponse] = await Promise.all([
        api.get(`/api/media-status/to_watch`),
        api.get(`/api/media-status/scheduled`),
        api.get(`/api/media-status/watched`),
      ]);

      setMediaItems({
        to_watch: toWatchResponse.data,
        scheduled: scheduledResponse.data,
        watched: watchedResponse.data,
      });
    } catch (error) {
      alert('Failed to fetch media items. Please try again later.');
    }
  };

  const updateMediaStatus = async (media_id, newStatus) => {
    try {
      await api.put(`/api/media-status/${media_id}`, { status: newStatus });
      setMediaItems((prevItems) => {
        const updatedItems = { ...prevItems };

        let movedItem = null;
        for (const status in updatedItems) {
          const itemIndex = updatedItems[status].findIndex(item => item.media_id === media_id);
          if (itemIndex > -1) {
            [movedItem] = updatedItems[status].splice(itemIndex, 1);
            break;
          }
        }

        if (movedItem) {
          movedItem.status = newStatus;
          updatedItems[newStatus].unshift(movedItem);
        }

        return updatedItems;
      });
    } catch (error) {
      alert('Error updating media status. Please try again later.');
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