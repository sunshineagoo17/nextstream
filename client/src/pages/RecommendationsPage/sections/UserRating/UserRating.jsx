import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './UserRating.scss';

const UserRating = ({ rating }) => {
  const percentage = Math.min(Math.max(Math.round(rating * 100) / 100, 0), 100);

  const getColor = (percent) => {
    if (percent > 0) {
      return '#007bff';
    } else {
      return '#ffffff'; 
    }
  };  

  return (
    <div className="user-rating-container">
      <div className="user-rating">
        <CircularProgressbar
          value={percentage}
          text={`${percentage}%`}
          styles={buildStyles({
            pathColor: getColor(percentage),
            textColor: '#012E71',
            trailColor: '#EEF4FC',
          })}
        />
      </div>
      <span className="tooltip-text">User Score</span>
    </div>
  );
};

export default UserRating;