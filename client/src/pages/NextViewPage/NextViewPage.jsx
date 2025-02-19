import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faCalendarPlus, faStar, faThumbsUp, faThumbsDown, faClose, faTv, faFilm, faChevronRight, faChevronLeft,
  faMap, faBomb, faPalette, faLaugh, faFingerprint, faClapperboard, faTheaterMasks, faQuidditch, faGhost, faUserSecret,
  faVideoCamera, faFaceKissWinkHeart, faMusic, faHandSpock, faMask, faChildren, faShareAlt,
  faFighterJet, faScroll, faHatCowboy, faChild, faTelevision,
  faBalanceScale, faHeartBroken, faBolt, faExplosion, faMeteor, faMicrophone, faListCheck,
  faPortrait
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext'; 
import { Tooltip } from 'react-tooltip';
import api from '../../services/api';
import WavesBg from '../../components/Backgrounds/WavesBg/WavesBg';
import Loader from '../../components/Loaders/Loader/Loader';
import Calendar from '../CalendarPage/sections/Calendar/Calendar';
import DefaultPosterImg from '../../assets/images/posternoimg-icon.png';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './NextViewPage.scss';

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

const NextViewPage = () => {
    const { mediaId, mediaType } = useParams();
    const navigate = useNavigate();  
    const { userId, isGuest } = useContext(AuthContext); 
    const [mediaData, setMediaData] = useState(null);
    const [certification, setCertification] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isTrailerLoading, setIsTrailerLoading] = useState(false);
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState('');
    const [interaction, setInteraction] = useState(null); 
    const [showCalendar, setShowCalendar] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [providers, setProviders] = useState([]);
    const [cast, setCast] = useState([]);
    const [scrollPosition, setScrollPosition] = useState(0);
    const calendarRef = useRef(null);
    const trailerModalRef = useRef(null);

    const castContainerRef = useRef(null);

    const showAlert = useCallback((message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => closeAlert(), 3000); 
    }, []);

    useEffect(() => {
        if (!mediaType || !mediaId) {
            navigate('/not-found'); 
            return;
        }

        const fetchMediaData = async () => {
            try {
                const response = await api.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/nextview/${userId}/${mediaId}/${mediaType}`);
                if (response.data) {
                    setMediaData(response.data);
                    setInteraction(response.data.interaction);
                    setProviders(response.data.providers || []);

                    // Fetch the certification data based on media type
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

                    // Fetch the cast information
                    const castResponse = await api.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${mediaType}/${mediaId}/credits`);
                    setCast(castResponse.data.cast);
                } else {
                    navigate('/not-found');
                }
            } catch (error) {
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
    
    const handleCloseCalendar = useCallback(() => {
        setShowCalendar(false);
    }, []);
      
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCalendar && calendarRef.current && !calendarRef.current.contains(event.target)) {
                handleCloseCalendar();
            }
            if (showTrailer && trailerModalRef.current && !trailerModalRef.current.contains(event.target)) {
                setShowTrailer(false);
            }
        };
    
        if (showCalendar || showTrailer) {
            document.addEventListener('mousedown', handleClickOutside);
        }
    
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showCalendar, showTrailer, handleCloseCalendar]);        
    
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
                showAlert('You disliked this media!', 'success');
            } else {
                showAlert('Interaction removed.', 'info');
            }
        } catch (error) {
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
            .then(() => showAlert('Successful share!', 'success'))
            .catch(() => showAlert('Error sharing. Please try again.', 'error'));
        } else {
            navigator.clipboard.writeText(`Check out this title - ${mediaData.title || mediaData.name}: ${url}`)
            .then(() => showAlert('Link copied to clipboard!', 'success'))
            .catch(() => showAlert('Failed to copy link', 'error'));
        }
    };

    const closeAlert = () => {
        setAlert({ show: false, message: '', type: '' });
    };

    const handleScrollRight = () => {
        if (castContainerRef.current) {
            const newPosition = scrollPosition + castContainerRef.current.clientWidth;
            castContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
            setScrollPosition(newPosition);
        }
    };

    const handleScrollLeft = () => {
        if (castContainerRef.current) {
            const newPosition = scrollPosition - castContainerRef.current.clientWidth;
            castContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
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
                <button>
                    <FontAwesomeIcon
                        icon={faThumbsUp}
                        className="nextview-page__thumbs-up active"
                        onClick={() => handleToggleInteraction(0)}
                        data-tooltip-id={`thumbsUpTooltip-${mediaId}`}
                        data-tooltip-content="LIKED"
                    />
                    <Tooltip id={`thumbsUpTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                </button>
            );
        } else if (interaction === 0) {
            return (
                <button>
                    <FontAwesomeIcon
                        icon={faThumbsDown}
                        className="nextview-page__thumbs-down active"
                        onClick={() => handleToggleInteraction(1)}
                        data-tooltip-id={`thumbsDownTooltip-${mediaId}`}
                        data-tooltip-content="DISLIKED"
                    />
                    <Tooltip id={`thumbsDownTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                </button>
            );
        } else {
            return (
                <>
                    <div className="nextview-page__neutral-interactions">
                        <button>
                            <FontAwesomeIcon
                                icon={faThumbsUp}
                                className="nextview-page__thumbs-up"
                                onClick={() => handleToggleInteraction(1)}
                                data-tooltip-id={`interactionTooltip-${mediaId}`}
                                data-tooltip-content="LIKE"
                            />
                        </button>
                        <button>
                            <FontAwesomeIcon
                                icon={faThumbsDown}
                                className="nextview-page__thumbs-down"
                                onClick={() => handleToggleInteraction(0)}
                                data-tooltip-id={`interactionTooltip-${mediaId}`}
                                data-tooltip-content="DISLIKE"
                            />
                        </button>
                    </div>
                    <Tooltip id={`interactionTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                </>
            );
        }
    };

    return (
        <div className="nextview-page">
            {alert.show && (
                <CustomAlerts
                    message={alert.message}
                    type={alert.type}
                    onClose={closeAlert}
                />
            )}
            <div className="nextview-page__heading-container">
                <h1 className="nextview-page__header">NextView</h1>
                <p className="nextview-page__copy">
                    <span className="nextview-page__gradient-subtitle">NextView</span>
                    is a detailed media display page in your app. It shows all the essential information about a selected movie or TV show, including its title, description, rating, genres, and available streaming services. You can watch a trailer, add the media to your calendar, and interact by liking or disliking it. The page is designed to give users a comprehensive and interactive experience with their chosen media.
                </p>
            </div>
            <div className="nextview-page__content-container">
                <div className="nextview-page__content">
                    <h1 className="nextview-page__title">
                        {mediaData.title || mediaData.name || "Title: N/A"}
                        {mediaData.release_date && <span className="nextview-page__release-date"> ({new Date(mediaData.release_date).getFullYear()})</span>}
                        {certification && (
                            <>
                                <span
                                    className="nextview-page__certification"
                                    data-tooltip-id={`certificationTooltip-${mediaId}`}
                                    data-tooltip-content={`Rating`}
                                >
                                    {certification}
                                </span>
                                <Tooltip id={`certificationTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                            </>
                        )}
                    </h1>
                    <p className="nextview-page__description">
                        {mediaData.overview || "Description: Unavailable"}
                    </p>
                </div>

                <div className="nextview-page__media-info">
                    <div className="nextview-page__left-media-container">
                        <Link to={`/nextwatch/${userId}/${mediaType}/${mediaId}`} className="nextview-page__nextwatch-link">
                            <FontAwesomeIcon icon={faListCheck} className="nextview-page__nextwatch-icon" />
                            Find Similar Media
                        </Link>
                        <div className="nextview-page__poster-container">
                            <button>
                                <img 
                                    src={mediaData.poster_path 
                                            ? `https://image.tmdb.org/t/p/w500${mediaData.poster_path}` 
                                            : DefaultPosterImg}  
                                    alt={mediaData.title || mediaData.name || "No Poster Available"} 
                                    className="nextview-page__poster"
                                />
                            </button>
                            <button className="nextview-page__play-overlay" onClick={handlePlayTrailer}>
                                <FontAwesomeIcon icon={faPlay} className="nextview-page__play-icon" />
                            </button>
                        </div> 

                        <div className="nextview-page__actions">
                            <div className="nextview-page__media-type">
                                <FontAwesomeIcon
                                    className="nextview-page__media-icon"
                                    icon={mediaType === 'tv' ? faTv : faFilm}
                                    data-tooltip-id={`mediaTypeTooltip-${mediaId}`}
                                    data-tooltip-content={`${mediaType === 'tv' ? 'TV Show' : 'Movie'}`}
                                />
                                <Tooltip id={`mediaTypeTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                            </div>
                            <button
                                className='nextview-page__calendar-button-container'
                                onClick={handleAddToCalendar}
                                data-tooltip-id={`calendarTooltip-${mediaId}`}
                                data-tooltip-content="Add to Calendar"
                            >
                                <FontAwesomeIcon icon={faCalendarPlus} className="nextview-page__calendar-button"/>
                            </button>
                            <Tooltip id={`calendarTooltip-${mediaId}`} place="top" className="custom-tooltip" />
                            
                            <button
                                className='nextview-page__share-button-container'
                                onClick={handleShare}
                                data-tooltip-id={`shareTooltip-${mediaId}`}
                                data-tooltip-content="Share"
                            >
                                <FontAwesomeIcon icon={faShareAlt} className="nextview-page__share-button" />
                            </button>
                            <Tooltip id={`shareTooltip-${mediaId}`} place="top" className="custom-tooltip" />

                            <div className="nextview-page__interaction-buttons">
                                {getInteractionIcon()}
                            </div>
                        </div> 
                    </div>

                    <div className="nextview-page__details">
                        <div className="nextview-page__genre">
                            {mediaData.genres.map(genre => (
                                <span key={genre.id} className="nextview-page__genre-item">
                                    <FontAwesomeIcon
                                        icon={genreIconMapping[genre.name] || faFilm}
                                        className="nextview-page__genre-icon"
                                    /> {genre.name}
                                </span>
                            ))}
                        </div>

                        <div className="nextview-page__details-container">
                            <div className="nextview-page__rating">
                                <FontAwesomeIcon icon={faStar} className="nextview-page__star-icon" /> {mediaData.vote_average} / 10
                            </div>

                            <div className="nextview-page__duration">
                                {mediaType === 'movie' 
                                    ? `${mediaData.runtime} minutes` 
                                    : mediaData.episode_run_time[0] 
                                        ? `${mediaData.episode_run_time[0]} minutes per episode`
                                        : 'Duration: Unavailable'}
                            </div>
                        </div>

                        <div className="nextview-page__streaming">
                            <p className="nextview-page__streaming-copy">Available on:</p>
                            <div className="nextview-page__streaming-services">
                                {providers.length > 0 ? (
                                    providers.map(provider => (
                                        <img
                                            key={provider.provider_id}
                                            src={`https://image.tmdb.org/t/p/original${provider.logo_path}`}
                                            alt={provider.provider_name}
                                            className="nextview-page__streaming-provider-logo"
                                        />
                                    ))
                                ) : (
                                    <p className="nextview-page__no-streaming-services">No streaming services available.</p>
                                )}
                            </div>
                        </div>

                        {/* Cast Section */}
                        <div className={`nextview-page__cast-container ${cast.length <= 3 ? 'no-scroll' : ''}`}>
                            <p className="nextview-page__cast-copy">Cast:</p>
                            {cast.length === 0 ? (
                                <p className="nextview-page__no-cast-copy">Cast information unavailable.</p>
                            ) : (
                                <>
                                    {cast.length > 3 && (
                                        <button className="nextview-page__cast-arrow nextview-page__cast-arrow-left" onClick={handleScrollLeft}>
                                            <FontAwesomeIcon icon={faChevronLeft} />
                                        </button>
                                    )}
                                    <div className="nextview-page__cast-scroll" ref={castContainerRef}>
                                        <ul className="nextview-page__cast-list">
                                            {cast.map(member => (
                                                <li key={member.id} className="nextview-page__cast-item"> 
                                                    <div
                                                        className="nextview-page__cast-card"
                                                        onClick={(e) => {
                                                            if (isGuest) {
                                                                e.preventDefault(); 
                                                                showAlert('Guests cannot access cast details. Please register for full access.', 'info');
                                                            } else {
                                                                navigate(`/spotlight/${userId}/${member.id}`); 
                                                            }
                                                        }}
                                                    >
                                                        {member.profile_path ? (
                                                            <img
                                                                src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                                                                alt={member.name}
                                                                className="nextview-page__cast-img"
                                                            />
                                                        ) : (
                                                            <FontAwesomeIcon icon={faPortrait} className="nextview-page__cast-img-placeholder" />
                                                        )}
                                                        <div className="nextview-page__cast-name">{member.name}</div>
                                                        <div className="nextview-page__cast-character">as {member.character}</div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul> 
                                    </div>

                                    {cast.length > 3 && (
                                        <button className="nextview-page__cast-arrow nextview-page__cast-arrow-right" onClick={handleScrollRight}>
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
                <div className="nextview-page__modal">
                    <div className="nextview-page__modal-content" ref={trailerModalRef}>
                        <button className="nextview-page__modal-content-close" onClick={() => setShowTrailer(false)}>
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
                                className="nextview-page__trailer"
                            ></iframe>
                        )}
                    </div>
                </div>
            )}

            <div className="nextview-page__background">
                <WavesBg />
            </div>

            {showCalendar && (
                <div className="nextview-page__calendar-modal">
                    <button
                        className="nextview-page__cal-close-btn"
                        onClick={handleCloseCalendar}
                    >
                        <FontAwesomeIcon icon={faClose} className="nextview-page__close-icon" />
                    </button>

                    <div ref={calendarRef}>
                        <Calendar
                            userId={userId}
                            eventTitle={mediaData.title || mediaData.name}
                            mediaType={mediaType}
                            duration={
                                mediaType === 'movie'
                                    ? mediaData.runtime
                                    : mediaData.episode_run_time[0]
                            }
                            onClose={handleCloseCalendar}
                        />
                    </div>
                </div>
            )}

        </div>
    );
};

export default NextViewPage;