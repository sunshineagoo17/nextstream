import React, { useEffect, useState } from "react";
import { Content } from "./sections/Content/Content";
import { Hero } from "./sections/Hero/Hero";
import CookieNotification from "./sections/CookieNotification/CookieNotification";
import Loader from '../../components/Loader/Loader';
import "./HomePage.scss";

export const HomePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [showCookieNotification, setShowCookieNotification] = useState(false);

  useEffect(() => {
    const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
      const [name, value] = cookie.split('=');
      acc[name] = value;
      return acc;
    }, {});

    if (!cookies.cookieConsent) {
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