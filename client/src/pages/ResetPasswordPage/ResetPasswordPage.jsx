import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast, ToastContainer, Slide } from 'react-toastify';
import axios from 'axios';
import Cookies from 'js-cookie'; 
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import ShowIcon from "../../assets/images/register-visible-icon.svg";
import HideIcon from "../../assets/images/register-invisible-icon.svg";
import Loader from '../../components/Loader/Loader';
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

  useEffect(() => {
    setIsLoading(false);
  }, []);

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
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/password-reset/reset-password`, { token, newPassword });
      setMessage(response.data.message);
      setMessageType(response.data.success ? 'success' : 'error');
      if (response.data.success) {
        Cookies.set('resetPasswordMessage', response.data.message, { expires: 1 }); 
        toast.success(response.data.message, {
          className: 'frosted-toast-reset',
        });
        navigate('/login');
      } else {
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
                    <img src={passwordVisible ? HideIcon : ShowIcon} alt="Toggle visibility" className="reset-password__password-toggle-icon" />
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
                    <img src={confirmPasswordVisible ? HideIcon : ShowIcon} alt="Toggle visibility" className="reset-password__password-toggle-icon" />
                  </button>
                </div>
                {validationError.confirmPassword && (
                  <div className="reset-password__validation-error">{validationError.confirmPassword}</div>
                )}
                <button type="submit" className="reset-password__button">Reset Password</button>
              </form>
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