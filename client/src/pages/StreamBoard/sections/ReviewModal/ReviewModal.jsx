import { useState } from 'react';
import './ReviewModal.scss';

const ReviewModal = ({ show, onClose, onSave, review }) => {
  const [newReview, setNewReview] = useState(review || '');

  const handleSave = () => {
    if (newReview.trim()) {
      onSave(newReview);
      setNewReview('');
    }
  };

  if (!show) return null;

  return (
    <div className="review-modal">
      <div className="review-modal__content">
        <h3 className="review-modal__title">Write a Review</h3>
        <textarea
          className="review-modal__textarea"
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
          placeholder="Enter your review"
        />
        <div className="review-modal__actions">
          <button className="review-modal__button review-modal__button--save" onClick={handleSave}>
            Save
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