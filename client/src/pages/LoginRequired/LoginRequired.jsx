import { useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import AnimatedBg from '../../components/Backgrounds/AnimatedBg/AnimatedBg';
import './LoginRequired.scss';
import Loader from '../../components/Loaders/Loader/Loader';
import LoginImg from "../../assets/images/login-required.svg";

export const LoginRequired = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { guestLogin } = useContext(AuthContext);
    const navigate = useNavigate();
    const graphicRef = useRef(null); 

    useEffect(() => {
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const graphic = graphicRef.current;
            const rect = graphic.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // Calculate the range for the rotation (-15deg to +15deg) based on mouse position
            const rotateX = (y / rect.height - 0.5) * 30; 
            const rotateY = (x / rect.width - 0.5) * -30; 

            // Apply 3D rotation and shadow effect
            graphic.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            graphic.style.boxShadow = `${-rotateY}px ${rotateX}px 20px rgba(0, 0, 0, 0.2)`;
        };

        const graphicContainer = document.querySelector('.login-required__graphic-container');
        graphicContainer.addEventListener('mousemove', handleMouseMove);

        return () => {
            graphicContainer.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    const handleGuestClick = () => {
        const guestToken = 'guestTokenValue';
        guestLogin(guestToken);
        navigate('/top-picks/guest');
    };

    const handleMouseDown = () => {
        const graphic = graphicRef.current;
        graphic.style.transform = `scale(0.9)`;
    };

    const handleMouseUp = () => {
        const graphic = graphicRef.current;
        graphic.style.transform = `scale(1)`;
    };

    return (
        <>
            {isLoading && <Loader />}
            <div className="login-required">
                <div className="login-required__container">
                    <div className="login-required__content-card">
                        <h1 className="login-required__title">Login Required</h1>
                        <p className="login-required__intro">You need to be logged in to view this page.</p>
                        <p className="login-required__text">
                            Please <button className="login-required__login-link" onClick={handleLoginClick} aria-label="Go to Login Page">
                            log</button> in to access the content. Don't have an account? <button className="login-required__register-link" onClick={handleRegisterClick} aria-label="Go to Register Page">Register</button> now or explore our app as a <button className="login-required__guest-link" onClick={handleGuestClick} aria-label="Continue as Guest">Guest</button>.
                        </p>
                        <div className="login-required__graphic-container">
                            <img 
                              src={LoginImg} 
                              alt="Login required graphic" 
                              className="login-required__graphic" 
                              ref={graphicRef} 
                              onMouseDown={handleMouseDown} 
                              onMouseUp={handleMouseUp} 
                              onClick={handleLoginClick} 
                            />
                        </div>
                    </div>
                </div>
                <div className="login-required__background">
                    <AnimatedBg />
                </div>
            </div>
        </>
    );
};

export default LoginRequired;