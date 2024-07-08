import React, { useEffect, useState } from "react";
import axios from 'axios';
import PreviousIcon from "../../../../assets/images/previous.svg";
import NextIcon from "../../../../assets/images/next.svg";
import VideoCamera from "../../../../assets/images/videocamera-1.png";
import TvIcon from "../../../../assets/images/tv-icon.png";
import CalendarIcon from "../../../../assets/images/calendar-icon.svg";
import Favourites from "../../../../assets/images/favourites-icon.svg";
import SearchIcon from "../../../../assets/images/search-icon.svg";
import "./Content.scss";

export const Content = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Fetch the newest releases from the backend
    const fetchNewReleases = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/new-releases`);
        setNewReleases(response.data.results);
      } catch (error) {
        console.error("Error fetching new releases:", error);
      }
    };

    fetchNewReleases();
  }, []);

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? newReleases.length - 3 : prevIndex - 3));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex === newReleases.length - 3 ? 0 : prevIndex + 3));
  };

  return (
    <div className="content">
      <div className="content__container">
        <div className="content__features-container">
          <div className="content__label-header-container">
            <div className="content__label-features">FEATURES</div>
          </div>
          <div className="content__card-features">
            <div className="content__card-features__feature content__card-features__feature--1">
              <div className="content__card-features__feature__icon-bg">
                <img className="content__card-features__feature__search-icon" src={SearchIcon} alt="Search icon" />
              </div>
              <div className="content__card-features__feature__label content__card-features__feature__label--stream-locator">Stream Locator</div>
            </div>
            <div className="content__card-features__feature content__card-features__feature--2">
              <div className="content__card-features__feature__icon-bg">
                <img className="content__card-features__feature__favourites-icon" src={Favourites} alt="Favourites icon" />
              </div>
              <div className="content__card-features__feature__label content__card-features__feature__label--custom-recommendations">Custom Recommendations</div>
            </div>
            <div className="content__card-features__feature content__card-features__feature--3">
              <div className="content__card-features__feature__icon-bg">
                <img className="content__card-features__feature__calendar-icon" src={CalendarIcon} alt="Calendar icon" />
              </div>
              <div className="content__card-features__feature__label content__card-features__feature__label--schedule-planner">Schedule Planner</div>
            </div>
          </div>
        </div>
        
        <div className="content__new-releases">
          <div className="content__new-releases-header">
            <div className="content__new-releases-subtitle-container">
              <p className="content__new-releases-subtitle">
                Check out the latest movies and shows that have just become available for streaming.
              </p>
              <div className="content__label-header-new-container">
                <div className="content__label-header-new-releases">NEW RELEASES</div>
              </div>
            </div>
          </div>
         
          <div className="content__card-media-container">
            <div className="content__card-media">
              {newReleases.slice(currentIndex, currentIndex + 3).map((release, index) => (
                <div key={index} className={`content__card${index + 1}-container`}>
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
            <img className="content__pagination" alt="Previous" src={PreviousIcon} onClick={handlePrevious} />
            <img className="content__next" alt="Next" src={NextIcon} onClick={handleNext} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;
