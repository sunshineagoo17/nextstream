import React, { useState, useEffect, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext/AuthContext'; 
import './Calendar.scss';

const Calendar = () => {
  const { userId } = useContext(AuthContext);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(`/api/calendar/${userId}/events`);
        const eventsWithIcons = response.data.map(event => ({
          ...event,
          title: `<i class="fas fa-film"></i> ${event.title}`,
        }));
        setEvents(eventsWithIcons);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [userId]);

  const handleDateClick = async (arg) => {
    const title = prompt('Enter event title:');
    if (title) {
      try {
        const response = await axios.post(`/api/calendar/${userId}/events`, {
          title,
          start: arg.date,
          end: arg.date,
        });
        const newEvent = {
          ...response.data,
          title: `<i class="fas fa-film"></i> ${response.data.title}`,
        };
        setEvents([...events, newEvent]);
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  const handleEventClick = async (clickInfo) => {
    if (window.confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'`)) {
      try {
        await axios.delete(`/api/calendar/${userId}/events/${clickInfo.event.id}`);
        setEvents(events.filter(event => event.id !== clickInfo.event.id));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const renderEventContent = (eventInfo) => {
    return (
      <div>
        <FontAwesomeIcon icon={faFilm} /> <b>{eventInfo.timeText}</b> <i>{eventInfo.event.title}</i>
      </div>
    );
  };

  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay',
      }}
      events={events}
      dateClick={handleDateClick}
      eventClick={handleEventClick}
      eventContent={renderEventContent} 
    />
  );
};

export default Calendar;
