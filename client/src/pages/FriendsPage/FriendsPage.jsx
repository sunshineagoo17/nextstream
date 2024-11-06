import { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { getFriends, rejectFriendRequest, fetchSharedCalendarEvents, respondToSharedEvent, fetchPendingCalendarInvitesService, sendFriendRequest, acceptFriendRequest, removeFriend, searchUsers, fetchPendingRequests as fetchPendingRequestsService } from '../../services/friendsService';
import { fetchMessages, sendMessage, deleteMessage, markAllMessagesAsRead } from '../../services/messageService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faTimes, faTrash, faBell, faClose, faCalendarAlt, faPaperPlane, faEraser } from '@fortawesome/free-solid-svg-icons';
import { nanoid } from 'nanoid';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import EmojiMessages from '../../components/EmojiMessages/EmojiMessages';
import TypingIndicator from '../../components/TypingIndicator/TypingIndicator';
import Calendar from '../CalendarPage/sections/Calendar/Calendar';
import io from 'socket.io-client';
import AddFriends from "../../assets/images/add-friends.svg";
import VoiceMessageFriends from '../../components/VoiceInteraction/VoiceMessageFriends/VoiceMessageFriends';
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
  const [alertMessage, setAlertMessage] = useState(null);
  const [pendingCalendarInvites, setPendingCalendarInvites] = useState([]);
  const [sharedCalendarEvents, setSharedCalendarEvents] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarKey, setCalendarKey] = useState(0);
  const socketRef = useRef(null);
  const calendarModalRef = useRef(null);
  const socketInitializedRef = useRef(false);

  const [receivedMessageIds, setReceivedMessageIds] = useState(() => {
    const storedIds = localStorage.getItem('receivedMessageIds');
    return storedIds ? JSON.parse(storedIds) : [];
  });
  
  const addMessageId = (id) => {
    setReceivedMessageIds((prevIds) => {
      if (!prevIds.includes(id)) {
        const updatedIds = [...prevIds, id];
        localStorage.setItem('receivedMessageIds', JSON.stringify(updatedIds));
        return updatedIds;
      }
      return prevIds;
    });
  };
  
  const handleShowCalendar = () => {
    setShowCalendar(true);
  };

  const handleCloseCalendar = useCallback(() => {
    setShowCalendar(false);
  }, []);

  const handleClickOutside = useCallback((event) => {
    if (calendarModalRef.current && !calendarModalRef.current.contains(event.target)) {
      handleCloseCalendar();
    }
  }, [handleCloseCalendar]);  

  useEffect(() => {
    if (showCalendar) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar, handleClickOutside]);
  
  const getEvents = useCallback(async () => {
    try {
      const response = await fetch(`/api/calendar/${userId}/events`);
  
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (response.ok) {
          setSharedCalendarEvents(data);
        }
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  }, [userId]);

  const fetchFriends = useCallback(async () => {
    try {
      const friendsData = await getFriends();
      setFriends(Array.isArray(friendsData) ? friendsData : []);
    } catch (error) {
      setAlertMessage({ message: 'Error fetching friends.', type: 'error' });
    }
  }, []);
  
  useEffect(() => {
    const fetchAllUnreadMessages = async () => {
      try {
        const allMessages = await Promise.all(
          friends.map(friend => fetchMessages(friend.id))
        );
        const unreadMessages = allMessages.flat().filter(msg => !msg.is_read);
        setMessages(unreadMessages);
      } catch (error) {
        console.error("Error fetching unread messages:", error);
      }
    };    

    if (userId) {
      fetchAllUnreadMessages();
    }
  }, [friends, userId]);

  const fetchPendingRequests = useCallback(async () => {
    try {
      const pendingData = await fetchPendingRequestsService();
      setPendingRequests(pendingData);
    } catch (error) {
    }
  }, []);

  const fetchPendingCalendarInvites = useCallback(async () => {
    try {
      const invites = await fetchPendingCalendarInvitesService(userId);
      setPendingCalendarInvites(invites);
    } catch (error) {
    }
  }, [userId]);

  const handleRespondToInvite = async (inviteId, isAccepted) => {
    try {
      await respondToSharedEvent(userId, inviteId, isAccepted);

      setPendingCalendarInvites((prevInvites) =>
        prevInvites.filter((invite) => invite.inviteId !== inviteId)
      );

      if (isAccepted) {
        const updatedEvents = await fetchSharedCalendarEvents(userId);
        setSharedCalendarEvents(updatedEvents);

        socketRef.current.emit('calendar_event_updated', {
          userId,
          inviteId,
        });
      } else {
        setSharedCalendarEvents((prevEvents) =>
          prevEvents.filter((event) => event.inviteId !== inviteId)
        );

        socketRef.current.emit('calendar_event_updated', {
          userId,
          inviteId,
        });
      }

      setCalendarKey((prevKey) => prevKey + 1);

      setAlertMessage({
        message: isAccepted
          ? 'Event accepted successfully!'
          : 'Event removed from calendar.',
        type: isAccepted ? 'success' : 'success',
      });
    } catch (error) {
      console.error('Error responding to event:', error);
      setAlertMessage({
        message: 'Failed to respond to the event.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    const fetchSharedEvents = async () => {
      try {
        const eventsData = await fetchSharedCalendarEvents(userId);
        setSharedCalendarEvents(eventsData);
      } catch (error) {
        console.error('Error fetching shared calendar events:', error);
      }
    };
  
    if (userId) {
      fetchSharedEvents();
    }
  }, [userId]);
  
  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchFriends();
      fetchPendingRequests();
      fetchPendingCalendarInvites(userId);
      fetchSharedCalendarEvents(userId);
      getEvents();
    }
  }, [
    isAuthenticated,
    userId,
    fetchFriends,
    fetchPendingRequests,
    fetchPendingCalendarInvites,
    getEvents,
  ]);
  
  const handleReceiveMessage = useCallback(
    (data) => {
      try {
        const messageWithId = { ...data, id: data.id || nanoid(), is_read: data.is_read || false };
        console.log("Message received:", messageWithId);
  
        if (!receivedMessageIds.includes(messageWithId.id)) {
          addMessageId(messageWithId.id);
          
          setMessages((prevMessages) => {
            if (!prevMessages.find((msg) => msg.id === messageWithId.id)) {
              return [...prevMessages, messageWithId];
            }
            return prevMessages;
          });
        } else {
          console.log("Duplicate message ignored:", messageWithId);
        }
      } catch (error) {
        console.error("Error handling received message:", error);
      }
    },
    [receivedMessageIds]
  );  

  const debounceReceiveMessage = (func, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedHandleReceiveMessage = debounceReceiveMessage(handleReceiveMessage, 300);

  useEffect(() => {
    if (userId && !socketInitializedRef.current) {
      socketRef.current = io(process.env.REACT_APP_BASE_URL, { withCredentials: true });
      console.log(`Socket initialized for user: ${userId}`);
      
      socketRef.current.off('receive_message').on('receive_message', debouncedHandleReceiveMessage);
      socketInitializedRef.current = true;
  
      if (selectedFriend) {
        socketRef.current.emit('join_room', `${userId}_${selectedFriend.id}`);
      }
    }
  
    return () => {
      if (socketRef.current) {
        socketRef.current.off('receive_message', debouncedHandleReceiveMessage);
        if (selectedFriend) {
          socketRef.current.emit('leave_room', `${userId}_${selectedFriend.id}`);
        }
        socketRef.current.disconnect();
        console.log(`Socket disconnected for user: ${userId}`);
      }
    };
  }, [userId, debouncedHandleReceiveMessage, selectedFriend]);
  
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && socketRef.current && !socketRef.current.connected) {
        socketRef.current.connect();
      }
    };
  
    document.addEventListener('visibilitychange', handleVisibilityChange);
  
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
  
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on('disconnect', () => {
        console.log('Socket disconnected, attempting to reconnect...');
        socketRef.current.connect();
      });
    }
  }, []);  
  
  const handleTyping = useCallback(() => {
    if (socketRef.current && !typing) {
      setTyping(true);
      socketRef.current.emit('typing', { userId, friendId: selectedFriend?.id });
    }
    
    clearTimeout(handleTyping.timeoutId);
    handleTyping.timeoutId = setTimeout(() => {
      if (socketRef.current) {
        setTyping(false);
        socketRef.current.emit('stop_typing', { userId, friendId: selectedFriend?.id });
      }
    }, 3000);
  }, [userId, selectedFriend, typing]);  

  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSendMessage();
    } else {
      handleTyping();
    }
  };

  const handleSelectFriend = async (friend) => {
    setSelectedFriend(friend); 
    setNewMessage('');  
    setTyping(false);
  
    try {
      const messagesData = await fetchMessages(friend.id);
  
      await markAllMessagesAsRead(friend.id);
  
      setMessages(messagesData);
  
      socketRef.current.emit('messages_read', {
        userId,
        friendId: friend.id
      });
    } catch (error) {
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const events = await fetchSharedCalendarEvents(userId);
        if (events.length === 0) {
          setSharedCalendarEvents([]);
        } else {
          setSharedCalendarEvents(events);
        }
      } catch (error) {
      }
    };

    if (userId) {
      fetchData();
    }
  }, [userId]);

  useEffect(() => {
    if (selectedFriend) {
      const fetchMessagesForFriend = async () => {
        try {
          const messagesData = await fetchMessages(selectedFriend.id);
          setMessages(messagesData);
        } catch (error) {
        }
      };
      fetchMessagesForFriend();
    }
  }, [selectedFriend]);

  const handleSendMessage = useCallback(async (messageText = newMessage) => {
    const textToSend = messageText.trim();
  
    if (textToSend && selectedFriend?.id) {
      const newMessageObj = {
        id: nanoid(),
        senderId: userId,
        receiverId: selectedFriend.id,
        message: textToSend,
        timestamp: new Date().toISOString(),
        is_read: false,
      };
  
      setMessages((prevMessages) => [...prevMessages, newMessageObj]);
  
      try {
        socketRef.current.emit('send_message', newMessageObj); 
        await sendMessage(selectedFriend.id, textToSend);
        setNewMessage('');
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  }, [newMessage, selectedFriend, userId]);   
  
  const handleDeleteMessage = async (messageId) => {
    try {
      await deleteMessage(messageId);

      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== messageId)
      );
    } catch (error) {
      setAlertMessage({ message: 'Error deleting message.', type: 'error' });
    }
  };

  const handleCloseChat = () => {
    setSelectedFriend(null);
    setMessages([]); 
    setNewMessage('');
    setTyping(false);
  };
  
  const handleSearch = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
    if (!searchTerm.trim()) {
      setAlertMessage({
        message: 'Please enter an email address to search.',
        type: 'info',
      });
      return;
    }
  
    if (!emailRegex.test(searchTerm.trim())) {
      setAlertMessage({
        message: 'Please enter a valid email address.',
        type: 'error',
      });
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
      setAlertMessage({ message: 'Error searching users.', type: 'error' });
    }
  };  

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
        setAlertMessage({
            message: 'Sending friend request...',
            type: 'info',
        });

        const response = await sendFriendRequest(friendId);

        if (response.message === 'Friend request sent successfully!') {
            await fetchFriends();
            setAlertMessage({
                message: response.message,
                type: 'success',
            });
        }
    } catch (error) {
        setAlertMessage({
            message: 'Error sending friend request. Please check your connection.',
            type: 'error',
        });
    }
};

  const handleDeclineFriendRequest = async (friendId) => {
    try {
      await rejectFriendRequest(friendId);
      setPendingRequests((prevPendingRequests) =>
        prevPendingRequests.filter((request) => request.id !== friendId)
      );
      setAlertMessage({
        message: 'Friend request declined!',
        type: 'success',
      });
    } catch (error) {
      setAlertMessage({
        message: 'Error declining friend request.',
        type: 'error',
      });
    }
  };

  useEffect(() => {
    if (selectedFriend && userId) {
      const fetchMessagesForFriend = async () => {
        try {
          const messagesData = await fetchMessages(selectedFriend.id);

          setMessages(messagesData);

          socketRef.current.emit('messages_read', {
            userId,
            friendId: selectedFriend.id,
          });
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      };

      fetchMessagesForFriend();
    }
  }, [selectedFriend, userId]);

  const handleAcceptFriendRequest = async (friendId) => {
    try {
      await acceptFriendRequest(friendId);
      fetchFriends();
      setPendingRequests((prevPendingRequests) =>
        prevPendingRequests.filter((request) => request.id !== friendId)
      );
      setAlertMessage({ message: 'Friend request accepted!', type: 'success' });
    } catch (error) {
      setAlertMessage({
        message: 'Error accepting friend request.',
        type: 'error',
      });
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await removeFriend(friendId);
      fetchFriends();
      setAlertMessage({
        message: 'Friend removed successfully!',
        type: 'success',
      });
    } catch (error) {
      setAlertMessage({ message: 'Error removing friend.', type: 'error' });
    }
  };

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

      <div className='friends-page__video-container'>
         <img src={AddFriends} alt="Add Friends" className='friends-page__friends-video' />
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
                  <FontAwesomeIcon
                    icon={faEraser}
                    className='friends-page__clear-friends-search'
                  />
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
                <p className='friends-page__no-users-txt'>No users found for your search.</p>
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
              <p className='friends-page__no-pending-txt'>No pending friend requests.</p>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className='friends-page__pending-item'>
                  <span className='friends-page__username--pending'>
                    {request.name}
                  </span>
                  <div className='friends-page__friend-requests-actions'>
                    <button
                      onClick={() => handleAcceptFriendRequest(request.id)}
                      className='friends-page__accept-friend'>
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineFriendRequest(request.id)}
                      className='friends-page__decline-friend'>
                      Decline
                    </button>
                  </div>
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
              {friends.length === 0 ? (
                <p className='friends-page__empty-friends-list'>No friends added yet.</p>
              ) : (
                friends.map((friend) => {
                  const unreadMessages = messages.filter(
                    (message) =>
                      message.senderId === friend.id && !message.is_read
                  ).length;

                  return (
                    <div
                      key={friend.id}
                      className={`friends-page__item ${
                        selectedFriend?.id === friend.id ? 'selected' : ''
                      }`}>
                      <div className='friends-page__friend-info'>
                        <div className='friends-page__friend-info-icons'>
                          {/* Avatar */}
                          <FontAwesomeIcon
                            icon={faUser}
                            alt={friend.name}
                            className='friends-page__avatar-default'
                          />

                          {/* Bell Icon & Unread Count */}
                          {unreadMessages > 0 && (
                            <div className='friends-page__notification-container'>
                              <button className='friends-page__bell-icon-btn'>
                                <FontAwesomeIcon
                                  icon={faBell}
                                  className='friends-page__bell-icon'
                                  onClick={() => handleSelectFriend(friend)}
                                />
                              </button>
                              <span className='friends-page__unread-msg-count'>
                                {unreadMessages}
                              </span>
                            </div>
                          )}
                        </div>

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

                        {/* Actions */}
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
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className='friends-page__container--bottom'>
          <div className='friends-page__cal-events-container'>
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
                <p className='friends-page__no-pending-cal-txt'>No pending calendar invites.</p>
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
                    <div className='friends-page__calendar-actions'>
                      <button
                        onClick={() =>
                          handleRespondToInvite(invite.inviteId, true)
                        }
                        className='friends-page__accept-invite'>
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

            {/* Shared Calendar Events Section */}
            <div className='friends-page__shared-calendar glassmorphic-card different-color'>
              <div className='friends-page__header-row'>
                <h3 className='friends-page__card-subtitle--shared'>
                  Shared Calendar Events
                  {sharedCalendarEvents.length > 0 && (
                    <span className='friends-page__shared-count'>
                      {sharedCalendarEvents.length}
                    </span>
                  )}
                </h3>
                <button
                  className='friends-page__cal-icon-container'
                  onClick={handleShowCalendar}>
                  <FontAwesomeIcon
                    icon={faCalendarAlt}
                    className='friends-page__show-cal-icon'
                  />
                  <span className='friends-page__show-cal-txt'>
                    Show Calendar
                  </span>
                </button>
              </div>
              {sharedCalendarEvents.length === 0 ? (
                <p className='friends-page__no-shared-cal-txt'>No shared calendar events.</p>
              ) : (
                sharedCalendarEvents.map((event) => (
                  <div
                    key={event.inviteId}
                    className='friends-page__shared-calendar__item'>
                    <div className='friends-page__calendar-info'>
                      {/* Event Title */}
                      <p>
                        <strong>Event Title:</strong> {event.eventTitle}
                      </p>
                      {/* Friend */}
                      <p>
                        <strong>Friend:</strong> {event.inviterOrInvitedFriend || 'Unknown'}
                      </p>
                      {/* Date and Time */}
                      <p>
                        <strong>Start Date:</strong>{' '}
                        {new Date(event.start).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>End Date:</strong>{' '}
                        {new Date(event.end).toLocaleDateString()}
                      </p>
                      <p>
                        <strong>Start Time:</strong>{' '}
                        {new Date(event.start).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p>
                        <strong>End Time:</strong>{' '}
                        {new Date(event.end).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      {/* Event Type */}
                      <p>
                        <strong>Type:</strong>{' '}
                        {event.eventType === 'movie'
                          ? 'Movie'
                          : event.eventType === 'tv'
                          ? 'TV Show'
                          : 'Unknown'}
                      </p>
                      <div className='friends-page__calendar-actions'>
                        <button
                          onClick={() =>
                            handleRespondToInvite(event.inviteId, false)
                          }
                          className='friends-page__delete-invite-btn'>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className='friends-page__calendar-container'>
            {/* Calendar Modal */}
            {showCalendar && (
              <div className='friends-page__cal-modal'>
                <button
                  className='friends-page__close-btn'
                  onClick={handleCloseCalendar}>
                  <FontAwesomeIcon
                    icon={faClose}
                    className='friends-page__close-icon'
                  />
                  <span className='friends-page__close-cal-txt'>
                    Close Calendar
                  </span>
                </button>
                <div
                  ref={calendarModalRef}
                >
                  <Calendar
                    key={calendarKey}
                    userId={userId}
                    events={sharedCalendarEvents}
                    onClose={handleCloseCalendar}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Chat Section */}
        {selectedFriend && (
          <div className='friends-page__container friends-page__container--chat'>
            <div className='friends-page__chat glassmorphic-card'>
              <button>
                <FontAwesomeIcon
                  icon={faTimes}
                  className='friends-page__chat-close'
                  onClick={handleCloseChat}
                />
              </button>
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
                      <button>
                        <FontAwesomeIcon
                          icon={faTrash}
                          className='friends-page__delete-icon'
                          onClick={() => handleDeleteMessage(message.id)}
                        />
                      </button>
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
                <div className='friends-page__input-btns-container'>
                  <button 
                    className="friends-page__clear-btn"
                    onClick={() => setNewMessage('')}
                  >
                    <FontAwesomeIcon icon={faEraser} />
                  </button>
                  <button
                    className='friends-page__send-btn'
                    onClick={() => handleSendMessage(newMessage)}>
                      <FontAwesomeIcon icon={faPaperPlane} />
                  </button>   
                </div>
              </div>
              <div className='friends-page__chat-action-btns'>
                <VoiceMessageFriends
                  setNewMessage={setNewMessage}
                  handleSendMessage={handleSendMessage}
                />
                <EmojiMessages newMessage={newMessage} setNewMessage={setNewMessage} className="emoji-btn"/>
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