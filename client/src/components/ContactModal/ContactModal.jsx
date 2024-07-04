import React, { useState } from 'react';
import './ContactModal.scss';

const ContactModal = ({ onClose }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await fetch('/api/email/send', {
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
        <span className="modal-contact__close" onClick={onClose}>&times;</span>
        <div className="modal-contact__label-container">
          <div className="modal-contact__label">
            Contact Us
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}
        <form className="modal-contact__form" onSubmit={handleSubmit}>
          <label className="modal-contact__label-input">
            <div className="modal-contact__label-txt">
              Name:
            </div>
            <input className="modal-contact__input" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
          <label className="modal-contact__label-input">
            <div className="modal-contact__label-txt">
              Email:
            </div>
            <input className="modal-contact__input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="modal-contact__label-txtarea">
            <div className="modal-contact__label-txtarea-txt">
              Message:
            </div>
            <textarea className="modal-contact__txtarea" value={message} onChange={(e) => setMessage(e.target.value)} required />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ContactModal;
