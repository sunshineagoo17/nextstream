import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faCalendarPlus, faStar, faThumbsUp, faThumbsDown, faClose, faTv, faFilm, faChevronRight, faChevronLeft,
  faMap, faBomb, faPalette, faLaugh, faFingerprint, faClapperboard, faTheaterMasks, faQuidditch, faGhost, faUserSecret,
  faVideoCamera, faFaceKissWinkHeart, faMusic, faHandSpock, faMask, faChildren, faShareAlt,
  faFighterJet, faScroll, faHatCowboy, faChild, faTelevision,
  faBalanceScale, faHeartBroken, faBolt, faExplosion, faMeteor, faMicrophone
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext'; 
import { Tooltip } from 'react-tooltip';
import api from '../../services/api';
import WavesBg from '../../components/WavesBg/WavesBg';
import Loader from '../../components/Loader/Loader';
import Calendar from '../CalendarPage/sections/Calendar';
import DefaultPosterImg from '../../assets/images/posternoimg-icon.png';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './NextWatchPage.scss';

const genreIconMapping = {
  Adventure: faMap,
  Action: faBomb,
  Animation: faPalette,
  Comedy: faLaugh,
  Crime: faFingerprint,
  Documentary: faClapperboard,
  Drama: faTheaterMasks,
  Fantasy: faQuidditch,
  History: faScroll,
  Horror: faGhost,
  Music: faMusic,
  Mystery: faUserSecret,
  Politics: faBalanceScale,
  Reality: faVideoCamera,
  Romance: faFaceKissWinkHeart,
  'Science Fiction': faHandSpock,
  Soap: faHeartBroken,
  Talk: faMicrophone,
  Thriller: faMask,
  War: faFighterJet,
  Western: faHatCowboy,
  Family: faChildren,
  Kids: faChild,
  'TV Movie': faTelevision,
  'Action & Adventure': faBolt,
  'War & Politics': faExplosion,
  'Sci-Fi & Fantasy': faMeteor
};

const NextWatchPage = () => {
    const { mediaId, mediaType } = useParams();
    const navigate = useNavigate();  
    const { userId, isGuest } = useContext(AuthContext); 
    const [mediaData, setMediaData] = useState(null);
    const [similarMedia, setSimilarMedia] = useState([]); // For similar media
    const [certification, setCertification] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTrailerLoading, setIsTrailerLoading] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState('');
    const [interaction, setInteraction] = useState(null); 
    const [showCalendar, setShowCalendar] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [providers, setProviders] = useState([]);
    const [scrollPosition, setScrollPosition] = useState(0);

    const similarMediaRef = useRef(null);

    const showAlert = useCallback((message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => closeAlert(), 3000); 
    }, []);

    useEffect(() => {
        if (!mediaType || !mediaId) {
            console.error('Media type or media ID is missing.');
            navigate('/not-found'); 
            return;
        }

        // Fetch media data
        const fetchMediaData = async () => {
            try {
                const response = await api.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/nextview/${userId}/${mediaId}/${mediaType}`);
                if (response.data) {
                    setMediaData(response.data);
                    setInteraction(response.data.interaction);
                    setProviders(response.data.providers || []);

                    // Fetch certification data based on media type
                    if (mediaType === 'movie') {
                        const releaseInfo = response.data.release_dates.results.find(r => r.iso_3166_1 === 'US');
                        if (releaseInfo && releaseInfo.release_dates.length > 0) {
                            const certification = releaseInfo.release_dates[0].certification;
                            setCertification(certification || 'NR');
                        }
                    } else if (mediaType === 'tv') {
                        const contentRating = response.data.content_ratings.results.find(r => r.iso_3166_1 === 'US');
                        if (contentRating) {
                            setCertification(contentRating.rating || 'NR');
                        }
                    }

                    // Fetch similar media
                    const similarResponse = await api.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${mediaType}/${mediaId}/similar`);
                    setSimilarMedia(similarResponse.data.results);
                } else {
                    console.error('No media data found');
                    navigate('/not-found');
                }
            } catch (error) {
                console.error('Error fetching media data:', error);
                showAlert('Error loading data. Please try again later.', 'error');
                navigate('/not-found');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMediaData();
    }, [mediaId, mediaType, navigate, userId, showAlert]);

    const handlePlayTrailer = async () => {
        setIsTrailerLoading(true);
        try {
            const response = await api.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${mediaType}/${mediaId}/videos`);
            const videoData = response.data;

            if (videoData && videoData.trailerUrl) {
                setTrailerUrl(videoData.trailerUrl);
                setShowTrailer(true);
            } else {
                showAlert('Apologies, no video is available.', 'info');
            }
        } catch (error) {
            console.error('Error fetching video:', error);
            showAlert('Apologies, no video is available.', 'info');
        } finally {
            setIsTrailerLoading(false);
        }
    };

    const handleAddToCalendar = () => {
        if (isGuest) {
            showAlert('Guests cannot add events to the calendar. Please register to use this feature.', 'info');
            return;
        }
    
        if (!userId) {
            showAlert('Please log in to add this to your calendar.', 'error');
            return;
        }
    
        showAlert(`You can now add ${mediaData.title || mediaData.name} to your calendar!`, 'success');
        setShowCalendar(true);
    };
    
    const handleCloseCalendar = () => {
        setShowCalendar(false);
    };
    
    const handleToggleInteraction = async (newInteraction) => {
        if (isGuest) {
            showAlert('Guests cannot interact with media. Please register to access these features.', 'info');
            return;
        }

        try {
            await api.post(`${process.env.REACT_APP_BASE_URL}/api/interactions`, {
                userId,
                media_id: mediaId,
                interaction: newInteraction,
                media_type: mediaType,
            });
            setInteraction(newInteraction);

            if (newInteraction === 1) {
                showAlert('You liked this media!', 'success');
            } else if (newInteraction === 0) {
                showAlert('You disliked this media!', 'info');
            } else {
                showAlert('Interaction removed.', 'info');
            }
        } catch (error) {
            console.error('Error toggling interaction:', error);
            showAlert('Error toggling interaction. Please try again later.', 'error');
        }
    };

    const handleShare = () => {
        if (isGuest) {
            showAlert('Guests cannot share media. Please register to access this feature.', 'info');
            return;
        }

        const url = `${window.location.origin}/nextview/${userId}/${mediaType}/${mediaId}`;
        
        if (navigator.share) {
            navigator.share({
                title: `Check out this title - ${mediaData.title || mediaData.name}`,
                url: url,
            })
            .then(() => console.log('Successful share!'))
            .catch((error) => console.error('Error sharing:', error));
        } else {
            navigator.clipboard.writeText(`Check out this title - ${mediaData.title || mediaData.name}: ${url}`)
            .then(() => showAlert('Link copied to clipboard!', 'success'))
            .catch((error) => showAlert('Failed to copy link', 'error'));
        }
    };

    const closeAlert = () => {
        setAlert({ show: false, message: '', type: '' });
    };

    const handleScrollRight = () => {
        if (similarMediaRef.current) {
            const newPosition = scrollPosition + similarMediaRef.current.clientWidth;
            similarMediaRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
            setScrollPosition(newPosition);
        }
    };

    const handleScrollLeft = () => {
        if (similarMediaRef.current) {
            const newPosition = scrollPosition - similarMediaRef.current.clientWidth;
            similarMediaRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
            setScrollPosition(newPosition);
        }
    };

    if (isLoading) {
        return <Loader />;
    }

    if (!mediaData) {
        return <p>Media data could not be loaded.</p>;
    }

    const getInteractionIcon = () => {
        if (interaction === 1) {
            return (
                <>
                    <FontAwesomeIcon
                        icon={faThumbsUp}
                        className="nextwatch-page__thumbs-up active"
                        onClick={() => handleToggleInteraction(0)}
                        data-tooltip-id={`thumbsUpTooltip-${mediaId}`}
                        data-tooltip-content="LIKED"
                    />
                    <Tooltip id={`thumbsUpTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                </>
            );
        } else if (interaction === 0) {
            return (
                <>
                    <FontAwesomeIcon
                        icon={faThumbsDown}
                        className="nextwatch-page__thumbs-down active"
                        onClick={() => handleToggleInteraction(1)}
                        data-tooltip-id={`thumbsDownTooltip-${mediaId}`}
                        data-tooltip-content="DISLIKED"
                    />
                    <Tooltip id={`thumbsDownTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                </>
            );
        } else {
            return (
                <>
                    <div className="nextwatch-page__neutral-interactions">
                        <FontAwesomeIcon
                            icon={faThumbsUp}
                            className="nextwatch-page__thumbs-up"
                            onClick={() => handleToggleInteraction(1)}
                            data-tooltip-id={`interactionTooltip-${mediaId}`}
                            data-tooltip-content="LIKE"
                        />
                        <FontAwesomeIcon
                            icon={faThumbsDown}
                            className="nextwatch-page__thumbs-down"
                            onClick={() => handleToggleInteraction(0)}
                            data-tooltip-id={`interactionTooltip-${mediaId}`}
                            data-tooltip-content="DISLIKE"
                        />
                    </div>
                    <Tooltip id={`interactionTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                </>
            );
        }
    };

    return (
        <div className="nextwatch-page">
            {alert.show && (
                <CustomAlerts
                    message={alert.message}
                    type={alert.type}
                    onClose={closeAlert}
                />
            )}
            <div className="nextwatch-page__heading-container">
                <h1 className="nextwatch-page__header">NextWatch</h1>
                <p className="nextwatch-page__copy">
                    <span className="nextwatch-page__gradient-subtitle">NextWatch</span>
                    lets you explore a world of similar media based on your selected title. Dive into these recommendations, check out more details, and decide what's next on your watchlist. Click on the media card now for your next watch.
                </p>
            </div>
            <div className="nextwatch-page__content-container">
                <div className="nextwatch-page__content">
                    <h1 className="nextwatch-page__title">
                        {mediaData.title || mediaData.name || "Title: N/A"}
                        {mediaData.release_date && <span className="nextwatch-page__release-date"> ({new Date(mediaData.release_date).getFullYear()})</span>}
                        {certification && (
                            <>
                                <span
                                    className="nextwatch-page__certification"
                                    data-tooltip-id={`certificationTooltip-${mediaId}`}
                                    data-tooltip-content={`Rating`}
                                >
                                    {certification}
                                </span>
                                <Tooltip id={`certificationTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                            </>
                        )}
                    </h1>
                    <p className="nextwatch-page__description">
                        {mediaData.overview || "Description: Unavailable"}
                    </p>
                </div>

                <div className="nextwatch-page__media-info">
                    <div className="nextwatch-page__left-media-container">
                        <div className="nextwatch-page__poster-container">
                            <img 
                                src={mediaData.poster_path 
                                        ? `https://image.tmdb.org/t/p/w500${mediaData.poster_path}` 
                                        : DefaultPosterImg}  
                                alt={mediaData.title || mediaData.name || "No Poster Available"} 
                                className="nextwatch-page__poster"
                            />
                            <div className="nextwatch-page__play-overlay" onClick={handlePlayTrailer}>
                                <FontAwesomeIcon icon={faPlay} className="nextwatch-page__play-icon" />
                            </div>
                        </div> 

                        <div className="nextwatch-page__actions">
                            <div className="nextwatch-page__media-type">
                                <FontAwesomeIcon
                                    className="nextwatch-page__media-icon"
                                    icon={mediaType === 'tv' ? faTv : faFilm}
                                    data-tooltip-id={`mediaTypeTooltip-${mediaId}`}
                                    data-tooltip-content={`${mediaType === 'tv' ? 'TV Show' : 'Movie'}`}
                                />
                                <Tooltip id={`mediaTypeTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                            </div>
                            <button
                                className="nextwatch-page__calendar-button"
                                onClick={handleAddToCalendar}
                                data-tooltip-id={`calendarTooltip-${mediaId}`}
                                data-tooltip-content="Add to Calendar"
                            >
                                <FontAwesomeIcon icon={faCalendarPlus} />
                            </button>
                            <Tooltip id={`calendarTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                            
                            <button
                                className="nextwatch-page__share-button"
                                onClick={handleShare}
                                data-tooltip-id={`shareTooltip-${mediaId}`}
                                data-tooltip-content="Share"
                            >
                                <FontAwesomeIcon icon={faShareAlt} />
                            </button>
                            <Tooltip id={`shareTooltip-${mediaId}`} place="top" className="custom-tooltip" />

                            <div className="nextwatch-page__interaction-buttons">
                                {getInteractionIcon()}
                            </div>
                        </div> 
                    </div>

                    <div className="nextwatch-page__details">
                        <div className="nextwatch-page__genre">
                            {mediaData.genres.map(genre => (
                                <span key={genre.id} className="nextwatch-page__genre-item">
                                    <FontAwesomeIcon
                                        icon={genreIconMapping[genre.name] || faFilm}
                                        className="nextwatch-page__genre-icon"
                                    /> {genre.name}
                                </span>
                            ))}
                        </div>

                        <div className="nextwatch-page__details-container">
                            <div className="nextwatch-page__rating">
                                <FontAwesomeIcon icon={faStar} className="nextwatch-page__star-icon" /> {mediaData.vote_average} / 10
                            </div>

                            <div className="nextwatch-page__duration">
                                {mediaType === 'movie' 
                                    ? `${mediaData.runtime} minutes` 
                                    : mediaData.episode_run_time[0] 
                                        ? `${mediaData.episode_run_time[0]} minutes per episode`
                                        : 'Duration: Unavailable'}
                            </div>
                        </div>

                        <div className="nextwatch-page__streaming">
                            <p className="nextwatch-page__streaming-copy">Available on:</p>
                            <div className="nextwatch-page__streaming-services">
                                {providers.length > 0 ? (
                                    providers.map(provider => (
                                        <img
                                            key={provider.provider_id}
                                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            className="nextwatch-page__streaming-provider-logo"
                                        />
                                    ))
                                ) : (
                                    <p className="nextwatch-page__no-streaming-services">No streaming services available.</p>
                                )}
                            </div>
                        </div>

                        {/* Similar Media Section */}
                        <div className={`nextwatch-page__similar-container ${similarMedia.length <= 3 ? 'no-scroll' : ''}`}>
                            <p className="nextwatch-page__media-copy">Similar Media:</p>
                            {similarMedia.length === 0 ? (
                                <p className="nextwatch-page__no-similar-media">Similar media info unavailable.</p>
                            ) : (
                                <>
                                    {similarMedia.length > 3 && (
                                        <button className="nextwatch-page__similar-arrow nextwatch-page__similar-arrow-left" onClick={handleScrollLeft}>
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                    )}
                                    <div className="nextwatch-page__similar-scroll" ref={similarMediaRef}>
                                        <ul className="nextwatch-page__similar-list">
                                            {similarMedia.map(item => (
                                                <li key={item.id} className="nextwatch-page__similar-item"> 
                                                    <div
                                                        className="nextwatch-page__similar-card"
                                                        onClick={() => navigate(`/nextview/${userId}/${item.id}/${item.media_type}`)}
                                                    >
                                                        {item.poster_path ? (
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w185${item.poster_path}`}
                                                                alt={item.title || item.name}
                                                                className="nextwatch-page__similar-img"
                                                            />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faFilm} className="nextwatch-page__similar-img-placeholder" />
                                                        )}
                                                        <div className="nextwatch-page__similar-copy-container">
                                                          <div className="nextwatch-page__similar-name">{item.title || item.name}</div>
                                                          <div className="nextwatch-page__similar-rating">
                                                              <FontAwesomeIcon icon={faStar} /> {item.vote_average} / 10
                                                          </div>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul> 
                                    </div>

                                    {similarMedia.length > 3 && (
                                        <button className="nextwatch-page__similar-arrow nextwatch-page__similar-arrow-right" onClick={handleScrollRight}>
                                            <FontAwesomeIcon icon={faChevronRight} />
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {showTrailer && (
                <div className="nextwatch-page__modal">
                    <div className="nextwatch-page__modal-content">
                        <button className="nextwatch-page__modal-content-close" onClick={() => setShowTrailer(false)}>
                            <FontAwesomeIcon icon={faClose} />
                        </button>
                        {isTrailerLoading ? (
                            <div className="loader-overlay">
                                <Loader />
                            </div>
                        ) : (
                            <iframe
                                src={trailerUrl}
                                title="Trailer"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="nextwatch-page__trailer"
                            ></iframe>
                        )}
                    </div>
                </div>
            )}

            <div className="nextwatch-page__background">
                <WavesBg />
            </div>

            {showCalendar && (
                <div className="nextwatch-page__calendar-modal">
                    <button className="nextwatch-page__cal-close-btn" onClick={handleCloseCalendar}>
                        <FontAwesomeIcon icon={faClose} className='nextwatch-page__close-icon' />
                    </button>
                    <Calendar
                        userId={userId}
                        eventTitle={mediaData.title || mediaData.name}
                        mediaType={mediaType}
                        duration={mediaType === 'movie' ? mediaData.runtime : mediaData.episode_run_time[0]}
                        onClose={handleCloseCalendar}
                    />
                </div>
            )}
        </div>
    );
};

export default NextWatchPage;
