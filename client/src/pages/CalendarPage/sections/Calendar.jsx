import { useState, useEffect, useContext, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilm, faTv } from '@fortawesome/free-solid-svg-icons';
import { toast } from 'react-toastify';
import moment from 'moment-timezone';
import api from '../../../services/api';
import { AuthContext } from '../../../context/AuthContext/AuthContext';
import Loader from '../../../components/Loader/Loader';
import './Calendar.scss';

const Calendar = forwardRef(({ userId, eventTitle, mediaType, onClose }, ref) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [miniCalendarVisible, setMiniCalendarVisible] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState(eventTitle || '');
  const [newEventStartDate, setNewEventStartDate] = useState('');
  const [newEventEndDate, setNewEventEndDate] = useState('');
  const [newEventType, setNewEventType] = useState(mediaType || 'movie');
  const calendarRef = useRef(null);
  const miniCalendarRef = useRef(null);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/calendar/${userId}/events`);
      setEvents(response.data);
      setFilteredEvents(response.data);
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (miniCalendarRef.current && !miniCalendarRef.current.contains(event.target)) {
        setMiniCalendarVisible(false);
      }
    };

    if (miniCalendarVisible) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [miniCalendarVisible]);

  const handleDateClick = (arg) => {
    const localDate = moment(arg.date).format('YYYY-MM-DDTHH:mm:ss');
    setNewEventStartDate(localDate);
    setNewEventEndDate(localDate);
    setSelectedEvent(null);
    setNewEventType(mediaType || 'movie');
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
    const eventType = event.extendedProps.eventType || 'movie';

    setSelectedEvent({
      id,
      title,
      start,
      end,
      eventType
    });
    setNewEventType(eventType);
    setModalVisible(true);
  };

  const handleAddEvent = async () => {
    setLoading(true);
    try {
      const newEvent = {
        title: newEventTitle,
        start: moment(newEventStartDate).format('YYYY-MM-DDTHH:mm:ss'),
        end: moment(newEventEndDate).format('YYYY-MM-DDTHH:mm:ss'),
        eventType: newEventType
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
        eventType: selectedEvent.eventType
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
      eventType: info.event.extendedProps.eventType
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

    const eventType = eventInfo.event.extendedProps.eventType;
    const eventClass = eventType === 'tv' ? 'calendar__event-tv' : 'calendar__event-movie';

    return (
      <div className={`calendar__event-content ${eventClass}`} onClick={() => handleEventClickWithLoader(eventInfo.event)}>
        <b className="calendar__event-title">{eventInfo.event.title.length > 10 ? `${eventInfo.event.title.substring(0, 10)}...` : eventInfo.event.title}</b>
        <i className="calendar__event-time">{moment(eventInfo.event.start).format('h:mm A')}</i>
        <FontAwesomeIcon 
          icon={eventType === 'tv' ? faTv : faFilm} 
          style={{ color: 'mediumblue' }} 
          className="calendar__event-icon" 
        />
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
    setSelectedDate(newDate);
    calendarRef.current.getApi().gotoDate(newDate);
    calendarRef.current.getApi().changeView('timeGridDay', newDate);
    setMiniCalendarVisible(false);
    toast.info(`Navigated to ${newDate.toDateString()}`);
  };

  const renderMiniCalendar = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const today = new Date();

    let daysArray = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(day);
    }

    return (
      <div className="mini-calendar" ref={miniCalendarRef}>
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
                className={`mini-calendar__day${day ? '' : ' mini-calendar__day--empty'}${today.getDate() === day && today.getMonth() === currentMonth.getMonth() && today.getFullYear() === currentMonth.getFullYear() ? ' mini-calendar__day--today' : ''}${selectedDate.getDate() === day && selectedDate.getMonth() === currentMonth.getMonth() && selectedDate.getFullYear() === currentMonth.getFullYear() ? ' mini-calendar__day--selected' : ''}`}
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

  // Expose a method to open the modal with a specific title
  useImperativeHandle(ref, () => ({
    openModalWithTitle: (title) => {
      setNewEventTitle(title);
      setModalVisible(true);
    },
  }));

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const handleSearch = () => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
      return;
    }

    const searchWords = searchQuery.trim().toLowerCase().split(/\s+/);
    // Filter events where every word in the search query is found in the event title
    const filtered = events.filter(event =>
      searchWords.every(word => event.title.toLowerCase().includes(word))
    );
    setFilteredEvents(filtered);

    if (filtered.length === 1) {
      calendarRef.current.getApi().gotoDate(filtered[0].start);
      calendarRef.current.getApi().changeView('timeGridDay');
      toast.success(`Navigated to ${filtered[0].title} on ${moment(filtered[0].start).format('MMMM Do YYYY')}`);
    } else if (filtered.length > 1) {
      calendarRef.current.getApi().gotoDate(filtered[0].start);
      calendarRef.current.getApi().changeView('dayGridMonth');
      toast.success(`Found multiple events for ${searchQuery}. Showing month view.`);
    } else {
      toast.error(`No events found for ${searchQuery}.`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEventTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      selectedEvent ? handleEditEvent() : handleAddEvent();
    }
  };

  return (
    <div className="calendar">
      <div className="calendar__header">
        <div className="calendar__search-container">
          <FontAwesomeIcon icon={faSearch} className="calendar__search-icon" onClick={handleSearch} />
          <input
            className="calendar__search-bar"
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
          />
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
            events={filteredEvents}
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
              onKeyDown={handleEventTitleKeyDown}
            />
            <input
              type="datetime-local"
              className="modal-input"
              value={selectedEvent ? selectedEvent.start : newEventStartDate}
              onChange={(e) => selectedEvent ? setSelectedEvent({ ...selectedEvent, start: e.target.value }) : setNewEventStartDate(e.target.value)}
            />
            <input
              type="datetime-local"
              className="modal-input"
              value={selectedEvent ? selectedEvent.end : newEventEndDate}
              onChange={(e) => selectedEvent ? setSelectedEvent({ ...selectedEvent, end: e.target.value }) : setNewEventEndDate(e.target.value)}
            />
            <div className="modal-input event-type-options">
              <label>
                <input
                  type="radio"
                  name="eventType"
                  value="movie"
                  className="calendar__radio"
                  checked={selectedEvent ? selectedEvent.eventType === 'movie' : newEventType === 'movie'}
                  onChange={(e) => selectedEvent ? setSelectedEvent({ ...selectedEvent, eventType: e.target.value }) : setNewEventType(e.target.value)}
                />
                Movie
              </label>
              <label>
                <input
                  type="radio"
                  name="eventType"
                  value="tv"
                  className="calendar__radio"
                  checked={selectedEvent ? selectedEvent.eventType === 'tv' : newEventType === 'tv'}
                  onChange={(e) => selectedEvent ? setSelectedEvent({ ...selectedEvent, eventType: e.target.value }) : setNewEventType(e.target.value)}
                />
                TV Show
              </label>
            </div>
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