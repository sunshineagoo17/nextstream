import React, { useState } from 'react';

const TagModal = ({ show, onClose, onSave, tags }) => {
  const [newTag, setNewTag] = useState('');

  const handleSave = () => {
    if (newTag.trim()) {
      onSave(newTag);
      setNewTag('');
    }
  };

  if (!show) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <h3>Edit Tags</h3>
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder="Enter new tag"
        />
        <button onClick={handleSave}>Save Tag</button>
        <button onClick={onClose}>Close</button>
        <div>
          <h4>Current Tags:</h4>
          <ul>
            {tags.map((tag, index) => (
              <li key={index}>{tag}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TagModal;