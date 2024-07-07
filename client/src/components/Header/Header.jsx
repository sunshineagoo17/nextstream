import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import nextStreamLogo from "../../assets/images/nextstream-wordmark.png";
import searchVector from "../../assets/images/searh-vector-handle.svg";
import UserIcon from "../../assets/images/user-icon.svg";
import "./Header.scss";

export const Header = () => {
  const { isAuthenticated, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="header">
      <div className="header__main-container">
        <div className="header__nav-container">
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
          <Link to="/" aria-label="Homepage">
            <img className="header__logo" alt="Nextstream logo" src={nextStreamLogo} />
          </Link>
        </div>
        {isAuthenticated ? (
          <button className="header__login-container" onClick={handleLogout}>
            <div className="header__login">
              <div className="header__sign-in-txt">Logout</div>
              <img className="header__sign-in-icon" src={UserIcon} alt="User Icon" />
            </div>
          </button>
        ) : (
          <Link to="/login" aria-label="Sign In">
            <button className="header__login-container">
              <div className="header__login">
                <div className="header__sign-in-txt">Sign In</div>
                <img className="header__sign-in-icon" src={UserIcon} alt="User Icon" />
              </div>
            </button>
          </Link>
        )}
      </div>
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