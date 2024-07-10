import React, { useState, useEffect, useContext } from 'react';
import { useSwipeable } from 'react-swipeable';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import MediaCard from './sections/MediaCard/MediaCard';
import api from '../../services/api';
import './TopPicksPage.scss';

const TopPicksPage = () => {
  const { userId } = useContext(AuthContext);
  const [media, setMedia] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch popular media (movies and shows) initially
    const fetchPopularMedia = async () => {
      try {
        const response = await api.get('/api/tmdb/popular');
        setMedia(response.data.results);
      } catch (error) {
        console.error('Error fetching data', error);
      }
    };
    fetchPopularMedia();
  }, []);

  // Use the useSwipeable hook to handle swipe gestures
  const handlers = useSwipeable({
    onSwipedLeft: () => handleSwipe('Left'),
    onSwipedRight: () => handleSwipe('Right')
  });

  const handleSwipe = (direction) => {
    if (currentIndex < media.length) {
      const interaction = direction === 'Right' ? 1 : 0;
      const currentMedia = media[currentIndex];

      api.post('/api/interactions', {
        user_id: userId,
        media_id: currentMedia.id,
        interaction: interaction,
        media_type: currentMedia.media_type
      }).then(() => {
        console.log('Interaction recorded');
      }).catch(error => console.error('Error recording interaction', error));

      setCurrentIndex(prevIndex => prevIndex + 1);
    }
  };

  const fetchRecommendations = () => {
    api.get(`/api/interactions/recommendations/${userId}`)
      .then(response => {
        console.log('Recommendations:', response.data);
        // Handle recommendations (e.g., set to state and display)
      })
      .catch(error => console.error('Error fetching recommendations', error));
  };

  return (
    <div className="top-picks-page" {...handlers}>
      {media.length > 0 && currentIndex < media.length && (
        <div className="top-picks-page__media-card">
          <MediaCard media={media[currentIndex]} />
        </div>
      )}
      {currentIndex >= media.length && (
        <div className="top-picks-page__no-more-media">
          <p>No more media</p>
          <button className="top-picks-page__recommendations-button" onClick={fetchRecommendations}>
            Get Recommendations
          </button>
        </div>
      )}
    </div>
  );
};

export default TopPicksPage;
