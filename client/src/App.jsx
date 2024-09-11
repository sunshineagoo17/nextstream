import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext/AuthContext';
import { SearchBarProvider } from './context/SearchBarContext/SearchBarContext';
import Cookies from 'js-cookie';
import api from './services/api'; 
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
import NextSearch from './pages/NextSearch/NextSearch';
import ContactModal from './components/ContactModal/ContactModal';
import CalendarModal from './pages/CalendarPage/sections/Calendar';
import Header from './components/Header/Header';
import HoverMenu from './components/Header/sections/HoverMenu/HoverMenu';
import LoginRequired from './pages/LoginRequired/LoginRequired';
import SpotlightPage from './pages/SpotlightPage/SpotlightPage';
import FavouritesPage from './pages/FavouritesPage/FavouritesPage';
import NextViewPage from './pages/NextViewPage/NextViewPage';
import TopPicksPage from './pages/TopPicksPage/TopPicksPage'; 
import StreamBoard from './pages/StreamBoard/StreamBoard';
import QuickstartGuide from './components/QuickStartGuide/QuickStartGuide'; 
import FriendsPage from './pages/FriendsPage/FriendsPage';
import './styles/global.scss';

// Firebase 
import { messaging } from './services/firebase'; 
import { getToken, onMessage } from 'firebase/messaging';

const App = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const location = useLocation();
  const { isAuthenticated, isGuest, userId } = useContext(AuthContext);
  const token = localStorage.getItem('token') || Cookies.get('token');

  const [showQuickstart, setShowQuickstart] = useState(true); 

  const handleCloseQuickstart = () => setShowQuickstart(false);

  useEffect(() => {
    const sendTokenToServer = async (token) => {
      try {
        await api.post('/api/profile/update-fcm-token', { fcmToken: token });
        console.log('Token sent to server successfully.');
      } catch (error) {
        console.error('Error sending token to server:', error);
      }
    };

    const requestFCMToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');

          const registration = await navigator.serviceWorker.ready;

          const currentToken = await getToken(messaging, {
            vapidKey: process.env.REACT_APP_VAPID_KEY,
            serviceWorkerRegistration: registration,
          });

          if (currentToken) {
            console.log('FCM Token:', currentToken);
            await sendTokenToServer(currentToken);
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else if (permission === 'denied') {
          console.warn('Notification permission denied by the user.');
        } else {
          console.warn('Notification permission request was dismissed.');
        }
      } catch (err) {
        console.error('An error occurred while retrieving token. ', err);
      }
    };

    if (isAuthenticated) {
      requestFCMToken();
    }

    // Handle incoming messages
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received:', payload);
    });

    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, isGuest, userId, token]);

  useEffect(() => {
    console.log('App component useEffect');
    console.log('isAuthenticated:', isAuthenticated);
    console.log('isGuest:', isGuest);
    console.log('userId:', userId);
  }, [isAuthenticated, isGuest, userId]);

  useEffect(() => {
    // Initialize theme on app load
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

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
        <Route path="/nextsearch/:userId" element={isAuthenticated ? <NextSearch userId={userId} /> : <Navigate to="/login-required" />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/login-required" element={<LoginRequired />} />
        <Route path="/nextview/:userId/:mediaType/:mediaId" element={isAuthenticated ? <NextViewPage /> : <Navigate to="/login-required" />} />
        <Route path="/top-picks/:userId" element={isGuest || isAuthenticated ? <TopPicksPage /> : <Navigate to="/login-required" />} />
        <Route path="/streamboard/:userId" element={isAuthenticated ? <StreamBoard /> : <Navigate to="/login-required" />} />
        <Route path="/spotlight/:userId/:personId" element={isAuthenticated ? <SpotlightPage /> : <Navigate to="/login-required" />} />
        <Route path="/friends/:userId" element={isAuthenticated ? <FriendsPage /> : <Navigate to="/login-required" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Footer onContactClick={handleContactClick} />
      {isContactModalOpen && <ContactModal onClose={handleCloseContactModal} />}
      {isCalendarModalOpen && <CalendarModal onClose={closeCalendarModal} eventTitle={eventTitle} />}

      {/* Quickstart Guide */}
      {showQuickstart && (
        <QuickstartGuide
          onClose={handleCloseQuickstart}
          isAuthenticated={isAuthenticated}
          currentPage={location.pathname === `/profile/${userId}` ? 'profile' : null}
          userId={userId}
        />
      )}
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