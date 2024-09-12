import { useContext, useState, useEffect, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { getFriends, respondToSharedEvent, fetchPendingCalendarInvitesService, sendFriendRequest, acceptFriendRequest, removeFriend, searchUsers, fetchPendingRequests as fetchPendingRequestsService } from '../../services/friendsService';
import { fetchMessages, sendMessage, deleteMessage, markAllMessagesAsRead } from '../../services/messageService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faTimes, faTrash } from '@fortawesome/free-solid-svg-icons';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import TypingIndicator from '../../components/TypingIndicator/TypingIndicator';
import io from 'socket.io-client';
import './FriendsPage.scss';

const socket = io('http://localhost:8080');

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
  const [alertMessage, setAlertMessage] = useState(null);
  const [pendingCalendarInvites, setPendingCalendarInvites] = useState([]);

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
        console.log('Invalid friends data structure.');
      }
    } catch (error) {
      console.log('Error fetching friends', error);
    }
  }, []);

  // Fetch pending friend requests
  const fetchPendingRequests = useCallback(async () => {
    try {
      const pendingData = await fetchPendingRequestsService();
      setPendingRequests(pendingData);
    } catch (error) {
      console.log('Error fetching pending friend requests:', error);
    }
  }, []);

  // Fetch pending calendar invites
  const fetchPendingCalendarInvites = useCallback(async () => {
    try {
      const invites = await fetchPendingCalendarInvitesService();
      setPendingCalendarInvites(invites);
    } catch (error) {
      console.log('Error fetching pending calendar invites:', error);
    }
  }, []);

  // Handle accept or decline calendar invite using the respondToSharedEvent
  const handleRespondToInvite = async (inviteId, isAccepted) => {
    try {
      await respondToSharedEvent(userId, inviteId, isAccepted);

      // Immediately update the pending invites list by removing the responded invite
      setPendingCalendarInvites((prevInvites) =>
        prevInvites.filter((invite) => invite.inviteId !== inviteId)
      );

      setAlertMessage({
        message: isAccepted
          ? 'Calendar invite accepted!'
          : 'Calendar invite declined.',
        type: 'success',
      });
    } catch (error) {
      console.log('Error responding to calendar invite', error);
      setAlertMessage({
        message: 'Error responding to calendar invite.',
        type: 'error',
      });
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchFriends();
      fetchPendingRequests();
      fetchPendingCalendarInvites();
    }
  }, [
    isAuthenticated,
    userId,
    fetchFriends,
    fetchPendingRequests,
    fetchPendingCalendarInvites,
  ]);

  // Manage socket connections and cleanup
  useEffect(() => {
    if (userId) {
      socket.emit('join_room', userId);

      socket.on('new_calendar_invite', (newInvite) => {
        setPendingCalendarInvites((prev) => [...prev, newInvite]);
      });

      return () => {
        socket.off('new_calendar_invite');
        socket.emit('leave_room', userId);
      };
    }
  }, [userId]);

  // Typing indicator handler with timeout
  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      socket.emit('typing', { userId, friendId: selectedFriend?.id });
    }

    const timeoutId = setTimeout(() => {
      setTyping(false);
      socket.emit('stop_typing', { userId, friendId: selectedFriend?.id });
    }, 3000);

    return () => clearTimeout(timeoutId);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  // Typing indicator listener
  useEffect(() => {
    socket.on('typing', (data) => {
      if (data.friendId === userId) {
        setTyping(true);
      }
    });

    socket.on('stop_typing', (data) => {
      if (data.friendId === userId) {
        setTyping(false);
      }
    });

    return () => {
      socket.off('typing');
      socket.off('stop_typing');
    };
  }, [userId]);

  // Select a friend and fetch messages
  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend);
    setNewMessage('');
    setTyping(false);

    try {
      const messagesData = await fetchMessages(friend.id);

      const validMessages = messagesData.map((message) => ({
        ...message,
        senderId: message.senderId || 'unknown_sender',
      }));

      validMessages.forEach((message) => {
        console.log(
          `Message: ${message.message}, senderId: ${message.senderId}, userId: ${userId}, is_read: ${message.is_read}`
        );
      });

      await markAllMessagesAsRead(friend.id);
      setMessages(validMessages);
    } catch (error) {
      console.log('Error fetching messages or marking them as read', error);
    }
  };

  useEffect(() => {
    if (selectedFriend) {
      const fetchMessagesForFriend = async () => {
        try {
          const messagesData = await fetchMessages(selectedFriend.id);
          setMessages(messagesData);
        } catch (error) {
          console.log('Error fetching messages:', error);
        }
      };
      fetchMessagesForFriend();
    }
  }, [selectedFriend]);

  useEffect(() => {
    socket.on('receive_message', (data) => {
      const newMessage = {
        ...data,
        is_read: false,
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, []);

  const handleSendMessage = async () => {
    console.log('Selected Friend:', selectedFriend);

    if (newMessage.trim() && selectedFriend?.id) {
      const newMessageObj = {
        senderId: userId,
        receiverId: selectedFriend.id,
        message: newMessage,
        timestamp: new Date().toISOString(),
        is_read: false,
      };

      setMessages((prevMessages) => [...prevMessages, newMessageObj]);

      try {
        await sendMessage(selectedFriend.id, newMessage);
        setNewMessage('');
      } catch (error) {
        console.log('Error sending message:', error);
      }
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);

      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== messageId)
      );
      console.log('Message deleted successfully');
    } catch (error) {
      console.log('Error deleting message:', error);
      setAlertMessage({ message: 'Error deleting message.', type: 'error' });
    }
  };

  const handleCloseChat = () => {
    setSelectedFriend(null);
    setNewMessage('');
    setTyping(false);
  };

  // Search users to send friend requests
  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      console.log('Please enter a search term.');
      return;
    }

    try {
      const searchResultsData = await searchUsers(searchTerm.trim());
      const filteredSearchResults = searchResultsData.filter(
        (user) => user.id !== userId
      );
      if (filteredSearchResults.length === 0) {
        setAlertMessage({
          message: 'No users found for your search.',
          type: 'info',
        });
      }

      setSearchResults(filteredSearchResults);
    } catch (error) {
      console.log('Error searching users', error);
      setAlertMessage({ message: 'Error searching users.', type: 'error' });
    }
  };

  // Send a friend request
  const handleSendFriendRequest = async (friendId) => {
    const isAlreadyFriend = friends.some((friend) => friend.id === friendId);

    if (isAlreadyFriend) {
      setAlertMessage({
        message: 'This user is already in your friends list!',
        type: 'info',
      });
      return;
    }

    try {
      const response = await sendFriendRequest(friendId);
      console.log('Friend request sent:', response);
      fetchFriends();
      setAlertMessage({
        message: 'Friend request sent successfully!',
        type: 'success',
      });
    } catch (error) {
      console.log('Error sending friend request', error);
      setAlertMessage({
        message: 'Error sending friend request.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    if (messages.length && selectedFriend) {
      localStorage.setItem(
        `messages_${selectedFriend.id}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, selectedFriend]);

  useEffect(() => {
    if (selectedFriend) {
      const savedMessages = localStorage.getItem(
        `messages_${selectedFriend.id}`
      );
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
    }
  }, [selectedFriend]);

  // Accept a friend request
  const handleAcceptFriendRequest = async (friendId) => {
    try {
      await acceptFriendRequest(friendId);
      fetchFriends();
      setPendingRequests((prevPendingRequests) =>
        prevPendingRequests.filter((request) => request.id !== friendId)
      );
      setAlertMessage({ message: 'Friend request accepted!', type: 'success' });
    } catch (error) {
      console.log('Error accepting friend request', error);
      setAlertMessage({
        message: 'Error accepting friend request.',
        type: 'error',
      });
    }
  };

  // Remove a friend
  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(friendId);
      fetchFriends();
      setAlertMessage({
        message: 'Friend removed successfully!',
        type: 'success',
      });
    } catch (error) {
      console.log('Error removing friend', error);
      setAlertMessage({ message: 'Error removing friend.', type: 'error' });
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
    <div className='friends-page'>
      {/* Custom Alert */}
      {alertMessage && (
        <CustomAlerts
          message={alertMessage.message}
          type={alertMessage.type}
          onClose={() => setAlertMessage(null)}
        />
      )}

      <div className='friends-page__heading-container'>
        <h1 className='friends-page__header'>Friends List</h1>
        <p className='friends-page__copy'>
          Stay connected with your{' '}
          <span className='friends-page__gradient-subtitle'>Friends List.</span>
          View your friends, manage pending requests, and share recommendations.
          Keep up with what your crew is watching and discover new shows and
          movies together.
        </p>
      </div>

      <div className='friends-page__main-content'>
        <div className='friends-page__container friends-page__container--friends-cards'>
          {/* Search Users to Send Friend Requests */}
          <div className='friends-page__search-section glassmorphic-card'>
            <h3 className='friends-page__card-subtitle--search'>
              Grow Your Crew
            </h3>
            <div className='friends-page__search-container'>
              <input
                type='text'
                className='friends-page__search'
                placeholder='Search users...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearch();
                }}
              />
              {searchTerm && (
                <button
                  className='friends-page__clear-button'
                  onClick={clearSearch}>
                  &times;
                </button>
              )}
            </div>
            <button
              className='friends-page__search-button'
              onClick={handleSearch}>
              Search
            </button>
            <div className='friends-page__search-results'>
              {searchResults.length === 0 ? (
                <p>No users found for your search.</p>
              ) : (
                searchResults.map((user) => (
                  <div key={user.id} className='friends-page__search-item'>
                    <span className='friends-page__username--search'>
                      {user.name}
                    </span>
                    <button
                      onClick={() => handleSendFriendRequest(user.id)}
                      className='friends-page__add-friend'>
                      Add Friend
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pending Friend Requests Section */}
          <div className='friends-page__pending-section glassmorphic-card'>
            <h3 className='friends-page__card-subtitle--requests'>
              Incoming Friend Requests
            </h3>
            {pendingRequests.length === 0 ? (
              <p>No pending friend requests.</p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className='friends-page__pending-item'>
                  <span className='friends-page__username--pending'>
                    {request.name}
                  </span>
                  <button
                    onClick={() => handleAcceptFriendRequest(request.id)}
                    className='friends-page__accept-friend'>
                    Accept
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Friends List Section */}
          <div className='friends-page__list glassmorphic-card'>
            <h3 className='friends-page__card-subtitle--friends'>
              Your NextCrew
            </h3>
            <div className='friend-page__friend-info-container'>
              {filteredFriends.length === 0 ? (
                <p>No friends added yet.</p>
              ) : (
                filteredFriends.map((friend) => (
                  <div
                    key={friend.id}
                    className={`friends-page__item ${
                      selectedFriend?.id === friend.id ? 'selected' : ''
                    }`}>
                    <div className='friends-page__friend-info'>
                      {/* Avatar */}
                      <FontAwesomeIcon
                        icon={faUser}
                        alt={friend.name}
                        className='friends-page__avatar-default'
                      />
                      {/* Friend details */}
                      <div className='friends-page__friend-details'>
                        {/* Name */}
                        <p className='friends-page__label'>
                          <strong className='friends-page__user-info'>
                            Name:
                          </strong>{' '}
                          {friend.name}
                        </p>
                        {/* Username */}
                        <p className='friends-page__label'>
                          <strong className='friends-page__user-info'>
                            Username:
                          </strong>{' '}
                          {friend.username}
                        </p>
                      </div>
                      <div className='friends-page__actions'>
                        <button
                          onClick={() => handleRemoveFriend(friend.id)}
                          className='friends-page__remove-friend'>
                          Remove
                        </button>
                        <button
                          onClick={() => handleSelectFriend(friend)}
                          className='friends-page__chat-button'>
                          Chat
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pending Calendar Invites Section */}
        <div className='friends-page__pending-calendar glassmorphic-card'>
          <div className='friends-page__header-row'>
            <h3 className='friends-page__card-subtitle--pendingrequests'>
              Pending Calendar Invites
              {pendingCalendarInvites.length > 0 && (
                <span className='friends-page__pending-count'>
                  {pendingCalendarInvites.length}
                </span>
              )}
            </h3>
          </div>
          {pendingCalendarInvites.length === 0 ? (
            <p>No pending calendar invites.</p>
          ) : (
            pendingCalendarInvites.map((invite) => (
              <div
                key={invite.inviteId}
                className='friends-page__pending-calendar__pending-item'>
                <div className='friends-page__calendar-info'>
                  {/* Event Title */}
                  <p>
                    <strong>Event Title:</strong> {invite.eventTitle}
                  </p>

                  {/* Inviter */}
                  <p>
                    <strong>Invited By:</strong> {invite.inviterName}
                  </p>

                  {/* Date and Time */}
                  <p>
                    <strong>Start Date:</strong>{' '}
                    {new Date(invite.start).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>End Date:</strong>{' '}
                    {new Date(invite.end).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Start Time:</strong>{' '}
                    {new Date(invite.start).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p>
                    <strong>End Time:</strong>{' '}
                    {new Date(invite.end).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  {/* Duration */}
                  <p>
                    <strong>Duration:</strong>{' '}
                    {invite.end
                      ? `${Math.round(
                          (new Date(invite.end) - new Date(invite.start)) /
                            60000
                        )} minutes`
                      : 'N/A'}
                  </p>

                  {/* Event Type */}
                  <p>
                    <strong>Type:</strong>{' '}
                    {invite.eventType === 'movie'
                      ? 'Movie'
                      : invite.eventType === 'tv'
                      ? 'TV Show'
                      : 'Unknown'}
                  </p>
                </div>

                {/* Buttons */}
                <div className='friends-page__calendar-actions'>
                  <button
                    onClick={() => handleRespondToInvite(invite.inviteId, true)}
                    className='friends-page__accept-friend'>
                    Accept
                  </button>
                  <button
                    onClick={() =>
                      handleRespondToInvite(invite.inviteId, false)
                    }
                    className='friends-page__delete-invite'>
                    Decline
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Section */}
        {selectedFriend && (
          <div className='friends-page__container friends-page__container--chat'>
            <div className='friends-page__chat glassmorphic-card'>
              <FontAwesomeIcon
                icon={faTimes}
                className='friends-page__chat-close'
                onClick={handleCloseChat}
              />
              <div className='friends-page__chat-header'>
                <span className='friends-page__chat-header-title'>
                  Chat with: {selectedFriend.name}
                </span>
              </div>
              <div className='friends-page__messages'>
                {messages.length === 0 ? (
                  <p className='friends-page__no-msgs'>
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`friends-page__message 
                      ${message.senderId === userId ? 'me' : 'sender'} 
                      ${message.is_read ? 'read' : 'unread'}`}>
                      {message.message}
                      <FontAwesomeIcon
                        icon={faTrash}
                        className='friends-page__delete-icon'
                        onClick={() => handleDeleteMessage(message.id)}
                      />
                    </div>
                  ))
                )}
              </div>
              <div className='friends-page__message-input'>
                <input
                  type='text'
                  value={newMessage}
                  className='friends-page__msg-placeholder'
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Type a message...'
                />
                <button
                  className='friends-page__send-btn'
                  onClick={handleSendMessage}>
                  Send
                </button>
              </div>
              {typing && (
                <div className='friends-page__typing'>
                  <TypingIndicator />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;