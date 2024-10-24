import Cookies from 'js-cookie';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMoon, faSun, faRainbow, faCloud, faStar, faSnowflake, faCloudRain } from '@fortawesome/free-solid-svg-icons';
import './ThemeToggle.scss';

const ThemeToggle = () => {
  const [theme, setTheme] = useState('snow-mode');

  useEffect(() => {
    const savedTheme = Cookies.get('theme') || 'snow-mode';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setTheme(savedTheme);
  }, []);

  const toggleTheme = () => {
    let newTheme = '';

    if (theme === 'snow-mode') {
      newTheme = 'sun-mode';
    } else if (theme === 'sun-mode') {
      newTheme = 'dark';
    } else if (theme === 'dark') {
      newTheme = 'cloud-mode';
    } else if (theme === 'cloud-mode') {
      newTheme = 'rain-mode';
    } else if (theme === 'rain-mode') {
      newTheme = 'trans-mode';
    } else if (theme === 'trans-mode') {
      newTheme = 'star-mode';
    } else {
      newTheme = 'snow-mode';
    }

    document.documentElement.setAttribute('data-theme', newTheme);
    setTheme(newTheme);
    Cookies.set('theme', newTheme, { expires: 7 });
  };

  return (
    <button onClick={toggleTheme} className={`dark-mode-toggle ${theme}`}>
      {theme === 'sun-mode' ? (
        <FontAwesomeIcon icon={faSun} className="icon sun" />
      ) : theme === 'dark' ? (
        <FontAwesomeIcon icon={faMoon} className="icon moon" />
      ) : theme === 'rain-mode' ? (
        <FontAwesomeIcon icon={faCloudRain} className="icon rain" />
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
