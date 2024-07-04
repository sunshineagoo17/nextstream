import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { HomePage } from "./pages/HomePage/HomePage";
import { Header } from "./components/Header/Header";
import { Footer } from "./components/Footer/Footer";
import { TermsAndConditions } from "./pages/TermsAndConditions/TermsAndConditions";
import ContactModal from "./components/ContactModal/ContactModal"; 
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
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/terms" element={<TermsAndConditions />} />
        </Routes>
        <Footer onContactClick={handleContactClick} />
        {isContactModalOpen && <ContactModal onClose={handleCloseModal} />}
      </div>
    </Router>
  );
};

export default App;