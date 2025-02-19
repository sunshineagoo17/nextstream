import React, { useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext/AuthContext';
import { SearchBarProvider } from './context/SearchBarContext/SearchBarContext';
import { MediaProvider } from './context/MediaContext/MediaContext';
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
import CalendarModal from './pages/CalendarPage/sections/Calendar/Calendar';
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
import UnsubscribePage from './pages/UnsubscribePage/UnsubscribePage';
import NextStreamBot from './pages/NextStreamBot/NextStreamBot';
import NextStreamGpt from './pages/NextStreamGpt/NextStreamGpt';
import NextWatchPage from './pages/NextWatchPage/NextWatchPage';
import AboutPage from './pages/AboutPage/AboutPage';
import PageTransition from './components/PageTransition/PageTransition';
import CustomAlerts from './components/CustomAlerts/CustomAlerts';
import io from 'socket.io-client'; 
import './components/PageTransition/PageTransition.scss';
import './styles/global.scss';
import { messaging } from './services/firebase';
import { getToken, onMessage } from 'firebase/messaging';

const App = () => {
  const [alertData, setAlertData] = useState(null); 
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const location = useLocation();
  const { isAuthenticated, isGuest, userId } = useContext(AuthContext);
  const token = Cookies.get('token');

  const [showQuickstart, setShowQuickstart] = useState(true);

  useEffect(() => {
    const socketUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:8080'
      : 'https://www.nextstream.ca';
    const socket = io(socketUrl);

    socket.on('calendar_event_notification', (data) => {
      console.log('Foreground calendar event notification received:', data);
      setAlertData({
        message: data.message || "Check your calendar for your next stream!",
        type: 'info',
      });
    });

    return () => {
      socket.off('calendar_event_notification');
      socket.disconnect();
    };
  }, [userId])

  const handleCloseQuickstart = () => setShowQuickstart(false);

  useEffect(() => {
    const sendTokenToServer = async (token) => {
      try {
        await api.post('/api/profile/update-fcm-token', { fcmToken: token });
        console.log('FCM token successfully sent to the server');
      } catch (error) {
        console.error('Error sending FCM token to server:', error);
      }
    };
  
    const requestFCMToken = async () => {
      try {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission); 
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          const registration = await navigator.serviceWorker.ready;
          
          try {
            const currentToken = await getToken(messaging, {
              vapidKey: process.env.REACT_APP_VAPID_KEY,
              serviceWorkerRegistration: registration,
            });
    
            if (currentToken) {
              console.log('FCM token obtained:', currentToken);
              await sendTokenToServer(currentToken);
            } else {
              console.warn('No FCM token available. Request permission to generate one.');
            }
          } catch (error) {
            console.error('Error while retrieving FCM token:', error);
          }
        } else {
          console.warn('Notification permission denied by the user.');
        }
      } catch (error) {
        console.error('An error occurred during FCM token retrieval:', error);
      }
    };    
  
    if (isAuthenticated) {
      requestFCMToken();
    }
  
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload); 
      try {
        setAlertData({
          message: payload.notification?.body || "Check your calendar for your next stream!",
          type: 'info',
        });
      } catch (error) {
        console.error('Error setting alert data:', error);
      }
    });      
  
    return () => {
      unsubscribe();
    };
  }, [isAuthenticated, isGuest, userId, token]);  

  useEffect(() => {
    const savedTheme = Cookies.get('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const handleCloseAlert = () => setAlertData(null);

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
    <div className={`layout ${location.pathname === '/login' || location.pathname === '/register' ? 'login-page register-page' : ''}`}>
      <Header className="layout__header" />
      <HoverMenu />
  
      <main className="layout__main">
        <PageTransition>
          <Routes location={location} key={location.key || location.pathname}>
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
            <Route path="/nextstream-bot/:userId" element={isAuthenticated ? <NextStreamBot userId={userId} /> : <Navigate to="/login-required" />} />
            <Route path="/nextstream-gpt/:userId" element={isAuthenticated ? <NextStreamGpt userId={userId} /> : <Navigate to="/login-required" />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/unsubscribe" element={<UnsubscribePage />} />
            <Route path="/login-required" element={<LoginRequired />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/nextview/:userId/:mediaType/:mediaId" element={isAuthenticated || isGuest ? <NextViewPage /> : <Navigate to="/login-required" />} />
            <Route path="/nextwatch/:userId/:mediaType/:mediaId" element={isAuthenticated || isGuest ? <NextWatchPage /> : <Navigate to="/login-required" />} />
            <Route path="/top-picks/:userId" element={isGuest || isAuthenticated ? <TopPicksPage /> : <Navigate to="/login-required" />} />
            <Route path="/streamboard/:userId" element={isAuthenticated ? <StreamBoard /> : <Navigate to="/login-required" />} />
            <Route path="/spotlight/:userId/:personId" element={isAuthenticated ? <SpotlightPage /> : <Navigate to="/login-required" />} />
            <Route path="/friends/:userId" element={isAuthenticated ? <FriendsPage /> : <Navigate to="/login-required" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </main>
  
      <Footer className="layout__footer" onContactClick={handleContactClick} />
  
      {/* Modals */}
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

      {/* CustomAlerts for in-app notifications */}
      {alertData && (
        <CustomAlerts
          message={alertData.message}
          type={alertData.type}
          onClose={handleCloseAlert}
        />
      )}
    </div>
  );
};

const RootApp = () => (
  <Router>
    <AuthProvider>
      <SearchBarProvider>
        <MediaProvider>
          <App />
        </MediaProvider>
      </SearchBarProvider>
    </AuthProvider>
  </Router>
);

export default RootApp;