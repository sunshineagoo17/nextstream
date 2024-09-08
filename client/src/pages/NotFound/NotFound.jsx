import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AnimatedBg from '../../components/AnimatedBg/AnimatedBg';
import Loader from '../../components/Loader/Loader';
import MonsterImg from "../../assets/images/404-monster.svg";
import DevErrors from "../../assets/images/404-error-devs.svg";
import TvError from "../../assets/images/404-error-tv.svg";
import SpaceError from "../../assets/images/404-lost-in-space.svg";
import './NotFound.scss';

const imageArr = [
    {
        id: 0,
        copy: "The page you are looking for does not exist. Our hardworking devs will be right on it once they sort things out.",
        image: DevErrors,
    },
    {
        id: 1,
        copy: "Oh no! They're at it again. Aliens have abducted this page.",
        image: SpaceError,
    },
    {
        id: 2,
        copy: "Whoa, you took a wrong turn! Stay away from the 404 monster.",
        image: MonsterImg,
    },       
    {
        id: 3,
        copy: "Great Scott! Looks like this page is broken. Hang tight while we get the gears running to find that missing page!",
        image: TvError,
    },
];

export const NotFound = () => {
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const graphicRef = useRef(null);

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
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const handleMouseMove = (e) => {
            const graphic = graphicRef.current;
            if (graphic) {
                const rect = graphic.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const rotateX = (y / rect.height - 0.5) * 30;
                const rotateY = (x / rect.width - 0.5) * -30;

                graphic.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
                graphic.style.boxShadow = `${-rotateY}px ${rotateX}px 20px rgba(0, 0, 0, 0.2)`;
            }
        };

        const graphicContainer = document.querySelector('.not-found__graphic-container');
        graphicContainer.addEventListener('mousemove', handleMouseMove);

        return () => {
            graphicContainer.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleClick = () => {
        const graphic = graphicRef.current;
        if (graphic) {
            graphic.style.transform = 'scale(0.9)'; 
            setTimeout(() => {
                navigate('/');
            }, 150);  
        }
    };

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
                        <div className="not-found__graphic-container" onClick={handleClick}>
                            <img
                                src={currentOption?.image}
                                alt="404 graphic"
                                className="not-found__graphic"
                                ref={graphicRef}
                            />
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