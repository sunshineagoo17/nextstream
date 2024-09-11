import api from './api';

// Fetch user's friends
export const getFriends = async () => {
    try {
      // No need to send userId in the request
      const response = await api.get(`/api/friends/list`);
      if (response.data.length === 0) {
        console.log('No friends found for this user.');
        return { friends: [], pendingRequests: [] };
      }
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

// Remove a friend (with request body - preferred method)
export const removeFriend = async (friendId) => {
  const response = await api.delete(`/api/friends/remove`, {
    data: { friendId }  // This sends `friendId` in the request body
  });
  return response.data;
};

// Search for users
export const searchUsers = async (searchTerm) => {
    const response = await api.get(`/api/users/search?query=${searchTerm}`);
    return response.data;
  };