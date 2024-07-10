import React, { useContext, useState, useEffect, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import Calendar from './sections/Calendar';
import { ToastContainer } from 'react-toastify';
import Loader from '../../components/Loader/Loader';
import './CalendarPage.scss';
import 'react-toastify/dist/ReactToastify.css';

const CalendarPage = () => {
  const { isAuthenticated, userId } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const calendarRef = useRef(null);

  useEffect(() => {
    if (isAuthenticated === true) {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
      <ToastContainer />
      <div className="calendar-page__hero">
        <div className="calendar-page__hero-text">
          <h1 className="calendar-page__title">Your Schedule</h1>
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