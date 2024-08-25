import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv, faImage } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../../../../context/AuthContext/AuthContext';
import CircleRating from '../CircleRating/CircleRating';
import DefaultPoster from "../../../../assets/images/posternoimg-icon.png";
import './MediaCard.scss';

const MediaCard = ({ media = {}, handlers }) => {
  const { media_type = 'unknown', vote_average, title, name, id, poster_path, overview } = media;
  const validRating = Math.min(Math.max(Math.round((vote_average || 0) * 10 * 100) / 100, 0), 100);
  const navigate = useNavigate();
  const { userId } = useContext(AuthContext);

  const handleMediaTypeClick = () => {
    if (media_type === 'tv' || media_type === 'movie') {
      navigate(`/nextview/${userId}/${media_type}/${id}`);
    }
  };

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
            {title || name}
          <span onClick={handleMediaTypeClick} className="media-card__type-link">
            <FontAwesomeIcon icon={icon} className="media-card__type-icon" />
          </span>
        </h2>
        <CircleRating rating={validRating} />
        <p className="media-card__overview">{overview}</p>
      </div>
    </div>
  );
};

export default MediaCard;