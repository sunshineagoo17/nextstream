import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import './VoiceMessageFriends.scss';

const VoiceMessageFriends = ({ handleSendMessage, setNewMessage }) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        setNewMessage(transcript);
        handleSendMessage(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        alert('Voice recognition error occurred. Please try again.');
      };

      recognitionRef.current = recognition;
    } else {
      alert('Speech recognition is not supported in this browser. Please use a supported browser.');
    }
  }, [handleSendMessage, setNewMessage]);

  const startVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  return (
    <button
      className="voice-message-friends__voice-button"
      onClick={startVoiceRecognition}
      disabled={isListening}
    >
      <FontAwesomeIcon icon={faMicrophone} />
    </button>
  );
};

export default VoiceMessageFriends;