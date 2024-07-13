import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import Calendar from './sections/Calendar';
import { ToastContainer, Slide } from 'react-toastify';
import Loader from '../../components/Loader/Loader';
import api from '../../services/api';
import './CalendarPage.scss';
import 'react-toastify/dist/ReactToastify.css';

const CalendarPage = () => {
  const { isAuthenticated, userId, name, setName } = useContext(AuthContext); 
  const [loading, setLoading] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const calendarRef = useRef(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (userId) {
        try {
          const response = await api.get(`/api/profile/${userId}`);
          setName(response.data.name);
        } catch (error) {
          console.error('Error fetching user profile:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false); // Stop loading if userId is not available
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

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <p>Please log in to view your calendar.</p>;
  }

  return (
    <div className="calendar-page">
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
      <div className="calendar-page__hero">
        <div className="calendar-page__hero-text">
          <h1 className="calendar-page__title">{name}'s Schedule</h1> 
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