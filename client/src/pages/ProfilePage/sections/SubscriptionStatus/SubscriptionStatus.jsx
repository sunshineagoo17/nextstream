import React, { useState } from 'react';
import './SubscriptionStatus.scss';

const SubscriptionStatus = () => {
  const [isActive, setIsActive] = useState(false);
  const [deleteAccount, setDeleteAccount] = useState(false);

  const toggleActiveStatus = () => {
    setIsActive(!isActive);
  };

  const handleDeleteAccount = () => {
    setDeleteAccount(!deleteAccount);
  };

  return (
    <div className="subscription-status">
      <div className="subscription-status__container">
        <div className="subscription-status__title">Subscription Status</div>
        <div className="subscription-status__active">
          <div className="subscription-status__select" onClick={toggleActiveStatus}>
            <div className={`subscription-status__checkbox ${isActive ? 'subscription-status__checkbox--active' : ''}`}>
              {isActive && <div className="subscription-status__check">✔</div>}
            </div>
          </div>
          <div className="subscription-status__box">
            <div className="subscription-status__input">Active</div>
          </div>
        </div>
      </div>
      <div
        className={`subscription-status__delete-account ${deleteAccount ? 'subscription-status__delete-account--delete' : ''}`}
        onClick={handleDeleteAccount}
      >
        <div className="subscription-status__delete-txt">Delete Account</div>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
