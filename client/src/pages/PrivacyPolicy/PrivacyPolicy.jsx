import React, { useState, useEffect } from 'react';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import ContactModal from '../../components/ContactModal/ContactModal';
import Loader from '../../components/Loader/Loader';
import './PrivacyPolicy.scss';

export const PrivacyPolicy = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set isLoading to false after component mounts
    setIsLoading(false);
  }, []);
  
  const handleLinkClick = (e) => {
    e.preventDefault();
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsModalOpen(true);
    }, 500);
  };  

  return (
    <>
      {isLoading && <Loader />}
      <div className={`privacy ${isAnimating ? 'privacy--animating' : ''}`}>
        <div className="privacy__container">
          <div className="privacy__content-card">
            <h1 className="privacy__title">Privacy Policy</h1>
            <p className="privacy__intro">Your privacy is important to us.</p>
            <p className="privacy__text">This policy outlines how we collect, use, and protect your information.</p>
            
            <h2 className="privacy__subtitle">Information We Collect</h2>
            <p className="privacy__text"><strong>Personal Information:</strong> When you create an account, search for content, or contact us, we may collect your name, email address, username, and password.</p>
            <p className="privacy__text"><strong>Usage Data:</strong> We collect information on how you interact with our website, such as your IP address, browser type, pages visited, and time spent on pages.</p>
            <p className="privacy__text"><strong>Cookies:</strong> We use cookies to enhance your experience. You can disable cookies in your browser settings, but some features of our site may not work properly.</p>

            <h2 className="privacy__subtitle">How We Use Your Information</h2>
            <p className="privacy__text">We use your information to:</p>
            <ul className="privacy__list">
              <li className="privacy__list-item">Provide and improve our services</li>
              <li className="privacy__list-item">Personalize your experience</li>
              <li className="privacy__list-item">Communicate with you about your account and updates</li>
              <li className="privacy__list-item">Analyze website usage for improvements</li>
            </ul>

            <h2 className="privacy__subtitle">Sharing Your Information</h2>
            <p className="privacy__text">We do not sell or share your personal information with third parties, except to comply with legal obligations, protect our rights, or in connection with a merger or acquisition.</p>

            <h2 className="privacy__subtitle">Security</h2>
            <p className="privacy__text">We take reasonable measures to protect your information from unauthorized access, but no online service can be completely secure.</p>

            <h2 className="privacy__subtitle">Your Rights</h2>
            <p className="privacy__text">You have the right to access, update, or delete your personal information. Contact us for assistance.</p>

            <h2 className="privacy__subtitle">Changes to This Policy</h2>
            <p className="privacy__text">We may update this policy from time to time. Changes will be posted on this page with an updated effective date.</p>

            <h2 className="privacy__subtitle">Contact Us</h2>
            <p className="privacy__text">If you have any questions about this policy, please contact us at:</p>
            <p className="privacy__text"><button className="privacy__link" onClick={handleLinkClick} aria-label="Contact NextStream Support">contact@nextstream.ca.</button></p>
          </div>
        </div>
        <div className="privacy__background">
          <AnimatedBg />
        </div>
        {isModalOpen && <ContactModal onClose={() => setIsModalOpen(false)} />}
      </div>
    </>
  );
};

export default PrivacyPolicy;