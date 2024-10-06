import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTv, faCouch, faFilm, faDesktopAlt, faMicrochip, faBriefcase, faGlobe, faSearch, faStar, faCalendarAlt, faSmile, faRobot, faHandPointer, faMapMarkerAlt, faBolt, faHeart, faBell, faCheckSquare } from '@fortawesome/free-solid-svg-icons'; 
import AnimatedBg from '../../components/Backgrounds/AnimatedBg/AnimatedBg';
import ContactModal from '../../components/ContactModal/ContactModal';
import Loader from '../../components/Loaders/Loader/Loader';
import './AboutPage.scss';

export const AboutPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(false);
  }, []);
  
  const handleLinkClick = (e) => {
    e.preventDefault();
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setIsModalOpen(true);
    }, 500);
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className={`about ${isAnimating ? 'about--animating' : ''}`}>
        <div className="about__container">
          <div className="about__content-card">
            <h1 className="about__title">About NextStream</h1>
            <p className="about__intro">Simplify Your Streaming Experience</p>
            <p className="about__text">
              NextStream is your all-in-one solution for finding and scheduling your favourite movies and shows. Tired of juggling multiple streaming platforms? We bring all the information you need into one convenient place, tailored to your global location.
            </p>

            <h2 className="about__subtitle">Why Choose NextStream?</h2>
            <p className="about__text">
              NextStream takes the stress out of managing multiple streaming platforms. Here's how we do it:
            </p>
            <ul className="about__list">
              <li className="about__list-item"><FontAwesomeIcon icon={faGlobe} className='about__icon about__globe-icon' /> Access global streaming information in one place.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faSearch} className='about__icon about__search-icon' /> Use our powerful search tool to locate any title, fast.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faStar} className='about__icon about__star-icon'/> Get personalized recommendations tailored to your tastes.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faCalendarAlt} className='about__icon about__calendar-icon' /> Schedule what to watch and set reminders easily.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faSmile} className='about__icon about__smile-icon' /> Enjoy a sleek, user-friendly interface for seamless navigation.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faRobot} className='about__icon about__robot-icon' /> Let Mizu, NextStream's Bot, assist you in discovering new content.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faHandPointer} className='about__icon about__hand-point-icon' /> Explore content with NextSwipe, a fun swipe-left/right feature.</li>
            </ul>

            <h2 className="about__subtitle">Who Is NextStream For?</h2>
            <p className="about__text">
              NextStream is designed for:
            </p>
            <ul className="about__list">
              <li className="about__list-item"><FontAwesomeIcon icon={faTv} className='about__icon about__tv-icon' /> <strong>Streaming Enthusiasts</strong>: Streamline finding and watching your favourite content.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faCouch} className='about__icon about__couch-icon' /> <strong>Binge Watchers</strong>: Keep track of your progress and plan your next session.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faFilm} className='about__icon about__film-icon' /> <strong>Cinephiles</strong>: Discover new films and revisit classics.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faBriefcase} className='about__icon about__briefcase-icon' /> <strong>Busy Professionals</strong>: Unwind without the hassle of searching across platforms.</li>
            </ul>

            <h2 className="about__subtitle">Key Features</h2>
            <ul className="about__list">
              <li className="about__list-item"><FontAwesomeIcon icon={faMapMarkerAlt} className='about__icon about__map-icon' /> <strong>Region-Based Availability</strong>: Know instantly where shows and movies are streaming in your area.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faBolt} className='about__icon about__bolt-icon' /> <strong>Lightning-Fast Search</strong>: Quickly search across all platforms and find what you need.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faHeart} className='about__icon about__heart-icon' /> <strong>Tailored Recommendations</strong>: Personalized suggestions based on your viewing habits.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faBell} className='about__icon about__bell-icon' /> <strong>Watchlists & Reminders</strong>: Organize your watchlist and receive notifications for upcoming releases.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faDesktopAlt} className='about__icon about__computer-icon' /> <strong>Simple, Modern Interface</strong>: Navigate effortlessly with an intuitive design for a smooth experience.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faMicrochip} className='about__icon about__microchip-icon' /> <strong>NextStream Bot</strong>: Your AI companion for discovering new content, Mizu, helps you find your next favourite show.</li>
              <li className="about__list-item"><FontAwesomeIcon icon={faCheckSquare} className='about__icon about__check-icon' /> <strong>NextSwipe</strong>: Swipe through recommendations with ease and pick your favourites by swiping left or right.</li>
            </ul>

            <h2 className="about__subtitle">Get in Touch</h2>
            <p className="about__text">
              Have questions or feedback? We'd love to hear from you!
            </p>
            <p className="about__text">
              <button className="about__link" onClick={handleLinkClick} aria-label="Contact NextStream Support">Contact Us</button>
            </p>
          </div>
        </div>
        <div className="about__background">
          <AnimatedBg />
        </div>
        {isModalOpen && <ContactModal onClose={() => setIsModalOpen(false)} />}
      </div>
    </>
  );
};

export default AboutPage;
