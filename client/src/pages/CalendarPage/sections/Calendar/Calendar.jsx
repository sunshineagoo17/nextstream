import { useState, useEffect, useContext, useCallback, forwardRef, useImperativeHandle, useRef } from 'react';
import { AuthContext } from '../../../../context/AuthContext/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilm, faTv, faTimes, faTrash, faCalendarAlt, faEraser } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import FullCalendar from '@fullcalendar/react';
import io from 'socket.io-client';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import moment from 'moment-timezone';
import api from '../../../../services/api';
import Loader from '../../../../components/Loaders/Loader/Loader';
import CustomAlerts from '../../../../components/CustomAlerts/CustomAlerts';
import AddToCalendar from '../../../../components/AddToCalendar/AddToCalendar';
import ShareEventWithFriends from '../../../../components/ShareEventWithFriends/ShareEventWithFriends';
import './Calendar.scss';

const viewNames = {
  dayGridMonth: 'Month',
  timeGridWeek: 'Week',
  timeGridDay: 'Day',
};

const Calendar = forwardRef(
  (
    {
      userId,
      eventTitle = '',
      mediaType = 'movie',
      duration,
      initialEvents = [],
    },
    ref
  ) => {
    const [events, setEvents] = useState(initialEvents);
    const { isAuthenticated, isGuest } = useContext(AuthContext);
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
    const [customAlert, setCustomAlert] = useState({ message: '', type: '' });
    const isDeletingEvent = useRef(false);
    const modalRef = useRef(null);

    const handleCloseModal = () => {
      setModalVisible(false);
    };

    useEffect(() => {
      const socketUrl =
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:8080'
          : 'https://www.nextstream.ca';
    
      const socket = io(socketUrl);
    
      socket.on('calendar_event_updated', (data) => {
        const updatedEvent = {
          ...data.event,
          start: moment.utc(data.event.start).local().format('YYYY-MM-DDTHH:mm:ss'),
          end: data.event.end ? moment.utc(data.event.end).local().format('YYYY-MM-DDTHH:mm:ss') : null,
        };
        
        setEvents((prevEvents) => {
          const eventIndex = prevEvents.findIndex((event) => event.id === updatedEvent.id);
          if (eventIndex !== -1) {
            const updatedEvents = [...prevEvents];
            updatedEvents[eventIndex] = updatedEvent;
            return updatedEvents;
          }
          return [...prevEvents, updatedEvent];
        });
      });         
    
      socket.on('calendar_event_removed', (data) => {
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== data.inviteId)
        );
      });
    
      return () => {
        socket.off('calendar_event_updated');
        socket.off('calendar_event_removed');
        socket.disconnect();
      };
    }, []);
    
    useEffect(() => {
      if (calendarRef.current) {
        const calendarApi = calendarRef.current.getApi();
        calendarApi.removeAllEvents();
    
        calendarApi.addEventSource(events);
      }
    }, [events]);
    
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (modalRef.current && !modalRef.current.contains(event.target)) {
          setModalVisible(false);
        }
      };

      if (modalVisible) {
        document.addEventListener('mousedown', handleClickOutside);
      } else {
        document.removeEventListener('mousedown', handleClickOutside);
      }
    
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [modalVisible]);
    
    const fetchEvents = useCallback(async () => {
      try {
        setLoading(true);
    
        if (isGuest) {
          showCustomAlert(
            'Guests have limited access to the calendar page.',
            'info'
          );
          setLoading(false);
          return;
        }
    
        const response = await api.get(`/api/calendar/${userId}/events`);
    
        if (response.data && response.data.length > 0) {
          // Convert event times from UTC to local time
          const eventsWithLocalTime = response.data.map(event => ({
            ...event,
            start: moment.utc(event.start).local().format('YYYY-MM-DDTHH:mm:ss'),
            end: event.end ? moment.utc(event.end).local().format('YYYY-MM-DDTHH:mm:ss') : null,
          }));
          
          setEvents(eventsWithLocalTime);
          setFilteredEvents(eventsWithLocalTime);
        } else {
          setEvents([]);
          setFilteredEvents([]);
        }
      } catch (error) {
        if (
          error.response &&
          error.response.status === 404 &&
          error.response.data.message === 'No events found for this user'
        ) {
          setEvents([]);
          setFilteredEvents([]);
          showCustomAlert(
            'No events found. Start by adding your first event!',
            'info'
          );
        } else {
          const errorMessage = error.response ? error.response.data : error.message;
          showCustomAlert(`Failed to fetch events: ${errorMessage}`, 'error');
        }
      } finally {
        setLoading(false);
      }
    }, [userId, isGuest]);
    
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
        if (
          miniCalendarRef.current &&
          !miniCalendarRef.current.contains(event.target)
        ) {
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

    const showCustomAlert = (message, type) => {
      setCustomAlert({ message, type });
      setTimeout(() => setCustomAlert({ message: '', type: '' }), 3000);
    };

    const handleDateClick = (arg) => {
      const startDate = moment(arg.dateStr).startOf('day').format('YYYY-MM-DDTHH:mm:ss');
      setNewEventStartDate(startDate);
    
      const endDate = moment(arg.dateStr).add(duration, 'minutes').format('YYYY-MM-DDTHH:mm:ss');
      setNewEventEndDate(endDate);
    
      setSelectedEvent(null);
      setNewEventType(mediaType || 'movie');
      setModalVisible(true);
    };    

    const handleEventClick = async (clickInfo) => {
      const { event } = clickInfo;
      if (!event) return;
    
      const start = moment.utc(event.start).tz(moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss');
      const end = event.end
        ? moment.utc(event.end).tz(moment.tz.guess()).format('YYYY-MM-DDTHH:mm:ss')
        : start;
    
      setSelectedEvent({
        id: event.id,
        title: event.title || '',
        start,
        end,
        eventType: event.extendedProps.eventType || 'movie',
      });
      setModalVisible(true);
    };
    
    const fetchUserNotificationTime = async () => {
      try {
        const response = await api.get(`/api/profile/${userId}`);
        const { notificationTime, customHours, customMinutes } = response.data;
        return { notificationTime, customHours, customMinutes };
      } catch (error) {
        return { notificationTime: '30', customHours: 0, customMinutes: 0 };
      }
    };

    const handleAddEvent = async () => {
      if (isGuest) {
        showCustomAlert('Guests cannot add events.', 'info');
        return;
      }
    
      if (newEventType !== 'movie' && newEventType !== 'tv') {
        showCustomAlert('Only movies/shows are allowed. Please enter a valid movie/show title.', 'error');
        setLoading(false);
        return;
      }
    
      setLoading(true);
      try {
        const { notificationTime, customHours, customMinutes } = await fetchUserNotificationTime();
    
        let notificationTimeOffset = notificationTime;
        if (notificationTime === 'custom') {
          notificationTimeOffset = parseInt(customHours || 0) * 60 + parseInt(customMinutes || 0);
        }
    
        // Convert start and end times to UTC before submitting
        const utcStart = moment(newEventStartDate).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
        const utcEnd = newEventEndDate ? moment(newEventEndDate).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : utcStart;
    
        const newEvent = {
          title: newEventTitle,
          start: utcStart,
          end: utcEnd,
          eventType: newEventType,
          notificationTime: notificationTimeOffset,
        };
    
        await api.post(`/api/calendar/${userId}/events`, newEvent);
        await fetchEvents();
        showCustomAlert('Event added successfully!', 'success');
      } catch (error) {
        showCustomAlert('Failed to add event. Ensure this is a valid movie or show title.', 'error');
      } finally {
        setLoading(false);
        setModalVisible(false);
      }
    };
    
    const handleEditEvent = async () => {
      if (!selectedEvent) return;
    
      const utcStart = moment(selectedEvent.start).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      const utcEnd = selectedEvent.end ? moment(selectedEvent.end).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : utcStart;
      const updatedEvent = {
        title: selectedEvent.title,
        start: utcStart,
        end: utcEnd,
        eventType: selectedEvent.eventType,
      };
    
      setLoading(true);
      try {
        await api.put(`/api/calendar/${userId}/events/${selectedEvent.id}`, updatedEvent);
        await fetchEvents();
        showCustomAlert('Event updated successfully!', 'success');
      } catch (error) {
        showCustomAlert('Failed to update event.', 'error');
      } finally {
        setLoading(false);
        setModalVisible(false);
      }
    };      
    
    const handleEventDrop = async (info) => {
      const { id, start, end } = info.event;
      const isSharedEvent = info.event.extendedProps.isShared === 1;
    
      if (isSharedEvent) {
        showCustomAlert('This is a shared event and cannot be moved.', 'info');
        info.revert();
        return;
      }
    
      // Convert start and end times to UTC before submitting
      const utcStart = moment(start).utc().format('YYYY-MM-DDTHH:mm:ss[Z]');
      const utcEnd = end ? moment(end).utc().format('YYYY-MM-DDTHH:mm:ss[Z]') : utcStart;
    
      const updatedEvent = {
        title: info.event.title,
        start: utcStart,
        end: utcEnd,
        eventType: info.event.extendedProps.eventType,
      };
    
      setLoading(true);
      try {
        await api.put(`/api/calendar/${userId}/events/${id}`, updatedEvent);
        await fetchEvents();
        showCustomAlert('Event moved successfully!', 'success');
      } catch (error) {
        showCustomAlert('Failed to move event.', 'error');
        info.revert();
      } finally {
        setLoading(false);
      }
    };
    
    const handleDeleteEvent = useCallback(async () => {
      if (isDeletingEvent.current || !selectedEvent) return;
      isDeletingEvent.current = true;
      setLoading(true);
    
      try {
        await api.delete(`/api/calendar/${userId}/events/${selectedEvent.id}`);
        await fetchEvents();
    
        showCustomAlert('Event deleted successfully!', 'success');
      } catch (error) {
        showCustomAlert('Failed to delete event.', 'error');
      } finally {
        setLoading(false);
        setModalVisible(false);
        isDeletingEvent.current = false;
      }
    }, [selectedEvent, fetchEvents, userId]);    
     
    const handleDeleteAllEvents = async () => {
      const currentView = calendarRef.current.getApi().view.type;
      const start = calendarRef.current.getApi().view.activeStart;
      const end = calendarRef.current.getApi().view.activeEnd;
    
      const eventsToDelete = events.filter((event) => {
        const eventStart = new Date(event.start);
        return eventStart >= start && eventStart < end;
      });
    
      try {
        setLoading(true);

        await Promise.all(
          eventsToDelete.map((event) =>
            api.delete(`/api/calendar/${userId}/events/${event.id}`)
          )
        );
    
        await fetchEvents();
    
        showCustomAlert(
          `Deleted all events in the current ${viewNames[currentView]} view!`,
          'success'
        );
      } catch (error) {
        const errorMessage = error.response ? error.response.data : error.message;
        showCustomAlert(`Failed to delete events: ${errorMessage}`, 'error');
      } finally {
        setLoading(false);
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
        <div
          className={`calendar__event-content ${eventClass}`}
          onClick={() => handleEventClickWithLoader(eventInfo.event)}>
          <b className='calendar__event-title'>
            {eventInfo.event.title.length > 10
              ? `${eventInfo.event.title.substring(0, 10)}...`
              : eventInfo.event.title}
          </b>
          <i className='calendar__event-time'>
            {moment.utc(eventInfo.event.start).local().format('h:mm A')} 
          </i>
          <FontAwesomeIcon
            icon={eventType === 'tv' ? faTv : faFilm}
            style={{ color: 'mediumblue' }}
            className='calendar__event-icon'
          />
        </div>
      );
    };
    
    const handlePrevMonth = () => {
      const newMonth = new Date(
        currentMonth.setMonth(currentMonth.getMonth() - 1)
      );
      setCurrentMonth(newMonth);
    };

    const handleNextMonth = () => {
      const newMonth = new Date(
        currentMonth.setMonth(currentMonth.getMonth() + 1)
      );
      setCurrentMonth(newMonth);
    };

    const handleDateSelect = (day) => {
      const newDate = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day
      );
      setSelectedDate(newDate);
      calendarRef.current.getApi().gotoDate(newDate);
      calendarRef.current.getApi().changeView('timeGridDay', newDate);
      setMiniCalendarVisible(false);
      showCustomAlert(`Navigated to ${newDate.toDateString()}`, 'info');
    };    

    const renderMiniCalendar = () => {
      const daysInMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        0
      ).getDate();
      const firstDayOfMonth = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        1
      ).getDay();
      const today = new Date();

      let daysArray = [];

      for (let i = 0; i < firstDayOfMonth; i++) {
        daysArray.push(null);
      }

      for (let day = 1; day <= daysInMonth; day++) {
        daysArray.push(day);
      }

      return (
        <div className='mini-calendar' ref={miniCalendarRef}>
          <div className='mini-calendar__header'>
            <button
              className='mini-calendar__nav-btn'
              onClick={handlePrevMonth}>
              {'<'}
            </button>
            <span className='mini-calendar__title'>
              {currentMonth.toLocaleString('default', { month: 'long' })}{' '}
              {currentMonth.getFullYear()}
            </span>
            <button
              className='mini-calendar__nav-btn'
              onClick={handleNextMonth}>
              {'>'}
            </button>
          </div>
          <div className='mini-calendar__body'>
            <div className='mini-calendar__day-names'>
              {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                <div key={day} className='mini-calendar__day-name'>
                  {day}
                </div>
              ))}
            </div>
            <div className='mini-calendar__days'>
              {daysArray.map((day, index) => (
                <div
                  key={index}
                  className={`mini-calendar__day${
                    day ? '' : ' mini-calendar__day--empty'
                  }${
                    today.getDate() === day &&
                    today.getMonth() === currentMonth.getMonth() &&
                    today.getFullYear() === currentMonth.getFullYear()
                      ? ' mini-calendar__day--today'
                      : ''
                  }${
                    selectedDate.getDate() === day &&
                    selectedDate.getMonth() === currentMonth.getMonth() &&
                    selectedDate.getFullYear() === currentMonth.getFullYear()
                      ? ' mini-calendar__day--selected'
                      : ''
                  }`}
                  onClick={() => day && handleDateSelect(day)}>
                  {day || ''}
                </div>
              ))}
            </div>
          </div>
          <button
            className='mini-calendar__close-btn'
            onClick={() => setMiniCalendarVisible(false)}>
            Close
          </button>
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
      const filtered = events.filter((event) =>
        searchWords.every((word) => event.title.toLowerCase().includes(word))
      );
      setFilteredEvents(filtered);
      
      if (filtered.length === 1) {
        calendarRef.current.getApi().gotoDate(filtered[0].start);
        calendarRef.current.getApi().changeView('timeGridDay');
        showCustomAlert(
          `Navigated to ${filtered[0].title} on ${moment(filtered[0].start).format('MMMM Do YYYY')}`,
          'success'
        );
      } else if (filtered.length > 1) {
        calendarRef.current.getApi().gotoDate(filtered[0].start);
        calendarRef.current.getApi().changeView('dayGridMonth');
        showCustomAlert(`Found multiple events for ${searchQuery}. Showing month view.`, 'success');
      } else {
        showCustomAlert(`No events found for ${searchQuery}.`, 'error');
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

    const clearSearchInput = () => {
      setSearchQuery('');
      setFilteredEvents(events);
    };

    const clearEventTitleInput = () => {
      setNewEventTitle('');
      if (selectedEvent) {
        setSelectedEvent((prevEvent) => ({ ...prevEvent, title: '' }));
      }
    };

    return (
      <div className='calendar'>
        <div className='calendar__header'>
          <div className='calendar__search-container'>
            <FontAwesomeIcon
              icon={faSearch}
              className='calendar__search-icon'
              onClick={handleSearch}
            />
            <input
              className='calendar__search-bar'
              type='text'
              placeholder='Search titles...'
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
            />
            {searchQuery && (
              <button className='calendar__clear-btn-container' onClick={clearSearchInput}>
                <FontAwesomeIcon
                  icon={faEraser}
                  className='calendar__clear-icon'
                  onClick={clearSearchInput}
                />
              </button>
            )}
          </div>
          {isAuthenticated && (
            <div className='calendar__actions'>
              <button
                className='calendar__toggle-sidebar-btn'
                onClick={() => setMiniCalendarVisible(!miniCalendarVisible)}>
                {miniCalendarVisible ? 'Hide Mini Cal' : 'Show Mini Cal'}
                <FontAwesomeIcon
                  icon={faCalendarAlt}
                  className='calendar__calendar-icon'
                />
              </button>
              <button
                className='calendar__delete-events-btn'
                onClick={handleDeleteAllEvents}>
                Delete Events
                <FontAwesomeIcon
                  icon={faTrash}
                  className='calendar__trash-icon'
                />
              </button>
            </div>
          )}
        </div>
        <div className='calendar__content'>
          {miniCalendarVisible && renderMiniCalendar()}
          {miniCalendarVisible && <div className='calendar__overlay' />}
          <div className='calendar__main'>
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView='dayGridMonth'
              headerToolbar={{
                left: 'prev,next,today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              views={{
                dayGridMonth: { buttonText: 'Month' },
                timeGridWeek: { buttonText: 'Week' },
                timeGridDay: { buttonText: 'Day' },
              }}
              timeZone='local'
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
        {customAlert.message && (
          <CustomAlerts
            message={customAlert.message}
            type={customAlert.type}
            onClose={() => setCustomAlert({ message: '', type: '' })}
          />
        )}
        {modalVisible && (
          <div className='modal'>
            <div className='modal-content' ref={modalRef}>
              <button className='modal-close-btn' onClick={handleCloseModal}>
                <FontAwesomeIcon icon={faTimes} onClick={handleCloseModal} className='modal-close-btn-icon'/>
              </button>
              <h2>{selectedEvent ? 'Edit Event' : 'Add Event'}</h2>
              <div className='modal-input-container'>
                <input
                  type='text'
                  className='modal-input'
                  value={selectedEvent ? selectedEvent.title : newEventTitle}
                  onChange={(e) =>
                    selectedEvent
                      ? setSelectedEvent({
                          ...selectedEvent,
                          title: e.target.value,
                        })
                      : setNewEventTitle(e.target.value)
                  }
                  onKeyDown={handleEventTitleKeyDown}
                />
                {(selectedEvent ? selectedEvent.title : newEventTitle) && (
                  <button className='modal-clear-button' onClick={clearEventTitleInput}>
                    <FontAwesomeIcon
                      icon={faEraser}
                      onClick={clearEventTitleInput}
                    />
                </button>
                )}
              </div>
              <input
                type='datetime-local'
                className='modal-input'
                value={selectedEvent ? selectedEvent.start : newEventStartDate}
                onChange={(e) => {
                  const dateValue = new Date(e.target.value);
                  if (!isNaN(dateValue)) {
                    selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, start: e.target.value }) 
                      : setNewEventStartDate(e.target.value);
                  } else {
                    showCustomAlert("Please enter a valid date", "error");
                  }
                }}
              />

              <input
                type='datetime-local'
                className='modal-input'
                value={selectedEvent ? selectedEvent.end : newEventEndDate}
                onChange={(e) => {
                  const dateValue = new Date(e.target.value);
                  if (!isNaN(dateValue)) {
                    selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, end: e.target.value }) 
                      : setNewEventEndDate(e.target.value);
                  } else {
                    showCustomAlert("Please enter a valid date", "error");
                  }
                }}
              />
              
              <div className='modal-input event-type-options'>
                <label>
                  <input
                    type='radio'
                    name='eventType'
                    value='movie'
                    className='calendar__radio'
                    checked={selectedEvent ? selectedEvent.eventType === 'movie' : newEventType === 'movie'}
                    onChange={(e) => selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, eventType: e.target.value })
                      : setNewEventType(e.target.value)}
                  />
                  Movie
                </label>
                <label>
                  <input
                    type='radio'
                    name='eventType'
                    value='tv'
                    className='calendar__radio'
                    checked={selectedEvent ? selectedEvent.eventType === 'tv' : newEventType === 'tv'}
                    onChange={(e) => selectedEvent 
                      ? setSelectedEvent({ ...selectedEvent, eventType: e.target.value })
                      : setNewEventType(e.target.value)}
                  />
                  TV Show
                </label>
              </div>
              <div className='calendar__btns-container'>
                <button
                  className='calendar__add-btn'
                  onClick={selectedEvent ? handleEditEvent : handleAddEvent}>
                  {selectedEvent ? 'Save' : 'Add'}
                </button>
                {selectedEvent && (
                  <button
                    className='calendar__delete-btn'
                    onClick={handleDeleteEvent}
                  >
                    Delete
                  </button>
                )}
                <button className='calendar__cancel-btn' onClick={() => setModalVisible(false)}>Cancel</button>
              </div>
              
              {/* AddToCalendar component */}
              <AddToCalendar
                eventTitle={selectedEvent ? selectedEvent.title : newEventTitle}
                eventStart={selectedEvent ? (selectedEvent.start || new Date().toISOString()) : (newEventStartDate || new Date().toISOString())}
                eventEnd={selectedEvent ? (selectedEvent.end || new Date().toISOString()) : (newEventEndDate || new Date().toISOString())}
                eventLocation="Online/Theater"
                eventDescription="Watch this event!"
              />

              {/* ShareEventWithFriends Component */}
              <ShareEventWithFriends
                eventId={selectedEvent ? selectedEvent.id : null}
                userId={userId}
                showAlert={showCustomAlert}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);

Calendar.propTypes = {
  events: PropTypes.array.isRequired, 
};

Calendar.defaultProps = {
  events: [], 
};

export default Calendar;