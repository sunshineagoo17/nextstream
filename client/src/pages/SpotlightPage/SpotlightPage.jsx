import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import api from '../../services/api';
import WavesBg from '../../components/WavesBg/WavesBg';
import Loader from '../../components/Loader/Loader';
import CustomAlerts from '../../components/CustomAlerts/CustomAlerts';
import DefaultSpotlightImg  from "../../assets/images/defaultimg.png";
import DefaultCreditImg from "../../assets/images/posternoimg-icon.png";
import './SpotlightPage.scss';

const SpotlightPage = () => {
    const { personId } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated, userId } = useContext(AuthContext);
    
    const [personData, setPersonData] = useState(null);
    const [credits, setCredits] = useState([]);
    const [images, setImages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, message: '', type: '' });
    const [showFullBio, setShowFullBio] = useState(false);

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

        if (!personId) {
            navigate('/not-found');
            return;
        }

        const fetchPersonData = async () => {
            try {
                const personResponse = await api.get(`/api/spotlight/${personId}`);
                setPersonData(personResponse.data.details);
                setCredits(personResponse.data.combinedCredits || []);
                setImages(personResponse.data.images.profiles?.slice(0, 1) || []);
            } catch (error) {
                showAlert('Error loading person details. Please try again later.', 'error');
                navigate('/not-found');
            } finally {
                setIsLoading(false);
            }
        };

        fetchPersonData();
    }, [personId, navigate, showAlert, isAuthenticated]);

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Unknown';
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, options);
    };

    const calculateAge = (birthday) => {
        if (!birthday) return 'Unknown';
        const today = new Date();
        const birthDate = new Date(birthday);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDifference = today.getMonth() - birthDate.getMonth();
        if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
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

            <div className="spotlight-page__content-container">
                <div className="spotlight-page__content">
                    <h2 className="spotlight-page__person-name">{personData.name}</h2>
                    <p className="spotlight-page__person-bio">
                        {showFullBio ? personData.biography : `${personData.biography?.slice(0, 200)}...`}
                        {personData.biography && personData.biography.length > 200 && (
                            <button className="spotlight-page__read-more" onClick={() => setShowFullBio(!showFullBio)}>
                                {showFullBio ? 'Read Less' : 'Read More'}
                            </button>
                        )}
                    </p>
                </div>

                <div className="spotlight-page__actor-container">
                    <div className="spotlight-page__left-container">
                        <div className="spotlight-page__image-container">
                            {images.length > 0 ? (
                                <img
                                    src={`https://image.tmdb.org/t/p/w500${images[0].file_path}`}
                                    alt={personData.name}
                                    className="spotlight-page__image"
                                />
                            ) : (
                                <img
                                    src={DefaultSpotlightImg} 
                                    alt="Default Profile"
                                    className="spotlight-page__image"
                                />
                            )}
                        </div>
                    </div>

                    <div className="spotlight-page__details">
                        <div className="spotlight-page__info-container">Personal Info</div>
                        <div className="spotlight-page__text-container">
                            <p className="spotlight-page__info-txt"><strong>Known For:</strong> {personData.known_for_department}</p>
                            <p className="spotlight-page__info-txt"><strong>Gender:</strong> {personData.gender === 1 ? 'Female' : 'Male'}</p>
                            <p className="spotlight-page__info-txt"><strong>Birthday:</strong> {formatDate(personData.birthday)} ({calculateAge(personData.birthday)} years old)</p>
                            <p className="spotlight-page__info-txt"><strong>Place of Birth:</strong> {personData.place_of_birth || 'Unknown'}</p>
                            <p className="spotlight-page__info-txt"><strong>Also Known As:</strong> {personData.also_known_as?.join(', ') || 'N/A'}</p>
                        </div>

                        <div className="spotlight-page__filmography-container">Filmography</div>
                        <div className="spotlight-page__credits-container" ref={creditsContainerRef} style={{ overflowX: 'auto', scrollbarWidth: 'thin' }}>
                            {credits.length > 0 ? credits.map(credit => (
                                <div key={credit.id} className="spotlight-page__credits-item">
                                    <Link to={`/nextview/${userId}/${credit.media_type}/${credit.id}`}>
                                        <img
                                            src={credit.poster_path ? `https://image.tmdb.org/t/p/w500${credit.poster_path}` : DefaultCreditImg} // Use DefaultCreditImg when no poster is available
                                            alt={credit.title || credit.name}
                                            className="spotlight-page__credit-poster"
                                        />
                                        <div className="spotlight-page__credit-title">
                                            <span>{credit.title || credit.name}</span>
                                        </div>
                                    </Link>
                                </div>
                            )) : <p>No filmography available.</p>}
                        </div>
                    </div>
                </div>

                <div className="spotlight-page__background">
                    <WavesBg />
                </div>
            </div>
        </div>
    );
};

export default SpotlightPage;