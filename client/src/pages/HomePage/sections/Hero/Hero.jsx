import React from "react";
import NextStreamLogo from "../../../../assets/images/logo-brand-mark-white.png";
import "./Hero.scss";

export const Hero = () => {
  return (
    <div className="hero">
      <div className="hero__logo-container">
        <img className="hero__logo" alt="NextStream Logo" src={NextStreamLogo} />
      </div>
      <div className="hero__copy-container">
        <div className="hero__title">
          Can’t Stream?
          <br />
          Try NextStream!
        </div>
        <div className="hero__copy">
          <p className="hero__subtitle">
              Discover where your favourite movies and shows are streaming, all in one place. Enjoy personalized
              recommendations and easy scheduling to enhance your viewing experience.
          </p>
          <button className="hero__btn-container">
            <div className="hero__btn">Start Watching</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Hero;