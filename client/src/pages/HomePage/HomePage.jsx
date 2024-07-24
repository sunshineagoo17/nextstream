import { useEffect, useState } from "react";
import { Content } from "./sections/Content/Content";
import { Hero } from "./sections/Hero/Hero";
import Cookies from "js-cookie";
import CookieNotification from "./sections/CookieNotification/CookieNotification";
import Loader from '../../components/Loader/Loader';
import "./HomePage.scss";

export const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showCookieNotification, setShowCookieNotification] = useState(false);

  useEffect(() => {
    const cookieConsent = Cookies.get('cookieConsent');

    if (!cookieConsent) {
      setShowCookieNotification(true);
    }

    // Set isLoading to false immediately after initial mount
    setIsLoading(false);
  }, []);

  return (
    <>
      {isLoading ? <Loader /> : (
        <div className="homepage">
          {showCookieNotification && <CookieNotification />}
          <div className="homepage__content">
            <Hero />
            <Content />
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;