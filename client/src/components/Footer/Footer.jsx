import { Link } from "react-router-dom";
import "./Footer.scss";
import logoMark from "../../assets/images/logo-wordmark-wh.png";

export const Footer = ({ onContactClick }) => {
  return (
    <footer className="footer">
      <div className="footer__logo-container">
        <Link to="/">
          <img className="footer__logo-wordmark" alt="NextStream Logo" src={logoMark} />
        </Link>
      </div>

      <div className="footer__copy-container">
        <div className="footer__copyright">© 2025 NextSream</div>
        <div className="footer__links-container">
          <Link to="/about" className="footer__about-link">
            <div className="footer__about">About</div>
          </Link>
          <Link to="/privacy-policy" className="footer__privacy-policy-link">
            <div className="footer__privacy-policy">Privacy Policy</div>
          </Link>
          <Link to="/terms" className="footer__tac-link">
            <div className="footer__tac">Terms and Conditions</div>
          </Link>
        </div>
      </div>

      <div className="footer__btn-container">
        <Link to="/register" className="footer__btn-register">
          <div className="footer__register">Register</div>
        </Link>
        <button className="footer__btn-contact" onClick={onContactClick}>
          <div className="footer__contact">Contact Us</div>
        </button>
      </div>
    </footer>
  );
};

export default Footer;