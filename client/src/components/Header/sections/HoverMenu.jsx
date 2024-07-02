import React, { useState } from 'react';
import './HoverMenu.scss';

export const HoverMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <div className="hover-menu-container">
      <div className="menu-button" onClick={handleMenuClick}>
        <div className={`menu-lines ${menuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      {menuOpen && (
        <div className="menu-content">
          <div className="menu-item">Search Results</div>
          <div className="menu-item">Picks</div>
          <div className="menu-item">Register</div>
          <div className="menu-item">Profile</div>
          <div className="menu-item">Calendar</div>
        </div>
      )}
    </div>
  );
};

export default HoverMenu;