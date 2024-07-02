import React from "react";
import PreviousIcon from "../../../../assets/images/previous.svg";
import NextIcon from "../../../../assets/images/next.svg";
import JusticeLeague from "../../../../assets/images/justice-league.png";
import BlackAdam from "../../../../assets/images/black-adam.png";
import Avatar from "../../../../assets/images/avatar.png";
import TvIcon from "../../../../assets/images/tv-icon.png";
import VideoCamera from "../../../../assets/images/videocamera-1.png";
import CalendarIcon from "../../../../assets/images/calendar-icon.svg";
import Favourites from "../../../../assets/images/favourites-icon.svg";
import SearchIcon from "../../../../assets/images/search-icon.svg";
import "./Content.scss";

export const Content = () => {
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
            <div className="content__label-headers-container">
              <div className="content__label-header-new-releases">NEW RELEASES</div>
            </div>
          </div>
        </div>
         
        <div className="content__card-media-container">
          <div className="content__card-media">
            <div className="content__card1-container">
              <div className="content__card1">
                <img className="content__poster1" alt="Avatar" src={Avatar} />
              </div>
              <div className="content__icon-bg-video">
                <img className="content__video-icon" alt="Video icon" src={VideoCamera} />
              </div>
            </div>

            <div className="content__card2-container">
              <div className="content__card2">
                <img className="content__poster2" alt="Black adam" src={BlackAdam} />
              </div>
              <div className="content__icon-bg-video2">
                <img className="content__video-icon2" alt="Video icon" src={VideoCamera} />
              </div>
            </div>

            <div className="content__card3-container">
              <div className="content__card3">
                <img className="content__poster3" alt="Justice league" src={JusticeLeague} />
              </div>
              <div className="content__icon-bg-tv">
                <img className="content__tv-icon" alt="TV icon" src={TvIcon} />
              </div>
            </div>
          </div>
        </div>

        <div className="content__pagination-container">
          <img className="content__pagination" alt="Previous" src={PreviousIcon} />
          <div className="content__page-nav-wrapper1">
            <div className="content__page1">00</div>
          </div>
          <div className="content__page-nav-wrapper2">
            <div className="content__page2">00</div>
          </div>
          <img className="content__next" alt="Next" src={NextIcon} />
        </div>
      </div>
    </div>
  </div>
  );
};

export default Content;