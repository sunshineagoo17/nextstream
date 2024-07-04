import { Link } from "react-router-dom";
import "./Footer.scss";
import logoMark from "../../assets/images/logo-wordmark-wh.png";

export const Footer = () => {
  return (
    <footer className="footer">
      
      <div className="footer__logo-container">
        <img className="footer__logo-wordmark" alt="NextStream Logo" src={logoMark} />
      </div>

      <div className="footer__copy-container">
        <div className="footer__copyright">© 2024</div>
        <div className="footer__privacy-policy">Privacy Policy</div>
        <Link to="/terms" className="footer__tac-link"><div className="footer__tac">Terms and Conditions</div></Link>
      </div>
      
      <div className="footer__btn-container">
        <button className="footer__btn-register">
          <div className="footer__register">Register</div>
        </button>
        <a href="mailto:contact.nextstream@gmail.com" className="footer__btn-contact">
          <div className="footer__contact">Contact Us</div>
        </a>
      </div>
    
    </footer>
  );
};

export default Footer;