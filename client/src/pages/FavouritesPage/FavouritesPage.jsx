import { useState, useContext, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faTv, faPlus, faChevronDown, faChevronUp, faHeart, faMinus, faPlay, faTimes } from '@fortawesome/free-solid-svg-icons';
import api from '../../services/api';
import BlobBg from '../../components/BlobBg/BlobBg';
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './FavouritesPage.scss';

const FavouritesPage = () => {
  const { userId } = useParams();
  const [faves, setFaves] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState({});
  const [displayedFaves, setDisplayedFaves] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [trailerUrl, setTrailerUrl] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const { isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    const fetchFaves = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await api.get(`/api/faves/${userId}/faves`);
        setFaves(response.data);
        setDisplayedFaves(response.data.slice(0, 5));
      } catch (error) {
        console.error('Error fetching faves:', error);
      }
    };

    fetchFaves();
  }, [userId, isAuthenticated]);

  const handleShowMore = (id) => {
    setShowFullDescription((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  };

  const toggleFaves = () => {
    if (isExpanded) {
      setDisplayedFaves(faves.slice(0, 5));
    } else {
      setDisplayedFaves(faves);
    }
    setIsExpanded(!isExpanded);
  };

  const handlePlayTrailer = async (media_id, media_type) => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/faves/${userId}/trailer/${media_type}/${media_id}`);
      const trailerData = response.data;
      if (trailerData && trailerData.trailerUrl) {
        setTrailerUrl(trailerData.trailerUrl);
        setIsModalOpen(true);
      } else {
        setAlert({ message: 'Apologies, the trailer was not found.', type: 'error' });
      }
    } catch (error) {
      console.error('Error fetching trailer:', error);
      setAlert({ message: 'Error fetching trailer.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTrailerUrl('');
  };

  return (
    <div className="faves-page">
      <BlobBg />
      <h1 className="faves-page__title">
        Your Favourites <FontAwesomeIcon icon={faHeart} />
      </h1>
      {alert && <CustomAlerts message={alert.message} type={alert.type} onClose={() => setAlert(null)} />}
      <div className="faves-page__grid">
        {displayedFaves.length > 0 ? (
          displayedFaves.map(fave => (
            <div key={fave.id || `${fave.media_id}-${fave.media_type}`} className="faves-page__card">
              <div className="faves-page__poster-container">
                <img
                  src={fave.poster_path ? `https://image.tmdb.org/t/p/w500${fave.poster_path}` : 'default-poster-url'}
                  alt={fave.title}
                  className="faves-page__poster"
                />
                <div className="faves-page__play-overlay" onClick={() => handlePlayTrailer(fave.media_id, fave.media_type)}>
                  <FontAwesomeIcon icon={faPlay} className="faves-page__play-icon" />
                </div>
              </div>
              <h2 className="faves-page__subtitle">{fave.title}</h2>
              <p className="faves-page__media-icon">
                <FontAwesomeIcon icon={fave.media_type === 'tv' ? faTv : faFilm} />
              </p>
              <p className="faves-page__text">Genre: {fave.genres.join(', ')}</p>
              <p className={`faves-page__description ${showFullDescription[fave.media_id] ? 'faves-page__description--expanded' : ''}`}>
                Description: {fave.overview}
              </p>
              <button className="faves-page__more-button" onClick={() => handleShowMore(fave.media_id)}>
                <FontAwesomeIcon icon={showFullDescription[fave.media_id] ? faChevronUp : faChevronDown} />
              </button>
            </div>
          ))
        ) : (
          <p className="faves-page__text">No favourites found.</p>
        )}
      </div>
      {faves.length > 5 && (
        <button className="faves-page__load-more" onClick={toggleFaves}>
          <FontAwesomeIcon icon={isExpanded ? faMinus : faPlus} /> {isExpanded ? 'Hide Cards' : 'Load More'}
        </button>
      )}
      {isModalOpen && (
        <div className="faves-page__modal">
          <div className="faves-page__modal-content">
            <button className="faves-page__modal-content-close" onClick={closeModal}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            {isLoading ? (
              <Loader />
            ) : (
              <iframe
                width="560"
                height="315"
                src={trailerUrl}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FavouritesPage;