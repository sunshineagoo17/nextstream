import React, { useState } from 'react';

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
    <div className="modal">
      <div className="modal-content">
        <h3>Write a Review</h3>
        <textarea
          value={newReview}
          onChange={(e) => setNewReview(e.target.value)}
          placeholder="Enter your review"
        />
        <button onClick={handleSave}>Save Review</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default ReviewModal;