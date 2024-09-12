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

// Accept calendar invite
export const acceptCalendarInvite = async (inviteId) => {
  return api.put(`/api/calendar/invite/${inviteId}/accept`);
};

// Delete calendar invite
export const deleteCalendarInvite = async (inviteId) => {
  try {
    const response = await api.delete(`/api/calendar/invite/${inviteId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting calendar invite', error);
    throw error;
  }
};