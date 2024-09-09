import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGoogle, faApple } from '@fortawesome/free-brands-svg-icons';
import Loader from '../Loader/Loader';
import api from '../../services/api';
import './AddToCalendar.scss';

const AddToCalendar = ({ eventTitle, eventStart, eventEnd, eventLocation, eventDescription }) => {
  const [loading, setLoading] = useState(false);
  const [appleLink, setAppleLink] = useState(null);

  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  };

  const googleCalendarLink = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitle)}&dates=${formatDate(eventStart)}/${formatDate(eventEnd)}&details=${encodeURIComponent(eventDescription)}&location=${encodeURIComponent(eventLocation)}`;

  const generateAppleDownloadLink = async () => {
    setLoading(true);

    try {
      const response = await api.post('/api/external-cal/create-ics', {
        title: eventTitle,
        start: eventStart,
        end: eventEnd,
        description: eventDescription,
        location: eventLocation
      }, {
        responseType: 'blob',
      });

      // Create a Blob URL and set it for the Apple link
      const blob = new Blob([response.data], { type: 'text/calendar' });
      const downloadLink = window.URL.createObjectURL(blob);
      setAppleLink(downloadLink);  // Set the link to be used for the download
    } catch (error) {
      console.error('Error creating or downloading ICS file:', error);
    } finally {
      setLoading(false);
    }
  };

  // Call the function to generate the Apple Calendar link immediately after rendering
  useState(() => {
    generateAppleDownloadLink();
  }, []);

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