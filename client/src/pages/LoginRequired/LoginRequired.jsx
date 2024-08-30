import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import './LoginRequired.scss';
import Loader from '../../components/Loader/Loader';
import LoginImg from "../../assets/images/login-required.svg";

export const LoginRequired = () => {
    const [isLoading, setIsLoading] = useState(true);
    const { guestLogin } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        setIsLoading(false);
    }, []);

    const handleLoginClick = () => {
        navigate('/login');
    };

    const handleRegisterClick = () => {
        navigate('/register');
    };

    const handleGuestClick = () => {
        const guestToken = 'guestTokenValue'; // Replace with your logic to generate or retrieve a guest token
        guestLogin(guestToken); // Call guestLogin to set the guest state
        navigate('/top-picks/guest');
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
                            log</button> in to access the content. Don't have an account? <button className="login-required__register-link" onClick={handleRegisterClick} aria-label="Go to Register Page">Register</button> now! Or explore as a <button className="login-required__guest-link" onClick={handleGuestClick} aria-label="Continue as Guest">Guest</button>.
                        </p>
                        <div className="login-required__graphic-container">
                            <img src={LoginImg} alt="Login required graphic" className="login-required__graphic" />
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