import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';

const EmojiMessages = ({ newMessage, setNewMessage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emojiObject, event) => { 
    console.log('Selected emoji object:', emojiObject); 
    if (emojiObject && emojiObject.emoji) {
      setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    } else {
      console.error('Error: Emoji object does not contain emoji property');
    }
  };

  return (
    <div className="emoji-container">
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-btn">
        😎 Add Emoji
      </button>
      {showEmojiPicker && (
        <div className="emoji-picker">
          <EmojiPicker onEmojiClick={handleEmojiClick} />
        </div>
      )}
    </div>
  );
};

export default EmojiMessages;