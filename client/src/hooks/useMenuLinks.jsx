import { useContext } from 'react';
import { useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext/AuthContext';

const useMenuLinks = () => {
  const location = useLocation();
  const { isAuthenticated, userId: authUserId } = useContext(AuthContext);

  const authenticatedLinksSet1 = [
    { name: "Stream Locator", path: "/stream-locator" },
    { name: "Top Picks", path: "/top-picks" },
    { name: "Calendar", path: "/calendar" },
    { name: "Profile", path: `/profile/${authUserId}` }
  ];

  const authenticatedLinksSet2 = [
    { name: "Stream Locator", path: "/stream-locator" },
    { name: "Top Picks", path: "/top-picks" },
    { name: "Calendar", path: "/calendar" },
  ];

  const unauthenticatedLinks = [
    { name: "Terms", path: "/terms" },
    { name: "Privacy Policy", path: "/privacy-policy" }
  ];

  const unauthenticatedHomeLink = [
    { name: "Home", path: "/" }
  ];

  const unauthenticatedRegisterLink = [
    { name: "Register", path: "/register" }
  ];

  const unauthenticatedLoginLink = [
    { name: "Register", path: "/login" }
  ];

  const loginRequiredPath = '/login-required';

  const navigateToLoginRequired = () => {
    window.location.href = loginRequiredPath; 
  };

  const getMenuLinks = (path) => {
    if (isAuthenticated) {
      if (path.startsWith(`/profile/${authUserId}`)) {
        return [
          { name: "Home", path: "/" },
          ...authenticatedLinksSet2
        ];
      } else {
        // Handle other authenticated routes
        return authenticatedLinksSet1;
      }
    } else {
      switch (path) {
        case "/privacy-policy":
        case "/terms":
          return [
            ...unauthenticatedHomeLink,
            ...authenticatedLinksSet1,
            ...unauthenticatedRegisterLink,
          ];
        case "/register":
          return [
            ...unauthenticatedHomeLink,
            ...unauthenticatedLoginLink,
            ...unauthenticatedLinks
          ];
        case "/login-required":
          return [
            ...unauthenticatedHomeLink,
            ...unauthenticatedRegisterLink,
            ...unauthenticatedLinks
          ];
        case "/login":
          return [
            ...unauthenticatedHomeLink,
            ...unauthenticatedRegisterLink,
            ...unauthenticatedLinks
          ];
        case "/":
          return [
            ...unauthenticatedRegisterLink,
            ...authenticatedLinksSet1
          ];
        default:
          // Redirect to login-required page for authenticated routes if not logged in
          if (authenticatedLinksSet1.some(link => link.path === path)) {
            navigateToLoginRequired();
            return [];
          }
          return unauthenticatedLinks;
      }
    }
  };

  return getMenuLinks(location.pathname);
};

export default useMenuLinks;
