import React, { useState } from 'react';
import { Link } from "react-router-dom";
import './HoverMenu.scss';

export const HoverMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="hover-menu__container">
      <div className="hover-menu__button" onClick={handleMenuClick}>
        <div className={`hover-menu__lines ${menuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      {menuOpen && (
        <div className="hover-menu__content">
          <Link to="/register" className="hover-menu__item">Register</Link>
          <div className="hover-menu__item">Search Results</div>
          <div className="hover-menu__item">Top Picks</div>
          <div className="hover-menu__item">Calendar</div>
          <div className="hover-menu__item">Profile</div>
        </div>
      )}
    </div>
  );
};

export default HoverMenu;