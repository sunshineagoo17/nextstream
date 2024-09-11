import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { getFriends, sendFriendRequest, acceptFriendRequest, removeFriend, searchUsers, fetchPendingRequests as fetchPendingRequestsService } from '../../services/friendsService'; // Ensure correct import
import { fetchMessages, sendMessage, markMessageAsRead, markAllMessagesAsRead } from '../../services/messageService';
import './FriendsPage.scss';

const FriendsPage = () => {
  const { isAuthenticated, userId } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typing, setTyping] = useState(false);

// Fetch friends list
const fetchFriends = useCallback(async () => {
    try {
      const friendsData = await getFriends();
      
      console.log("Fetched Friends Data:", friendsData); 
      
      if (Array.isArray(friendsData)) {
        setFriends(friendsData); 
      } else if (friendsData && Array.isArray(friendsData.friends)) {
        setFriends(friendsData.friends); 
      } else {
        setFriends([]);
        console.log("Invalid friends data structure.");
      }
    } catch (error) {
      console.error("Error fetching friends", error);
    }
  }, []);

  // Fetch pending friend requests
  const fetchPendingRequests = useCallback(async () => {
    try {
        const pendingData = await fetchPendingRequestsService(); 
        console.log("Pending Requests Data:", pendingData); 
        setPendingRequests(pendingData); 
    } catch (error) {
        console.error('Error fetching pending friend requests:', error);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchFriends(); 
      fetchPendingRequests(); 
    }
  }, [isAuthenticated, userId, fetchFriends, fetchPendingRequests]);

  // Select a friend and fetch messages
  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend);
    try {
      const messagesData = await fetchMessages(friend.id);
      setMessages(messagesData);

      messagesData.forEach(async (message) => {
        if (!message.is_read && message.receiver_id === userId) {
          await markMessageAsRead(message.id);
        }
      });

      await markAllMessagesAsRead(friend.id);
    } catch (error) {
      console.error('Error fetching messages or marking them as read', error);
    }
  };

  // Send a new message
  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      const messageData = {
        sender_id: userId,
        receiver_id: selectedFriend.id,
        message: newMessage,
      };

      try {
        await sendMessage(messageData);
        setMessages([...messages, { sender: 'me', text: newMessage }]);
        setNewMessage('');
        setTyping(false);
      } catch (error) {
        console.error('Error sending message', error);
      }
    }
  };

  // Search users to send friend requests
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      console.log("Please enter a search term.");
      return;
    }
  
    try {
      const searchResultsData = await searchUsers(searchTerm.trim());
      setSearchResults(searchResultsData);
    } catch (error) {
      console.error('Error searching users', error);
    }
  };  

  // Send a friend request
  const handleSendFriendRequest = async (friendId) => {
    try {
      const response = await sendFriendRequest(friendId);
      console.log('Friend request sent:', response);
      fetchFriends(); 
    } catch (error) {
      console.error('Error sending friend request', error);
    }
  };
  
  // Accept a friend request
  const handleAcceptFriendRequest = async (friendId) => {
    try {
      await acceptFriendRequest(friendId);
      fetchFriends(); 
    } catch (error) {
      console.error('Error accepting friend request', error);
    }
  };

  // Remove a friend
  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(friendId);
      fetchFriends(); 
    } catch (error) {
      console.error('Error removing friend', error);
    }
  };

const filteredFriends = friends;

  const clearSearch = () => {
    setSearchTerm('');      
    setSearchResults([]);    
  };

  if (!isAuthenticated) {
    return <div>Please log in to view your friends.</div>;
  }

  return (
    <div className="friends-page">
        <div className="friends-page__heading-container">
                <h1 className="friends-page__header">Friends List</h1>
                <p className="friends-page__copy">
                    Stay connected with your <span className="friends-page__gradient-subtitle">Friends List.</span>
                    View your friends, manage pending requests, and share recommendations. Keep up with what your crew is watching and discover new shows and movies together.
                </p>
        </div>
      <div className="friends-page__container">

        {/* Search Users to Send Friend Requests */}
        <div className="friends-page__search-section glassmorphic-card">
            <div className="friends-page__search-container">
                <input
                type="text"
                className="friends-page__search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSearch();
                }}
                />
                {searchTerm && (
                <button className="friends-page__clear-button" onClick={clearSearch}>
                    &times;
                </button>
                )}
            </div>
            <button className="friends-page__search-button" onClick={handleSearch}>
                Search
            </button>
            <div className="friends-page__search-results">
                {searchResults.length === 0 ? (
                <p>No users found for your search.</p>
                ) : (
                searchResults.map((user) => (
                    <div key={user.id} className="friends-page__search-item">
                    <span>{user.name}</span>
                    <button
                        onClick={() => handleSendFriendRequest(user.id)}
                        className="friends-page__add-friend"
                    >
                        Add Friend
                    </button>
                    </div>
                ))
                )}
            </div>
        </div>

        {/* Pending Friend Requests Section */}
        <div className="friends-page__pending-section glassmorphic-card">
          <h3>Pending Requests</h3>
          {pendingRequests.length === 0 ? (
            <p>No pending friend requests.</p>
          ) : (
            pendingRequests.map((request) => (
              <div key={request.id} className="friends-page__pending-item">
                <span>{request.name}</span>
                <button 
                    onClick={() => handleAcceptFriendRequest(request.id)}
                    className="friends-page__accept-friend"
                >
                    Accept
                </button>
              </div>
            ))
          )}
        </div>

        {/* Friends List Section */}
        <div className="friends-page__list glassmorphic-card">
        <h3>Friends</h3>
        {filteredFriends.length === 0 ? (
            <p>No friends added yet.</p>
        ) : (
            filteredFriends.map((friend) => (
            <div
                key={friend.id}
                className={`friends-page__item ${selectedFriend?.id === friend.id ? 'selected' : ''}`}
                onClick={() => handleSelectFriend(friend)}
            >
                <img
                src={friend.avatar || '/path/to/default/avatar.png'}
                alt={friend.name}
                className="friends-page__avatar"
                />
                <span>{friend.name}</span>
                <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="friends-page__remove-friend"
                >
                    Remove
                </button>
            </div>
            ))
        )}
        </div>

        {/* Chat Section */}
        {selectedFriend && (
          <div className="friends-page__chat glassmorphic-card">
            <div className="friends-page__chat-header">
              <span>{selectedFriend.name}</span>
            </div>
            <div className="friends-page__messages">
              {messages.length === 0 ? (
                <p>No messages yet. Start the conversation!</p>
              ) : (
                messages.map((message, index) => (
                  <div key={index} className={`friends-page__message ${message.sender === 'me' ? 'me' : 'friend'}`}>
                    {message.text}
                  </div>
                ))
              )}
            </div>
            <div className="friends-page__message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={() => setTyping(true)}
                placeholder="Type a message..."
              />
              <button onClick={handleSendMessage}>Send</button>
            </div>
            {typing && <div className="friends-page__typing">Typing...</div>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;