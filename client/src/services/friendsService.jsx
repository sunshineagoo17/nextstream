import api from './api';

// Fetch user's friends
export const getFriends = async () => {
    try {
      const response = await api.get('/api/friends/list'); 
      console.log('Response from API:', response); 
      return response.data; 
    } catch (error) {
      console.error('Error fetching friends', error);
      throw error;
    }
  };  

// Send a friend request
export const sendFriendRequest = async (friendId) => {
  const response = await api.post('/api/friends/add', { friendId });
  return response.data;
};

// Accept a friend request
export const acceptFriendRequest = async (friendId) => {
  const response = await api.post('/api/friends/accept', { friendId });
  return response.data;
};

// Remove a friend 
export const removeFriend = async (friendId) => {
  const response = await api.delete(`/api/friends/remove`, {
    data: { friendId }  
  });
  return response.data;
};

// Search for users
export const searchUsers = async (searchTerm) => {
    const response = await api.get(`/api/users/search?query=${searchTerm}`);
    return response.data;
};

// Fetch pending friend requests
export const fetchPendingRequests = async () => {
  try {
    const response = await api.get(`/api/friends/pending`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending friend requests', error);
    throw error;
  }
};

// Fetch pending calendar invites
export const fetchPendingCalendarInvitesService = async () => {
  try {
    const response = await api.get(`/api/calendar/pending-invites`);
    return response.data;
  } catch (error) {
    console.error('Error fetching pending calendar invites', error);
    throw error;
  }
};

// Respond to a shared event (accept or decline)
export const respondToSharedEvent = async (userId, calendarEventId, isAccepted) => {
  try {
    const response = await api.put(`/api/calendar/${userId}/shared-events/${calendarEventId}/respond`, {
      isAccepted
    });
    return response.data;
  } catch (error) {
    console.error('Error responding to shared event', error);
    throw error;
  }
};

// Fetch shared friends for a specific event
export const getSharedFriendsForEvent = async (userId, eventId) => {
  try {
    const response = await api.get(`/api/calendar/${userId}/events/${eventId}/shared`);
    return response.data;
  } catch (error) {
    console.error('Error fetching shared friends for the event', error);
    throw error;
  }
};