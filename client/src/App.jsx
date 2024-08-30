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
import NextSwipePage from './pages/NextSwipe/NextSwipe';
import CalendarPage from './pages/CalendarPage/CalendarPage';
import SearchResultsPage from './pages/SearchResultsPage/SearchResultsPage';
import AuthSearchResultsPage from './pages/AuthSearchResultsPage/AuthSearchResultsPage';
import ContactModal from './components/ContactModal/ContactModal';
import CalendarModal from './pages/CalendarPage/sections/Calendar';
import Header from './components/Header/Header';
import HoverMenu from './components/Header/sections/HoverMenu/HoverMenu';
import { AuthProvider, AuthContext } from './context/AuthContext/AuthContext';
import { SearchBarProvider } from './context/SearchBarContext/SearchBarContext';
import LoginRequired from './pages/LoginRequired/LoginRequired';
import FavouritesPage from './pages/FavouritesPage/FavouritesPage';
import NextViewPage from './pages/NextViewPage/NextViewPage';
import TopPicksPage from './pages/TopPicksPage/TopPicksPage'; 
import StreamBoard from './pages/StreamBoard/StreamBoard';
import './styles/global.scss';

const App = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const location = useLocation();
  const { isAuthenticated, isGuest, userId } = useContext(AuthContext);

  useEffect(() => {
    // Initialize theme on app load
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);
  
  useEffect(() => {
    console.log('App component useEffect');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('isGuest:', isGuest);
    console.log('userId:', userId);
  }, [isAuthenticated, isGuest, userId]);

  const handleContactClick = () => {
    setIsContactModalOpen(true);
  };

  const handleCloseContactModal = () => {
    setIsContactModalOpen(false);
  };

  const openCalendarModal = (title) => {
    setEventTitle(title);
    setIsCalendarModalOpen(true);
  };

  const closeCalendarModal = () => {
    setIsCalendarModalOpen(false);
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
        <Route path="/nextswipe/:userId" element={isAuthenticated ? <NextSwipePage openModal={openCalendarModal} /> : <Navigate to="/login-required" />} />
        <Route path="/calendar/:userId" element={isAuthenticated || isGuest ? <CalendarPage openModal={openCalendarModal} /> : <Navigate to="/login-required" />} />
        <Route path="/faves/:userId" element={isAuthenticated ? <FavouritesPage /> : <Navigate to="/login-required" />} /> 
        <Route path="/search" element={isAuthenticated ? <AuthSearchResultsPage openModal={openCalendarModal} userId={userId} /> : <SearchResultsPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login-required" element={<LoginRequired />} />
        <Route path="/nextview/:userId/:mediaType/:mediaId" element={isAuthenticated ? <NextViewPage /> : <Navigate to="/login-required" />} />
        <Route path="/top-picks/:userId" element={isGuest || isAuthenticated ? <TopPicksPage /> : <Navigate to="/login-required" />} />
        <Route path="/streamboard/:userId" element={isAuthenticated ? <StreamBoard /> : <Navigate to="/login-required" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer onContactClick={handleContactClick} />
      {isContactModalOpen && <ContactModal onClose={handleCloseContactModal} />}
      {isCalendarModalOpen && <CalendarModal onClose={closeCalendarModal} eventTitle={eventTitle} />}
    </div>
  );
};

const RootApp = () => (
  <Router>
    <AuthProvider>
      <SearchBarProvider> 
        <App />
      </SearchBarProvider>
    </AuthProvider>
  </Router>
);

export default RootApp;