import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv, faSearch, faImage } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import CircleRating from '../CircleRating/CircleRating';
import DefaultPoster from "../../../../assets/images/posternoimg-icon.png";
import './MediaCard.scss';

const MediaCard = ({ media = {}, handlers }) => {
  const { media_type = 'unknown', vote_average, title, name, id, poster_path, overview } = media;
  const validRating = Math.min(Math.max(Math.round((vote_average || 0) * 10 * 100) / 100, 0), 100);
  const navigate = useNavigate();

  const handleSearchClick = () => {
    const query = title || name;
    const encodedQuery = encodeURIComponent(query);
    navigate(`/search?q=${encodedQuery}`);
  };

  const tmdbUrl = media_type === 'tv'
    ? `https://www.themoviedb.org/tv/${id}`
    : media_type === 'movie'
    ? `https://www.themoviedb.org/movie/${id}`
    : `https://www.themoviedb.org/collection/${id}`;

  const icon = media_type === 'tv'
    ? faTv
    : media_type === 'movie'
    ? faFilm
    : faImage;

  const posterUrl = poster_path
    ? `https://image.tmdb.org/t/p/w500${poster_path}`
    : DefaultPoster;

  return (
    <div className="media-card" {...handlers}>
      <img src={posterUrl} alt={title || name} className="media-card__image" />
      <div className="media-card__details">
        <h2 className="media-card__title">
          <a href={tmdbUrl} target="_blank" rel="noopener noreferrer" className="media-card__tmdb-link">
            {title || name}
          </a>
          <a href={tmdbUrl} target="_blank" rel="noopener noreferrer" className="media-card__type-link">
            <FontAwesomeIcon icon={icon} className="media-card__type-icon" />
          </a>
          <FontAwesomeIcon icon={faSearch} className="media-card__search-icon" onClick={handleSearchClick} />
        </h2>
        <CircleRating rating={validRating} />
        <p className="media-card__overview">{overview}</p>
      </div>
    </div>
  );
};

export default MediaCard;