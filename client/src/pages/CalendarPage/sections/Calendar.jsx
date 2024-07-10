import React, { useState, useEffect, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilm, faSearch } from '@fortawesome/free-solid-svg-icons';
import api from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext/AuthContext';
import Loader from '../../../components/Loader/Loader';
import './Calendar.scss';

const Calendar = () => {
  const { userId, isAuthenticated } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [miniCalendarVisible, setMiniCalendarVisible] = useState(false); 
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarView, setCalendarView] = useState('dayGridMonth');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get(`/api/calendar/${userId}/events`);
        const eventsWithIcons = response.data.map(event => ({
          ...event,
          title: `<i class="fas fa-film"></i> ${event.title}`,
        }));
        setEvents(eventsWithIcons);
      } catch (error) {
        console.error('Error fetching events:', error.response ? error.response.data : error.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchEvents();
    }
  }, [userId]);

  const handleDateClick = async (arg) => {
    const title = prompt('Enter event title:');
    if (title) {
      try {
        const response = await api.post(`/api/calendar/${userId}/events`, {
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
        console.error('Error adding event:', error.response ? error.response.data : error.message);
      }
    }
  };

  const handleEventClick = async (clickInfo) => {
    const eventId = clickInfo.event.id; 
    if (window.confirm(`Are you sure you want to delete the event '${clickInfo.event.title}'?`)) {
      try {
        await api.delete(`/api/calendar/${userId}/events/${eventId}`);
        setEvents(events.filter(event => event.id !== eventId));
      } catch (error) {
        console.error('Error deleting event:', error.response ? error.response.data : error.message);
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
        <div className="mini-calendar__header">
          <button className="mini-calendar__nav-btn" onClick={handlePrevMonth}>{'<'}</button>
          <span className="mini-calendar__title">
            {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
          </span>
          <button className="mini-calendar__nav-btn" onClick={handleNextMonth}>{'>'}</button>
        </div>
        <div className="mini-calendar__body">
          <div className="mini-calendar__day-names">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="mini-calendar__day-name">{day}</div>
            ))}
          </div>
          <div className="mini-calendar__days">
            {daysArray.map((day, index) => (
              <div
                key={index}
                className={`mini-calendar__day${day ? '' : ' mini-calendar__day--empty'}`}
                onClick={() => day && handleDateSelect(day)}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
        <button className="mini-calendar__close-btn" onClick={() => setMiniCalendarVisible(false)}>Close</button>
      </div>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div className="calendar__search-container">
          <FontAwesomeIcon icon={faSearch} className="calendar__search-icon" />
          <input className="calendar__search-bar" type="text" placeholder="Search events..." />
        </div>
        {isAuthenticated && (
          <button className="calendar__toggle-sidebar-btn" onClick={() => setMiniCalendarVisible(!miniCalendarVisible)}>
            {miniCalendarVisible ? 'Hide Mini Calendar' : 'Show Mini Calendar'}
          </button>
        )}
      </div>
      <div className="calendar__content">
        {miniCalendarVisible && renderMiniCalendar()}
        {miniCalendarVisible && <div className="calendar__overlay" />}
        <div className="calendar__main">
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