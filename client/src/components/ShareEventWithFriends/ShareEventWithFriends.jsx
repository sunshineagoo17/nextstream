import { useState, useEffect } from 'react';
import api from '../../services/api';
import './ShareEventWithFriends.scss';

const ShareEventWithFriends = ({ eventId, userId, showAlert }) => {
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);

  // Fetch the user's friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await api.get('/api/friends/list'); 
        setFriends(response.data);
      } catch (error) {
        console.error('Error fetching friends', error);
      }
    };
    fetchFriends();
  }, []);

// Log selected friends when they change
useEffect(() => {
    console.log('Selected friends:', selectedFriends);
    }, [selectedFriends]);
  
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
    if (selectedFriends.length === 0) {
      showAlert('Please select at least one friend to share the event.', 'info'); 
      return;
    }

    try {
      const response = await api.post(`/api/calendar/${userId}/events/${eventId}/share`, {
        friendIds: selectedFriends,
      });
      console.log('Event shared with selected friends:', response.data);
      showAlert('Event shared successfully!', 'success');
    } catch (error) {
      console.error('Error sharing event', error);
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
              />
              <label htmlFor={`friend-${friend.id}`} className="share-event__label">
                {friend.name}
              </label>
            </div>
          ))
        ) : (
          <p className="share-event__no-friends">No friends available to share with.</p>
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