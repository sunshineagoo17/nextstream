import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faRainbow, faCloud } from '@fortawesome/free-solid-svg-icons';
import './ThemeToggle.scss';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' 
      ? 'dark' 
      : theme === 'dark' 
      ? 'cloud-mode'
      : theme === 'cloud-mode'
      ? 'trans-mode' 
      : 'light';
      
    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button onClick={toggleTheme} className={`dark-mode-toggle ${theme}`}>
      {theme === 'dark' ? (
        <FontAwesomeIcon icon={faMoon} className="icon moon" />
      ) : theme === 'trans-mode' ? (
        <FontAwesomeIcon icon={faRainbow} className="icon rainbow" />
      ) : theme === 'cloud-mode' ? (  
        <FontAwesomeIcon icon={faCloud} className="icon cloud" />
      ) : (
        <FontAwesomeIcon icon={faSun} className="icon sun" />
      )}
      <span className="light-effect"></span>
    </button>
  );
};

export default ThemeToggle;