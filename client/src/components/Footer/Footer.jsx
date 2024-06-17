import React from "react";
import "./Footer.scss";
import logoMark from "../../assets/images/logo-wordmark-wh.png";

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="overlap-group">
        <div className="footer-copy">
          <div className="copyright">© 2024</div>
          <div className="privacy-and-terms">Privacy Policy</div>
          <div className="text-wrapper">Terms and Conditions</div>
        </div>
        <button className="btn-register">
          <div className="body">Register</div>
        </button>
        <button className="btn-contact">
          <div className="body-pt">Contact Us</div>
        </button>
        <img className="logo-wordmark-wh" alt="Logo wordmark wh" src={logoMark} />
      </div>
    </footer>
  );
};

export default Footer;