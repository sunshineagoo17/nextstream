import "./Footer.scss";
import logoMark from "../../assets/images/logo-wordmark-wh.png";

export const Footer = () => {
  return (
    <footer className="footer">

      <img className="footer__logo-wordmark" alt="NextStream Logo" src={logoMark} />
      
      <div className="footer__copy-container">
        <div className="footer__copyright">© 2024</div>
        <div className="footer__privacy-policy">Privacy Policy</div>
        <div className="footer__tac">Terms and Conditions</div>
      </div>
      
      <div className="footer__btn-container">
        <button className="footer__btn-register">
          <div className="footer__register">Register</div>
        </button>
        <button className="footer__btn-contact">
          <div className="footer__contact">Contact Us</div>
        </button>
      </div>
    
    </footer>
  );
};

export default Footer;