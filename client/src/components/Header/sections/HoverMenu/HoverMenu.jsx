import { useState, useEffect, useRef, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './HoverMenu.scss';
import useMenuLinks from '../../../../hooks/useMenuLinks';
import { AuthContext } from '../../../../context/AuthContext/AuthContext';

const HoverMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const links = useMenuLinks();
  const location = useLocation();
  const { userId } = useContext(AuthContext);

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // This determines the background class based on the current page
  const getBackgroundClass = () => {
    const darkBackgroundPaths = [
      `/login`,
      `/calendar/${userId}`, 
      `/calendar/guest`,
      `/faves/${userId}`, 
      `/friends/${userId}`,
      `/nextsearch/${userId}`, 
      `/nextstream-bot/${userId}`, 
      `/nextswipe/${userId}`, 
      `/auth-search-results/${userId}`,
      `/search`,
      `/streamboard/${userId}`,
    ];
  
    const isDarkBackgroundPage = darkBackgroundPaths.includes(location.pathname) ||
      // Added regular expression to match the NextView page with dynamic segments
      new RegExp(`^/nextview/${userId}/(movie|tv)/\\d+$`).test(location.pathname) ||
      // Added regular expression to match the Spotlight page with dynamic segments
      new RegExp(`^/spotlight/${userId}/\\d+$`).test(location.pathname);
  
    // Check if cloud, trans, star, sun, dark, or rain mode is enabled
    const isCloudModeEnabled = document.documentElement.getAttribute('data-theme') === 'cloud-mode'; 
    const isTransModeEnabled = document.documentElement.getAttribute('data-theme') === 'trans-mode'; 
    const isStarModeEnabled = document.documentElement.getAttribute('data-theme') === 'star-mode'; 
    const isSunModeEnabled = document.documentElement.getAttribute('data-theme') === 'sun-mode'; 
    const isDarkModeEnabled = document.documentElement.getAttribute('data-theme') === 'dark';
    const isRainModeEnabled = document.documentElement.getAttribute('data-theme') === 'rain-mode';
  
    if (isCloudModeEnabled) {
      return 'cloud-mode-background'; 
    }
  
    if (isTransModeEnabled) {
      return 'trans-mode-background';
    }

    if (isStarModeEnabled) {
      return 'star-mode-background';
    }

    if (isSunModeEnabled) {
      return 'sun-mode-background';
    }
    
    if (isRainModeEnabled) {
      return 'rain-mode-background';
    }
  
    return isDarkBackgroundPage || isDarkModeEnabled ? 'dark-background' : '';
  };
  
  return (
    <div ref={menuRef} className={`hover-menu__container ${getBackgroundClass()}`}>
      <button className="hover-menu__button" onClick={handleMenuClick}>
        <button className={`hover-menu__lines ${menuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </button>
      {menuOpen && (
        <div className="hover-menu__content">
          {links.map(link => (
            <Link
              to={link.path}
              key={link.name}
              className="hover-menu__item"
              onClick={() => setMenuOpen(false)}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HoverMenu;