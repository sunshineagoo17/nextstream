import React, { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext/AuthContext'; 
import Calendar from './sections/Calendar';

const CalendarPage = () => {
  const { isAuthenticated, userId } = useContext(AuthContext);
  
  if (!isAuthenticated) {
    return <p>Please log in to view your calendar.</p>;
  }

  return (
    <div>
      <h1>Your Schedule</h1>
      <Calendar userId={userId} />
    </div>
  );
};

export default CalendarPage;
