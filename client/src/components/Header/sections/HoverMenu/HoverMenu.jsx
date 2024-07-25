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
    const darkBackgroundPages = [
      `/login`,
      `/top-picks/${userId}`, 
      `/calendar/${userId}`, 
      `/faves/${userId}`, 
      `/auth-search-results/${userId}`,
      `/search`
    ];
    return darkBackgroundPages.includes(location.pathname) ? 'dark-background' : '';
  };

  return (
    <div ref={menuRef} className={`hover-menu__container ${getBackgroundClass()}`}>
      <div className="hover-menu__button" onClick={handleMenuClick}>
        <div className={`hover-menu__lines ${menuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
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
