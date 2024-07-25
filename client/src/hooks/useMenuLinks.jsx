import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext/AuthContext';

const useMenuLinks = () => {
  const location = useLocation();
  const { isAuthenticated, userId: authUserId } = useContext(AuthContext);

  const authenticatedLinks = [
    { name: "Top Picks", path: `/top-picks/${authUserId}` },
    { name: "Calendar", path: `/calendar/${authUserId}` },
    { name: "Profile", path: `/profile/${authUserId}` },
    { name: "Favourites", path: `/faves/${authUserId}` } 
  ];

  const unauthenticatedLinks = [
    { name: "Register", path: "/register" },
    { name: "Login", path: "/login" },
    { name: "Terms", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy-policy" }
  ];

  const getMenuLinks = (path) => {
    const homeLink = { name: "Home", path: "/" };
    if (isAuthenticated) {
      const filteredAuthenticatedLinks = authenticatedLinks.filter(link => link.path !== path);
      return path !== "/" ? [homeLink, ...filteredAuthenticatedLinks] : filteredAuthenticatedLinks;
    } else {
      const filteredUnauthenticatedLinks = unauthenticatedLinks.filter(link => link.path !== path);
      return path !== "/" ? [homeLink, ...filteredUnauthenticatedLinks] : filteredUnauthenticatedLinks;
    }
  };

  return getMenuLinks(location.pathname);
};

export default useMenuLinks;