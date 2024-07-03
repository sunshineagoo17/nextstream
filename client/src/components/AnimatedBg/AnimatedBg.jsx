import React from "react";
import "./AnimatedBg.scss";

const AnimatedBg = () => {
    return (
        <div className="animated-bg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#cbf4ff" />
                        <stop offset="100%" stopColor="#4092ff" />
                    </linearGradient>
                </defs>
                <path fill="url(#grad1)">
                    <animate attributeName="d" dur="10s" repeatCount="indefinite" values="
                      M0,192 C320,96 640,288 960,192 C1280,96 1600,288 1920,192 L1920,320 L0,320 Z;
                      M0,256 C320,128 640,320 960,256 C1280,192 1600,384 1920,256 L1920,320 L0,320 Z;
                      M0,192 C320,96 640,288 960,192 C1280,96 1600,288 1920,192 L1920,320 L0,320 Z;
                    " />
                </path>
            </svg>
        </div>
    );
};

export default AnimatedBg;
