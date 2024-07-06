import './ToggleButton.scss';

const ToggleButton = ({ checked, onChange }) => {
  return (
    <div
      className={`toggle-button__switch ${checked ? 'checked' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <div className="toggle-button__slider" />
    </div>
  );
};

export default ToggleButton;
