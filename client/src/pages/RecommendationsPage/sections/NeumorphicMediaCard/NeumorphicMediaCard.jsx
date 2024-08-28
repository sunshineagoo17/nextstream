import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faCalendarPlus, faPlay } from '@fortawesome/free-solid-svg-icons';
import './NeumorphicMediaCard.scss'; 

const NeumorphicMediaCard = ({ media }) => {
  const handlePlayTrailer = () => {
    // Logic to play trailer
  };

  const handleAddToCalendar = () => {
    // Logic to add to calendar
  };

  return (
    <div className="neumorphic-media-card">
      <div className="neumorphic-media-card__image-container">
        <img
          src={media.poster_path ? `https://image.tmdb.org/t/p/w500${media.poster_path}` : 'default-poster-url'}
          alt={media.title || media.name || 'Unknown Title'}
          className="neumorphic-media-card__image"
        />
        <div className="neumorphic-media-card__play-overlay" onClick={handlePlayTrailer}>
          <FontAwesomeIcon icon={faPlay} className="neumorphic-media-card__play-icon" />
        </div>
      </div>
      <div className="neumorphic-media-card__content">
        <h2 className="neumorphic-media-card__title">{media.title || media.name || 'Untitled'}</h2>
        <p className="neumorphic-media-card__description">{media.overview || 'No description available.'}</p>
        <div className="neumorphic-media-card__info">
          <div className="neumorphic-media-card__rating">
            <FontAwesomeIcon icon={faStar} /> {media.vote_average !== undefined ? `${media.vote_average} / 10` : 'No rating'}
          </div>
          <button className="neumorphic-media-card__calendar-button" onClick={handleAddToCalendar}>
            <FontAwesomeIcon icon={faCalendarPlus} /> Add to Calendar
          </button>
        </div>
      </div>
    </div>
  );
};

export default NeumorphicMediaCard;
