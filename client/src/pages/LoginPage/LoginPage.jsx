import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ShowIcon from "../../assets/images/register-visible-icon.svg";
import HideIcon from "../../assets/images/register-invisible-icon.svg";
import NextStreamBg from "../../assets/images/nextstream-bg.jpg";
import ArrowIcon from "../../assets/images/register-arrow-icon.svg";
import SignUpIcon from "../../assets/images/register-sign-up-icon.svg";
import SignInCouple from "../../assets/images/login-hero-couple-watching.svg";
import "./LoginPage.scss";

export const LoginPage = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const goToPreviousPage = () => {
    navigate(-1);
  };

  const handleSignIn = async () => {
    const userData = { username, password };
    try {
      const response = await axios.post('https://nextstream-api-url.com/login', userData);
      if (response.data.success) {
        navigate('/dashboard'); 
      }
    } catch (error) {
      setErrors(error.response.data.errors);
    }
  };

  return (
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
                  id="input-username"
                  placeholder="Enter your username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
                <label className="login__label" htmlFor="input-username">
                  Username
                </label>
                {errors.username && <p className="error">{errors.username}</p>}
              </div>
              <div className="login__input-group login__input-group--password">
                <input
                  className="login__input"
                  id="input-password"
                  placeholder="Enter your password"
                  type={passwordVisible ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <label className="login__label" htmlFor="input-password">
                  Password
                </label>
                <button
                  type="button"
                  className="login__password-toggle"
                  onClick={togglePasswordVisibility}
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                >
                  <img src={passwordVisible ? HideIcon : ShowIcon} alt="Toggle visibility" className="login__password-toggle-icon" />
                </button>
                {errors.password && <p className="error">{errors.password}</p>}
              </div>
            </div>
            <label className="login__checkbox">
              <input type="checkbox" className="login__checkbox-box" />
              <p className="login__remember-txt">Remember Me</p>
            </label>
            <p className="login__forgot-password-link">Forgot Password?</p>
            <div className="login__button-group">
              <button className="login__button login__button--previous" onClick={goToPreviousPage}>
                <img src={ArrowIcon} className="previous__button-icon" alt="Arrow Icon" />
                <span>Previous</span>
              </button>
              <button className="login__button login__button--signin" onClick={handleSignIn}>
                <img src={SignUpIcon} className="login__button-icon" alt="Sign In Icon" />
                <span>Sign In</span>
              </button>
            </div>
            <div className="login__btn-create-account-wrapper">
              <div className="login__btn-create-account-bg"></div>
              <button className="login__btn-create-account">
                <span className="login__btn-create-account-txt">Create an Account</span>
              </button>
            </div>
          </div>
        </div>
        <div className="login__image-card">
          <img src={SignInCouple} alt="Logging in Couple" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;