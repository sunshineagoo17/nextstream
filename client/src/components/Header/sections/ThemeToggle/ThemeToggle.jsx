import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faRainbow, faCloud, faStar, faSnowflake } from '@fortawesome/free-solid-svg-icons';
import './ThemeToggle.scss';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('snow-mode'); // Default to snow-mode (formerly light)

  // Check for saved theme in localStorage or default to 'snow-mode'
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'snow-mode';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setTheme(savedTheme);
  }, []);

  // Function to toggle between themes
  const toggleTheme = () => {
    let newTheme = '';

    if (theme === 'snow-mode') {
      newTheme = 'sun-mode'; // Switch from snow to sun-mode
    } else if (theme === 'sun-mode') {
      newTheme = 'dark'; // Switch from sun-mode to dark
    } else if (theme === 'dark') {
      newTheme = 'cloud-mode'; // Switch from dark to cloud-mode
    } else if (theme === 'cloud-mode') {
      newTheme = 'trans-mode'; // Switch from cloud-mode to trans-mode
    } else if (theme === 'trans-mode') {
      newTheme = 'star-mode'; // Switch from trans-mode to star-mode
    } else {
      newTheme = 'snow-mode'; // Back to snow-mode
    }

    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button onClick={toggleTheme} className={`dark-mode-toggle ${theme}`}>
      {/* Icon changes based on current theme */}
      {theme === 'sun-mode' ? (
        <FontAwesomeIcon icon={faSun} className="icon sun" />
      ) : theme === 'dark' ? (
        <FontAwesomeIcon icon={faMoon} className="icon moon" />
      ) : theme === 'trans-mode' ? (
        <FontAwesomeIcon icon={faRainbow} className="icon rainbow" />
      ) : theme === 'cloud-mode' ? (
        <FontAwesomeIcon icon={faCloud} className="icon cloud" />
      ) : theme === 'star-mode' ? (
        <FontAwesomeIcon icon={faStar} className="icon star" />
      ) : (
        <FontAwesomeIcon icon={faSnowflake} className="icon snowflake" />
      )}
      <span className="light-effect"></span>
    </button>
  );
};

export default ThemeToggle;