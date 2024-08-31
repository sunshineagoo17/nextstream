import './LogoLoader.scss'; 
import nextstreamLogo from "../../assets/images/nextstream-brandmark-logo.svg";

const LogoLoader = () => {
  return (
    <div className="loader-container">
      <div className="loader-wrapper">
        <img src={nextstreamLogo} className="loader-svg" alt="Loading..." />
      </div>
    </div>
  );
};

export default LogoLoader;