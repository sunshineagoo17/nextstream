import { useLocation } from 'react-router-dom';

const useMenuLinks = () => {
  const location = useLocation();

  const getMenuLinks = (path) => {
    switch (path) {
      case "/register":
        return [
          { name: "Home", path: "/" },
          { name: "Search Results", path: "/search" },
          { name: "Top Picks", path: "/top-picks" },
          { name: "Calendar", path: "/calendar" },
          { name: "Profile", path: "/profile" }
        ];
      case "/":
      default:
        return [
          { name: "Register", path: "/register" },
          { name: "Search Results", path: "/search" },
          { name: "Top Picks", path: "/top-picks" },
          { name: "Calendar", path: "/calendar" },
          { name: "Profile", path: "/profile" }
        ];
    }
  };

  return getMenuLinks(location.pathname);
};

export default useMenuLinks;
