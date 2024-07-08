import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext/AuthContext';

const useMenuLinks = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, userId } = useContext(AuthContext);

  const authenticatedLinks = [
    { name: "Stream Locator", path: "/stream-locator" },
    { name: "Top Picks", path: "/top-picks" },
    { name: "Calendar", path: "/calendar" },
    { name: "Profile", path: `/profile/${userId}` }
  ];

  const unauthenticatedLinks = [
    { name: "Home", path: "/" },
    { name: "Register", path: "/register" },
    { name: "Login", path: "/login" },
    { name: "Terms", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy-policy" }
  ];

  const getMenuLinks = (path) => {
    if (isAuthenticated) {
      return authenticatedLinks;
    } else {
      switch (path) {
        case "/privacy-policy":
        case "/terms":
          return [
            { name: "Home", path: "/" },
            { name: "Register", path: "/register" },
            { name: "Login", path: "/login" }
          ];
        case "/login":
        case "/register":
          return [
            { name: "Home", path: "/" },
            { name: "Register", path: "/register" },
            { name: "Terms", path: "/terms" },
            { name: "Privacy Policy", path: "/privacy-policy" }
          ];
        case "/profile":
        case "/stream-locator":
        case "/top-picks":
        case "/calendar":
          navigate('/login-required');
          return [];
        case "/":
        default:
          return unauthenticatedLinks;
      }
    }
  };

  return getMenuLinks(location.pathname);
};

export default useMenuLinks;
