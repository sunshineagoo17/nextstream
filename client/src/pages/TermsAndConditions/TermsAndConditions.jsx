import React, { useState, useEffect } from 'react';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import ContactModal from '../../components/ContactModal/ContactModal';
import Loader from '../../components/Loader/Loader';
import './TermsAndConditions.scss';

export const TermsAndConditions = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
      <div className={`terms ${isAnimating ? 'terms--animating' : ''}`}>
        <div className="terms__container">
          <div className="terms__content-card">
            <h1 className="terms__title">Terms and Conditions</h1>
            <p className="terms__intro">Welcome to NextStream!</p>
            <p className="terms__text">These terms and conditions outline the rules and regulations for the use of NextStream's Website, located at <a href="https://www.nextstream.ca" aria-label="Visit NextStream" className="terms__nextstream-link">https://www.nextstream.ca</a>.</p>
            <p className="terms__text">By accessing this website, we assume you accept these terms and conditions. Do not continue to use NextStream if you do not agree to take all of the terms and conditions stated on this page.</p>

            <h2 className="terms__subtitle">License</h2>
            <p className="terms__text">Unless otherwise stated, NextStream and/or its licensors own the intellectual property rights for all material on NextStream. All intellectual property rights are reserved. You may access this from NextStream for your own personal use subjected to restrictions set in these terms and conditions.</p>
            <p className="terms__text">You must not:</p>
            <ul className="terms__list">
              <li className="terms__list-item">Republish material from NextStream</li>
              <li className="terms__list-item">Sell, rent, or sub-license material from NextStream</li>
              <li className="terms__list-item">Reproduce, duplicate, or copy material from NextStream</li>
              <li className="terms__list-item">Redistribute content from NextStream</li>
            </ul>

            <h2 className="terms__subtitle">User Accounts</h2>
            <p className="terms__text">To access certain features of the website, you may need to create an account. You agree to provide accurate and up-to-date information during the registration process. You are responsible for maintaining the confidentiality of your account information, including your password, and for all activities that occur under your account.</p>

            <h2 className="terms__subtitle">Content</h2>
            <p className="terms__text">Parts of this website offer an opportunity for users to post and exchange opinions and information in certain areas of the website. NextStream does not filter, edit, publish or review Comments prior to their presence on the website. Comments do not reflect the views and opinions of NextStream, its agents, or affiliates. Comments reflect the views and opinions of the person who posts their views and opinions.</p>
            <p className="terms__text">To the extent permitted by applicable laws, NextStream shall not be liable for the Comments or for any liability, damages, or expenses caused and/or suffered as a result of any use of and/or posting of and/or appearance of the Comments on this website.</p>
            <p className="terms__text">NextStream reserves the right to monitor all Comments and to remove any Comments which can be considered inappropriate, offensive, or causes a breach of these Terms and Conditions.</p>

            <h2 className="terms__subtitle">Disclaimer</h2>
            <p className="terms__text">All the information on this website is published in good faith and for general information purposes only. NextStream does not make any warranties about the completeness, reliability, and accuracy of this information. Any action you take upon the information you find on this website (NextStream), is strictly at your own risk. NextStream will not be liable for any losses and/or damages in connection with the use of our website.</p>

            <h2 className="terms__subtitle">Privacy Policy</h2>
            <p className="terms__text">Please refer to our Privacy Policy for information on how we collect, use, and disclose information from our users.</p>

            <h2 className="terms__subtitle">Governing Law</h2>
            <p className="terms__text">These terms and conditions are governed by and construed in accordance with the laws of Ontario, Canada, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>

            <h2 className="terms__subtitle">Changes to These Terms</h2>
            <p className="terms__text">NextStream reserves the right to revise these terms and conditions at any time without notice. By using this website, you are expected to review these Terms and Conditions on a regular basis to ensure you understand all terms and conditions governing the use of this website.</p>

            <h2 className="terms__subtitle">Contact Us</h2>
            <p className="terms__text">If you have any questions about these Terms and Conditions, please contact us at:</p>
            <p className="terms__text"><button className="terms__link" onClick={handleLinkClick} aria-label="Contact NextStream Support">contact@nextstream.ca</button></p>
          </div>
        </div>
        <div className="terms__background">
          <AnimatedBg />
        </div>
        {isModalOpen && <ContactModal onClose={() => setIsModalOpen(false)} />}
      </div>
    </>
  );
};

export default TermsAndConditions;