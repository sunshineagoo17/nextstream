import React from 'react';
import nextStreamLogo from "../../assets/images/nextstream-wordmark.png";
import searchVector from "../../assets/images/searh-vector-handle.svg";
import HoverMenu from "./sections/HoverMenu";
import "./Header.scss";

export const Header = () => {
  return (
    <div className="header">
      <div className="header__nav-container">
        <div className="header__menu-container">
          <HoverMenu />
        </div>
        <div className="header__search-bar">
          <div className="header__search-icon">
            <div className="header__magnifying-glass">
              <div className="header__icon-container">
                <img className="header__search-vector" alt="Magnifying Glass" src={searchVector} />
                <div className="header__search-ellipse" />
              </div>
            </div>
          </div>
          <div className="header__search-content">
            <input className="header__search" type="text" placeholder="Search..." />
          </div>
        </div>
      </div>
      <div className="header__logo-wrapper">
        <img className="header__logo" alt="Nextstream logo" src={nextStreamLogo} />
      </div>
      <button className="header__login-container">
        <div className="header__login">Sign In</div>
      </button>
      {/* Search Bar - only present on mobile breakpoints */}
      <div className="header__search-bar--mobile">
        <div className="header__search-icon--mobile">
          <div className="header__magnifying-glass--mobile">
            <div className="header__icon-container--mobile">
              <img className="header__search-vector--mobile" alt="Magnifying Glass" src={searchVector} />
              <div className="header__search-ellipse--mobile" />
            </div>
          </div>
        </div>
        <div className="header__search-content--mobile">
          <input className="header__search--mobile" type="text" placeholder="Search..." />
        </div>
      </div>
    </div>
  );
};

export default Header;