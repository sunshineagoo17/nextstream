import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext';
import Calendar from './sections/Calendar';
import Loader from '../../components/Loader/Loader';
import './CalendarPage.scss';

const CalendarPage = () => {
  const { isAuthenticated, userId } = useContext(AuthContext);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated !== null) {
      setLoading(false);
    }
  }, [isAuthenticated]);

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated) {
    return <p>Please log in to view your calendar.</p>;
  }

  return (
    <div className="calendar-page">
      <div className="calendar-page__hero">
        <div className="calendar-page__hero-text">
          <h1 className="calendar-page__title">Your Schedule</h1>
          <h2 className="calendar-page__subtitle">Upcoming Movies/Shows</h2>
        </div>
      </div>
      <Calendar userId={userId} />
    </div>
  );
};

export default CalendarPage;