import { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import { ToastContainer, Slide } from 'react-toastify';
import Calendar from './sections/Calendar/Calendar';
import Loader from '../../components/Loaders/Loader/Loader';
import api from '../../services/api';
import './CalendarPage.scss';
import 'react-toastify/dist/ReactToastify.css';

const CalendarPage = () => {
  const { isAuthenticated, isGuest, userId, name, setName } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const calendarRef = useRef(null);
  const pageRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          const response = await api.get(`/api/profile/${userId}`);
          setName(response.data.name);
        } catch (error) {
          const errorMessage = error.response ? error.response.data : error.message;
          console.error('Error fetching user profile:', errorMessage);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, setName]);

  const openCalendarModal = (title) => {
    setEventTitle(title);
    setIsCalendarModalOpen(true);
  };

  const closeCalendarModal = () => {
    setIsCalendarModalOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pageRef.current && !pageRef.current.contains(event.target)) {
        closeCalendarModal();
      }
    };

    if (isCalendarModalOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarModalOpen]);

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated && !isGuest) {
    return <p>Please log in or continue as a guest to view the calendar page.</p>;
  }

  return (
    <div className="calendar-page" ref={pageRef}>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
      <div className="calendar-page__hero">
        <div className="bubble bubble1"></div>
        <div className="bubble bubble2"></div>
        <div className="bubble bubble3"></div>
        <div className="bubble bubble4"></div>
        <div className="bubble bubble5"></div>
        <div className="bubble bubble6"></div>
        <div className="bubble bubble7"></div>
        <div className="calendar-page__hero-text">
          <h1 className="calendar-page__title">{name ? `${name}'s Schedule` : 'Your Schedule'}</h1>
          <h2 className="calendar-page__subtitle">Upcoming Movies/Shows</h2>
        </div>
      </div>
      <Calendar userId={userId} ref={calendarRef} openModal={openCalendarModal} />
      {isCalendarModalOpen && (
        <Calendar
          onClose={closeCalendarModal}
          eventTitle={eventTitle}
          userId={userId}
          ref={calendarRef}
        />
      )}
    </div>
  );
};

export default CalendarPage;