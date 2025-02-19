import { useEffect, useContext, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../../../../context/AuthContext/AuthContext";
import { useSearchBar } from "../../../../context/SearchBarContext/SearchBarContext";
import { ToastContainer, Slide, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import api from "../../../../services/api";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVideo,
  faTv,
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import CalendarIcon from "../../../../assets/images/calendar-icon.svg";
import Favourites from "../../../../assets/images/favourites-icon.svg";
import SearchIcon from "../../../../assets/images/search-icon.svg";
import LightbulbIcon from "../../../../assets/images/lightbulb-icon.svg";
import HeartMessageIcon from "../../../../assets/images/heart-message-icon.svg";
import StartIcon from "../../../../assets/images/star-icon.svg";
import DefaultPoster from "../../../../assets/images/posternoimg-icon.png";
import "./Content.scss";

export const Content = () => {
  const [newReleases, setNewReleases] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animationClass, setAnimationClass] = useState("");
  const navigate = useNavigate();
  const { userId, isAuthenticated, isGuest } = useContext(AuthContext);
  const { searchBarDesktopRef, searchBarMobileRef } = useSearchBar();

  const handleError = (e) => {
    e.target.src = DefaultPoster;
  };

  useEffect(() => {
    const fetchNewReleases = async () => {
      try {
        const response = await api.get("/api/tmdb/popular");
        setNewReleases(response.data.results);
      } catch (error) {
        console.error("Error fetching new releases:", error);
      }
    };

    fetchNewReleases();
  }, [userId]);

  const handlePrevious = () => {
    setAnimationClass("slide-out-left");
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === 0 ? newReleases.length - 3 : prevIndex - 3
      );
      setAnimationClass("slide-in-left");
    }, 500);
  };

  const handleNext = () => {
    setAnimationClass("slide-out-right");
    setTimeout(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex + 3 >= newReleases.length ? 0 : prevIndex + 3
      );
      setAnimationClass("slide-in-right");
    }, 500);
  };

  const scrollToSearchBar = () => {
    const isMobile = window.innerWidth <= 768;
    const ref = isMobile ? searchBarMobileRef : searchBarDesktopRef;

    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth" });
      toast.info(
        "Start by typing the name of the show or movie you're looking for to find out where it's streaming.",
        {
          className: "frosted-toast-content",
        }
      );
    }
  };

  const handleCardClick = (release) => {
    const mediaType = release.media_type;
    const mediaId = release.id;

    if (isAuthenticated) {
      navigate(`/nextview/${userId}/${mediaType}/${mediaId}`);
    } else if (isGuest) {
      navigate(`/nextview/guest/${mediaType}/${mediaId}`);
    } else {
      navigate("/login-required");
    }
  };

  const handleNavigateToCalendar = () => {
    if (isGuest) {
      navigate("/calendar/guest");
    } else {
      navigate(`/calendar/${userId}`);
    }
  };

  const handleNavigateToTopPicks = () => {
    if (isGuest) {
      navigate("/top-picks/guest");
    } else {
      navigate(`/top-picks/${userId}`);
    }
  };

  const handleNavigateToFriends = () => {
    if (isGuest) {
      navigate("/friends/guest");
    } else {
      navigate(`/friends/${userId}`);
    }
  };

  const handleNavigateToChatbot = () => {
    if (isGuest) {
      navigate("/nextstream-gpt/guest");
    } else {
      navigate(`/nextstream-gpt/${userId}`);
    }
  };

  const handleNavigateToStreamboard = () => {
    if (isGuest) {
      navigate("/streamboard/guest");
    } else {
      navigate(`/streamboard/${userId}`);
    }
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
                onClick={scrollToSearchBar}>
                <button className="content__card-features__feature__icon-bg">
                  <img
                    className="content__card-features__feature__search-icon"
                    src={SearchIcon}
                    alt="Search icon"
                  />
                </button>
                <button className="content__card-features__feature__label content__card-features__feature__label--stream-locator">
                  Stream Locator
                </button>
              </div>
              <div
                className="content__card-features__feature content__card-features__feature--2"
                data-tooltip="Personalized recommendations based on your history."
                onClick={handleNavigateToTopPicks}>
                <button className="content__card-features__feature__icon-bg">
                  <img
                    className="content__card-features__feature__favourites-icon"
                    src={Favourites}
                    alt="Favourites icon"
                  />
                </button>
                <button className="content__card-features__feature__label content__card-features__feature__label--custom-recommendations">
                  Custom Recommendations
                </button>
              </div>
              <div
                className="content__card-features__feature content__card-features__feature--3"
                data-tooltip="Plan your schedule and never miss a show/movie."
                onClick={handleNavigateToCalendar}>
                <button className="content__card-features__feature__icon-bg">
                  <img
                    className="content__card-features__feature__calendar-icon"
                    src={CalendarIcon}
                    alt="Calendar icon"
                  />
                </button>
                <button className="content__card-features__feature__label content__card-features__feature__label--schedule-planner">
                  Schedule Planner
                </button>
              </div>

              <div
                className="content__card-features__feature content__card-features__feature--4"
                data-tooltip="Ask our AI-powered chatbot anything!"
                onClick={handleNavigateToChatbot}>
                <button className="content__card-features__feature__icon-bg">
                  <img
                    className="content__card-features__feature__chatbot-icon"
                    src={LightbulbIcon}
                    alt="Chatbot icon"
                  />
                </button>
                <button className="content__card-features__feature__label content__card-features__feature__label--chatbot">
                  Mizu Chatbot
                </button>
              </div>

              <div
                className="content__card-features__feature content__card-features__feature--5"
                data-tooltip="Chat w/ friends and share your faves."
                onClick={handleNavigateToFriends}>
                <button className="content__card-features__feature__icon-bg">
                  <img
                    className="content__card-features__feature__friends-icon"
                    src={HeartMessageIcon}
                    alt="Friends chat icon"
                  />
                </button>
                <button className="content__card-features__feature__label content__card-features__feature__label--friends-chat">
                  Friends List
                </button>
              </div>

              <div
                className="content__card-features__feature content__card-features__feature--6"
                data-tooltip="Organize and track your watchlist easily."
                onClick={handleNavigateToStreamboard}>
                <button className="content__card-features__feature__icon-bg">
                  <img
                    className="content__card-features__feature__streamboard-icon"
                    src={StartIcon}
                    alt="Streamboard icon"
                  />
                </button>
                <button className="content__card-features__feature__label content__card-features__feature__label--streamboard">
                  Kanban Streamboard
                </button>
              </div>
            </div>
          </div>

          <div className="content__new-releases">
            <div className="content__new-releases-header">
              <div className="content__new-releases-subtitle-container">
                <p className="content__new-releases-subtitle">
                  Browse the top trending movies and TV shows available for
                  streaming.{" "}
                  <Link
                    to="/register"
                    aria-label="Register Now"
                    className="content-new-releases__register-btn">
                    Register now
                  </Link>{" "}
                  to find out where to watch these titles.
                </p>
                <div className="content__label-header-new-container">
                  <div className="content__label-header-new-releases">
                    POPULAR
                  </div>
                </div>
              </div>
            </div>

            <div className="content__card-media-container">
              <div className="content__card-media">
                {newReleases
                  .slice(currentIndex, currentIndex + 3)
                  .map((release, index) => (
                    <div
                      key={index}
                      className={`content__card${
                        index + 1
                      }-container ${animationClass}`}>
                      <button
                        className={`content__card${index + 1}`}
                        onClick={() => handleCardClick(release)}>
                        <img
                          className={`content__poster${index + 1}`}
                          alt={release.title || release.name}
                          src={`https://image.tmdb.org/t/p/w500${release.poster_path}`}
                          onError={handleError}
                        />
                      </button>
                      <div
                        className={`content__icon-bg-${
                          release.media_type === "tv" ? "tv" : "video"
                        }`}>
                        <FontAwesomeIcon
                          icon={release.media_type === "tv" ? faTv : faVideo}
                          className={`content__${
                            release.media_type === "tv" ? "tv" : "video"
                          }-icon`}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="content__pagination-container">
              <button
                className="content__page-nav-wrapper-previous"
                onClick={handlePrevious}>
                <FontAwesomeIcon
                  icon={faChevronLeft}
                  className="content__previous-icon"
                />
              </button>
              <div className="content__nav-circles">
                {newReleases
                  .slice(0, Math.ceil(newReleases.length / 3))
                  .map((_, index) => (
                    <button
                      key={index}
                      className={`content__nav-circle ${
                        currentIndex / 3 === index
                          ? "content__nav-circle--active"
                          : ""
                      }`}
                      onClick={() => setCurrentIndex(index * 3)}></button>
                  ))}
              </div>
              <button
                className="content__page-nav-wrapper-next"
                onClick={handleNext}>
                <FontAwesomeIcon
                  icon={faChevronRight}
                  className="content__next-icon"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Content;
