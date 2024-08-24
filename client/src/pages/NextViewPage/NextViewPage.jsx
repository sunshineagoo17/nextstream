import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faCalendarPlus, faThumbsUp, faThumbsDown, faStar } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import { AuthContext } from '../../context/AuthContext/AuthContext'; 
import './NextViewPage.scss';

const NextViewPage = () => {
    const { mediaId, mediaType } = useParams();
    const navigate = useNavigate();  
    const { userId } = useContext(AuthContext); 
    const [mediaData, setMediaData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showTrailer, setShowTrailer] = useState(false);

    useEffect(() => {
        if (!mediaType || !mediaId) {
            console.error('Media type or media ID is missing.');
            navigate('/not-found'); 
            return;
        }

        const fetchMediaData = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/${mediaType}/${mediaId}`);
                if (response.data) {
                    setMediaData(response.data);
                } else {
                    console.error('No media data found');
                    navigate('/not-found');
                }
            } catch (error) {
                console.error('Error fetching media data:', error);
                navigate('/not-found');
            } finally {
                setIsLoading(false);
            }
        };

        fetchMediaData();
    }, [mediaId, mediaType, navigate]);

    const handlePlayTrailer = () => {
        setShowTrailer(true);
    };

    const handleAddToCalendar = () => {
        if (!userId) {
            alert('Please log in to add this to your calendar.');
            return;
        }

        // Logic to add to calendar goes here, using userId
        // e.g., open a modal or make a POST request to your calendar API endpoint
    };

    if (isLoading) {
        return <Loader />;
    }

    if (!mediaData) {
        return <p>Media data could not be loaded.</p>;
    }

    return (
        <div className="nextview-page">
            <div className="nextview-page__content">
                <h1 className="nextview-page__title">{mediaData.title || mediaData.name}</h1>
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
                            {mediaType === 'movie' ? `${mediaData.runtime} minutes` : `${mediaData.episode_run_time[0]} minutes per episode`}
                        </div>

                        <div className="nextview-page__streaming">
                            <h3>Available on:</h3>
                            <div className="nextview-page__streaming-services">
                                {mediaData.providers?.results?.CA?.flatrate?.length > 0 ? (
                                    mediaData.providers.results.CA.flatrate.map(provider => (
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
                    <button className="nextview-page__calendar-button" onClick={handleAddToCalendar}>
                        <FontAwesomeIcon icon={faCalendarPlus} />
                        Add to Calendar
                    </button>
                    <div className="nextview-page__interaction-buttons">
                        <FontAwesomeIcon icon={faThumbsUp} className="nextview-page__thumbs-up" />
                        <FontAwesomeIcon icon={faThumbsDown} className="nextview-page__thumbs-down" />
                    </div>
                </div>
            </div>

            {showTrailer && mediaData.videos?.results?.find(video => video.type === 'Trailer') && (
                <div className="nextview-page__trailer-modal">
                    <button className="nextview-page__close-btn" onClick={() => setShowTrailer(false)}>
                        Close
                    </button>
                    <iframe
                        src={`https://www.youtube.com/embed/${mediaData.videos.results.find(video => video.type === 'Trailer').key}`}
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
        </div>
    );
};

export default NextViewPage;