import CircleRating from '../CircleRating/CircleRating';
import './MediaCard.scss';

const MediaCard = ({ media, handlers }) => {
  const validRating = Math.min(Math.max(Math.round(media.vote_average * 10 * 100) / 100, 0), 100);

  return (
    <div className="media-card" {...handlers}>
      <img src={`https://image.tmdb.org/t/p/w500${media.poster_path}`} alt={media.title || media.name} className="media-card__image"/>
      <div className="media-card__details">
        <h2 className="media-card__title">{media.title || media.name}</h2>
        <CircleRating rating={validRating} />
        <p className="media-card__overview">{media.overview}</p>
      </div>
    </div>
  );
};

export default MediaCard;