import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight, faChevronLeft, faUser } from '@fortawesome/free-solid-svg-icons';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { Tooltip } from 'react-tooltip';
import api from '../../services/api';
import WavesBg from '../../components/WavesBg/WavesBg';
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import './SpotlightPage.scss';

const SpotlightPage = () => {
    const { userId, personId } = useParams(); // Ensure userId is captured here
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
        if (!personId || !userId) { // Ensure both personId and userId are validated
            navigate('/not-found');
            return;
        }

        const fetchPersonData = async () => {
            try {
                const personResponse = await api.get(`/api/spotlight/${personId}`);
                setPersonData(personResponse.data.details);
                setCredits(personResponse.data.combinedCredits.cast);
                setImages(personResponse.data.images.profiles);
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
                    showcases detailed information about actors and public figures, including their filmography, biography, and known works. Explore and learn more about their career journey.
                </p>
            </div>

            <div className="spotlight-page__heading-container">
                <h2 className="spotlight-page__person-name">{personData.name}</h2>
                <p className="spotlight-page__person-bio">{personData.biography || 'Biography Unavailable'}</p>
            </div>

            <div className="spotlight-page__content-container">
                <div className="spotlight-page__left-container">
                    <div className="spotlight-page__images-container">
                        {images.length > 0 ? (
                            images.map((image, index) => (
                                <img
                                    key={index}
                                    src={`https://image.tmdb.org/t/p/w500${image.file_path}`}
                                    alt={personData.name} 
                                    className="spotlight-page__image"
                                />
                            ))
                        ) : (
                            <p>No images available</p>
                        )}
                    </div>
                </div>

                <div className="spotlight-page__details">
                    <p><strong>Known For:</strong> {personData.known_for_department}</p>
                    <p><strong>Gender:</strong> {personData.gender === 1 ? 'Female' : 'Male'}</p>
                    <p><strong>Birthday:</strong> {personData.birthday || 'Unknown'}</p>
                    <p><strong>Place of Birth:</strong> {personData.place_of_birth || 'Unknown'}</p>

                    <h3>Filmography:</h3>
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
                            <div key={credit.id} className="spotlight-page__credit-item">
                                <FontAwesomeIcon
                                    icon={faUser}
                                    className="spotlight-page__credit-icon"
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