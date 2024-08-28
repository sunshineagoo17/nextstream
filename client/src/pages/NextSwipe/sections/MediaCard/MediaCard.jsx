import { useState, useContext } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv, faImage, faShareAlt } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'react-tooltip';
import { AuthContext } from '../../../../context/AuthContext/AuthContext';
import CircleRating from '../CircleRating/CircleRating';
import CustomAlerts from '../../../../components/CustomAlerts/CustomAlerts';
import DefaultPoster from "../../../../assets/images/posternoimg-icon.png";
import './MediaCard.scss';

const MediaCard = ({ media = {}, handlers }) => {
  const { media_type = 'unknown', vote_average, title, name, id, poster_path, overview } = media;
  const validRating = Math.min(Math.max(Math.round((vote_average || 0) * 10 * 100) / 100, 0), 100);
  const navigate = useNavigate();
  const { userId } = useContext(AuthContext);

  const [alert, setAlert] = useState({ show: false, message: '', type: '' });

  const showAlert = (message, type) => {
    setAlert({ show: true, message, type });
    setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
  };

  const handleMediaTypeClick = () => {
    if (media_type === 'tv' || media_type === 'movie') {
      navigate(`/nextview/${userId}/${media_type}/${id}`);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/nextview/${userId}/${media_type}/${id}`;

    if (navigator.share) {
      navigator.share({
        title: `Check out this title - ${title || name}`,
        url: url,
      })
      .then(() => showAlert('Successful share!', 'success'))
      .catch((error) => showAlert('Error sharing', 'error'));
    } else {
      navigator.clipboard.writeText(`Check out this title - ${title || name}: ${url}`)
      .then(() => showAlert('Link copied to clipboard!', 'success'))
      .catch((error) => showAlert('Failed to copy link', 'error'));
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
    <>
      {alert.show && (
        <CustomAlerts
          message={alert.message}
          type={alert.type}
          onClose={() => setAlert({ show: false, message: '', type: '' })}
        />
      )}
      <div className="media-card" {...handlers}>
        <img src={posterUrl} alt={title || name} className="media-card__image" />
        <div className="media-card__details">
          <h2 className="media-card__title">
              {title || name}
              <span onClick={handleMediaTypeClick} className="media-card__type-link" data-tooltip-id={`mediaTypeTooltip-${id}`} data-tooltip-content="View Details">
                <FontAwesomeIcon icon={icon} className="media-card__type-icon" />
              </span>
              <Tooltip id={`mediaTypeTooltip-${id}`} place="top" className="details-tooltip" /> 
              <span onClick={handleShare} className="media-card__share-link" data-tooltip-id={`shareTooltip-${id}`} data-tooltip-content="Share">
                <FontAwesomeIcon icon={faShareAlt} className="media-card__share-icon" />
              </span>
              <Tooltip id={`shareTooltip-${id}`} place="top" className="details-tooltip" />
          </h2>
          <CircleRating rating={validRating} />
          <p className="media-card__overview">{overview}</p>
        </div>
      </div>
    </>
  );
};

export default MediaCard;