import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './HoverMenu.scss';
import useMenuLinks from '../../../../hooks/useMenuLinks';

const HoverMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const links = useMenuLinks();
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

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

  return (
    <div ref={menuRef} className={`hover-menu__container ${isLoginPage ? 'login-page' : ''}`}>
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
