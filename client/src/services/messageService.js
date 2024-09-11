import api from './api';

// Fetch messages between the user and a friend
export const fetchMessages = async (friendId) => {
  const response = await api.get(`/api/messages/${friendId}`);
  return response.data;
};

// Send a message
export const sendMessage = async (friendId, message) => {
  const response = await api.post(`/api/messages`, { friendId, message });
  return response.data;
};

// Mark a message as read
export const markMessageAsRead = async (messageId) => {
  const response = await api.patch(`/api/messages/${messageId}/read`);
  return response.data;
};

// Mark all messages as read
export const markAllMessagesAsRead = async (friendId) => {
  const response = await api.patch(`/api/messages/${friendId}/read-all`);
  return response.data;
};