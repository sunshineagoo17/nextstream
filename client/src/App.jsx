import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage } from "./pages/HomePage/HomePage";
import { Footer } from "./components/Footer/Footer";
import { TermsAndConditions } from "./pages/TermsAndConditions/TermsAndConditions";
import { PrivacyPolicy } from "./pages/PrivacyPolicy/PrivacyPolicy";
import { NotFound } from "./pages/NotFound/NotFound";
import { RegisterPage } from "./pages/RegisterPage/RegisterPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage/ResetPasswordPage";
import { LoginPage } from "./pages/LoginPage/LoginPage";
import { ProfilePage } from "./pages/ProfilePage/ProfilePage";
import ContactModal from "./components/ContactModal/ContactModal";
import Header from "./components/Header/Header";
import HoverMenu from "./components/Header/sections/HoverMenu/HoverMenu";
import { AuthProvider } from './context/AuthContext/AuthContext';  
import './styles/global.scss';

const App = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const location = useLocation();

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsContactModalOpen(false);
  };

  return (
    <div className={location.pathname === '/login' || location.pathname === '/register' ? 'login-page register-page' : ''}>
      <Header />
      <HoverMenu />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer onContactClick={handleContactClick} />
      {isContactModalOpen && <ContactModal onClose={handleCloseModal} />}
    </div>
  );
};

const RootApp = () => (
  <Router>
    <AuthProvider>
      <App />
    </AuthProvider>
  </Router>
);

export default RootApp;