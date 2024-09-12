import { useState, useEffect } from 'react';
import api from '../../services/api';
import './ShareEventWithFriends.scss';

const ShareEventWithFriends = ({ eventId, userId }) => {
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
    try {
      await Promise.all(
        selectedFriends.map((friendId) =>
          api.post(`/api/calendar/${userId}/events/${eventId}/share`, {
            friendId,
          })
        )
      );
      console.log('Event shared with selected friends');
    } catch (error) {
      console.error('Error sharing event', error);
    }
  };  

  return (
    <div className="share-event">
      <h3 className="share-event__title">Share Event with Friends</h3>
      <div className="share-event__friends-list">
        {friends.length > 0 ? (
          friends.map((friend) => (
            <div key={friend.id} className="share-event__friend">
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
        className="share-event__button share-event__button--primary"
        onClick={handleShareEvent}
      >
        Share with Selected Friends
      </button>
    </div>
  );
};

export default ShareEventWithFriends;