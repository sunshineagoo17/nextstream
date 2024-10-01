import { useState, useEffect } from 'react';
import './TagModal.scss';
import api from '../../../../services/api'; 

const TagModal = ({ show, onClose, onSave, tags, mediaId, setAlert }) => {
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (tags && tags.length > 0) {
      setNewTag(tags.join(', ')); 
    }
    console.log('mediaId in TagModal:', mediaId); 
  }, [tags, mediaId]);

  const handleSave = () => {
    if (newTag.trim()) {
      const tagArray = newTag.split(',').map(tag => tag.trim()); 
      onSave(tagArray);
      setNewTag(''); 
      setAlert({ type: 'success', message: 'Tags saved successfully!' }); 
      onClose(); 
    }
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/api/media-status/${mediaId}/tags`); 
      setNewTag('');  
      setAlert({ type: 'success', message: 'Tags deleted successfully!' }); 
      onClose();
    } catch (error) {
      console.error('Error deleting tags:', error);
      setAlert({ type: 'error', message: 'Failed to delete tags.' }); 
    }
  };

  if (!show) return null;

  return (
    <div className="tag-modal">
      <div className="tag-modal__content">
        <h3 className="tag-modal__title">Edit Tags</h3>
        <input
          className="tag-modal__input"
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Enter new tag"
        />
        <div className="tag-modal__actions">
          <button className="tag-modal__button tag-modal__button--save" onClick={handleSave}>
            Save
          </button>
          <button className="tag-modal__button tag-modal__button--delete" onClick={handleDelete}>
            Delete
          </button>
          <button className="tag-modal__button tag-modal__button--close" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagModal;