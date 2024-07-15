import React, { useState } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie'; 
import './ForgotPasswordModal.scss';

const ForgotPasswordModal = ({ onClose }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/password-reset/forgot-password`, { email });
      setMessage(response.data.message);
      setIsError(false);
      Cookies.set('forgotPasswordEmail', email, { expires: 1 });
    } catch (error) {
      console.error('Error:', error); 
      if (error.response && error.response.status === 404) {
        setMessage("This account doesn't exist. Try again.");
      } else {
        setMessage('Error sending password reset link. Please try again.');
      }
      setIsError(true);
    }
  };

  return (
    <div className="modal-forgot-password">
      <div className="modal-forgot-password__container">
        <button className="modal-forgot-password__close" onClick={onClose}>×</button>
        <div className="modal-forgot-password__label-container">
          <h2 className="modal-forgot-password__label">Forgot Password</h2>
        </div>
        <form className="modal-forgot-password__form" onSubmit={handleSubmit}>
          <div className="modal-forgot-password__label-input">
            <label className="modal-forgot-password__label-txt" htmlFor="email">Email Address</label>
            <input
              className="modal-forgot-password__input"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">Send Reset Link</button>
        </form>
        {message && <p className={`modal-forgot-password__message ${isError ? 'error' : 'success'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;