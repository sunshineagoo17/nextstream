import RobotLoaderAnimation from '../../assets/animation/robot-loader-original.webm'; 

const RobotLoader = () => {
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

export default RobotLoader;