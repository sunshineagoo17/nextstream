import "./WavesBg.scss";

const WavesBg = () => {
    return (
        <div className="waves-bg">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#4092FF" />
                        <stop offset="100%" stopColor="#2575fc" />
                    </linearGradient>
                </defs>
                {/* First Wave */}
                <path fill="url(#neonGradient)" fillOpacity="1" d="M0,256 C320,128 640,320 960,192 C1280,64 1600,288 1920,160 L1920,320 L0,320 Z">
                    <animateTransform
                        attributeName="transform"
                        attributeType="XML"
                        type="translate"
                        values="0,0; 50,0; 0,0; -50,0; 0,0"
                        dur="25s"
                        repeatCount="indefinite"
                    />
                </path>
                {/* Second Wave */}
                <path fill="url(#neonGradient)" fillOpacity="0.5" d="M0,192 C320,96 640,288 960,128 C1280,-32 1600,256 1920,128 L1920,320 L0,320 Z">
                    <animateTransform
                        attributeName="transform"
                        attributeType="XML"
                        type="translate"
                        values="0,0; -50,0; 0,0; 50,0; 0,0"
                        dur="35s"
                        repeatCount="indefinite"
                    />
                </path>
            </svg>
        </div>
    );
};

export default WavesBg;