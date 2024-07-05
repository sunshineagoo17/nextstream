import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignUpIcon from "../../assets/images/register-sign-up-icon.svg";
import ArrowIcon from "../../assets/images/register-arrow-icon.svg";
import ShowIcon from "../../assets/images/register-visible-icon.svg";
import HideIcon from "../../assets/images/register-invisible-icon.svg";
import NextStreamBg from "../../assets/images/nextstream-bg.jpg";
import RegisterCouple from "../../assets/images/register-couple-logging-in.svg";
import "./RegisterPage.scss";

export const RegisterPage = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const goToPreviousPage = () => {
    navigate(-1);
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
                />
                <label className="register__label" htmlFor="input-name">
                  Name
                </label>
              </div>
              <div className="register__input-group">
                <input
                  className="register__input"
                  id="input-username"
                  placeholder="Enter your username"
                  type="text"
                />
                <label className="register__label" htmlFor="input-username">
                  Username
                </label>
              </div>
              <div className="register__input-group">
                <input
                  className="register__input"
                  id="input-email"
                  placeholder="Enter your email address"
                  type="email"
                />
                <label className="register__label" htmlFor="input-email">
                  Email
                </label>
              </div>
              <div className="register__input-group register__input-group--password">
                <input
                  className="register__input"
                  id="input-password"
                  placeholder="Enter your password"
                  type={passwordVisible ? "text" : "password"}
                />
                <label className="register__label" htmlFor="input-password">
                  Password
                </label>
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
              <input type="checkbox" className="register__checkbox-box" />
              I agree to the terms and conditions
            </label>
            <p className="register__already-account">
              Already have an account? <span className="register__signin-link">Sign In</span>
            </p>
            <div className="register__button-group">
              <button className="register__button register__button--previous" onClick={goToPreviousPage}>
                <img src={ArrowIcon} className="register__button-icon" alt="Arrow Icon" />
                <span>Previous</span>
              </button>
              <button className="register__button register__button--signup">
                <img src={SignUpIcon} className="register__button-icon" alt="Sign Up Icon" />
                <span>Sign Up</span>
              </button>
            </div>
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