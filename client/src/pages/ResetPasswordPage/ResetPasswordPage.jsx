import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import ShowIcon from "../../assets/images/register-visible-icon.svg";
import HideIcon from "../../assets/images/register-invisible-icon.svg";
import './ResetPasswordPage.scss';

export const ResetPasswordPage = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.search).get('token');

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  const toggleConfirmPasswordVisibility = () => {
    setConfirmPasswordVisible(!confirmPasswordVisible);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/password-reset/reset-password`, { token, newPassword });
      setMessage(response.data.message);
      if (response.data.success) {
        navigate('/login'); // Redirect to login page after successful reset
      }
    } catch (error) {
      setMessage('Error resetting password. Please try again.');
    }
  };

  return (
    <div className="reset-password">
      <div className="reset-password__container">
        <div className="reset-password__content-card">
          <h1 className="reset-password__title">Reset Password</h1>
          <form onSubmit={handleSubmit}>
            <div className="reset-password__input-group reset-password__input-group--password">
              <input
                type={passwordVisible ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
            <div className="reset-password__input-group reset-password__input-group--password">
              <input
                type={confirmPasswordVisible ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
            <button type="submit" className="reset-password__button">Reset Password</button>
          </form>
          {message && <p className={`reset-password__message ${message.includes('Error') ? 'reset-password__message--error' : 'reset-password__message--success'}`}>{message}</p>}
        </div>
      </div>
      <div className="reset-password__background">
        <AnimatedBg />
      </div>
    </div>
  );
};

export default ResetPasswordPage;
