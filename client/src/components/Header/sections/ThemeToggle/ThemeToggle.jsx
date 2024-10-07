import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faRainbow, faCloud } from '@fortawesome/free-solid-svg-icons';
import './ThemeToggle.scss';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('light');

  // Check for saved theme in localStorage or default to 'light'
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setTheme(savedTheme);
  }, []);

  // Function to toggle between themes
  const toggleTheme = () => {
    let newTheme = '';

    if (theme === 'light') {
      newTheme = 'dark';
    } else if (theme === 'dark') {
      newTheme = 'cloud-mode';
    } else if (theme === 'cloud-mode') {
      newTheme = 'trans-mode';
    } else {
      newTheme = 'light';  // Reset to light mode
    }

    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);  // Save the theme to localStorage
  };

  return (
    <button onClick={toggleTheme} className={`dark-mode-toggle ${theme}`}>
      {/* Icon changes based on current theme */}
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