import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv, faSearch, faImage, faUser } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import CircleRating from '../CircleRating/CircleRating';
import DefaultPoster from "../../../../assets/images/posternoimg-icon.png";
import './MediaCard.scss';

const MediaCard = ({ media, handlers }) => {
  const validRating = Math.min(Math.max(Math.round(media.vote_average * 10 * 100) / 100, 0), 100);
  const navigate = useNavigate();

  const handleSearchClick = () => {
    const query = media.title || media.name;
    const encodedQuery = encodeURIComponent(query);
    navigate(`/search?q=${encodedQuery}`);
  };

  // Determine the correct URL and icon based on media type
  const tmdbUrl = media.media_type === 'tv' 
    ? `https://www.themoviedb.org/tv/${media.id}` 
    : media.media_type === 'movie' 
    ? `https://www.themoviedb.org/movie/${media.id}` 
    : media.media_type === 'person'
    ? `https://www.themoviedb.org/person/${media.id}`
    : `https://www.themoviedb.org/collection/${media.id}`;
    
  const icon = media.media_type === 'tv' 
    ? faTv 
    : media.media_type === 'movie' 
    ? faFilm 
    : media.media_type === 'person' 
    ? faUser 
    : faImage;

  // Default poster's used if poster path isn't available
  const posterUrl = media.poster_path
    ? `https://image.tmdb.org/t/p/w500${media.poster_path}`
    : DefaultPoster;

  return (
    <div className="media-card" {...handlers}>
      <img src={posterUrl} alt={media.title || media.name} className="media-card__image" />
      <div className="media-card__details">
        <h2 className="media-card__title">
          <a href={tmdbUrl} target="_blank" rel="noopener noreferrer" className="media-card__tmdb-link">
            {media.title || media.name}
          </a>
          <a href={tmdbUrl} target="_blank" rel="noopener noreferrer" className="media-card__type-link">
            <FontAwesomeIcon icon={icon} className="media-card__type-icon" />
          </a>
          <FontAwesomeIcon icon={faSearch} className="media-card__search-icon" onClick={handleSearchClick} />
        </h2>
        <CircleRating rating={validRating} />
        <p className="media-card__overview">{media.overview}</p>
      </div>
    </div>
  );
};

export default MediaCard;