import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay, faCalendarPlus, faThumbsUp, faThumbsDown, faStar, faClose, faTv, faFilm, faChevronRight, faChevronLeft,
  faMap, faBomb, faPalette, faLaugh, faFingerprint, faClapperboard, faTheaterMasks, faQuidditch, faGhost, faUserSecret,
  faVideoCamera, faFaceKissWinkHeart, faHandSpock, faMask, faGlobe, faTrophy, faUsersViewfinder, faChildren
} from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext'; 
import { Tooltip } from 'react-tooltip';
import axios from 'axios';
import WavesBg from '../../components/WavesBg/WavesBg';
import Loader from '../../components/Loader/Loader';
import Calendar from '../CalendarPage/sections/Calendar';
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
  Horror: faGhost,
  Mystery: faUserSecret,
  Reality: faVideoCamera,
  Romance: faFaceKissWinkHeart,
  'Science Fiction': faHandSpock,
  Thriller: faMask,
  International: faGlobe,
  Popular: faStar,
  New: faTrophy,
  'Broad Audience': faUsersViewfinder,
  Family: faChildren,
  // Add other genres and their corresponding icons here
};

const NextViewPage = () => {
    const { mediaId, mediaType } = useParams();
    const navigate = useNavigate();  
    const { userId } = useContext(AuthContext); 
    const [mediaData, setMediaData] = useState(null);
    const [certification, setCertification] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState('');
    const [interaction, setInteraction] = useState(null); 
    const [showCalendar, setShowCalendar] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [providers, setProviders] = useState([]);
    const [cast, setCast] = useState([]);
    const [scrollPosition, setScrollPosition] = useState(0);

    const castContainerRef = useRef(null);

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

        const fetchMediaData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/nextview/${userId}/${mediaId}/${mediaType}`);
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
                    const castResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${mediaType}/${mediaId}/credits`);
                    setCast(castResponse.data.cast);
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
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${mediaType}/${mediaId}/videos`);
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
            setIsLoading(false);
        }
    };

    const handleAddToCalendar = () => {
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
        try {
            await axios.post(`${process.env.REACT_APP_BASE_URL}/api/interactions`, {
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
                <>
                    <FontAwesomeIcon
                        icon={faThumbsUp}
                        className="nextview-page__thumbs-up active"
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
                        className="nextview-page__thumbs-down active"
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
                    <div className="nextview-page__neutral-interactions">
                        <FontAwesomeIcon
                            icon={faThumbsUp}
                            className="nextview-page__thumbs-up"
                            onClick={() => handleToggleInteraction(1)}
                            data-tooltip-id={`interactionTooltip-${mediaId}`}
                            data-tooltip-content="LIKE"
                        />
                        <FontAwesomeIcon
                            icon={faThumbsDown}
                            className="nextview-page__thumbs-down"
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
                        {mediaData.title || mediaData.name}
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
                    <p className="nextview-page__description">{mediaData.overview}</p>
                </div>

                <div className="nextview-page__media-info">
                    <div className="nextview-page__left-media-container">
                        <div className="nextview-page__poster-container">
                            <img 
                                src={`https://image.tmdb.org/t/p/w500${mediaData.poster_path}`} 
                                alt={mediaData.title || mediaData.name} 
                                className="nextview-page__poster"
                            />
                            <div className="nextview-page__play-overlay" onClick={handlePlayTrailer}>
                                <FontAwesomeIcon icon={faPlay} className="nextview-page__play-icon" />
                            </div>
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
                                className="nextview-page__calendar-button"
                                onClick={handleAddToCalendar}
                                data-tooltip-id={`calendarTooltip-${mediaId}`}
                                data-tooltip-content="Add to Calendar"
                            >
                                <FontAwesomeIcon icon={faCalendarPlus} />
                            </button>
                            <Tooltip id={`calendarTooltip-${mediaId}`} place="top" className="custom-tooltip" />
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
                                <FontAwesomeIcon icon={faStar} /> {mediaData.vote_average} / 10
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
                                    <p>No streaming services available.</p>
                                )}
                            </div>
                        </div>

                        {/* Cast Section */}
                        <div className={`nextview-page__cast-container ${cast.length <= 3 ? 'no-scroll' : ''}`}>
                            <p className="nextview-page__cast-copy">Cast:</p>
                            {cast.length === 0 ? (
                                <p>Cast information unavailable.</p>
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
                                                <li key={member.cast_id} className="nextview-page__cast-item">
                                                    <div className="nextview-page__cast-card">
                                                        <img
                                                            src={`https://image.tmdb.org/t/p/w185${member.profile_path}`}
                                                            alt={member.name}
                                                            className="nextview-page__cast-img"
                                                        />
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
                    <div className="nextview-page__modal-content">
                        <button className="nextview-page__modal-content-close" onClick={() => setShowTrailer(false)}>
                            <FontAwesomeIcon icon={faClose} />
                        </button>
                        <iframe
                            src={trailerUrl}
                            title="Trailer"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="nextview-page__trailer"
                        ></iframe>
                    </div>
                </div>
            )}

            <div className="nextview-page__background">
                <WavesBg />
            </div>

            {showCalendar && (
                <div className="calendar-modal">
                    <button className="calendar-close-btn" onClick={handleCloseCalendar}>
                        <FontAwesomeIcon icon={faClose} className='nextview-page__close-icon' />
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

export default NextViewPage;