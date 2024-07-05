import React, { useState } from 'react';
import { Link } from "react-router-dom";
import './HoverMenu.scss';
import useMenuLinks from '../../../../hooks/useMenuLinks';

export const HoverMenu = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const links = useMenuLinks();

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
          {links.map(link => (
            <Link to={link.path} key={link.name} className="hover-menu__item">
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HoverMenu;
