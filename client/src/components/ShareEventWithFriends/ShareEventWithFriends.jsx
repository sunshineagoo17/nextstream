import { useState, useEffect } from 'react';
import { getFriends, getSharedFriendsForEvent } from '../../services/friendsService';
import api from '../../services/api';
import './ShareEventWithFriends.scss';

const ShareEventWithFriends = ({ eventId, userId, showAlert }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [sharedFriends, setSharedFriends] = useState([]); 

  // Fetch the user's friends
  useEffect(() => {
    const fetchFriendsList = async () => {
      try {
        const friendsData = await getFriends(); 
        setFriends(friendsData);
      } catch (error) {
        showAlert('Failed to load friends list.', 'error');
      }
    };
    fetchFriendsList();
  }, [showAlert]); 

  // Fetch friends with whom the event has already been shared
  useEffect(() => {
    const fetchSharedFriends = async () => {
      try {
        const sharedFriendsData = await getSharedFriendsForEvent(userId, eventId);
        setSharedFriends(sharedFriendsData.sharedFriendIds); 
      } catch (error) {
        showAlert('Error fetching shared friends.', 'error');
      }
    };

    if (eventId && userId) {
      fetchSharedFriends();
    }
  }, [eventId, userId, showAlert]); 

  // Handle selecting and deselecting friends
  const handleSelectFriend = (friendId) => {
    setSelectedFriends((prevSelectedFriends) =>
      prevSelectedFriends.includes(friendId)
        ? prevSelectedFriends.filter((id) => id !== friendId)
        : [...prevSelectedFriends, friendId]
    );
  };

  // Share the event with selected friends
  const handleShareEvent = async () => {
    if (!eventId) {
      showAlert('Please add the event before sharing it with friends.', 'info');
      return;
    }

    if (selectedFriends.length === 0) {
      showAlert('Please select at least one friend to share the event.', 'info');
      return;
    }

    // Check if any selected friends have already been shared with
    const alreadySharedFriends = selectedFriends.filter(friendId => sharedFriends.includes(friendId));

    if (alreadySharedFriends.length > 0) {
      showAlert("Event's already been shared with some selected friends.", 'info');
      return;
    }

    try {
      await api.post(`/api/calendar/${userId}/events/${eventId}/share`, {
        friendIds: selectedFriends,
      });
      showAlert('Event shared successfully!', 'success');
    } catch (error) {
      showAlert('Error sharing the event. Please try again.', 'error');
    }
  };

  return (
    <div className="share-event glassmorphic-card">
      <h3 className="share-event__title neumorphic-text">Share Event with Friends</h3>
      <div className="share-event__friends-list">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="share-event__friend neumorphic-item">
              <input
                type="checkbox"
                id={`friend-${friend.id}`}
                className="share-event__checkbox"
                value={friend.id}
                onChange={() => handleSelectFriend(friend.id)}
                disabled={sharedFriends.includes(friend.id)}  
              />
              <label htmlFor={`friend-${friend.id}`} className="share-event__label">
                {friend.name} {sharedFriends.includes(friend.id) && '(Already Shared)'}
              </label>
            </div>
          ))
        ) : (
          <p className="share-event__no-friends">Add friends to start sharing events.</p>
        )}
      </div>
      <button
        className="share-event__button"
        onClick={handleShareEvent}
      >
        Send Invite
      </button>
    </div>
  );
};

export default ShareEventWithFriends;