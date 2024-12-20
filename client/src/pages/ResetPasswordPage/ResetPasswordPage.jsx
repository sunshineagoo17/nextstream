import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer, Slide } from 'react-toastify';
import api from '../../services/api';
import Cookies from 'js-cookie';
import AnimatedBg from '../../components/Backgrounds/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loaders/Loader/Loader';
import ResetPasswordImg from "../../assets/images/reset-password.svg";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import 'react-toastify/dist/ReactToastify.css';
import './ResetPasswordPage.scss';

export const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [validationError, setValidationError] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');
  const graphicRef = useRef(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Mouse move animation
  useEffect(() => {
    const graphicContainer = document.querySelector('.reset-password__graphic-container');
    
    if (graphicContainer) {
        const handleMouseMove = (e) => {
            const graphic = graphicRef.current;
            if (graphic) {
                const rect = graphic.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const rotateX = (y / rect.height - 0.5) * 30;
                const rotateY = (x / rect.width - 0.5) * -30;

                graphic.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                graphic.style.boxShadow = `${-rotateY}px ${rotateX}px 20px rgba(0, 0, 0, 0.2)`;
            }
        };

        graphicContainer.addEventListener('mousemove', handleMouseMove);

        return () => {
            graphicContainer.removeEventListener('mousemove', handleMouseMove);
        };
    }
}, []);

const handleClick = () => {
    const graphic = graphicRef.current;
    if (graphic) {
        graphic.style.transform = 'scale(0.9)';
        setTimeout(() => {
            navigate('/');
        }, 150);
    }
};

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleInputChange = (e, setState) => {
    setState(e.target.value);
    setValidationError((prev) => ({
      ...prev,
      [e.target.name]: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let errors = {};
    if (!newPassword) {
      errors.newPassword = 'Please fill out this field.';
    } else if (newPassword.length < 8) {
      errors.newPassword = 'Password must be 8+ chars.';
    }
    if (!confirmPassword) {
      errors.confirmPassword = 'Please fill out this field.';
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    setValidationError(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await api.post('/api/password-reset/reset-password', { token, newPassword });
      setMessage(response.data.message);
      setMessageType(response.data.success ? 'success' : 'error');
      if (response.data.success) {
        Cookies.set('resetPasswordMessage', response.data.message, { expires: 1 });
        toast.success(response.data.message, {
          className: 'frosted-toast-reset',
        });
        navigate('/login');
      }
    } catch (error) {
      toast.error('Error resetting password. Please try again.', {
        className: 'frosted-toast-reset',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={true}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
      {isLoading ? <Loader /> : (
        <div className="reset-password">
          <div className="reset-password__container">
            <div className="reset-password__content-card">
              <h1 className="reset-password__title">Reset Password</h1>
              <p className="reset-password__intro">Keep your account secure.</p>
              <p className="reset-password__text">
                Please enter a new password below. This will replace your current password and ensure your account remains secure.
              </p>
              <form className="reset-password__form" onSubmit={handleSubmit}>
                <div className="reset-password__input-group reset-password__input-group--password">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    value={newPassword}
                    name="newPassword"
                    onChange={(e) => handleInputChange(e, setNewPassword)}
                    required
                    className="reset-password__input"
                    placeholder=" "
                  />
                  <label className="reset-password__label">New Password</label>
                  <button
                    type="button"
                    className="reset-password__password-toggle"
                    onClick={togglePasswordVisibility}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    <FontAwesomeIcon
                      icon={passwordVisible ? faEyeSlash : faEye}
                      className="reset-password__password-toggle-icon"
                    />
                  </button>
                </div>
                {validationError.newPassword && (
                  <div className="reset-password__validation-error">{validationError.newPassword}</div>
                )}
                <div className="reset-password__input-group reset-password__input-group--password">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    value={confirmPassword}
                    name="confirmPassword"
                    onChange={(e) => handleInputChange(e, setConfirmPassword)}
                    required
                    className="reset-password__input"
                    placeholder=" "
                  />
                  <label className="reset-password__label">Confirm Password</label>
                  <button
                    type="button"
                    className="reset-password__password-toggle"
                    onClick={toggleConfirmPasswordVisibility}
                    aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                  >
                    <FontAwesomeIcon
                      icon={confirmPasswordVisible ? faEyeSlash : faEye}
                      className="reset-password__password-toggle-icon"
                    />
                  </button>
                </div>
                {validationError.confirmPassword && (
                  <div className="reset-password__validation-error">{validationError.confirmPassword}</div>
                )}
                <button type="submit" className="reset-password__button">Reset Password</button>
              </form>
              <div className="reset-password__graphic-container" onClick={handleClick}>
                <img
                  src={ResetPasswordImg}
                  alt="reset password graphic"
                  className="reset-password__graphic"
                  ref={graphicRef}
                />
              </div>
              {message && (
                <div className={`reset-password__message ${messageType === 'error' ? 'reset-password__message--error' : 'reset-password__message--success'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>
          <div className="reset-password__background">
            <AnimatedBg />
          </div>
        </div>
      )}
    </>
  );
};

export default ResetPasswordPage;