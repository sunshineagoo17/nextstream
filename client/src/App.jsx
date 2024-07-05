// App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { HomePage } from "./pages/HomePage/HomePage";
import { Footer } from "./components/Footer/Footer";
import { TermsAndConditions } from "./pages/TermsAndConditions/TermsAndConditions";
import { PrivacyPolicy } from "./pages/PrivacyPolicy/PrivacyPolicy";
import { NotFound } from "./pages/NotFound/NotFound";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import ContactModal from "./components/ContactModal/ContactModal";
import Header from "./components/Header/Header";
import HoverMenu from "./components/Header/sections/HoverMenu/HoverMenu";
import './styles/global.scss';

const App = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsContactModalOpen(false);
  };

  return (
    <Router>
      <div>
        <Header />
        <HoverMenu />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Footer onContactClick={handleContactClick} />
        {isContactModalOpen && <ContactModal onClose={handleCloseModal} />}
      </div>
    </Router>
  );
};

export default App;
