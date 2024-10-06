import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEraser } from '@fortawesome/free-solid-svg-icons';
import './ReviewModal.scss';

const ReviewModal = ({ show, onDelete, onClose, onSave, review, mediaId, setAlert }) => {
  const [newReview, setNewReview] = useState('');

  useEffect(() => {
    setNewReview(review || '');
  }, [review]);

  const handleSave = () => {
    if (newReview.trim()) {
      onSave(newReview);
      setNewReview('');
      setAlert({ type: 'success', message: 'Review saved successfully!' });
      onClose();
    }
  };

  const handleDelete = () => {
    if (onDelete && mediaId) {
      onDelete(mediaId);
      setNewReview('');
      setAlert({ type: 'success', message: 'Review deleted successfully!' });
      onClose();
    }
  };

  const handleClearInput = () => {
    setNewReview('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  if (!show) return null;

  return (
    <div className="review-modal">
      <div className="review-modal__content">
        <h3 className="review-modal__title">Write a Review</h3>
        <div className="review-modal__textarea-container">
          <textarea
            className="review-modal__textarea"
            value={newReview}
            onChange={(e) => setNewReview(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter your review"
          />
          <FontAwesomeIcon 
            icon={faEraser} 
            className="review-modal__eraser-icon" 
            onClick={handleClearInput} 
          />
        </div>
        <div className="review-modal__actions">
          <button className="review-modal__button review-modal__button--save" onClick={handleSave}>
            Save
          </button>
          <button className="review-modal__button review-modal__button--delete" onClick={handleDelete}>
            Delete
          </button>
          <button className="review-modal__button review-modal__button--close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;