import React, { useState, useEffect, useContext } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilm } from '@fortawesome/free-solid-svg-icons';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment-timezone';
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
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDate, setNewEventDate] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true); 
        const response = await api.get(`/api/calendar/${userId}/events`);
        setEvents(response.data);
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

  const handleDateClick = (arg) => {
    const localDate = moment(arg.date).format('YYYY-MM-DDTHH:mm:ss');
    setNewEventDate(localDate);
    setSelectedEvent(null);
    setModalVisible(true);
  };

  const handleEventClick = (clickInfo) => {
    setSelectedEvent({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
      start: moment.utc(clickInfo.event.start).toISOString(),
      end: clickInfo.event.end ? moment.utc(clickInfo.event.end).toISOString() : null,
    });
    setModalVisible(true);
  };

  const handleAddEvent = async () => {
    setLoading(true);
    try {
      const newEvent = {
        title: newEventTitle,
        start: moment.utc(newEventDate).toISOString(),
        end: moment.utc(newEventDate).toISOString(),
      };
      const response = await api.post(`/api/calendar/${userId}/events`, newEvent);
      setEvents([...events, response.data]);
      toast.success('Event added successfully!');
    } catch (error) {
      console.error('Error adding event:', error.response ? error.response.data : error.message);
      toast.error('Failed to add event.');
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };
  

  const handleEditEvent = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      // Format the event start and end times
      const updatedEvent = {
        title: selectedEvent.title,
        start: moment(selectedEvent.start).toISOString(),
        end: selectedEvent.end ? moment(selectedEvent.end).toISOString() : null,
      };
  
      // Remove 'end' if it's null to avoid sending 'Invalid date'
      if (updatedEvent.end === null) {
        delete updatedEvent.end;
      }
  
      // Make the API call to update the event
      await api.put(`/api/calendar/${userId}/events/${selectedEvent.id}`, updatedEvent);
  
      // Update the events state
      const updatedEvents = events.map(event =>
        event.id === selectedEvent.id ? { ...event, ...selectedEvent } : event
      );
      setEvents(updatedEvents);
      toast.success('Event updated successfully!');
    } catch (error) {
      console.error('Error updating event:', error.response ? error.response.data : error.message);
      toast.error('Failed to update event.');
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  const handleEventDrop = async (info) => {
    const { id } = info.event;
    const updatedEvent = {
      title: info.event.title,
      start: moment(info.event.start).toISOString(),
      end: info.event.end ? moment(info.event.end).toISOString() : moment(info.event.start).toISOString(),
    };
    try {
      await api.put(`/api/calendar/${userId}/events/${id}`, updatedEvent);
      const updatedEvents = events.map(event =>
        event.id === id ? { ...event, ...updatedEvent } : event
      );
      setEvents(updatedEvents);
      toast.success('Event moved successfully!');
    } catch (error) {
      console.error('Error moving event:', error.response ? error.response.data : error.message);
      toast.error('Failed to move event.');
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      await api.delete(`/api/calendar/${userId}/events/${selectedEvent.id}`);
      setEvents(events.filter(event => event.id !== selectedEvent.id));
      toast.success('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error.response ? error.response.data : error.message);
      toast.error('Failed to delete event.');
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };  

  const renderEventContent = (eventInfo) => {
    const handleEventClickWithLoader = async (event) => {
      setLoading(true);
      try {
        await handleEventClick(event);
      } finally {
        setLoading(false);
      }
    };
  
    return (
      <div onClick={() => handleEventClickWithLoader(eventInfo.event)}>
        <FontAwesomeIcon icon={faFilm} style={{ color: 'mediumblue' }} /> 
        <b>{moment(eventInfo.event.start).format('h:mm A')}</b> 
        <i>{eventInfo.event.title}</i>
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
            eventDrop={handleEventDrop}
            editable={true}
            eventContent={renderEventContent}
          />
        </div>
      </div>
      <ToastContainer position="top-center" autoClose={3000} hideProgressBar />
      {modalVisible && (
        <div className="modal">
          <div className="modal-content">
            <h2>{selectedEvent ? 'Edit Event' : 'Add Event'}</h2>
            <input
              type="text"
              className="modal-input"
              value={selectedEvent ? selectedEvent.title : newEventTitle}
              onChange={(e) => selectedEvent ? setSelectedEvent({ ...selectedEvent, title: e.target.value }) : setNewEventTitle(e.target.value)}
            />
            <input
              type="datetime-local"
              className="modal-input"
              value={selectedEvent ? moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm:ss') : newEventDate}
              onChange={(e) => selectedEvent ? setSelectedEvent({ ...selectedEvent, start: e.target.value }) : setNewEventDate(e.target.value)}
            />
            <button onClick={selectedEvent ? handleEditEvent : handleAddEvent}>
              {selectedEvent ? 'Save' : 'Add'}
            </button>
            {selectedEvent && <button onClick={handleDeleteEvent}>Delete</button>}
            <button onClick={() => setModalVisible(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendar;