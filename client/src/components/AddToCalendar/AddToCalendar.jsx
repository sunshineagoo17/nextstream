import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faApple } from '@fortawesome/free-brands-svg-icons';
import Loader from '../Loaders/Loader/Loader';
import './AddToCalendar.scss';

// Function to format dates for .ics and Google Calendar
const formatDate = (date) => {
  return new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
};

// Generate .ics file content
const generateICSFile = (eventTitle, eventStart, eventEnd, eventDescription, eventLocation) => {
  const startDate = formatDate(eventStart);
  const endDate = formatDate(eventEnd);

  return `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${eventTitle}
DESCRIPTION:${eventDescription}
DTSTART:${startDate}
DTEND:${endDate}
LOCATION:${eventLocation}
END:VEVENT
END:VCALENDAR`;
};

const AddToCalendar = ({ eventTitle, eventStart, eventEnd, eventLocation, eventDescription }) => {
  const [loading, setLoading] = useState(false);
  const [appleLink, setAppleLink] = useState(null);

  // Google Calendar link generation
  const googleCalendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(eventStart)}/${formatDate(eventEnd)}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;

  // Generate .ics file for Apple Calendar 
  useEffect(() => {
    const generateAppleDownloadLink = () => {
      setLoading(true);
      try {
        const icsContent = generateICSFile(eventTitle, eventStart, eventEnd, eventDescription, eventLocation);
        const blob = new Blob([icsContent], { type: 'text/calendar' });
        const url = URL.createObjectURL(blob);
        setAppleLink(url); 
      } catch (error) {
        console.error('Error generating ICS file:', error);
      } finally {
        setLoading(false);
      }
    };

    generateAppleDownloadLink();
  }, [eventTitle, eventStart, eventEnd, eventDescription, eventLocation]);

  return (
    <div className="add-to-cal">
      {loading && <Loader />}
      <a href={googleCalendarLink} target="_blank" rel="noopener noreferrer" className="add-to-cal__link add-to-cal__link--google">
        <FontAwesomeIcon icon={faGoogle} className="add-to-cal__icon" /> Add to Google Cal
      </a>
      {appleLink && (
        <a href={appleLink} download={`${eventTitle}.ics`} className="add-to-cal__link add-to-cal__link--apple">
          <FontAwesomeIcon icon={faApple} className="add-to-cal__icon" /> Add to Apple Cal
        </a>
      )}
    </div>
  );
};

export default AddToCalendar;