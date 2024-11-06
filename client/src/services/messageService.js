import api from './api';

// Fetch messages between the user and a friend
export const fetchMessages = async (friendId) => {
  const response = await api.get(`/api/messages/history/${friendId}`);

  // Ensure senderId and receiverId are correctly mapped
  const validMessages = response.data.map(message => ({
    ...message,
    senderId: message.senderId || "unknown",  
  }));

  return validMessages;
};

// Send a message
export const sendMessage = async (friendId, message) => {
  const response = await api.post(`/api/messages/send`, { friendId, message });
  return response.data;
};
  
// Mark a message as read
export const markMessageAsRead = async (messageId) => {
  const response = await api.post(`/api/messages/mark-as-read`, { messageId });
  return response.data;
};
  

// Mark all messages as read
export const markAllMessagesAsRead = async (friendId) => {
  const response = await api.patch(`/api/messages/mark-all-read/${friendId}`);
  return response.data;
};

// Delete a message
export const deleteMessage = async (messageId) => {
  try {
    const response = await api.delete(`/api/messages/delete/${messageId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Delete all messages
export const deleteAllMessages = async (friendId) => {
  try {
    const response = await api.delete(`/api/messages/${friendId}/delete-all`);
    return response.data;
  } catch (error) {
    throw error;
  }
};