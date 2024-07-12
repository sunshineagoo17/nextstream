import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import AlienAbductionImage from "../../assets/images/404-alien-abduction.jpg";
import DeveloperImage from "../../assets/images/404-developer-sleeping.jpg";
import MatrixImage from "../../assets/images/404-matrix.jpg";
import TimeTravelImage from "../../assets/images/404-time-travel.jpg";
import './NotFound.scss';

const imageArr = [
    {
        id: 0,
        copy: "The page you are looking for does not exist. Our hardworking devs will be right on it once they sort things out.",
        image: DeveloperImage,
    },
    {
        id: 1,
        copy: "Oh no! They're at it again. Aliens have abducted this page.",
        image: AlienAbductionImage,
    },
    {
        id: 2,
        copy: "Whoa, you took a wrong turn! Stay away from the 404 monster.",
        image: MatrixImage,
    },       
    {
        id: 3,
        copy: "Great Scott! Looks like this page is broken. Hang tight while we get the gears running to find that missing page!",
        image: TimeTravelImage,
    },
];

export const NotFound = () => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    const getNextOption = useCallback(() => {
        let nextIndex = 0;
        try {
            const lastIndex = parseInt(sessionStorage.getItem("lastShownIndex"), 10);
            nextIndex = isNaN(lastIndex) ? 0 : (lastIndex + 1) % imageArr.length;
            sessionStorage.setItem("lastShownIndex", nextIndex.toString());
        } catch (e) {
            console.error("Error accessing sessionStorage", e);
        }
        return imageArr[nextIndex];
    }, []);

    const [currentOption, setCurrentOption] = useState(() => getNextOption());

    useEffect(() => {
        setCurrentOption(getNextOption());
    }, [getNextOption]);

    const handleNextOptionClick = () => {
        setCurrentOption(getNextOption());
        navigate('/');
    };

    useEffect(() => {
        // Set isLoading to false after component mounts
        setIsLoading(false);
    }, []);

    return (
        <>
            {isLoading && <Loader />}
            <div className="not-found">
                <div className="not-found__container">
                    <div className="not-found__content-card">
                        <h1 className="not-found__title">Page Not Found</h1>
                        <p className="not-found__intro">Looks like we've hit a snag!</p>
                        <p className="not-found__text">
                            {currentOption?.copy} Don't worry, you can find plenty of other awesome things to check out on our{" "}
                            <button className="not-found__homepage-link" onClick={handleNextOptionClick} aria-label="Go back to Homepage">
                                homepage.
                            </button>
                        </p>
                        <div className="not-found__graphic-container">
                            <img src={currentOption?.image} alt="404 graphic" className="not-found__graphic" />
                        </div>
                    </div>
                </div>
                <div className="not-found__background">
                    <AnimatedBg />
                </div>
            </div>
        </>
    );
};

export default NotFound;