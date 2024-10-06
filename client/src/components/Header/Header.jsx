import { useContext, useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { useSearchBar } from '../../context/SearchBarContext/SearchBarContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEraser, faSignInAlt, faSignOutAlt } from '@fortawesome/free-solid-svg-icons';
import nextStreamLogo from "../../assets/images/nextstream-wordmark.png";
import searchVector from "../../assets/images/search-vector-handle.svg";
import ThemeToggle from './sections/ThemeToggle/ThemeToggle';
import "./Header.scss";

const Header = () => {
  const { isAuthenticated, isGuest, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const { searchBarDesktopRef, searchBarMobileRef } = useSearchBar();

  const placeholders = useMemo(() => ["titles...", "movies...", "shows...", "streams...", "episodes...", "series...", "features...", "docs...", "classics..."], []);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState("Search ");
  const [typing, setTyping] = useState(true);

  useEffect(() => {
    let timeout;

    if (typing) {
      if (displayedPlaceholder.length < `Search ${placeholders[placeholderIndex]}`.length) {
        timeout = setTimeout(() => {
          setDisplayedPlaceholder((prev) => prev + placeholders[placeholderIndex][displayedPlaceholder.length - 7]);
        }, 150);
      } else {
        timeout = setTimeout(() => {
          setTyping(false);
        }, 2000);
      }
    } else {
      if (displayedPlaceholder.length > 7) {
        timeout = setTimeout(() => {
          setDisplayedPlaceholder((prev) => prev.slice(0, -1));
        }, 100);
      } else {
        setTyping(true);
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayedPlaceholder, typing, placeholderIndex, placeholders]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      const encodedQuery = query.trim().replace(/\s+/g, '+');
      navigate(`/search?q=${encodedQuery}`);
    }
  };

  const handleClearInput = () => {
    setQuery('');
  };

  return (
    <div className="header">
      <div className="header__main-container">
        <div className="header__nav-container">
          <div className="header__search-bar" ref={searchBarDesktopRef}>
            <div className="header__search-icon">
              <div className="header__icon-container">
                <img className="header__search-vector" alt="Magnifying Glass" src={searchVector} />
                <div className="header__search-ellipse" />
              </div>
            </div>
            <div className="header__search-content">
              <form onSubmit={handleSearch}>
                <input 
                  className="header__search-input" 
                  type="text" 
                  placeholder={displayedPlaceholder} 
                  value={query} 
                  onChange={(e) => setQuery(e.target.value)} 
                />
                {query && (
                  <button 
                    type="button" 
                    className="header__clear-btn" 
                    onClick={handleClearInput}
                  >
                    <FontAwesomeIcon icon={faEraser} />
                  </button>
                )}
              </form>
            </div>
          </div>
        </div>
        <div className="header__logo-wrapper">
          <Link to="/" aria-label="Homepage">
            <img className="header__logo" alt="Nextstream logo" src={nextStreamLogo} />
          </Link>
        </div>
        <div className="header__right-container">
          {/* <ThemeToggle /> */}
          {(isAuthenticated || isGuest) ? (
            <button className="header__login-container" onClick={handleLogout}>
              <div className="header__login">
                <div className="header__sign-in-txt">Logout</div>
                <FontAwesomeIcon icon={faSignOutAlt} className="header__sign-in-icon" alt="Logout Icon" />
              </div>
            </button>
          ) : (
            <Link to="/login" aria-label="Sign In">
              <button className="header__login-container">
                <div className="header__login">
                  <div className="header__sign-in-txt">Sign In</div>
                  <FontAwesomeIcon icon={faSignInAlt} className="header__sign-in-icon" alt="User Icon" />
                </div>
              </button>
            </Link>
          )}
        </div>
      </div>
      <div className="header__search-bar--mobile" ref={searchBarMobileRef}>
        <div className="header__search-icon--mobile">
          <div className="header__magnifying-glass--mobile">
            <div className="header__icon-container--mobile">
              <img className="header__search-vector--mobile" alt="Magnifying Glass" src={searchVector} />
              <div className="header__search-ellipse--mobile" />
            </div>
          </div>
        </div>
        <div className="header__search-content--mobile">
          <form className="header__form-mobile" onSubmit={handleSearch}>
            <input 
              className="header__search-input--mobile" 
              type="text" 
              placeholder={displayedPlaceholder} 
              value={query} 
              onChange={(e) => setQuery(e.target.value)} 
            />
            {query && (
              <button 
                type="button" 
                className="header__clear-btn--mobile" 
                onClick={handleClearInput}
              >
                <FontAwesomeIcon icon={faEraser} />
              </button>
            )}
          </form>
        </div>
      </div>
      <ThemeToggle className="header__theme-toggle--mobile"/>
    </div>
  );
};

export default Header;