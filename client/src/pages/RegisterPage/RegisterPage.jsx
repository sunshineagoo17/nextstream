import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import SignUpIcon from "../../assets/images/register-sign-up-icon.svg";
import ArrowIcon from "../../assets/images/register-arrow-icon.svg";
import ShowIcon from "../../assets/images/register-visible-icon.svg";
import HideIcon from "../../assets/images/register-invisible-icon.svg";
import NextStreamBg from "../../assets/images/nextstream-bg.jpg";
import RegisterCouple from "../../assets/images/register-couple-logging-in.svg";
import "./RegisterPage.scss";

export const RegisterPage = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [name, setName] = useState(localStorage.getItem('name') || '');
  const [username, setUsername] = useState(localStorage.getItem('username') || '');
  const [email, setEmail] = useState(localStorage.getItem('email') || '');
  const [password, setPassword] = useState(localStorage.getItem('password') || '');
  const [errors, setErrors] = useState({});
  const [isValidName, setIsValidName] = useState(true);
  const [isValidUsername, setIsValidUsername] = useState(true);
  const [isValidEmail, setIsValidEmail] = useState(true);
  const [isValidPassword, setIsValidPassword] = useState(true);
  const [isCheckedTerms, setIsCheckedTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    // Load values from local storage
    setName(localStorage.getItem('name') || '');
    setUsername(localStorage.getItem('username') || '');
    setEmail(localStorage.getItem('email') || '');
    setPassword(localStorage.getItem('password') || '');
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

  const handleSignUp = async () => {
    validateName();
    validateUsername();
    validateEmail();
    validatePassword();

    if (!isValidName || !isValidUsername || !isValidEmail || !isValidPassword || !isCheckedTerms) {
      if (!isCheckedTerms) {
        setTermsError(true);
      }
      return; // Prevent registration if any validation fails or terms checkbox is not checked
    }

    const userData = { name, username, email, password };
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/auth/register`, userData);
      if (response.data.success) {
        const { token } = response.data;
        login(token, true);

        // Save input values to local storage
        localStorage.setItem('name', name);
        localStorage.setItem('username', username);
        localStorage.setItem('email', email);
        localStorage.setItem('password', password);

        navigate('/profile');
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: 'An error occurred. Please try again.' });
      }
    }
  };

  return (
    <div className="register">
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
                  onChange={(e) => setName(e.target.value)}
                  onBlur={validateName} // Validate on blur
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
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={validateUsername} // Validate on blur
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
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={validateEmail} // Validate on blur
                />
                <label className="register__label" htmlFor="input-email">
                  Email
                </label>
                {!isValidEmail && <p className="error">Please enter a valid email address</p>}
              </div>
              <div className="register__input-group register__input-group--password">
                <input
                  className="register__input"
                  id="input-password"
                  placeholder="Enter your password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={validatePassword} // Validate on blur
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
              Already have an account? <Link to="/login" aria-label="Log In"><span className="register__signin-link">Sign In</span></Link>
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
  );
};

export default RegisterPage;