import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import './CircleRating.scss';

const CircleRating = ({ rating }) => {
  const percentage = Math.min(Math.max(Math.round(rating * 100) / 100, 0), 100);

  const getColor = (percent) => {
    if (percent >= 75) {
      return '#012E71';
    } else if (percent >= 50) {
      return '#0045B6';
    } else if (percent >= 25) {
      return '#4092FF';
    } else {
      return '#00C9FF';
    }
  };

  return (
    <div className="circle-rating-container">
      <div className="circle-rating">
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

export default CircleRating;