import RobotLoaderAnimation from '../../../assets/animation/robot-loader-slim.webm'; 

const MizuLoader = () => {
  return (
    <div className="robot-loader__container">
      <video
        className="robot-loader__video robot-loader__half-size"
        src={RobotLoaderAnimation}
        autoPlay
        loop
        muted
        playsInline
      />
    </div>
  );
};

export default MizuLoader;