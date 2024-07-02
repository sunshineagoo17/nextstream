import nextStreamLogo from "../../assets/images/nextstream-wordmark.png";
import searchVector from "../../assets/images/searh-vector-handle.svg";
import "./Header.scss";

export const Header = () => {
  return (
    <div className="header">
      
      <div className="header__nav-container">
        <div className="header__menu-container">
          <div className="header__menu">
            <div className="header__menu-circle1" />
            <div className="header__menu-circle2" />
            <div className="header__menu-circle3" />
            <div className="header__menu-circle4" />
          </div>
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

      <img className="header__logo" alt="Nextstream logo" src={nextStreamLogo} />
      
      <button className="header__login-container">
        <div className="header__login">Sign In</div>
      </button>
      
    </div>
  );
};

export default Header;