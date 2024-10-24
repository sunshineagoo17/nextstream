import { useState } from 'react';
import EmojiPicker from 'emoji-picker-react';
import "./EmojiMessages.scss";

const EmojiMessages = ({ setNewMessage }) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiClick = (emojiObject) => { 
    if (emojiObject && emojiObject.emoji) {
      setNewMessage(prevMessage => prevMessage + emojiObject.emoji);
    } else {
      console.error('Error: Emoji object does not contain emoji property');
    }
  };

  return (
    <div className="emoji-container">
      <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="emoji-btn">
        {showEmojiPicker ? "😶‍🌫️ Hide Emojis" : "😎 Add Emoji"}
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