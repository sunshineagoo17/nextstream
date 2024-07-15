import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv } from '@fortawesome/free-solid-svg-icons';
import CircleRating from '../CircleRating/CircleRating';
import './MediaCard.scss';

const MediaCard = ({ media, handlers }) => {
  const validRating = Math.min(Math.max(Math.round(media.vote_average * 10 * 100) / 100, 0), 100);
  const tmdbUrl = `https://www.themoviedb.org/${media.media_type === 'tv' ? 'tv' : 'movie'}/${media.id}`;
  const icon = media.media_type === 'tv' ? faTv : faFilm;

  return (
    <div className="media-card" {...handlers}>
      <img src={`https://image.tmdb.org/t/p/w500${media.poster_path}`} alt={media.title || media.name} className="media-card__image"/>
      <div className="media-card__details">
        <h2 className="media-card__title">
          <a href={tmdbUrl} target="_blank" rel="noopener noreferrer" className="media-card__tmdb-link">
            {media.title || media.name}
          </a>
          <FontAwesomeIcon icon={icon} className="media-card__type-icon" />
        </h2>
        <CircleRating rating={validRating} />
        <p className="media-card__overview">{media.overview}</p>
      </div>
    </div>
  );
};

export default MediaCard;