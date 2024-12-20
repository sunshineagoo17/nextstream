import api from './api';

// Fetch user's friends
export const getFriends = async () => {
    try {
      const response = await api.get('/api/friends/list'); 
      return response.data; 
    } catch (error) {
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

// Reject a friend request
export const rejectFriendRequest = async (friendId) => {
  const response = await api.post('/api/friends/reject', { friendId });
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
    throw error;
  }
};

// Fetch pending calendar invites
export const fetchPendingCalendarInvitesService = async (userId) => {
  try {
    const response = await api.get(`/api/calendar/${userId}/pending-invites`);
    return response.data;
  } catch (error) {
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
    throw error.response?.data || new Error('Failed to respond to shared event.');
  }
};

// Fetch shared friends for a specific event
export const getSharedFriendsForEvent = async (userId, eventId) => {
  try {
    const response = await api.get(`/api/calendar/${userId}/events/${eventId}/shared`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchSharedCalendarEvents = async (userId) => {
  try {
    const response = await api.get(`/api/calendar/${userId}/shared-events`);
    // Filter out events missing essential data
    const validEvents = response.data.filter(
      (event) => event.eventTitle && event.start && event.end
    );
    return validEvents;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return []; 
    }
    throw error;
  }
};