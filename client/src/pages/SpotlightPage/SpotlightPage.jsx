import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { Tooltip } from 'react-tooltip';
import api from '../../services/api';
import WavesBg from '../../components/WavesBg/WavesBg';
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './SpotlightPage.scss';

const SpotlightPage = () => {
    const { userId, personId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useContext(AuthContext);
    const [personData, setPersonData] = useState(null);
    const [credits, setCredits] = useState([]);
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [scrollPosition, setScrollPosition] = useState(0);

    const creditsContainerRef = useRef(null);

    const showAlert = useCallback((message, type) => {
        setAlert({ show: true, message, type });
        setTimeout(() => setAlert({ show: false, message: '', type: '' }), 3000);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
    }, [isAuthenticated, navigate]);

    useEffect(() => {
        if (!personId || !userId) {
            navigate('/not-found');
            return;
        }

        const fetchPersonData = async () => {
            try {
                const personResponse = await api.get(`/api/spotlight/${personId}`);
                setPersonData(personResponse.data.details);
                setCredits(personResponse.data.combinedCredits.cast);
                setImages(personResponse.data.images.profiles.slice(0, 1)); // Display only one image
            } catch (error) {
                showAlert('Error loading person details. Please try again later.', 'error');
                navigate('/not-found');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPersonData();
    }, [personId, userId, navigate, showAlert]);

    const handleScrollRight = () => {
        const newPosition = scrollPosition + creditsContainerRef.current.clientWidth;
        creditsContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
        setScrollPosition(newPosition);
    };

    const handleScrollLeft = () => {
        const newPosition = scrollPosition - creditsContainerRef.current.clientWidth;
        creditsContainerRef.current.scrollTo({ left: newPosition, behavior: 'smooth' });
        setScrollPosition(newPosition);
    };

    if (isLoading) {
        return <Loader />;
    }

    if (!personData) {
        return <p>Person data could not be loaded.</p>;
    }

    return (
        <div className="spotlight-page">
            {alert.show && (
                <CustomAlerts
                    message={alert.message}
                    type={alert.type}
                    onClose={() => setAlert({ show: false, message: '', type: '' })}
                />
            )}

            <div className="spotlight-page__heading-container">
                <h1 className="spotlight-page__header">Spotlight</h1>
                <p className="spotlight-page__copy">
                    <span className="spotlight-page__gradient-subtitle">Spotlight</span>
                    showcases detailed information about actors and public figures, including their filmography, biography, and known works.
                </p>
            </div>

            <div className="spotlight-page__heading-container">
                <h2 className="spotlight-page__person-name">{personData.name}</h2>
                <p className="spotlight-page__person-bio">{personData.biography || 'Biography Unavailable'}</p>
            </div>

            <div className="spotlight-page__content-container">
                <div className="spotlight-page__left-container">
                    <div className="spotlight-page__image-container">
                        {images.length > 0 ? (
                            <img
                                src={`https://image.tmdb.org/t/p/w500${images[0].file_path}`}
                                alt={personData.name}
                                className="spotlight-page__image"
                            />
                        ) : (
                            <p>No image available</p>
                        )}
                    </div>
                </div>

                <div className="spotlight-page__right-container">
                    <div className="spotlight-page__person-info">
                        <p><strong>Known For:</strong> {personData.known_for_department}</p>
                        <p><strong>Gender:</strong> {personData.gender === 1 ? 'Female' : 'Male'}</p>
                        <p><strong>Birthday:</strong> {personData.birthday || 'Unknown'}</p>
                        <p><strong>Place of Birth:</strong> {personData.place_of_birth || 'Unknown'}</p>
                        <p><strong>Also Known As:</strong> {personData.also_known_as?.join(', ') || 'N/A'}</p>
                    </div>

                    <div className="spotlight-page__credits-container" ref={creditsContainerRef}>
                        {credits.length > 3 && (
                            <FontAwesomeIcon
                                icon={faChevronLeft}
                                className="spotlight-page__chevron-icon"
                                onClick={handleScrollLeft}
                                data-tooltip-id="leftArrowTooltip"
                                data-tooltip-content="Scroll Left"
                            />
                        )}
                        {credits.map(credit => (
                            <div key={credit.id} className="spotlight-page__credits-item">
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${credit.poster_path}`}
                                    alt={credit.title || credit.name}
                                    className="spotlight-page__poster"
                                />
                                <span>{credit.title || credit.name}</span>
                            </div>
                        ))}
                        {credits.length > 3 && (
                            <FontAwesomeIcon
                                icon={faChevronRight}
                                className="spotlight-page__chevron-icon"
                                onClick={handleScrollRight}
                                data-tooltip-id="rightArrowTooltip"
                                data-tooltip-content="Scroll Right"
                            />
                        )}
                    </div>
                </div>
            </div>

            <Tooltip id="leftArrowTooltip" place="top" className="custom-tooltip" />
            <Tooltip id="rightArrowTooltip" place="top" className="custom-tooltip" />

            <div className="spotlight-page__background">
                <WavesBg />
            </div>
        </div>
    );
};

export default SpotlightPage;