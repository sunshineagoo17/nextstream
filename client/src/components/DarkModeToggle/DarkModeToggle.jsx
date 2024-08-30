import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun} from '@fortawesome/free-solid-svg-icons'; 
import './DarkModeToggle.scss';

const DarkModeToggle = () => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setTheme(savedTheme);
  }, []);

  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <button onClick={toggleDarkMode} className={`dark-mode-toggle ${theme}`}>
      {theme === 'dark' ? (
        <FontAwesomeIcon icon={faMoon} className="icon moon" />
      ) : (
        <FontAwesomeIcon icon={faSun} className="icon sun" />
      )}
      <span className="light-effect"></span>
    </button>
  );
};

export default DarkModeToggle;
