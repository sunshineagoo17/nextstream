import { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import api from '../../services/api';
import ErrorIcon from '../../assets/images/error-icon.svg';
import ShowIcon from '../../assets/images/register-visible-icon.svg';
import HideIcon from '../../assets/images/register-invisible-icon.svg';
import NextStreamBg from '../../assets/images/nextstream-bg.jpg';
import ArrowIcon from '../../assets/images/register-arrow-icon.svg';
import SignUpIcon from '../../assets/images/register-sign-up-icon.svg';
import SignInCouple from '../../assets/images/login-hero-couple-watching.svg';
import ForgotPasswordModal from '../../components/ForgotPasswordModal/ForgotPasswordModal';
import Loader from '../../components/Loader/Loader';
import Cookies from 'js-cookie';
import './LoginPage.scss';

export const LoginPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [isForgotPasswordModalOpen, setIsForgotPasswordModalOpen] = useState(false);
  const navigate = useNavigate();
  const { login, guestLogin } = useContext(AuthContext);

  useEffect(() => {
    const storedEmail = Cookies.get('rememberedEmail');
    const storedPassword = Cookies.get('rememberedPassword');
    if (storedEmail && storedPassword) {
      setEmail(storedEmail);
      setPassword(storedPassword);
      setRememberMe(true);
    }

    setIsLoading(false);
  }, []);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const goToPreviousPage = () => {
    navigate(-1);
  };

  const validateFields = () => {
    if (!email.trim() || !password.trim()) {
      setErrors({ general: 'Please fill in all fields' });
      return false;
    }
    return true;
  };

  const clearErrors = () => {
    setErrors({});
  };

  const handleGuestClick = () => {
    const guestToken = 'guestTokenValue'; 
    guestLogin(guestToken); 
    navigate('/top-picks/guest');
};

  const handleSignIn = async () => {
    if (!validateFields()) return;

    const userData = { email, password };
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/login', userData);
      console.log('Login response:', response);
      if (response.data.token) {
        login(response.data.token, response.data.userId, rememberMe);

        // Store email and password in cookies if rememberMe is checked
        if (rememberMe) {
          Cookies.set('rememberedEmail', email, { expires: 7, secure: true, sameSite: 'strict' });
          Cookies.set('rememberedPassword', password, { expires: 7, secure: true, sameSite: 'strict' });
        } else {
          // Clear cookies if rememberMe is unchecked
          Cookies.remove('rememberedEmail');
          Cookies.remove('rememberedPassword');
        }

        console.log('Navigating to profile page');
        navigate(`/profile/${response.data.userId}`);
      } else {
        console.log('Login failed: Token missing in response');
        setErrors({ general: 'Login failed. Please try again.' });
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        setErrors({ general: error.response.data.message });
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckboxChange = (event) => {
    setRememberMe(event.target.checked);
  };

  const openForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(true);
  };

  const closeForgotPasswordModal = () => {
    setIsForgotPasswordModalOpen(false);
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="login">
        <div className="login__hero">
          <h1 className="login__title">Login</h1>
        </div>
        <div className="login__bg" style={{ backgroundImage: `url(${NextStreamBg})` }}></div>
        <div className="login__container">
          <div className="login__content-card">
            <div className="login__input-section">
              <div className="login__inputs">
                <div className="login__input-group">
                  <input
                    className="login__input"
                    id="input-email"
                    placeholder="Enter your email"
                    type="text"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearErrors();
                    }}
                  />
                  <label className="login__label" htmlFor="input-email">
                    Email
                  </label>
                  {errors.email && <p className="error">{errors.email}</p>}
                </div>
                <div className="login__input-group login__input-group--password">
                  <input
                    className="login__input"
                    id="input-password"
                    placeholder="Enter your password"
                    type={passwordVisible ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearErrors();
                    }}
                  />
                  <label className="login__label" htmlFor="input-password">
                    Password
                  </label>
                  <button
                    type="button"
                    className="login__password-toggle"
                    onClick={togglePasswordVisibility}
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                  >
                    <img src={passwordVisible ? HideIcon : ShowIcon} alt="Toggle visibility" className="login__password-toggle-icon" />
                  </button>
                  {errors.password && <p className="error">{errors.password}</p>}
                </div>
              </div>
              <label className="login__checkbox">
                <input
                  type="checkbox"
                  className="login__checkbox-box"
                  checked={rememberMe}
                  onChange={handleCheckboxChange}
                />
                <p className="login__remember-txt">Remember Me</p>
              </label>
              <p className="login__forgot-password-link" onClick={openForgotPasswordModal}>Forgot Password?</p>
              <div className="login__button-group">
                <button className="login__button login__button--previous" onClick={goToPreviousPage}>
                  <img src={ArrowIcon} className="previous__button-icon" alt="Arrow Icon" />
                  <span>Previous</span>
                </button>
                <button className="login__button login__button--signin" onClick={handleSignIn} disabled={isLoading}>
                  {isLoading ? (
                    <div className="login__loader-circle"></div>
                  ) : (
                    <div className="login__btn-wrapper">
                      <img src={SignUpIcon} className="login__button-icon" alt="Sign In Icon" />
                      <span>Sign In</span>
                    </div>
                  )}
                </button>
              </div>

              <div className="login__btn-create-account-wrapper">
                <Link to="/register" aria-label="Create a NextStream Account" className="login__btn-create-account-container">
                  <button className="login__btn-create-account">
                    Create an Account
                  </button>
                </Link>
                <button className="login__guest-link" onClick={handleGuestClick} aria-label="Continue as Guest">Login as a Guest</button>
              </div>

              {errors.general && (
                <div className="login__error-container">
                  <img src={ErrorIcon} className="login__error-icon" alt="error icon" />
                  <p className="error">{errors.general}</p>
                </div>
              )}

            </div>
          </div>
          <div className="login__image-card">
            <img src={SignInCouple} alt="Logging in Couple" />
          </div>
        </div>
        {isForgotPasswordModalOpen && <ForgotPasswordModal onClose={closeForgotPasswordModal} />}
      </div>
    </>
  );
};

export default LoginPage;