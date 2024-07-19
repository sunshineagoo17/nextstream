import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import api from '../../services/api'; 
import { AuthContext } from '../../context/AuthContext/AuthContext';
import SignUpIcon from '../../assets/images/register-sign-up-icon.svg';
import ArrowIcon from '../../assets/images/register-arrow-icon.svg';
import ShowIcon from '../../assets/images/register-visible-icon.svg';
import HideIcon from '../../assets/images/register-invisible-icon.svg';
import NextStreamBg from '../../assets/images/nextstream-bg.jpg';
import RegisterCouple from '../../assets/images/register-couple-logging-in.svg';
import Loader from '../../components/Loader/Loader';
import './RegisterPage.scss';
import Cookies from 'js-cookie';

export const RegisterPage = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isValidName, setIsValidName] = useState(true);
  const [isValidUsername, setIsValidUsername] = useState(true);
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isCheckedTerms, setIsCheckedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const rememberedName = Cookies.get('name');
    const rememberedUsername = Cookies.get('username');
    const rememberedEmail = Cookies.get('email');
    const rememberedPassword = Cookies.get('password');
    
    if (rememberedName) setName(rememberedName);
    if (rememberedUsername) setUsername(rememberedUsername);
    if (rememberedEmail) setEmail(rememberedEmail);
    if (rememberedPassword) setPassword(rememberedPassword);

    setIsLoading(false); 
  }, []);

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const goToPreviousPage = () => {
    navigate(-1);
  };

  const validateName = () => {
    setIsValidName(name.trim() !== '');
  };

  const validateUsername = () => {
    setIsValidUsername(username.trim() !== '');
  };

  const validateEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setIsValidEmail(emailRegex.test(email));
  };

  const validatePassword = () => {
    setIsValidPassword(password.length >= 8);
  };

  const handleCheckboxChange = (event) => {
    setIsCheckedTerms(event.target.checked);
    if (event.target.checked) {
      setTermsError(false);
    }
  };

  const clearError = (field) => {
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSignUp = async () => {
    validateName();
    validateUsername();
    validateEmail();
    validatePassword();

    if (!isValidName || !isValidUsername || !isValidEmail || !isValidPassword || !isCheckedTerms) {
      if (!isCheckedTerms) {
        setTermsError(true);
      }
      return; 
    }

    const userData = { name, username, email, password };
    try {
      setIsLoading(true);
      const response = await api.post('/api/auth/register', userData); 
      if (response.data.success) {
        const { userId, token } = response.data;
        login(token, userId, true);
    
        Cookies.set('name', name, { expires: 7 });
        Cookies.set('username', username, { expires: 7 });
        Cookies.set('email', email, { expires: 7 });
        Cookies.set('password', password, { expires: 7 });
    
        toast.success('Registration successful! Redirecting to profile page...', {
          className: 'frosted-toast-register',
        });
    
        setTimeout(() => {
          navigate(`/profile/${userId}`);
        }, 3000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response && error.response.data && error.response.data.message) {
        if (error.response.data.message === 'Email already in use') {
          setErrors({ email: 'Email already in use. Please use a different email address.' });
        } else {
          setErrors({ general: error.response.data.message });
        }
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="register">
        <ToastContainer
          position="top-center"
          autoClose={4000}
          hideProgressBar={true}
          transition={Slide}
          closeOnClick
          pauseOnHover
        />
        <div className="register__hero">
          <h1 className="register__title">Register</h1>
        </div>
        <div className="register__bg" style={{ backgroundImage: `url(${NextStreamBg})` }}></div>
        <div className="register__container">
          <div className="register__content-card">
            <div className="register__input-section">
              <div className="register__inputs">
                <div className="register__input-group">
                  <input
                    className="register__input"
                    id="input-name"
                    placeholder="Enter your name"
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError('name');
                    }}
                    onBlur={validateName}
                  />
                  <label className="register__label" htmlFor="input-name">
                    Name
                  </label>
                  {!isValidName && <p className="error">Please enter your name</p>}
                </div>
                <div className="register__input-group">
                  <input
                    className="register__input"
                    id="input-username"
                    placeholder="Enter your username"
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      clearError('username');
                    }}
                    onBlur={validateUsername}
                  />
                  <label className="register__label" htmlFor="input-username">
                    Username
                  </label>
                  {!isValidUsername && <p className="error">Please enter your username</p>}
                </div>
                <div className="register__input-group">
                  <input
                    className="register__input"
                    id="input-email"
                    placeholder="Enter your email address"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      clearError('email');
                    }}
                    onBlur={validateEmail}
                  />
                  <label className="register__label" htmlFor="input-email">
                    Email
                  </label>
                  {!isValidEmail && <p className="error">Please enter a valid email address</p>}
                  {errors.email && <p className="error">{errors.email}</p>}
                </div>
                <div className="register__input-group register__input-group--password">
                  <input
                    className="register__input"
                    id="input-password"
                    placeholder="Enter your password"
                    type={passwordVisible ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearError('password');
                    }}
                    onBlur={validatePassword}
                  />
                  <label className="register__label" htmlFor="input-password">
                    Password
                  </label>
                  {!isValidPassword && <p className="error">Password must be at least 8 characters</p>}
                  <button
                    type="button"
                    className="register__password-toggle"
                    onClick={togglePasswordVisibility}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                  >
                    <img src={passwordVisible ? HideIcon : ShowIcon} alt="Toggle visibility" className="register__password-toggle-icon" />
                  </button>
                </div>
              </div>
              <label className="register__checkbox">
                <input
                  type="checkbox"
                  className="register__checkbox-box"
                  checked={isCheckedTerms}
                  onChange={handleCheckboxChange}
                  required
                />
                <p className="register__terms-txt">I agree to the <Link to="/terms" aria-label="Terms and Conditions" className="register__terms-link">terms and conditions</Link>.</p>
              </label>
              {termsError && <p className="error">Please agree to the terms and conditions</p>}
              <p className="register__already-account">
                Already have an account? <Link to="/login" aria-label="Log In"><span className="register__signin-link">Sign In.</span></Link>
              </p>
              <div className="register__button-group">
                <button className="register__button register__button--previous" onClick={goToPreviousPage}>
                  <img src={ArrowIcon} className="register__button-icon" alt="Arrow Icon" />
                  <span>Previous</span>
                </button>
                <button className="register__button register__button--signup" onClick={handleSignUp}>
                  <img src={SignUpIcon} className="register__button-icon" alt="Sign Up Icon" />
                  <span>Sign Up</span>
                </button>
              </div>
              {errors.general && <p className="error">{errors.general}</p>}
            </div>
          </div>
          <div className="register__image-card">
            <img src={RegisterCouple} alt="Registering Couple" />
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;