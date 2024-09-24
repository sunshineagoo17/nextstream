import { Link } from 'react-router-dom';
import NextStreamLogo from "../../../../assets/images/logo-brand-mark-white.svg";
import "./Hero.scss";

export const Hero = () => {
  return (
    <div className="hero">

      <div className="hero__copy-container">
        <div className="hero__top-container">
          <div className="hero__logo-container--mobile">
            <div className="hero__logo-border--mobile">
              <img className="hero__logo--mobile" alt="NextStream Logo" src={NextStreamLogo} />
            </div>
          </div>
          <div className="hero__title">
            Stream Smarter with NextStream.
          </div>
        </div>
        
        <p className="hero__subtitle regular">
            Discover where your favourite movies and shows are streaming, all in one place. Enjoy personalized
            recommendations and easy scheduling to enhance your viewing experience. 
            <br /><p className="hero__subtitle--tagline">Explore what the world is watching.</p>
        </p>
        <Link to="/register" aria-label="Register">
          <button className="hero__btn-container">
            <div className="hero__btn">Register Now</div>
          </button>
        </Link>
      </div>

      <div className="hero__logo-container">
        <div className="hero__logo-border">
          <img className="hero__logo" alt="NextStream Logo" src={NextStreamLogo} />
        </div>
      </div>
      
    </div>
  );
};

export default Hero;