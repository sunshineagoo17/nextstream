import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext/AuthContext';

const useMenuLinks = () => {
  const location = useLocation();
  const { isAuthenticated, isGuest, userId: authUserId } = useContext(AuthContext);

  const authenticatedLinks = [
    { name: "NextSearch", path: `/nextsearch/${authUserId}` },
    { name: "Top Picks", path: `/top-picks/${authUserId}` },
    { name: "NextSwipe", path: `/nextswipe/${authUserId}` },
    { name: "Favourites", path: `/faves/${authUserId}` },
    { name: "Calendar", path: `/calendar/${authUserId}` },
    { name: "Streamboard", path: `/streamboard/${authUserId}` },
    { name: "Friends", path: `/friends/${authUserId}` },
    { name: "Profile", path: `/profile/${authUserId}` }
  ];

  const guestLinks = [
    { name: "Top Picks", path: `/top-picks/guest` },
    { name: "Calendar", path: `/calendar/guest` },
    { name: "Register", path: "/register" },
    { name: "Terms", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy-policy" }
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
    } else if (isGuest) {
      const filteredGuestLinks = guestLinks.filter(link => link.path !== path);
      return path !== "/" ? [homeLink, ...filteredGuestLinks] : filteredGuestLinks;
    } else {
      const filteredUnauthenticatedLinks = unauthenticatedLinks.filter(link => link.path !== path);
      return path !== "/" ? [homeLink, ...filteredUnauthenticatedLinks] : filteredUnauthenticatedLinks;
    }
  };

  return getMenuLinks(location.pathname);
};

export default useMenuLinks;