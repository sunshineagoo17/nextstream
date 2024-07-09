import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import './Calendar.scss';

const Calendar = () => {
  const events = [
    {
      title: 'Inception',
      start: '2024-07-01T09:30:00',
      end: '2024-07-01T12:30:00',
      extendedProps: {
        genre: 'Sci-Fi',
        type: 'movie'
      }
    },
    // Add more events here
  ];

  const renderEventContent = (eventInfo) => (
    <div>
      <FontAwesomeIcon icon={faFilm} /> {eventInfo.event.title}
    </div>
  );

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      events={events}
      eventContent={renderEventContent} // Custom event rendering
    />
  );
};

export default Calendar;
