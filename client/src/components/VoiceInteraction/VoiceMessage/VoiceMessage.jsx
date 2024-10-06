import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import './VoiceMessage.scss';

const VoiceMessage = ({ handleSendMessage }) => {
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
        setIsListening(false);
        handleSendMessage(transcript); // Send the recognized text as a message
      };

      recognition.onerror = () => {
        setIsListening(false);
        alert('Voice search error occurred. Please try again.');
      };

      recognitionRef.current = recognition;
    }
  }, [handleSendMessage]);

  const startVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
    }
  };

  return (
    <button
      className="voice-message__voice-button"
      onClick={startVoiceRecognition}
      disabled={isListening}
    >
      <FontAwesomeIcon icon={faMicrophone} />
    </button>
  );
};

export default VoiceMessage;