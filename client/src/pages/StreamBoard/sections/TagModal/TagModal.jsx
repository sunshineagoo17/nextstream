import { useState, useEffect } from 'react';
import './TagModal.scss';

const TagModal = ({ show, onClose, onSave, tags }) => {
  const [newTag, setNewTag] = useState('');

  // Pre-fill the input with the existing tags, joined by commas (if any)
  useEffect(() => {
    if (tags && tags.length > 0) {
      setNewTag(tags.join(', ')); // Join tags with commas
    }
  }, [tags]);

  const handleSave = () => {
    if (newTag.trim()) {
      const tagArray = newTag.split(',').map(tag => tag.trim()); // Convert back to an array of tags
      onSave(tagArray);
      setNewTag(''); // Clear input after saving
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
            Save Tag
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