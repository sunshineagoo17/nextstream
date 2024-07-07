import React, { useState } from 'react';
import axios from 'axios';
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
    } catch (error) {
      setMessage('Error sending password reset email. Try again.');
      setIsError(true);
    }
  };

  return (
    <div className="modal-contact">
      <div className="modal-contact__container">
        <button className="modal-contact__close" onClick={onClose}>×</button>
        <div className="modal-contact__label-container">
          <h2 className="modal-contact__label">Forgot Password</h2>
        </div>
        <form className="modal-contact__form" onSubmit={handleSubmit}>
          <div className="modal-contact__label-input">
            <label className="modal-contact__label-txt" htmlFor="email">Email Address</label>
            <input
              className="modal-contact__input"
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit">Send Reset Link</button>
        </form>
        {message && <p className={`modal-contact__message ${isError ? 'error' : 'success'}`}>{message}</p>}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
