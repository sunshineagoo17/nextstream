import { useState } from 'react';
import './ContactModal.scss';

const ContactModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = () => {
    if (!name) {
      return "Please enter your name.";
    }
    if (!email) {
      return "Please enter your email.";
    }
    if (email && !validateEmail(email)) {
      return "Please enter a valid email address.";
    }
    if (!message) {
      return "Please enter your message.";
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        setError(null);
        setName('');
        setEmail('');
        setMessage('');
      } else {
        setError(data.message || 'Failed to send email.');
        setSuccess(null);
      }
    } catch (error) {
      setError('An error occurred while sending the email.');
      setSuccess(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-contact">
      <div className="modal-contact__container">
        <button className="modal-contact__close" onClick={onClose}>
          &times;
        </button>
        <div className="modal-contact__label-container">
          <div className="modal-contact__label">Contact Us</div>
        </div>
        {error && (
          <div className="error">
            <svg className="error-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm6 16.59L16.59 18 12 13.41 7.41 18 6 16.59 10.59 12 6 7.41 7.41 6 12 10.59 16.59 6 18 7.41 13.41 12 18 16.59z"/>
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="success">
            <svg className="success-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.198 18.291l-4.549-4.544 1.695-1.697 2.854 2.854 6.363-6.364 1.697 1.697-8.06 8.054z"/>
            </svg>
            {success}
          </div>
        )}
        <form className="modal-contact__form" onSubmit={handleSubmit} noValidate>
          <label className="modal-contact__label-input">
            <div className="modal-contact__label-txt">Name:</div>
            <input
              className="modal-contact__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              data-required-msg="Please enter your name."
            />
          </label>
          <label className="modal-contact__label-input modal-contact__label-input-email">
            <div className="modal-contact__label-txt">Email:</div>
            <input
              className="modal-contact__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-required-msg="Please enter your email."
              data-type-mismatch-msg="Please include a valid email address."
            />
          </label>
          <label className="modal-contact__label-txtarea">
            <div className="modal-contact__label-txtarea-txt">Message:</div>
            <textarea
              className="modal-contact__txtarea"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              data-required-msg="Please enter your message."
            />
          </label>
          <button type="submit" disabled={loading} className='modal-contact__submit-text'>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;