import React, { useState, useEffect, useContext, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilm } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import moment from 'moment-timezone';
import api from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext/AuthContext';
import Loader from '../../../components/Loader/Loader';
import './Calendar.scss';

const Calendar = forwardRef(({ userId, eventTitle, onClose }, ref) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [miniCalendarVisible, setMiniCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState(eventTitle || ''); 
  const [newEventDate, setNewEventDate] = useState('');
  const calendarRef = useRef(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/calendar/${userId}/events`);
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error.response ? error.response.data : error.message);
      toast.error('Failed to fetch events.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (isAuthenticated !== null) {
      fetchEvents(); 
    }
  }, [isAuthenticated, fetchEvents]); 

  const handleDateClick = (arg) => {
    const localDate = moment(arg.date).format('YYYY-MM-DDTHH:mm:ss');
    setNewEventDate(localDate);
    setSelectedEvent(null);
    setModalVisible(true);
  };

  const handleEventClick = async (clickInfo) => {
    const { event } = clickInfo;
    if (!event) {
      console.error('Event data not found.');
      return;
    }

    const id = event.id;
    const title = event.title || '';
    const start = moment(event.start).format('YYYY-MM-DDTHH:mm:ss') || '';
    const end = event.end ? moment(event.end).format('YYYY-MM-DDTHH:mm:ss') : start;

    setSelectedEvent({
      id,
      title,
      start,
      end,
    });
    setModalVisible(true);
  };

  const handleAddEvent = async () => {
    setLoading(true);
    try {
      const newEvent = {
        title: newEventTitle,
        start: moment(newEventDate).format('YYYY-MM-DDTHH:mm:ss'),
        end: moment(newEventDate).format('YYYY-MM-DDTHH:mm:ss'),
      };
      await api.post(`/api/calendar/${userId}/events`, newEvent);
      await fetchEvents();
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
      const updatedEvent = {
        title: selectedEvent.title,
        start: moment(selectedEvent.start).format('YYYY-MM-DDTHH:mm:ss'),
        end: moment(selectedEvent.end).format('YYYY-MM-DDTHH:mm:ss'),
      };

      await api.put(`/api/calendar/${userId}/events/${selectedEvent.id}`, updatedEvent);
      await fetchEvents();
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
      start: moment(info.event.start).format('YYYY-MM-DDTHH:mm:ss'),
      end: info.event.end ? moment(info.event.end).format('YYYY-MM-DDTHH:mm:ss') : moment(info.event.start).format('YYYY-MM-DDTHH:mm:ss'),
    };
    setLoading(true);
    try {
      await api.put(`/api/calendar/${userId}/events/${id}`, updatedEvent);
      await fetchEvents();
      toast.success('Event moved successfully!');
    } catch (error) {
      console.error('Error moving event:', error.response ? error.response.data : error.message);
      toast.error('Failed to move event.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    setLoading(true);
    try {
      await api.delete(`/api/calendar/${userId}/events/${selectedEvent.id}`);
      await fetchEvents();
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
      <div className="calendar__event-content" onClick={() => handleEventClickWithLoader(eventInfo.event)}>
        <FontAwesomeIcon icon={faFilm} style={{ color: 'mediumblue' }} className="calendar__event-icon" />
        <b className="calendar__event-time">{moment(eventInfo.event.start).format('h:mm A')}</b>
        <i className="calendar__event-title">{eventInfo.event.title}</i>
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
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    calendarRef.current.getApi().changeView('timeGridDay', newDate); // Use calendarRef to change view
    setMiniCalendarVisible(false);
    toast.info(`Navigated to ${newDate.toDateString()}`);
  };

  const renderMiniCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    // Create an array to hold all days of the month
    let daysArray = [];

    // Fill days before the first day of the month with null
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }

    // Fill days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(day);
    }

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
                {day || ''}
              </div>
            ))}
          </div>
        </div>
        <button className="mini-calendar__close-btn" onClick={() => setMiniCalendarVisible(false)}>Close</button>
      </div>
    );
  };

  // Expose functions to parent component through ref
  useImperativeHandle(ref, () => ({
    openModalWithTitle: (title) => {
      setNewEventTitle(title);
      setModalVisible(true);
    },
  }));

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
            ref={calendarRef} 
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
            eventDrop={handleEventDrop}
            editable={true}
            eventContent={renderEventContent}
          />
        </div>
      </div>
      {loading && <Loader />}
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
              value={selectedEvent ? selectedEvent.start : newEventDate}
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
});

export default Calendar;