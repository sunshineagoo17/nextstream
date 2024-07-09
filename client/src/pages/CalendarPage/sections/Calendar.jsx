import React, { useState, useEffect, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faSearch } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import { AuthContext } from '../../../context/AuthContext/AuthContext';
import './Calendar.scss';

const Calendar = () => {
  const { userId } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [miniCalendarVisible, setMiniCalendarVisible] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState('dayGridMonth');

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

  const handlePrevMonth = () => {
    const newMonth = new Date(currentMonth.setMonth(currentMonth.getMonth() - 1));
    setCurrentMonth(newMonth);
  };

  const handleNextMonth = () => {
    const newMonth = new Date(currentMonth.setMonth(currentMonth.getMonth() + 1));
    setCurrentMonth(newMonth);
  };

  const handleDateSelect = (day) => {
    setCalendarView('timeGridDay');
  };

  const renderMiniCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysArray = [...Array(firstDayOfMonth).fill(null), ...Array(daysInMonth).keys()].map(day => day + 1);

    return (
      <div className="mini-calendar">
        <div className="mini-calendar-header">
          <button className="nav-btn" onClick={handlePrevMonth}>{'<'}</button>
          <span className="mini-calendar-title">
            {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
          </span>
          <button className="nav-btn" onClick={handleNextMonth}>{'>'}</button>
        </div>
        <div className="mini-calendar-body">
          <div className="mini-calendar-day-names">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="mini-calendar-day-name">{day}</div>
            ))}
          </div>
          <div className="mini-calendar-days">
            {daysArray.map((day, index) => (
              <div
                key={index}
                className={`mini-calendar-day${day ? '' : ' empty'}`}
                onClick={() => day && handleDateSelect(day)}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="search-container">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input className="search-bar" type="text" placeholder="Search events..." />
        </div>
        <button className="toggle-sidebar-btn" onClick={() => setMiniCalendarVisible(!miniCalendarVisible)}>
          {miniCalendarVisible ? 'Hide Mini Calendar' : 'Show Mini Calendar'}
        </button>
      </div>
      <div className="calendar-content">
        {miniCalendarVisible && renderMiniCalendar()}
        <div className="main-calendar">
          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={calendarView}
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
        </div>
      </div>
    </div>
  );
};

export default Calendar;