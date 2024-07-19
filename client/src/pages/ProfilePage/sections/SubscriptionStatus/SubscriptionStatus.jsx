import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../../../context/AuthContext/AuthContext';
import checkmarkIcon from '../../../../assets/images/checkmark-icon.svg'; 
import './SubscriptionStatus.scss';

const SubscriptionStatus = ({ isSubscribed, onSubscriptionChange, onDeleteAccount }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [isActive, setIsActive] = useState(isSubscribed);
  const [deleteAccount, setDeleteAccount] = useState(false);

  useEffect(() => {
    setIsActive(isSubscribed);
  }, [isSubscribed]);

  const toggleActiveStatus = () => {
    const newStatus = !isActive;
    setIsActive(newStatus);
    onSubscriptionChange(newStatus);
  };

  const handleDeleteAccount = () => {
    setDeleteAccount(!deleteAccount);
    if (!deleteAccount) {
      onDeleteAccount();
    }
  };

  return (
    <div className="subscription-status">
      <div className="subscription-status__container">
        <div className="subscription-status__title">Subscription Status</div>
        <div className="subscription-status__active">
          <div className="subscription-status__select" onClick={toggleActiveStatus}>
            <div className={`subscription-status__checkbox ${isActive ? 'subscription-status__checkbox--active' : 'subscription-status__checkbox--inactive'}`}>
              {isActive ? (
                <img src={checkmarkIcon} alt="Checkmark" className="subscription-status__check" />
              ) : (
                <span className="subscription-status__x">x</span>
              )}
            </div>
          </div>
          <div className={`subscription-status__box ${isActive ? '' : 'subscription-status__box--inactive'}`}>
            <div className="subscription-status__input">{isActive ? 'Active' : 'Inactive'}</div>
          </div>
        </div>
      </div>
      {isAuthenticated && (
        <div
          className={`subscription-status__delete-account ${deleteAccount ? 'subscription-status__delete-account--delete' : ''}`}
          onClick={handleDeleteAccount}
        >
          <div className="subscription-status__delete-txt">Delete Account</div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionStatus;