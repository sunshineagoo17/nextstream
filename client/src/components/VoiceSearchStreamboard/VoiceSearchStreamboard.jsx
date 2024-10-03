import { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import './VoiceSearchStreamboard.scss';

const VoiceSearchStreamboard = ({ setQuery, handleSearch }) => {
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event) => {
        const resultTranscript = event.results[0][0].transcript.trim();
        setIsVoiceSearching(false);
        setTranscript(resultTranscript);
      };

      recognition.onerror = () => {
        alert('Voice search error occurred. Try again.');
        setIsVoiceSearching(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (transcript) {
      setQuery(transcript);
      handleSearch();
    }
  }, [transcript, setQuery, handleSearch]);

  const handleVoiceSearch = () => {
    if (recognitionRef.current) {
      setIsVoiceSearching(true);
      recognitionRef.current.start();
    }
  };

  return (
    <button className="voice-search-streamboard__voice-button" onClick={handleVoiceSearch} disabled={isVoiceSearching}>
      <FontAwesomeIcon icon={faMicrophone} className='voice-search-streamboard__mic-icon'/>
    </button>
  );
};

export default VoiceSearchStreamboard;
