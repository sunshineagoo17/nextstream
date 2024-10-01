import { useState, useEffect } from 'react';
import './TagModal.scss';

const TagModal = ({ show, onClose, onSave, tags, mediaId, setAlert, onDelete }) => {
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    if (tags && tags.length > 0) {
      setNewTag(tags.join(', ')); 
    } else {
      setNewTag(''); 
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

  const handleDelete = () => {
    if (onDelete && mediaId) {
      onDelete(mediaId);  
      setNewTag('');
      setAlert({ type: 'success', message: 'Tags deleted successfully!' });
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
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
          onKeyDown={handleKeyDown} 
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