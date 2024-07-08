import React, { useEffect, useState } from "react";
import axios from 'axios'; // Import axios to make API requests
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

  useEffect(() => {
    // Fetch the newest releases from the backend
    const fetchNewReleases = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tmdb/new-releases`);
        setNewReleases(response.data.results.slice(0, 3)); // Set the first 3 releases
      } catch (error) {
        console.error("Error fetching new releases:", error);
      }
    };

    fetchNewReleases();
  }, []);

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
              {newReleases.map((release, index) => (
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
                  <div className={`content__icon-bg-${index === 2 ? 'tv' : 'video'}`}>
                    <img className={`content__${index === 2 ? 'tv' : 'video'}-icon`} alt="Media icon" src={index === 2 ? TvIcon : VideoCamera} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="content__pagination-container">
            <img className="content__pagination" alt="Previous" src={PreviousIcon} />
            {/* For version 2.0 - to add more posters down the road */}
            {/* <div className="content__page-nav-wrapper1">
              <div className="content__page1">00</div>
            </div>
            <div className="content__page-nav-wrapper2">
              <div className="content__page2">00</div>
            </div> */}
            <img className="content__next" alt="Next" src={NextIcon} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Content;