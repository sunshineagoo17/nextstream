import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { useSearchBar } from '../../../../context/SearchBarContext/SearchBarContext';
import { ToastContainer, Slide, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';
import VideoCamera from "../../../../assets/images/videocamera-1.png";
import TvIcon from "../../../../assets/images/tv-icon.png";
import CalendarIcon from "../../../../assets/images/calendar-icon.svg";
import Favourites from "../../../../assets/images/favourites-icon.svg";
import SearchIcon from "../../../../assets/images/search-icon.svg";
import PreviousIcon from "../../../../assets/images/previous-icon.svg";
import NextIcon from "../../../../assets/images/next-icon.svg";
import "./Content.scss";

export const Content = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState('');
  const navigate = useNavigate();
  const { userId } = useContext(AuthContext);
  const { searchBarDesktopRef, searchBarMobileRef } = useSearchBar();

  useEffect(() => {
    console.log('User ID:', userId);

    // Fetch the newest releases from the backend
    const fetchNewReleases = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/popular`);
        setNewReleases(response.data.results);
      } catch (error) {
        console.error("Error fetching new releases:", error);
      }
    };

    fetchNewReleases();
  }, [userId]);

  const handlePrevious = () => {
    setAnimationClass('slide-out-left');
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex === 0 ? newReleases.length - 3 : prevIndex - 3));
      setAnimationClass('slide-in-left');
    }, 500);
  };

  const handleNext = () => {
    setAnimationClass('slide-out-right');
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 3 >= newReleases.length ? 0 : prevIndex + 3));
      setAnimationClass('slide-in-right');
    }, 500);
  };

  const scrollToSearchBar = () => {
    const isMobile = window.innerWidth <= 768;
    const ref = isMobile ? searchBarMobileRef : searchBarDesktopRef;

    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth' });
      toast.info("Start by typing the name of the show or movie you're looking for to find out where it's streaming.", {
      });
    }
  };

  const navigateTo = (path) => {
    navigate(path);
  };

  return (
    <>
      <ToastContainer
        position="top-left"
        autoClose={3000}
        hideProgressBar={false}
        transition={Slide}
        closeOnClick
        pauseOnHover
      />
      <div className="content">
        <div className="content__container">
          <div className="content__features-container">
            <div className="content__label-header-container">
              <div className="content__label-features">FEATURES</div>
            </div>
            <div className="content__card-features">
              <div
                className="content__card-features__feature content__card-features__feature--1"
                data-tooltip="Find where your fave shows/movies are being streamed."
                onClick={scrollToSearchBar}
              >
                <div className="content__card-features__feature__icon-bg">
                  <img className="content__card-features__feature__search-icon" src={SearchIcon} alt="Search icon" />
                </div>
                <div className="content__card-features__feature__label content__card-features__feature__label--stream-locator">
                  Stream Locator
                </div>
              </div>
              <div
                className="content__card-features__feature content__card-features__feature--2"
                data-tooltip="Personalized recommendations based on your history."
                onClick={() => navigateTo(`/top-picks/${userId}`)}
              >
                <div className="content__card-features__feature__icon-bg">
                  <img className="content__card-features__feature__favourites-icon" src={Favourites} alt="Favourites icon" />
                </div>
                <div className="content__card-features__feature__label content__card-features__feature__label--custom-recommendations">
                  Custom Recommendations
                </div>
              </div>
              <div
                className="content__card-features__feature content__card-features__feature--3"
                data-tooltip="Plan your schedule and never miss a show/movie."
                onClick={() => navigateTo(`/calendar/${userId}`)}
              >
                <div className="content__card-features__feature__icon-bg">
                  <img className="content__card-features__feature__calendar-icon" src={CalendarIcon} alt="Calendar icon" />
                </div>
                <div className="content__card-features__feature__label content__card-features__feature__label--schedule-planner">
                  Schedule Planner
                </div>
              </div>
            </div>
          </div>
          
          <div className="content__new-releases">
            <div className="content__new-releases-header">
              <div className="content__new-releases-subtitle-container">
                <p className="content__new-releases-subtitle">
                Discover the top trending movies and TV shows available for streaming. Register now to find out where to watch these titles.
                </p>
                <div className="content__label-header-new-container">
                  <div className="content__label-header-new-releases">POPULAR</div>
                </div>
              </div>
            </div>

            <div className="content__card-media-container">
              <div className="content__card-media">
                {newReleases.slice(currentIndex, currentIndex + 3).map((release, index) => (
                  <div key={index} className={`content__card${index + 1}-container ${animationClass}`}>
                    <a href={release.url} target="_blank" rel="noopener noreferrer">
                      <div className={`content__card${index + 1}`}>
                        <img
                          className={`content__poster${index + 1}`}
                          alt={release.title || release.name}
                          src={`https://image.tmdb.org/t/p/w500${release.poster_path}`}
                        />
                      </div>
                    </a>
                    <div className={`content__icon-bg-${release.media_type === 'tv' ? 'tv' : 'video'}`}>
                      <img className={`content__${release.media_type === 'tv' ? 'tv' : 'video'}-icon`} alt="Media icon" src={release.media_type === 'tv' ? TvIcon : VideoCamera} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="content__pagination-container">
              <div className="content__page-nav-wrapper-next" onClick={handlePrevious}>
                <img src={PreviousIcon} className="content__previous-icon" alt="Previous" />
              </div>
              <div className="content__page-nav-wrapper-previous" onClick={handleNext}>
                <img src={NextIcon} className="content__next-icon" alt="Next" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Content;