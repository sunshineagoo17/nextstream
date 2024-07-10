import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import Footer from './components/Footer/Footer';
import TermsAndConditions from './pages/TermsAndConditions/TermsAndConditions';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import NotFound from './pages/NotFound/NotFound';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage';
import LoginPage from './pages/LoginPage/LoginPage';
import ProfilePage from './pages/ProfilePage/ProfilePage';
import StreamLocatorPage from './pages/StreamLocatorPage/StreamLocatorPage';
import TopPicksPage from './pages/TopPicksPage/TopPicksPage';
import CalendarPage from './pages/CalendarPage/CalendarPage';
import SearchResultsPage from './pages/SearchResultsPage/SearchResultsPage';
import AuthSearchResultsPage from './pages/AuthSearchResultsPage/AuthSearchResultsPage';
import ContactModal from './components/ContactModal/ContactModal';
import Header from './components/Header/Header';
import HoverMenu from './components/Header/sections/HoverMenu/HoverMenu';
import { AuthProvider, AuthContext } from './context/AuthContext/AuthContext';
import LoginRequired from './pages/LoginRequired/LoginRequired';
import './styles/global.scss';

const App = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, userId } = useContext(AuthContext);

  useEffect(() => {
    console.log('App component useEffect');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('userId:', userId);
  }, [isAuthenticated, userId]);

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
        <Route path="/profile/:userId" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login-required" />} />
        <Route path="/stream-locator/:userId" element={isAuthenticated ? <StreamLocatorPage /> : <Navigate to="/login-required" />} />
        <Route path="/top-picks/:userId" element={isAuthenticated ? <TopPicksPage /> : <Navigate to="/login-required" />} />
        <Route path="/calendar/:userId" element={isAuthenticated ? <CalendarPage /> : <Navigate to="/login-required" />} />
        {/* Use conditional rendering for search results page */}
        <Route path="/search" element={isAuthenticated ? <AuthSearchResultsPage /> : <SearchResultsPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login-required" element={<LoginRequired />} />
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