import { useLocation } from 'react-router-dom';

const useMenuLinks = () => {
  const location = useLocation();

  const getMenuLinks = (path) => {
    switch (path) {
      case "/privacy-policy":
        return [
          { name: "Home", path: "/" },
          { name: "Register", path: "/register" },
          { name: "Stream Locator", path: "/stream-locator" },
          { name: "Top Picks", path: "/top-picks" },
          { name: "Calendar", path: "/calendar" },
          { name: "Profile", path: "/profile" }
        ];
      case "/terms":
        return [
          { name: "Home", path: "/" },
          { name: "Register", path: "/register" },
          { name: "Stream Locator", path: "/stream-locator" },
          { name: "Top Picks", path: "/top-picks" },
          { name: "Calendar", path: "/calendar" },
          { name: "Profile", path: "/profile" }
        ];
      case "/register":
        return [
          { name: "Home", path: "/" },
          { name: "Stream Locator", path: "/stream-locator" },
          { name: "Top Picks", path: "/top-picks" },
          { name: "Calendar", path: "/calendar" },
          { name: "Profile", path: "/profile" }
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
  };

  return getMenuLinks(location.pathname);
};

export default useMenuLinks;
