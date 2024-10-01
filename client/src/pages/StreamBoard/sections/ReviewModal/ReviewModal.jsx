import { useState } from 'react';
import './ReviewModal.scss';
import CustomAlerts from '../../../../components/CustomAlerts/CustomAlerts';
import api from '../../../../services/api'; 

const ReviewModal = ({ show, onClose, onSave, review, mediaId }) => {
  const [newReview, setNewReview] = useState(review || '');
  const [alert, setAlert] = useState({ type: '', message: '' });

  const handleSave = () => {
    if (newReview.trim()) {
      onSave(newReview);
      setNewReview('');
      setAlert({ type: 'success', message: 'Review saved successfully!' }); 
    }
  };

  const handleDelete = async () => {
    try {
      if (!mediaId) {
        console.error('No mediaId available for deletion');
        return;
      }
  
      await api.delete(`/api/media-status/${mediaId}/review`);
      setNewReview(''); 
      onClose(); 
      setAlert({ type: 'success', message: 'Review deleted successfully!' });
    } catch (error) {
      console.error('Error deleting review:', error);
      setAlert({ type: 'error', message: 'Failed to delete review.' });
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
          <button className="review-modal__button review-modal__button--delete" onClick={handleDelete}>
            Delete
          </button>
          <button className="review-modal__button review-modal__button--close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      {/* CustomAlerts for displaying success/error messages */}
      {alert.message && (
        <CustomAlerts
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ type: '', message: '' })} 
        />
      )}
    </div>
  );
};

export default ReviewModal;