import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import './VoiceSearch.scss';

const VoiceSearch = ({ setSearchQuery, handleSearch }) => {
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript.trim();
        setIsVoiceSearching(false);
        setSearchQuery(transcript); 
        handleSearch();
      };

      recognition.onerror = () => {
        alert('Voice search error occurred. Try again.');
        setIsVoiceSearching(false);
      };

      recognitionRef.current = recognition;
    }
  }, [setSearchQuery, handleSearch]);

  const handleVoiceSearch = () => {
    if (recognitionRef.current) {
      setIsVoiceSearching(true);
      recognitionRef.current.start();
    }
  };

  return (
    <button className="voice-search__voice-button" onClick={handleVoiceSearch} disabled={isVoiceSearching}>
      <FontAwesomeIcon icon={faMicrophone} />
    </button>
  );
};

export default VoiceSearch;