import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faApple } from '@fortawesome/free-brands-svg-icons';

const AddToCalendar = ({ eventTitle, eventStart, eventEnd, eventLocation, eventDescription }) => {
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const googleCalendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(eventStart)}/${formatDate(eventEnd)}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;

  const appleCalendarLink = `/api/external-cal/ics?title=${encodeURIComponent(eventTitle)}&start=${eventStart}&end=${eventEnd}&description=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;

  return (
    <div className="add-to-calendar-container">
      <h3>Add event to your external calendars:</h3>
      <a href={googleCalendarLink} target="_blank" rel="noopener noreferrer" className="calendar-link">
        <FontAwesomeIcon icon={faGoogle} size="1x" /> Google Calendar
      </a>
      <a href={appleCalendarLink} download="event.ics" className="calendar-link">
        <FontAwesomeIcon icon={faApple} size="1x" /> Apple Calendar
      </a>
    </div>
  );
};

export default AddToCalendar;