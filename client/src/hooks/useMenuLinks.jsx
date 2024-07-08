import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext/AuthContext'; 

const useMenuLinks = () => {
  const location = useLocation();
  const { isAuthenticated, userId } = useContext(AuthContext);

  const getMenuLinks = (path) => {
    if (isAuthenticated) {
      return [
        { name: "Stream Locator", path: "/stream-locator" },
        { name: "Top Picks", path: "/top-picks" },
        { name: "Calendar", path: "/calendar" },
        { name: "Profile", path: `/profile/${userId}` }
      ];
    } else {
      // User is not logged in, restrict access to certain pages
      switch (path) {
        case "/privacy-policy":
        case "/terms":
          return [
            { name: "Home", path: "/" },
            { name: "Register", path: "/register" },
            { name: "Login", path: "/login" }
          ];
        case "/login":
          return [
            { name: "Home", path: "/" },
            { name: "Register", path: "/register" },
            { name: "Terms", path: "/terms" },
            { name: "Privacy Policy", path: "/privacy-policy" },
          ];
        case "/register":
            return [
              { name: "Home", path: "/" },
              { name: "Login", path: "/login" },
              { name: "Terms", path: "/terms" },
              { name: "Privacy Policy", path: "/privacy-policy" },
            ];
        case "/":
        default:
          return [
            { name: "Register", path: "/register" },
            { name: "Stream Locator", path: "/stream-locator" },
            { name: "Top Picks", path: "/top-picks" },
            { name: "Calendar", path: "/calendar" },
            { name: "Profile", path: "/profile" }
          ];
      }
    }
  };

  return getMenuLinks(location.pathname);
};

export default useMenuLinks;