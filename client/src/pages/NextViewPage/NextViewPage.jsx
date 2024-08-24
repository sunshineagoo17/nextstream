import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faCalendarPlus, faThumbsUp, faThumbsDown, faStar, faClose, faTv, faFilm } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import Calendar from '../CalendarPage/sections/Calendar';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import { AuthContext } from '../../context/AuthContext/AuthContext'; 
import { Tooltip } from 'react-tooltip';
import './NextViewPage.scss';

const NextViewPage = () => {
    const { mediaId, mediaType } = useParams();
    const navigate = useNavigate();  
    const { userId } = useContext(AuthContext); 
    const [mediaData, setMediaData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);
    const [trailerUrl, setTrailerUrl] = useState('');
    const [interaction, setInteraction] = useState(null); 
    const [showCalendar, setShowCalendar] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [providers, setProviders] = useState([]);

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
    }, [mediaId, mediaType, navigate, userId]);

    const handlePlayTrailer = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${mediaType}/${mediaId}/videos`);
            const videoData = response.data;

            if (videoData && videoData.embedUrl) {
                setTrailerUrl(videoData.embedUrl);
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
            alert('Please log in to add this to your calendar.');
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
                showAlert('You liked this item!', 'success');
            } else if (newInteraction === 0) {
                showAlert('You disliked this item!', 'info');
            } else {
                showAlert('Interaction removed.', 'info');
            }
        } catch (error) {
            console.error('Error toggling interaction:', error);
            showAlert('Error toggling interaction. Please try again later.', 'error');
        }
    };

    const showAlert = (message, type) => {
        setAlert({ show: true, message, type });
    };

    const closeAlert = () => {
        setAlert({ show: false, message: '', type: '' });
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
                    <Tooltip id={`thumbsUpTooltip-${mediaId}`} place="top" className="tooltip-custom" />
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
                    <Tooltip id={`thumbsDownTooltip-${mediaId}`} place="top" className="tooltip-custom" />
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
                    <Tooltip id={`interactionTooltip-${mediaId}`} place="top" className="tooltip-custom" />
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
            <div className="nextview-page__content">
                <h1 className="nextview-page__title">
                    {mediaData.title || mediaData.name}
                    {mediaData.release_date && <span className="nextview-page__release-date"> ({new Date(mediaData.release_date).getFullYear()})</span>}
                    {mediaData.certification && <span className="nextview-page__certification"> {mediaData.certification}</span>}
                </h1>
                {mediaData.adult && <p className="nextview-page__rating">Rated R</p>}
                <p className="nextview-page__description">{mediaData.overview}</p>

                <div className="nextview-page__media-info">
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

                    <div className="nextview-page__details">
                        <div className="nextview-page__genre">
                            {mediaData.genres.map(genre => (
                                <span key={genre.id} className="nextview-page__genre-item">{genre.name}</span>
                            ))}
                        </div>

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

                        <div className="nextview-page__streaming">
                            <h3>Available on:</h3>
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
                    </div>
                </div>

                <div className="nextview-page__actions">
                    <div className="nextview-page__media-type">
                        <FontAwesomeIcon icon={mediaType === 'tv' ? faTv : faFilm} />
                        {mediaType === 'tv' ? ' TV Show' : ' Movie'}
                    </div>
                    <button className="nextview-page__calendar-button" onClick={handleAddToCalendar}>
                        <FontAwesomeIcon icon={faCalendarPlus} />
                        Add to Calendar
                    </button>
                    <div className="nextview-page__interaction-buttons">
                        {getInteractionIcon()}
                    </div>
                </div>
            </div>

            {showTrailer && (
                <div className="nextview-page__trailer-modal">
                    <button className="nextview-page__close-btn" onClick={() => setShowTrailer(false)}>
                        Close
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
            )}

            <div className="nextview-page__background">
                <AnimatedBg />
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