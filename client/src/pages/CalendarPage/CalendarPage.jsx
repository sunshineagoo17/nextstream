import "./CalendarPage.scss";
import Calendar from './sections/Calendar';

const CalendarPage = () => {
  return (
    <div className="calendar-page">
      <header className="header">
        <h1>Your Schedule</h1>
      </header>
      <main>
        <Calendar />
      </main>
    </div>
  );
};

export default CalendarPage;